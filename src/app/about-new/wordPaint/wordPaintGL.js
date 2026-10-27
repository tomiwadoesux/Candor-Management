// The giant word, drawn in light. One canvas under the whole section and
// three kinds of work:
//
//   field  once per layout. The word is set in a 2D canvas with the page's own
//          font at the DOM's own glyph positions, then turned into a signed
//          distance field on the CPU (css px, negative inside the letters).
//          Every outline and glow below is read off that one
//          texture, so the stroke is the same hairline at any size, and there
//          is no SVG path, font file or triangulation to ship.
//   paint  every frame. A quarter-resolution ping-pong buffer that the pointer
//          stirs: x/y hold velocity, z is ink that lingers for seconds, w is the
//          fresh stroke, gone in a few frames. Each frame the buffer is carried
//          along its own velocity, softened and faded, so a stroke smears like
//          ink in water instead of keeping a brush edge.
//   view   every frame. The Darkroom shader reads the field and the paint: the
//          letters are windows onto a photograph, and the paint is light.
//
// Raw three.js, like the carousel and the casting window, imported only when
// the section is about to scroll into view. The component stops calling
// step() once the paint has settled, so a still page costs nothing.
import * as THREE from "three";

const FIELD_SCALE = 0.5; // the distance field is built at half the css size
const FIELD_RANGE = 160; // css px either side of the outline worth measuring
const PAINT_SCALE = 0.25; // the paint buffer runs at a quarter of the css size
const ATLAS_MAX = 2048; // widest the Darkroom photo atlas gets, in px
const INF = 1e20;

// ---- shaders ----------------------------------------------------------------

const quadVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const paintFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform sampler2D uPrev;
  uniform vec2  uSize;      // canvas, css px
  uniform vec2  uTexel;     // one paint texel, in uv
  uniform vec2  uFrom;      // the pointer's path this frame, css px, y up
  uniform vec2  uTo;
  uniform float uRadius;    // brush radius in css px; 0 while the pointer is still
  uniform vec2  uVelocity;  // pointer velocity, css px per 60 Hz frame
  uniform vec3  uKeep;      // what survives this frame: velocity, ink, fresh
  uniform float uCarry;     // how far the paint rides its own velocity
  uniform float uSpread;    // how much of the neighbours bleeds in
  uniform vec2  uGain;      // ink and fresh laid per frame at the brush's centre

  float segment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0);
    return length(pa - ba * h);
  }

  void main() {
    // Carry: what arrives here is whatever sat one velocity step upstream
    // (semi-Lagrangian advection, the cheap half of a fluid solver).
    vec2 velocity = texture2D(uPrev, vUv).xy;
    vec2 from = vUv - velocity * uCarry / uSize;
    vec4 paint = texture2D(uPrev, from);

    // Spread: a cross of neighbours mixed in, so strokes bloom and soften.
    vec4 around = texture2D(uPrev, from + vec2(uTexel.x, 0.0))
                + texture2D(uPrev, from - vec2(uTexel.x, 0.0))
                + texture2D(uPrev, from + vec2(0.0, uTexel.y))
                + texture2D(uPrev, from - vec2(0.0, uTexel.y));
    paint = mix(paint, around * 0.25, uSpread);

    paint.xy *= uKeep.x;
    paint.z *= uKeep.y;
    paint.w *= uKeep.z;

    // The brush: a capsule along this frame's pointer path, soft at its rim.
    if (uRadius > 0.0) {
      float d = segment(vUv * uSize, uFrom, uTo);
      float brush = 1.0 - smoothstep(0.0, uRadius, d);
      brush *= brush;
      paint.xy = mix(paint.xy, uVelocity, brush * 0.85);
      paint.z = min(1.0, paint.z + brush * uGain.x);
      paint.w = min(1.0, paint.w + brush * uGain.y);
    }

    gl_FragColor = paint;
  }
`;

// Shared by the three looks.
const viewCommon = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform sampler2D uField;   // signed distance to the word, css px, < 0 inside
  uniform sampler2D uPaint;   // xy velocity, z ink, w fresh
  uniform vec2  uSize;        // canvas, css px
  uniform float uTime;
  uniform float uReveal;      // 0 → 1 as the section first arrives

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  // The word comes up left to right behind a soft front.
  float revealAt(vec2 uv) {
    float front = mix(-0.3, 1.3, uReveal);
    return 1.0 - smoothstep(front - 0.3, front, uv.x);
  }

  // A line \`width\` css px wide on the zero contour of \`sd\`, antialiased to
  // the device pixel.
  float hairline(float sd, float width) {
    float aa = max(fwidth(sd), 1e-3) * 0.5;
    return 1.0 - smoothstep(width * 0.5 - aa, width * 0.5 + aa, abs(sd));
  }

  float insideOf(float sd) {
    float aa = max(fwidth(sd), 1e-3) * 0.5;
    return 1.0 - smoothstep(-aa, aa, sd);
  }
`;

// Darkroom. The letters are windows onto a photograph, and the paint is
// light: where the pointer passes, the print comes up the way it does in the
// developer tray (shadows first, then the mids, colour last) and sinks back
// to a cool latent as the ink fades. The letters are always outlined; the
// torch is soft and wide, pools Candor blue on the paper around them, and
// lights the outline and the edges' halation the same blue. At rest the
// latent image breathes, very slowly.
const darkroomFragment = /* glsl */ `
  ${viewCommon}

  uniform sampler2D uPhotos;  // the photograph(s), already cut to the letters
  uniform vec3 uAccent;       // the safelight: Candor blue

  void main() {
    float sd = texture2D(uField, vUv).r;
    vec4 paint = texture2D(uPaint, vUv);
    float ink = paint.z, fresh = paint.w;
    float inside = insideOf(sd);
    float expose = smoothstep(0.0, 0.7, ink + fresh * 0.2);

    vec2 part = paint.xy * 0.15 / uSize;
    vec3 photo = vec3(
      texture2D(uPhotos, vUv + part).r,
      texture2D(uPhotos, vUv).g,
      texture2D(uPhotos, vUv - part).b
    );
    float photoLuma = dot(photo, vec3(0.299, 0.587, 0.114));

    // A steep curve that relaxes as exposure builds: the shadows arrive first.
    vec3 print = pow(photo, vec3(mix(2.2, 1.0, expose))) * smoothstep(0.0, 0.85, expose);
    float luma = dot(print, vec3(0.299, 0.587, 0.114));
    print = mix(luma * vec3(0.9, 0.95, 1.0), print, smoothstep(0.5, 1.0, expose));

    // The latent image: cool, only just there, and breathing.
    float breath = 0.75 + 0.25 * sin(uTime * 0.45 + vUv.x * 2.0);
    vec3 latent = pow(photoLuma, 1.6) * vec3(0.16, 0.2, 0.24) * 0.5 * breath;

    vec3 base = vec3(0.035, 0.035, 0.038);
    vec3 c = base + inside * (print + latent + 0.01);

    // The safelight: a soft pool on the paper where the torch has been.
    float outside = 1.0 - inside;
    c += uAccent * ink * 0.1 * outside;
    // Halation off the lit edges.
    float glow = exp(-max(sd, 0.0) / 14.0) * outside * (ink * 0.5 + fresh * 0.2);
    c += uAccent * glow * 0.5;
    // The outline: always there, and lit blue under the torch.
    vec3 rimColour = mix(vec3(0.62), uAccent * 1.6 + 0.2, smoothstep(0.05, 0.5, ink + fresh * 0.5));
    c = mix(c, rimColour, hairline(sd, 1.4));

    c = mix(base, c, revealAt(vUv));
    // Film grain, heavier where the print is up.
    c += (hash(gl_FragCoord.xy + fract(uTime) * 97.0) - 0.5) * (0.015 + expose * 0.035);
    gl_FragColor = vec4(c, 1.0);
  }
`;

// ---- the brush -------------------------------------------------------------
// A torch more than a pen: wide, soft, and the print lingers.
// brush: radius grows with pointer speed from min to max (css px);
// gain: ink and fresh laid per frame at the brush's centre;
// keep: what survives each 60 Hz frame of velocity, ink and the fresh stroke;
// carry: how far the paint rides its own velocity; spread: how much it bleeds.
const LOOK = {
  brush: { min: 90, max: 230, perSpeed: 2.6 },
  gain: [0.3, 0.45],
  keep: [0.93, 0.99, 0.88],
  carry: 0.4,
  spread: 0.3,
};

// ---- the field ------------------------------------------------------------------

const fontString = (font, scale) =>
  `${font.style} ${font.weight} ${font.size * scale}px ${font.family}`;

// Felzenszwalb & Huttenlocher's squared Euclidean distance transform, one
// row or column at a time: the lower envelope of the parabolas rooted at each
// sample. Linear in the pixel count, so the whole field costs a few ms.
function distance1d(grid, offset, stride, length, f, v, z) {
  v[0] = 0;
  z[0] = -INF;
  z[1] = INF;
  for (let q = 0; q < length; q++) f[q] = grid[offset + q * stride];
  for (let q = 1, k = 0, s = 0; q < length; q++) {
    do {
      const r = v[k];
      s = (f[q] - f[r] + q * q - r * r) / (q - r) / 2;
    } while (s <= z[k] && --k > -1);
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = INF;
  }
  for (let q = 0, k = 0; q < length; q++) {
    while (z[k + 1] < q) k++;
    const r = v[k];
    grid[offset + q * stride] = f[r] + (q - r) * (q - r);
  }
}

function distance2d(grid, width, height) {
  const n = Math.max(width, height);
  const f = new Float64Array(n);
  const v = new Uint16Array(n);
  const z = new Float64Array(n + 1);
  for (let x = 0; x < width; x++) distance1d(grid, x, width, height, f, v, z);
  for (let y = 0; y < height; y++) distance1d(grid, y * width, 1, width, f, v, z);
}

// Sets the glyphs in a 2D canvas and measures, for every pixel, how far it is
// from their outline. Partly covered edge pixels seed a sub-pixel distance
// from their coverage, so the outline lands between pixels where the font
// put it. Returns half floats, bottom row first, ready for a DataTexture.
function buildField(layout) {
  const s = FIELD_SCALE;
  const width = Math.max(1, Math.round(layout.width * s));
  const height = Math.max(1, Math.round(layout.height * s));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.font = fontString(layout.font, s);
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#fff";
  for (const g of layout.glyphs) ctx.fillText(g.ch, g.left * s, g.baseline * s);
  const pixels = ctx.getImageData(0, 0, width, height).data;

  const size = width * height;
  const outer = new Float64Array(size);
  const inner = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    const a = pixels[i * 4 + 3] / 255;
    if (a === 1) {
      outer[i] = 0;
      inner[i] = INF;
    } else if (a === 0) {
      outer[i] = INF;
      inner[i] = 0;
    } else {
      const d = 0.5 - a;
      outer[i] = d > 0 ? d * d : 0;
      inner[i] = d < 0 ? d * d : 0;
    }
  }
  distance2d(outer, width, height);
  distance2d(inner, width, height);

  const data = new Uint16Array(size);
  for (let y = 0; y < height; y++) {
    const row = (height - 1 - y) * width;
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const sd = (Math.sqrt(outer[i]) - Math.sqrt(inner[i])) / s;
      data[row + x] = THREE.DataUtils.toHalfFloat(Math.max(-FIELD_RANGE, Math.min(FIELD_RANGE, sd)));
    }
  }
  return { data, width, height };
}

// ---- the Darkroom faces -------------------------------------------------------

// object-fit: cover into a box, focused a third of the way down so faces keep
// their eyes in the letter.
function drawCover(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.naturalWidth - sw) * 0.5;
  const sy = (img.naturalHeight - sh) * 0.3;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// One canvas the size of the section with the photograph cut to the letters
// (grown a little past the outline, so sampling at the edge never pulls in
// black), so the shader samples it at the same uv as the field. One image
// spans the whole word; several are dealt one per letter.
function buildAtlas(layout, images) {
  const s = Math.min(1, ATLAS_MAX / layout.width);
  const width = Math.max(1, Math.round(layout.width * s));
  const height = Math.max(1, Math.round(layout.height * s));
  const make = () => {
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    return [c, c.getContext("2d")];
  };
  const [atlas, actx] = make();
  const [piece, pctx] = make();
  const [mask, mctx] = make();
  actx.fillStyle = "#000";
  actx.fillRect(0, 0, width, height);
  mctx.font = fontString(layout.font, s);
  mctx.textBaseline = "alphabetic";
  mctx.lineWidth = 10 * s;
  mctx.lineJoin = "round";
  // The italic leans past the advance box, so each face gets room either side.
  const lean = layout.font.size * 0.3;
  const glyphBox = (g) => [(g.left - lean) * s, g.top * s, (g.width + lean * 2) * s, g.height * s];
  const cut = (img, box, glyphs) => {
    if (!img) return;
    pctx.globalCompositeOperation = "source-over";
    pctx.clearRect(0, 0, width, height);
    drawCover(pctx, img, ...box);
    mctx.clearRect(0, 0, width, height);
    for (const g of glyphs) {
      mctx.fillText(g.ch, g.left * s, g.baseline * s);
      mctx.strokeText(g.ch, g.left * s, g.baseline * s);
    }
    pctx.globalCompositeOperation = "destination-in";
    pctx.drawImage(mask, 0, 0);
    actx.drawImage(piece, 0, 0);
  };

  const inked = layout.glyphs.filter((g) => g.ch.trim());
  if (images.length === 1) {
    const boxes = inked.map(glyphBox);
    const x0 = Math.min(...boxes.map((b) => b[0]));
    const y0 = Math.min(...boxes.map((b) => b[1]));
    const x1 = Math.max(...boxes.map((b) => b[0] + b[2]));
    const y1 = Math.max(...boxes.map((b) => b[1] + b[3]));
    cut(images[0], [x0, y0, x1 - x0, y1 - y0], inked);
  } else {
    inked.forEach((g, i) => cut(images[i % images.length], glyphBox(g), [g]));
  }
  return atlas;
}

const loadImage = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

// ---- the renderer -------------------------------------------------------------

// `faces`: image urls — one to span the word, or one per letter — loaded
// when the renderer is made. `onChange`: called when they land and a frame
// is due.
export function createWordPaint(canvas, { faces = [], onChange = () => {} } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "low-power" });
  // The paint lives in half floats; without a way to render into them there's
  // no effect, and the component keeps the plain word.
  const floatTargets =
    renderer.capabilities.isWebGL2 &&
    (renderer.extensions.has("EXT_color_buffer_float") || renderer.extensions.has("EXT_color_buffer_half_float"));
  if (!floatTargets) {
    renderer.dispose();
    throw new Error("word paint: no half-float render targets");
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.autoClear = false; // every pass is a full-frame quad

  const camera = new THREE.Camera();
  const quad = new THREE.PlaneGeometry(2, 2);
  const blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  blank.needsUpdate = true;

  const targetOptions = {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
    stencilBuffer: false,
  };
  let read = new THREE.WebGLRenderTarget(1, 1, targetOptions);
  let write = new THREE.WebGLRenderTarget(1, 1, targetOptions);

  const paintUniforms = {
    uPrev: { value: read.texture },
    uSize: { value: new THREE.Vector2(1, 1) },
    uTexel: { value: new THREE.Vector2(1, 1) },
    uFrom: { value: new THREE.Vector2() },
    uTo: { value: new THREE.Vector2() },
    uRadius: { value: 0 },
    uVelocity: { value: new THREE.Vector2() },
    uKeep: { value: new THREE.Vector3(1, 1, 1) },
    uCarry: { value: 0 },
    uSpread: { value: 0 },
    uGain: { value: new THREE.Vector2() },
  };
  const paintMaterial = new THREE.ShaderMaterial({
    vertexShader: quadVertex,
    fragmentShader: paintFragment,
    uniforms: paintUniforms,
    depthTest: false,
    depthWrite: false,
  });
  const paintScene = new THREE.Scene();
  const paintMesh = new THREE.Mesh(quad, paintMaterial);
  paintMesh.frustumCulled = false;
  paintScene.add(paintMesh);

  const uniforms = {
    uField: { value: blank },
    uPaint: { value: read.texture },
    uSize: paintUniforms.uSize,
    uTime: { value: 0 },
    uReveal: { value: 0 },
    uPhotos: { value: blank },
    uAccent: { value: new THREE.Color("#00749e") },
  };
  const viewMaterial = new THREE.ShaderMaterial({
    vertexShader: quadVertex,
    fragmentShader: darkroomFragment,
    uniforms,
    depthTest: false,
    depthWrite: false,
  });
  const viewScene = new THREE.Scene();
  const viewMesh = new THREE.Mesh(quad, viewMaterial);
  viewMesh.frustumCulled = false;
  viewScene.add(viewMesh);

  const look = LOOK;
  let layout = null;
  let fieldTexture = null;
  let photos = null; // the loaded images
  let photosTexture = null;
  let photosLoading = false;
  let disposed = false;

  // The pointer, in css px with y up. `prev` is where it was last frame.
  let pointer = null;
  let prev = null;
  let lastTime = 0;
  let lastStroke = -INF;

  const rebuildAtlas = () => {
    if (!layout || !photos) return;
    photosTexture?.dispose();
    photosTexture = new THREE.CanvasTexture(buildAtlas(layout, photos));
    photosTexture.minFilter = THREE.LinearFilter;
    photosTexture.generateMipmaps = false;
    uniforms.uPhotos.value = photosTexture;
  };

  const ensurePhotos = () => {
    if (photos || photosLoading || !faces.length) return;
    photosLoading = true;
    Promise.all(faces.map(loadImage)).then((images) => {
      if (disposed) return;
      photos = images;
      rebuildAtlas();
      onChange();
    });
  };

  ensurePhotos();

  return {
    uniforms,

    // `glyphs`: [{ ch, left, top, width, height }] in css px from the section's
    // top left, where the DOM laid each letter out. The baseline is put back
    // from the top of each letter's text box and the font's own ascent.
    setLayout({ width, height, font, glyphs }) {
      const probe = document.createElement("canvas").getContext("2d");
      probe.font = fontString(font, 1);
      const placed = glyphs.map((g) => {
        const ascent = probe.measureText(g.ch).fontBoundingBoxAscent ?? g.height * 0.8;
        return { ...g, baseline: g.top + ascent };
      });
      layout = { width, height, font, glyphs: placed };

      renderer.setSize(width, height, false);
      paintUniforms.uSize.value.set(width, height);
      const pw = Math.max(1, Math.round(width * PAINT_SCALE));
      const ph = Math.max(1, Math.round(height * PAINT_SCALE));
      if (read.width !== pw || read.height !== ph) {
        read.setSize(pw, ph);
        write.setSize(pw, ph);
        paintUniforms.uTexel.value.set(1 / pw, 1 / ph);
      }

      const field = buildField(layout);
      fieldTexture?.dispose();
      fieldTexture = new THREE.DataTexture(field.data, field.width, field.height, THREE.RedFormat, THREE.HalfFloatType);
      fieldTexture.minFilter = THREE.LinearFilter;
      fieldTexture.magFilter = THREE.LinearFilter;
      fieldTexture.unpackAlignment = 2; // rows of half floats, any width
      fieldTexture.needsUpdate = true;
      uniforms.uField.value = fieldTexture;

      rebuildAtlas();
    },

    // Where the word sits, for the component's scripted stroke.
    wordBox() {
      if (!layout?.glyphs.length) return null;
      const first = layout.glyphs[0];
      const last = layout.glyphs[layout.glyphs.length - 1];
      return {
        left: first.left,
        right: last.left + last.width,
        baseline: first.baseline,
        size: layout.font.size,
        height: layout.height,
      };
    },

    // Pointer position in css px from the section's top left, or null when
    // it has left.
    point(x, y) {
      pointer = x == null || !layout ? null : { x, y: layout.height - y };
      if (!pointer) prev = null;
    },

    // True until the last stroke's ink has faded below 1%.
    busy(time) {
      return time - lastStroke < Math.log(0.01) / Math.log(look.keep[1]) / 60;
    },

    step(time) {
      if (!layout) return;
      const dt = Math.min(1 / 20, Math.max(1 / 240, time - lastTime || 1 / 60));
      const frames = dt * 60; // this frame, in 60 Hz frames
      lastTime = time;

      // The brush: this frame's path, its speed setting its width.
      let radius = 0;
      if (pointer && prev) {
        const vx = (pointer.x - prev.x) / frames;
        const vy = (pointer.y - prev.y) / frames;
        const speed = Math.hypot(vx, vy);
        if (speed > 0.35) {
          radius = Math.min(look.brush.max, look.brush.min + speed * look.brush.perSpeed);
          paintUniforms.uFrom.value.set(prev.x, prev.y);
          paintUniforms.uTo.value.set(pointer.x, pointer.y);
          paintUniforms.uVelocity.value.set(vx, vy);
          lastStroke = time;
        }
      }
      prev = pointer && { ...pointer };
      paintUniforms.uRadius.value = radius;
      paintUniforms.uKeep.value.set(look.keep[0] ** frames, look.keep[1] ** frames, look.keep[2] ** frames);
      paintUniforms.uCarry.value = look.carry * frames;
      paintUniforms.uSpread.value = Math.min(1, look.spread * frames);
      paintUniforms.uGain.value.set(look.gain[0], look.gain[1]);

      paintUniforms.uPrev.value = read.texture;
      renderer.setRenderTarget(write);
      renderer.render(paintScene, camera);
      renderer.setRenderTarget(null);
      [read, write] = [write, read];

      uniforms.uPaint.value = read.texture;
      uniforms.uTime.value = time;
      renderer.render(viewScene, camera);
    },

    dispose() {
      disposed = true;
      viewMaterial.dispose();
      paintMaterial.dispose();
      quad.dispose();
      read.dispose();
      write.dispose();
      fieldTexture?.dispose();
      photosTexture?.dispose();
      blank.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

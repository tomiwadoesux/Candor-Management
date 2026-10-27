// The model board's picture window: one full-frame plane, one pass, three moves.
//
// The landing page's board steps through the roster one model at a time, and
// each of its three layouts turns the page in its own photographic way:
//
//   0 · develop  the outgoing print bleaches back to paper, highlights first,
//                and the incoming one comes up out of it shadows first, the
//                way a print appears in the developer tray.
//   1 · gate     the frame advances through a gate cut into vertical slits,
//                each slit pulling the film a beat after its neighbour, with
//                a dark frame line between the two pictures and the channels
//                parted while the film is moving.
//   2 · iris     a seven-bladed aperture opens from wherever you pressed,
//                its blades turning as they part, with a bright, split rim.
//
// Shared by all three: cover-fit biased up for faces, a cursor lens, optional
// monochrome-at-rest with colour developing under the lens (the Casting
// menu's idea), and light grain. Raw three.js, like the carousel, the sphere
// and the Casting window; loaded only when a board first nears the viewport.
import * as THREE from "three";

export const MODES = { develop: 0, gate: 1, iris: 2 };

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform sampler2D uFrom;
  uniform sampler2D uTo;
  uniform vec2  uFromSize;
  uniform vec2  uToSize;
  uniform vec2  uResolution;
  uniform float uProgress;     // 0 = uFrom, 1 = uTo
  uniform float uDir;          // +1 forward through the roster, -1 back
  uniform vec2  uOrigin;       // iris centre, 0..1, y up
  uniform vec2  uMouse;        // 0..1, y up
  uniform float uLens;         // 0..1 while the pointer is over the frame
  uniform float uMono;         // 0 = colour at rest, 1 = monochrome at rest
  uniform vec3  uPaper;        // what a bleached print goes back to
  uniform float uGrain;
  uniform float uTime;
  uniform int   uMode;

  const float PI = 3.14159265;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) { return noise(p) * 0.6 + noise(p * 2.1 + 5.3) * 0.28 + noise(p * 4.7 + 1.7) * 0.12; }
  float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

  // object-fit: cover, biased up a touch so faces keep their foreheads.
  // zoom > 1 pushes in around the centre, for pictures settling as they land.
  vec2 cover(vec2 uv, vec2 img, float zoom) {
    float canvasRatio = uResolution.x / uResolution.y;
    float imgRatio = img.x / img.y;
    vec2 scale = canvasRatio > imgRatio ? vec2(1.0, imgRatio / canvasRatio) : vec2(canvasRatio / imgRatio, 1.0);
    uv = (uv - 0.5) / zoom + 0.5;
    return uv * scale + (1.0 - scale) * vec2(0.5, 0.62);
  }
  vec3 sampleFrom(vec2 uv, float zoom) { return texture2D(uFrom, cover(uv, uFromSize, zoom)).rgb; }
  vec3 sampleTo(vec2 uv, float zoom) { return texture2D(uTo, cover(uv, uToSize, zoom)).rgb; }
  vec3 splitTo(vec2 uv, float zoom, vec2 split) {
    return vec3(texture2D(uTo, cover(uv + split, uToSize, zoom)).r,
                texture2D(uTo, cover(uv, uToSize, zoom)).g,
                texture2D(uTo, cover(uv - split, uToSize, zoom)).b);
  }
  vec3 splitFrom(vec2 uv, float zoom, vec2 split) {
    return vec3(texture2D(uFrom, cover(uv + split, uFromSize, zoom)).r,
                texture2D(uFrom, cover(uv, uFromSize, zoom)).g,
                texture2D(uFrom, cover(uv - split, uFromSize, zoom)).b);
  }

  // ── 0 · develop ──────────────────────────────────────────────────────────
  // Two thresholds over the same progress. The outgoing print bleaches where
  // it is brightest first; the incoming one starts a third of the way in and
  // takes its shadows before its highlights. Both are broken up by a slow,
  // blotchy noise, the uneven wash of developer across the paper.
  vec3 develop(vec2 uv, float p, float aspect) {
    float wash = fbm(uv * vec2(aspect, 1.0) * 3.2 + vec2(3.1, uTime * 0.05));
    float swell = 4.0 * p * (1.0 - p);
    // The tray rocks: the picture breathes a little while it changes.
    vec2 ripple = vec2(sin(uv.y * 18.0 + uTime * 2.0), cos(uv.x * 14.0 - uTime * 1.6)) * 0.0025 * swell;
    vec3 from = sampleFrom(uv + ripple, 1.0 + 0.02 * p);
    vec3 to = sampleTo(uv + ripple, 1.06 - 0.06 * smoothstep(0.2, 1.0, p));
    float bleach = clamp(p * 2.2 - (1.0 - luma(from)) * 0.6 - wash * 0.4, 0.0, 1.0);
    float dev = clamp((p - 0.3) / 0.7 * 1.9 - luma(to) * 0.6 - wash * 0.3, 0.0, 1.0);
    vec3 base = mix(from, uPaper, smoothstep(0.0, 1.0, bleach));
    // A developing print is thin before it is dense: lift it towards the
    // paper's tone until it has fully come up.
    vec3 rising = mix(uPaper, to, smoothstep(0.0, 1.0, dev));
    return mix(base, rising, smoothstep(0.0, 0.35, dev));
  }

  // ── 1 · gate ─────────────────────────────────────────────────────────────
  // Each slit is a strip of film. The incoming picture sits on the reel just
  // past the outgoing one; a slit's offset runs 0 → 1, a beat behind its
  // neighbour in the direction of travel.
  vec3 gate(vec2 uv, float p) {
    float slits = 9.0;
    float col = floor(uv.x * slits);
    float order = uDir > 0.0 ? col / (slits - 1.0) : 1.0 - col / (slits - 1.0);
    float local = clamp(p * 1.7 - order * 0.7 - hash(vec2(col, 3.0)) * 0.06, 0.0, 1.0);
    float o = local < 0.5 ? 4.0 * local * local * local : 1.0 - pow(-2.0 * local + 2.0, 3.0) * 0.5;
    float speed = 4.0 * local * (1.0 - local);
    vec2 split = vec2(0.0, speed * 0.012);

    float r = uv.y - o * uDir;
    bool onTo = uDir > 0.0 ? r < 0.0 : r > 1.0;
    float y = onTo ? r + uDir : r;
    vec2 at = vec2(uv.x, y);
    // Motion blur along the film: three taps, spread by the slit's speed.
    vec2 blur = vec2(0.0, speed * 0.018);
    vec3 c = onTo
      ? (splitTo(at, 1.0, split) * 0.5 + sampleTo(at + blur, 1.0) * 0.25 + sampleTo(at - blur, 1.0) * 0.25)
      : (splitFrom(at, 1.0, split) * 0.5 + sampleFrom(at + blur, 1.0) * 0.25 + sampleFrom(at - blur, 1.0) * 0.25);

    // The frame line between the two pictures, and a hairline where one slit
    // meets the next while the film is moving.
    float edge = onTo ? abs(y - (uDir > 0.0 ? 1.0 : 0.0)) : abs(r - (uDir > 0.0 ? 0.0 : 1.0));
    c *= 1.0 - smoothstep(0.012, 0.0, edge) * 0.92 * step(0.001, speed);
    float seam = abs(fract(uv.x * slits) - 0.5) * 2.0;
    c *= 1.0 - smoothstep(0.94, 1.0, seam) * speed * 0.6;
    return c;
  }

  // ── 2 · iris ─────────────────────────────────────────────────────────────
  // Distance to a regular seven-sided polygon, turning as it grows, so the
  // opening has blades rather than reading as a plain circle.
  vec3 iris(vec2 uv, float p, float aspect) {
    vec2 q = (uv - uOrigin) * vec2(aspect, 1.0);
    float blades = 7.0;
    float a = atan(q.y, q.x) + p * 1.4;
    float sector = 2.0 * PI / blades;
    float k = cos(PI / blades) / cos(mod(a, sector) - sector * 0.5);
    float d = length(q) / k;
    float R = p * (length(vec2(aspect, 1.0)) + 0.35);
    float inside = smoothstep(R + 0.004, R - 0.004, d);
    float rim = smoothstep(0.06, 0.0, abs(d - R)) * (1.0 - smoothstep(0.75, 1.0, p));
    vec2 split = normalize(q + 1e-4) * rim * 0.012 / vec2(aspect, 1.0);
    vec3 to = splitTo(uv, 1.12 - 0.12 * p, split);
    vec3 from = sampleFrom(uv, 1.0 + 0.04 * p) * (1.0 - 0.55 * p);
    vec3 c = mix(from, to, inside);
    return c + rim * rim * 0.18;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;

    // Cursor lens: a gentle bulge, strongest at the centre.
    vec2 toMouse = (uv - uMouse) * vec2(aspect, 1.0);
    float r = length(toMouse);
    float lens = smoothstep(0.36, 0.0, r) * uLens;
    uv += -(uv - uMouse) * lens * 0.05;

    float p = clamp(uProgress, 0.0, 1.0);
    vec3 colour = uMode == 0 ? develop(uv, p, aspect) : uMode == 1 ? gate(uv, p) : iris(uv, p, aspect);

    // Monochrome at rest (when asked for), developing back into colour under
    // the lens, with a faint warm cast so the greys don't read as cold.
    float bloom = smoothstep(0.26, 0.02, r) * uLens;
    vec3 mono = vec3(luma(colour)) * vec3(1.02, 1.0, 0.97);
    colour = mix(colour, mono, uMono * (1.0 - bloom));

    colour += (hash(vUv * uResolution + fract(uTime) * 91.0) - 0.5) * uGrain;
    gl_FragColor = vec4(colour, 1.0);
  }
`;

// Textures are kept per renderer and evicted oldest-first past this many, so
// stepping through all sixteen models doesn't hold ~32 full-size pictures in
// video memory. The two on screen are never evicted.
const KEEP = 6;

export function createBoardRenderer(canvas, { mode = "develop", mono = 0, paper = "#ffffff", grain = 0.03 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const loader = new THREE.TextureLoader();
  const paperColour = new THREE.Color(paper);
  const blankPixel = new Uint8Array([paperColour.r * 255, paperColour.g * 255, paperColour.b * 255, 255].map(Math.round));
  const blank = new THREE.DataTexture(blankPixel, 1, 1);
  blank.needsUpdate = true;
  const blankEntry = { texture: blank, size: new THREE.Vector2(1, 1) };

  const uniforms = {
    uFrom: { value: blank }, uTo: { value: blank },
    uFromSize: { value: blankEntry.size }, uToSize: { value: blankEntry.size },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uProgress: { value: 1 }, uDir: { value: 1 }, uOrigin: { value: new THREE.Vector2(0.5, 0.5) },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) }, uLens: { value: 0 },
    uMono: { value: mono }, uPaper: { value: new THREE.Vector3(paperColour.r, paperColour.g, paperColour.b) },
    uGrain: { value: grain }, uTime: { value: 0 }, uMode: { value: MODES[mode] ?? 0 },
  };
  const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, depthTest: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(mesh);

  const cache = new Map(); // src → Promise<entry>, in insertion (≈ use) order
  let fromEntry = blankEntry;
  let toEntry = blankEntry;
  let disposed = false;

  const load = (src) => {
    if (cache.has(src)) {
      const hit = cache.get(src);
      cache.delete(src);
      cache.set(src, hit);
      return hit;
    }
    const pending = new Promise((resolve) => {
      loader.load(src, (texture) => {
        if (disposed) { texture.dispose(); return resolve(blankEntry); }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        resolve({ texture, size: new THREE.Vector2(texture.image.width, texture.image.height) });
      }, undefined, () => resolve(blankEntry));
    });
    cache.set(src, pending);
    evict();
    return pending;
  };

  const evict = () => {
    while (cache.size > KEEP) {
      const [oldest, pending] = cache.entries().next().value;
      cache.delete(oldest);
      pending.then((entry) => {
        if (entry !== blankEntry && entry !== fromEntry && entry !== toEntry) entry.texture.dispose();
      });
    }
  };

  const assign = (slot, entry) => {
    uniforms[slot].value = entry.texture;
    uniforms[`${slot}Size`].value = entry.size;
  };

  return {
    uniforms,
    load,
    resize(width, height) {
      renderer.setSize(width, height, false);
      uniforms.uResolution.value.set(width, height);
    },
    // Both take an entry from load(), not a src, so the caller can await the
    // texture and drop the step if a newer one arrived in the meantime —
    // nothing here is asynchronous, so a stale load can never overwrite a
    // fresher picture.
    //
    // Show an entry at once, no transition: the first picture.
    show(entry) {
      fromEntry = toEntry = entry;
      assign("uFrom", entry);
      assign("uTo", entry);
      uniforms.uProgress.value = 1;
    },
    // Ready a transition toward an entry; the caller tweens uProgress 0 → 1.
    // If one is under way, whichever picture is mostly on screen becomes the
    // starting point, so a quick run of clicks never flashes back to a model
    // already left behind.
    begin(entry, { dir = 1, origin } = {}) {
      const current = uniforms.uProgress.value > 0.5 ? toEntry : fromEntry;
      fromEntry = current;
      toEntry = entry;
      assign("uFrom", current);
      assign("uTo", entry);
      uniforms.uDir.value = dir;
      if (origin) uniforms.uOrigin.value.set(origin.x, origin.y);
      uniforms.uProgress.value = 0;
    },
    render(time) {
      uniforms.uTime.value = time;
      renderer.render(scene, camera);
    },
    dispose() {
      disposed = true;
      cache.forEach((pending) => pending.then((entry) => entry !== blankEntry && entry.texture.dispose()));
      cache.clear();
      blank.dispose();
      material.dispose();
      mesh.geometry.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

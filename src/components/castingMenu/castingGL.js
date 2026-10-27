// The Casting study's portrait window: one full-frame plane, one pass.
//
// Two textures and a progress value. The incoming face rises through the
// outgoing one along a noisy, viscous front (the carousel's goo, flattened to
// a wipe); pixels near that front are pulled upward and split by channel, so
// the change reads as liquid rather than a clip. The page is monochrome and
// so is the window at rest: a soft lens follows the cursor and develops the
// photograph back into colour underneath it, the way a print comes up in
// the tray. Raw three.js, like the carousel and the sphere, loaded only when
// the menu first opens.
import * as THREE from "three";

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
  uniform vec2  uFromSize;     // natural image size, for cover-fit
  uniform vec2  uToSize;
  uniform vec2  uResolution;   // canvas size in px
  uniform float uProgress;     // 0 = uFrom, 1 = uTo
  uniform vec2  uMouse;        // 0..1, y up
  uniform float uLens;         // 0..1, eased in while the pointer is over the window
  uniform float uTime;

  // Value noise, two octaves: enough to make the front wander without
  // reading as static.
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) { return noise(p) * 0.65 + noise(p * 2.3 + 7.1) * 0.35; }

  // object-fit: cover, biased up a touch so faces keep their foreheads.
  vec2 cover(vec2 uv, vec2 img) {
    float canvasRatio = uResolution.x / uResolution.y;
    float imgRatio = img.x / img.y;
    vec2 scale = canvasRatio > imgRatio ? vec2(1.0, imgRatio / canvasRatio) : vec2(canvasRatio / imgRatio, 1.0);
    vec2 offset = (1.0 - scale) * vec2(0.5, 0.62);
    return uv * scale + offset;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;

    // The front: a horizontal line climbing from below the frame to above
    // it, bent by noise that drifts with time. Its band is ~18% of height.
    float wobble = (fbm(vec2(uv.x * 3.0, uTime * 0.25)) - 0.5) * 0.32;
    float front = mix(-0.25, 1.25, uProgress) + wobble;
    float d = front - uv.y;                       // > 0 below the front: already uTo
    float band = smoothstep(0.18, 0.0, abs(d));   // 1 on the front
    float mixTo = smoothstep(-0.04, 0.04, d);

    // Pull pixels up along the front, the outgoing image dragged and the
    // incoming one released, with the red and blue channels parted a little.
    vec2 pull = vec2(0.0, band * 0.09);
    float split = band * 0.012;

    // Cursor lens: a gentle bulge, strongest at the centre.
    vec2 toMouse = (uv - uMouse) * vec2(aspect, 1.0);
    float r = length(toMouse);
    float lens = smoothstep(0.32, 0.0, r) * uLens;
    vec2 bulge = -(uv - uMouse) * lens * 0.06;

    vec2 base = uv + bulge;
    vec3 from, to;
    from.r = texture2D(uFrom, cover(base - pull + vec2(split, 0.0), uFromSize)).r;
    from.g = texture2D(uFrom, cover(base - pull, uFromSize)).g;
    from.b = texture2D(uFrom, cover(base - pull - vec2(split, 0.0), uFromSize)).b;
    to.r = texture2D(uTo, cover(base + pull * 0.6 + vec2(split, 0.0), uToSize)).r;
    to.g = texture2D(uTo, cover(base + pull * 0.6, uToSize)).g;
    to.b = texture2D(uTo, cover(base + pull * 0.6 - vec2(split, 0.0), uToSize)).b;
    vec3 colour = mix(from, to, mixTo);

    // Monochrome everywhere but under the lens, with a faint warm cast so the
    // greys sit on the cream page rather than fighting it.
    float luma = dot(colour, vec3(0.299, 0.587, 0.114));
    vec3 mono = vec3(luma) * vec3(1.02, 1.0, 0.96);
    float develop = smoothstep(0.24, 0.02, r) * uLens;
    colour = mix(mono, colour, develop);

    // The front itself carries a thin bright meniscus, like the carousel's
    // glass lip, so the move has an edge to follow.
    colour += band * band * 0.10;

    // Film grain, very light.
    colour += (hash(uv * uResolution + fract(uTime) * 91.0) - 0.5) * 0.035;

    gl_FragColor = vec4(colour, 1.0);
  }
`;

export function createCastingRenderer(canvas, sources) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const loader = new THREE.TextureLoader();
  const blank = new THREE.DataTexture(new Uint8Array([20, 20, 20, 255]), 1, 1);
  blank.needsUpdate = true;

  const textures = sources.map(() => ({ texture: blank, size: new THREE.Vector2(1, 1) }));
  const uniforms = {
    uFrom: { value: blank }, uTo: { value: blank },
    uFromSize: { value: new THREE.Vector2(1, 1) }, uToSize: { value: new THREE.Vector2(1, 1) },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uProgress: { value: 0 }, uMouse: { value: new THREE.Vector2(0.5, 0.5) }, uLens: { value: 0 },
    uTime: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, depthTest: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(mesh);

  let shown = 0;
  let disposed = false;
  const assign = (slot, index) => {
    uniforms[slot].value = textures[index].texture;
    uniforms[`${slot}Size`].value = textures[index].size;
  };

  const ready = Promise.all(sources.map((src, index) => new Promise((resolve) => {
    loader.load(src, (texture) => {
      if (disposed) { texture.dispose(); return resolve(); }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      textures[index] = { texture, size: new THREE.Vector2(texture.image.width, texture.image.height) };
      if (index === shown) { assign("uFrom", index); assign("uTo", index); }
      resolve();
    }, undefined, () => resolve());
  })));

  return {
    ready,
    resize(width, height) {
      renderer.setSize(width, height, false);
      uniforms.uResolution.value.set(width, height);
    },
    // Begin a transition toward `index`. If one is under way, whichever image
    // is mostly on screen becomes the new starting point, so a quick sweep
    // across the links never flashes back to a face already left behind.
    beginTo(index) {
      const current = uniforms.uProgress.value > 0.5 ? uniforms.uTo.value : uniforms.uFrom.value;
      const currentIndex = textures.findIndex((entry) => entry.texture === current);
      const from = currentIndex === -1 ? shown : currentIndex;
      assign("uFrom", from);
      assign("uTo", index);
      uniforms.uProgress.value = 0;
      shown = index;
    },
    uniforms,
    render(time) {
      uniforms.uTime.value = time;
      renderer.render(scene, camera);
    },
    dispose() {
      disposed = true;
      textures.forEach((entry) => entry.texture !== blank && entry.texture.dispose());
      blank.dispose();
      material.dispose();
      mesh.geometry.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

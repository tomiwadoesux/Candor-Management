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

// The looks. Every look reads the same paint (velocity, ink, fresh) and the
// same distance field; they differ only in how the photograph is composed
// under it, so switching look costs nothing in passes or buffers. Each is a
// main() body that sets \`c\` (the letter's interior) and \`expose\` (how
// developed it is, for the grain); \`finish\` then adds the paper, the
// safelight pool, the halation and the hairline that every look shares.
const lookCommon = /* glsl */ `
  uniform sampler2D uPhotos;  // the photograph(s), already cut to the letters
  uniform vec3 uAccent;       // the safelight: Candor blue

  const vec3 BASE = vec3(0.035, 0.035, 0.038);
  const vec3 LUMA = vec3(0.299, 0.587, 0.114);

  // The gradient of the ink: which way the stroke falls off, in uv.
  vec2 inkGradient(vec2 uv) {
    vec2 e = 3.0 / uSize;
    return vec2(
      texture2D(uPaint, uv + vec2(e.x, 0.0)).z - texture2D(uPaint, uv - vec2(e.x, 0.0)).z,
      texture2D(uPaint, uv + vec2(0.0, e.y)).z - texture2D(uPaint, uv - vec2(0.0, e.y)).z
    );
  }

  // The paper, the pool, the halation, the outline, the reveal and the grain.
  vec3 finish(vec3 c, float sd, float ink, float fresh, float expose) {
    float outside = 1.0 - insideOf(sd);
    c += uAccent * ink * 0.1 * outside;
    float glow = exp(-max(sd, 0.0) / 14.0) * outside * (ink * 0.5 + fresh * 0.2);
    c += uAccent * glow * 0.5;
    vec3 rimColour = mix(vec3(0.38), uAccent * 1.4 + 0.15, smoothstep(0.05, 0.5, ink + fresh * 0.5));
    c = mix(c, rimColour, hairline(sd, 1.6) * 0.85);
    c = mix(BASE, c, revealAt(vUv));
    c += (hash(gl_FragCoord.xy + fract(uTime) * 97.0) - 0.5) * (0.015 + expose * 0.035);
    return c;
  }
`;

const lookFragment = (body) => /* glsl */ `
  ${viewCommon}
  ${lookCommon}

  void main() {
    float sd = texture2D(uField, vUv).r;
    vec4 paint = texture2D(uPaint, vUv);
    float ink = paint.z, fresh = paint.w;
    float inside = insideOf(sd);
    vec3 photo = texture2D(uPhotos, vUv).rgb;
    float photoLuma = dot(photo, LUMA);
    // The latent image: cool, only just there, and breathing.
    float breath = 0.75 + 0.25 * sin(uTime * 0.45 + vUv.x * 2.0);
    vec3 latent = pow(photoLuma, 1.6) * vec3(0.16, 0.2, 0.24) * 0.5 * breath;
    vec3 c = BASE;
    float expose = 0.0;
    ${body}
    gl_FragColor = vec4(finish(c, sd, ink, fresh, expose), 1.0);
  }
`;

export const LOOKS = {
  // Darkroom: the print comes up the way it does in the developer tray —
  // shadows first, then the mids, colour last — and sinks back to the latent.
  darkroom: /* glsl */ `
    expose = smoothstep(0.0, 0.7, ink + fresh * 0.2);
    vec2 part = paint.xy * 0.15 / uSize;
    photo = vec3(texture2D(uPhotos, vUv + part).r, photo.g, texture2D(uPhotos, vUv - part).b);
    vec3 print = pow(photo, vec3(mix(2.2, 1.0, expose))) * smoothstep(0.0, 0.85, expose);
    float luma = dot(print, LUMA);
    print = mix(luma * vec3(0.9, 0.95, 1.0), print, smoothstep(0.5, 1.0, expose));
    c += inside * (print + latent + 0.01);
  `,

  // Wet: the stroke is developer poured onto the paper. It has an edge — a
  // meniscus that catches the light — and the print is only up inside it,
  // seen through a skin of liquid that bends it a little.
  wet: /* glsl */ `
    vec2 g = inkGradient(vUv);
    float wet = smoothstep(0.16, 0.26, ink);
    expose = wet;
    float boundary = 1.0 - abs(wet * 2.0 - 1.0);
    float meniscus = boundary * smoothstep(0.0, 0.03, length(g));
    vec2 nrm = g / (length(g) + 1e-4);
    float sheen = pow(max(0.0, dot(nrm, normalize(vec2(-0.5, 0.85)))), 2.0);
    vec3 print = texture2D(uPhotos, vUv - g * 0.9).rgb * wet;
    print += fresh * wet * 0.08;
    c += inside * (print + latent * (1.0 - wet) + 0.01);
    c += inside * meniscus * (0.18 + 0.7 * sheen) * vec3(0.8, 0.92, 1.0);
  `,

  // Ripple: the photograph is already there, under water. The pointer
  // disturbs the surface: the image wobbles where the stroke falls off, and
  // rings of light run out across it, then it settles.
  ripple: /* glsl */ `
    vec2 g = inkGradient(vUv);
    float ring = 0.5 + 0.5 * sin(ink * 36.0 - uTime * 5.0);
    vec2 disp = g * (0.6 + 0.6 * ring) + paint.xy * 0.0004;
    float lit = 0.22 + 0.78 * smoothstep(0.0, 0.6, ink);
    expose = lit;
    vec3 print = pow(texture2D(uPhotos, vUv + disp).rgb, vec3(mix(1.6, 1.0, lit))) * lit;
    float crest = ring * smoothstep(0.0, 0.3, ink) * (1.0 - smoothstep(0.6, 1.0, ink)) * smoothstep(0.0, 0.02, length(g));
    c += inside * (print + crest * 0.22 * vec3(0.85, 0.95, 1.0) + 0.01);
  `,

  // Grain: silver. The print comes up grain by grain, each one flipping
  // from dark to its tone in its own time, and the fresh stroke sparkles
  // with grains that haven't settled.
  grain: /* glsl */ `
    float n = hash(floor(gl_FragCoord.xy / 1.5));
    float dev = smoothstep(0.0, 0.9, ink * 1.4);
    float settled = smoothstep(n - 0.35, n + 0.05, dev);
    expose = settled;
    vec3 tone = mix(vec3(photoLuma) * vec3(0.95, 0.97, 1.0), photo, smoothstep(0.4, 1.0, dev));
    vec3 print = tone * settled;
    float sparkle = step(0.985, hash(floor(gl_FragCoord.xy / 1.5) + floor(uTime * 10.0)));
    c += inside * (print + latent * (1.0 - dev) + fresh * sparkle * 0.7 + 0.01);
  `,

  // Chrome: the letters are cast, not printed. The field gives each edge a
  // bevel; the torch lights it from the way it travels, so a sweep rolls a
  // highlight along the edges, and the photograph shows in the metal only as
  // a reflection.
  chrome: /* glsl */ `
    vec2 e = 1.5 / uSize;
    vec2 slope = vec2(
      texture2D(uField, vUv + vec2(e.x, 0.0)).r - texture2D(uField, vUv - vec2(e.x, 0.0)).r,
      texture2D(uField, vUv + vec2(0.0, e.y)).r - texture2D(uField, vUv - vec2(0.0, e.y)).r
    );
    vec2 nrm = slope / (length(slope) + 1e-4);
    float bevel = 1.0 - smoothstep(0.0, 22.0, -sd);
    bevel *= bevel;
    vec3 N = normalize(vec3(nrm * bevel * 1.4, 1.0));
    vec3 L = normalize(vec3(paint.xy * 0.03 + vec2(-0.35, 0.6), 0.75));
    float diff = max(dot(N, L), 0.0);
    float spec = pow(max(dot(reflect(-L, N), vec3(0.0, 0.0, 1.0)), 0.0), 28.0);
    float lit = smoothstep(0.0, 0.5, ink);
    expose = lit;
    vec3 reflection = texture2D(uPhotos, vUv + nrm * bevel * 0.08).rgb;
    vec3 metal = vec3(0.06, 0.065, 0.07) + diff * vec3(0.28, 0.3, 0.34) + spec * 0.9 + reflection * 0.35 * (0.4 + 0.6 * bevel);
    c += inside * (mix(latent * 0.6 + 0.01, metal, lit) + fresh * spec * 0.6);
  `,

  // Smear: the print is wet and the pointer drags it. The image streaks
  // along the stroke's travel, the channels pull apart, and it stills again
  // as the velocity dies.
  smear: /* glsl */ `
    vec2 v = paint.xy * 0.7 / uSize;
    vec3 acc = vec3(0.0);
    for (int i = 0; i < 6; i++) {
      float t = float(i) / 5.0 - 0.5;
      acc += texture2D(uPhotos, vUv - v * t).rgb;
    }
    acc /= 6.0;
    acc.r = mix(acc.r, texture2D(uPhotos, vUv + v * 0.6).r, 0.6);
    acc.b = mix(acc.b, texture2D(uPhotos, vUv - v * 0.6).b, 0.6);
    expose = smoothstep(0.0, 0.6, ink);
    vec3 print = pow(acc, vec3(mix(1.8, 1.0, expose))) * expose;
    float streak = smoothstep(0.0, 40.0, length(paint.xy)) * fresh;
    c += inside * (print + latent * (1.0 - expose) + streak * 0.12 + 0.01);
  `,

  // Negative: the whole word is already there as a film negative, dim and
  // inverted with the orange mask, and the torch turns it positive where it
  // passes — the moment of the print.
  negative: /* glsl */ `
    float pos = smoothstep(0.05, 0.6, ink);
    expose = pos;
    vec3 negative = (1.0 - photo) * vec3(0.5, 0.42, 0.34) * 0.32 * (0.85 + 0.15 * breath);
    vec3 positive = pow(photo, vec3(mix(1.4, 1.0, pos)));
    vec3 print = mix(negative, positive, pos);
    c += inside * (print + fresh * 0.06 + 0.01);
  `,
};

// Spectrum, after Lusion's "AWARD" title: no photograph. The letters are the
// page's own ground with a lit outline — light on a dark page, ink on a light
// one — and the paint is colour. A slow cosine
// wave runs diagonally across the section; where the stroke has passed, the
// fill and (four times as hard) the outline take their colour from a looping
// spectrum strip, indexed by the wave plus the stroke's own velocity, so the
// colour shifts with which way and how fast the pointer went. Inside the
// colour, the photograph shows through, barely: only where the stroke is.
//
// Untouched, the outline is lit like a real edge rather than shimmering: one
// light in the scene (the pointer, or a key light up and to the left when it's
// away), the outline's normal read off the distance field, so the edges that
// face the light catch a highlight and the far side of every stroke catches a
// dimmer bounce in the opposite colour. Every few seconds a glint runs across
// the word, flaring the edges that face the light as it passes.
const spectrumFragment = /* glsl */ `
  ${viewCommon}
  uniform sampler2D uSpectrum; // a loop of colour, 256 x 1
  uniform sampler2D uPhotos;   // the photograph, cut to the letters
  uniform sampler2D uPhotosNext; // the next one, faded to by uSwap
  uniform float uSwap;
  uniform float uPhoto;        // how much of it shows at full stroke
  uniform float uLine;         // outline width, css px
  uniform vec3  uLight;        // the light, css px, y up; z its height above the page
  uniform float uGlint;        // the glint's front across the word, in uv; off below -1
  uniform vec3  uGround;       // the page behind the section, sRGB
  uniform vec3  uInk;          // its opposite: what the light is made of
  uniform float uDark;         // 1 on a dark ground, 0 on a light one
  uniform float uRest;         // how much of the photograph shows untouched
  uniform float uClear;        // 1: see-through off the letters

  const vec3 LUMA = vec3(0.299, 0.587, 0.114);

  vec3 spectrum(float h) { return texture2D(uSpectrum, vec2(fract(h), 0.5)).rgb; }
  // The strip as the stroke lays it: a little greyed and sunk toward the
  // ground, so the colour is a tint rather than a flare; deepened a touch on
  // a light ground so it still reads.
  vec3 hush(vec3 c) { return mix(uGround, mix(vec3(dot(c, LUMA)), c, 0.7) * mix(0.8, 1.0, uDark), 0.7); }
  // Light on a dark ground adds up; on a light ground it's ink, laid over, and
  // laid heavier, since a hairline of ink on white reads fainter than light.
  vec3 lay(vec3 base, vec3 colour, float amount) {
    return mix(mix(base, colour, clamp(amount * 1.8, 0.0, 1.0)), base + colour * amount * 1.5, uDark);
  }

  void main() {
    float sd = texture2D(uField, vUv).r;
    vec4 paint = texture2D(uPaint, vUv);
    float strength = max(paint.z, paint.w);
    float tint = smoothstep(0.0, 1.0, strength) * 0.4;
    float velocity = (paint.x + paint.y) * 0.012;

    // The wave picks the stroke's colour; the outline runs it half a turn out
    // of step with the fill. It drifts, slowly.
    float drift = uTime * 0.35;
    float wave = cos((vUv.x + vUv.y) * 4.0 + drift) * 0.5 + 0.5;
    float waveEdge = cos((vUv.x + vUv.y) * 4.0 + drift + 3.1415926) * 0.5 + 0.5;

    // The edge's outward normal, from the slope of the field.
    vec2 e = 2.0 / uSize;
    vec2 slope = vec2(
      texture2D(uField, vUv + vec2(e.x, 0.0)).r - texture2D(uField, vUv - vec2(e.x, 0.0)).r,
      texture2D(uField, vUv + vec2(0.0, e.y)).r - texture2D(uField, vUv - vec2(0.0, e.y)).r
    );
    vec2 n = slope / (length(slope) + 1e-4);

    // The light: which way it falls on this bit of edge.
    vec3 toLight = normalize(vec3(uLight.xy - vUv * uSize, uLight.z));
    float facing = dot(n, toLight.xy);
    float key = pow(max(facing, 0.0), 2.5);
    float bounce = pow(max(-facing, 0.0), 4.0);

    // The glint: a narrow slanted band that crosses the word, flaring the
    // edges that face the light and lifting the rest a little.
    float band = exp(-pow((vUv.x + vUv.y * 0.3 - uGlint) * 4.0, 2.0));

    // The highlight's colour turns with the edge's angle, as a reflection
    // would; the bounce is the opposite colour on the strip.
    float angle = atan(n.y, n.x) / 6.2831853;
    vec3 keyColour = mix(uInk, spectrum(angle * 0.5 + 0.08) * mix(0.7, 1.0, uDark), mix(0.4, 0.5, uDark));
    vec3 bounceColour = spectrum(angle * 0.5 + 0.58) * mix(0.55, 1.0, uDark);

    vec3 photo = mix(texture2D(uPhotos, vUv).rgb, texture2D(uPhotosNext, vUv).rgb, uSwap);
    vec3 fillBase = lay(uGround, uInk, wave * wave * 0.015);
    // At rest the photograph is just there in the letters, plain, no colour:
    // a dim print on a dark ground, a pale one on a light ground, its tones
    // lifted there so the picture shows rather than a grey wash.
    vec3 rest = mix(vec3(dot(photo, LUMA)), photo, 0.8);
    rest = mix(pow(rest, vec3(0.45)), rest, uDark);
    fillBase = mix(fillBase, rest, uRest);
    // A soft sheen just inside the lit edges, so the letters read as having
    // thickness, and lifting a little as the glint passes.
    float sheen = exp(min(sd, 0.0) / 7.0) * insideOf(sd);
    fillBase = lay(fillBase, keyColour, sheen * key * (0.02 + band * 0.06));
    vec3 fill = mix(fillBase, hush(spectrum(velocity + wave * 2.0)), tint);
    // The photo, as an imprint in the colour: its tones shade the colour
    // rather than replace it, so the colour stays and the picture is faint.
    vec3 imprint = mix(fill * (0.55 + photo * 0.6), fill * (0.1 + photo * 2.0) + photo * 0.04, uDark);
    fill = mix(fill, imprint, uPhoto * tint * 2.0);

    // Every edge keeps a trace of the outline; the light does the rest.
    vec3 edgeBase = lay(uGround, uInk, mix(0.2, 0.08, uDark));
    edgeBase = lay(edgeBase, keyColour, key * (0.4 + band * 0.6));
    edgeBase = lay(edgeBase, bounceColour, bounce * (0.15 + band * 0.2));
    edgeBase = lay(edgeBase, uInk, band * 0.06);
    vec3 edgeHue = hush(spectrum(velocity + waveEdge * 2.0));
    vec3 edge = mix(edgeBase, edgeHue, smoothstep(0.0, 1.0, strength * 1.5) * 0.6);

    float inside = insideOf(sd);
    float line = hairline(sd, uLine) * mix(0.6, 0.8, uDark);
    float shown = revealAt(vUv);
    vec3 c = mix(uGround, fill, inside);
    c = mix(c, edge, line);
    c = mix(uGround, c, shown);
    // How much of this pixel is word. A clear canvas lets the page through
    // the rest: premultiplied, with the ground's share taken back out, so
    // over a page of that ground it comes to exactly the opaque picture.
    float cover = (1.0 - (1.0 - inside) * (1.0 - line)) * shown;
    c += (hash(gl_FragCoord.xy + fract(uTime) * 97.0) - 0.5) * 0.008 * mix(1.0, cover, uClear);
    gl_FragColor = mix(vec4(c, 1.0), vec4(c - uGround * (1.0 - cover), cover), uClear);
  }
`;

// The strip Spectrum reads: plum through red, orange and peach to lilac, then
// cyan, Candor blue and navy, and back to plum so the loop has no seam.
const SPECTRUM_STOPS = ["#3a0a34", "#b3122c", "#ff4f1c", "#ff9a55", "#f3b6a4", "#c9bfe0", "#3fd2f2", "#0a8fd0", "#00749e", "#0b2f9e", "#1a1060", "#3a0a34"];

function buildSpectrum() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  const ramp = ctx.createLinearGradient(0, 0, 256, 0);
  SPECTRUM_STOPS.forEach((c, i) => ramp.addColorStop(i / (SPECTRUM_STOPS.length - 1), c));
  ctx.fillStyle = ramp;
  ctx.fillRect(0, 0, 256, 1);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

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

// Spectrum's brush is Lusion's: a pen whose width is the pointer's speed, a
// trail that fades over a second or two, and paint that rides its velocity
// hard, so a flick leaves a smeared ribbon of colour.
// Spectrum's ground until the page's is read (.wp's background), and the ink
// it lights with on a dark ground or draws with on a light one, sRGB 0–1.
const DARK_GROUND = [0.039, 0.035, 0.031];
const LIGHT_INK = [1.0, 0.97, 0.93];
const DARK_INK = [0.07, 0.065, 0.06];
// How much of the photograph shows in the letters at rest, per ground.
const REST_PHOTO = { dark: 0.12, light: 0.22 };
// How often the photograph turns over to the next set, and the crossfade, s.
const PHOTO_EVERY = 4.5;
const PHOTO_FADE = 1.4;

// Spectrum's glint: how often it crosses the word and how long it takes, s.
const GLINT_EVERY = 9;
const GLINT_TIME = 2.6;

const SPECTRUM_BRUSH = {
  brush: { min: 48, max: 120, perSpeed: 1.8 },
  gain: [0.3, 0.5],
  keep: [0.9, 0.985, 0.5],
  carry: 0.45,
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

const imageLoads = new Map();
const loadImage = (src) => {
  if (imageLoads.has(src)) return imageLoads.get(src);
  const loading = new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = async () => {
      try { await img.decode(); } catch { /* Already decoded or unsupported. */ }
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
  imageLoads.set(src, loading);
  return loading;
};

// Photo variations are background preparation, not work for one scroll frame.
const idleTurn = () => new Promise((resolve) => {
  if (window.requestIdleCallback) window.requestIdleCallback(resolve, { timeout: 1500 });
  else setTimeout(resolve, 32);
});

// ---- the renderer -------------------------------------------------------------

// `faces`: image urls — one to span the word, or one per letter — loaded
// when the renderer is made. `frames`: for Spectrum, several such sets that the
// letters crossfade through in turn; the first is shown first. `look`: a key
// of LOOKS. `clear`: for Spectrum, a canvas see-through off the letters.
// `rest`: for Spectrum, how much of the photograph shows at rest, per ground.
// `onChange`: called when they land and a frame is due.
export function createWordPaint(
  canvas,
  { faces = [], frames = [faces], look: lookName = "darkroom", clear = false, rest = REST_PHOTO, onChange = () => {} } = {}
) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: clear, powerPreference: "low-power" });
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

  const spectrum = lookName === "spectrum";
  const uniforms = {
    uField: { value: blank },
    uPaint: { value: read.texture },
    uSize: paintUniforms.uSize,
    uTime: { value: 0 },
    uReveal: { value: 0 },
    uPhotos: { value: blank },
    uAccent: { value: new THREE.Color("#00749e") },
    uSpectrum: { value: spectrum ? buildSpectrum() : blank },
    uPhoto: { value: 0.65 },
    uLine: { value: 1 },
    uLight: { value: new THREE.Vector3(0, 0, 1) },
    uGlint: { value: -9 },
    uGround: { value: new THREE.Vector3(...DARK_GROUND) },
    uInk: { value: new THREE.Vector3(...LIGHT_INK) },
    uDark: { value: 1 },
    uRest: { value: 0 }, // set once the photograph is in
    uClear: { value: clear ? 1 : 0 },
    uPhotosNext: { value: blank },
    uSwap: { value: 0 },
  };
  const viewMaterial = new THREE.ShaderMaterial({
    vertexShader: quadVertex,
    fragmentShader: spectrum ? spectrumFragment : lookFragment(LOOKS[lookName] || LOOKS.darkroom),
    uniforms,
    depthTest: false,
    depthWrite: false,
  });
  const viewScene = new THREE.Scene();
  const viewMesh = new THREE.Mesh(quad, viewMaterial);
  viewMesh.frustumCulled = false;
  viewScene.add(viewMesh);

  const look = spectrum ? SPECTRUM_BRUSH : LOOK;
  let layout = null;
  let fieldTexture = null;
  const photos = []; // the loaded images, per set
  const photosTextures = []; // their atlases, per set
  let photosLoading = false;
  let disposed = false;

  // The pointer, in css px with y up. `prev` is where it was last frame.
  let pointer = null;
  let prev = null;
  let lastTime = 0;
  let lastStroke = -INF;

  // Spectrum's light, css px with y up and z its height, eased toward the
  // pointer or back to the key light; and the glint's schedule, in seconds.
  const light = new THREE.Vector3();
  let lightPlaced = false;
  let lightMoving = false;
  let glintAt = -INF;
  let nextGlint = null;
  const lightTarget = () =>
    pointer
      ? { x: pointer.x, y: pointer.y, z: layout.height * 0.22 }
      : { x: -layout.width * 0.15, y: layout.height * 1.6, z: layout.height * 0.5 };

  // One atlas per set of photos; the view shows `shown` and, while a swap
  // runs, fades to the next.
  const sets = frames.filter((set) => set.length);
  let shown = 0;
  let swapAt = -INF;
  let nextSwap = null;
  const cycling = () => spectrum && photosTextures.filter(Boolean).length > 1;
  const nextIndex = () => {
    for (let i = 1; i < sets.length; i++) {
      const j = (shown + i) % sets.length;
      if (photosTextures[j]) return j;
    }
    return shown;
  };
  const showPhotos = () => {
    uniforms.uPhotos.value = photosTextures[shown] || blank;
    uniforms.uPhotosNext.value = photosTextures[nextIndex()] || uniforms.uPhotos.value;
  };

  const rebuildAtlas = (onlyIndex) => {
    if (!layout) return;
    photos.forEach((images, i) => {
      if (onlyIndex !== undefined && i !== onlyIndex) return;
      if (!images) return;
      photosTextures[i]?.dispose();
      const texture = new THREE.CanvasTexture(buildAtlas(layout, images));
      texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      photosTextures[i] = texture;
      // Upload during background preparation, before this variation appears.
      renderer.initTexture(texture);
    });
    showPhotos();
    showRest();
  };

  // The photograph at rest, once there is one to show.
  const showRest = () => {
    if (!photosTextures[shown]) return;
    uniforms.uRest.value = uniforms.uDark.value ? rest.dark : rest.light;
  };

  // The first set straight away; the rest once it's in, only for Spectrum,
  // which is the only look that turns through them.
  const loadSet = async (i) => {
    const images = await Promise.all(sets[i].map(loadImage));
    await idleTurn();
    if (disposed) return;
    photos[i] = images;
    rebuildAtlas(i);
    onChange();
  };
  const ensurePhotos = () => {
    if (photosLoading || !sets.length) return;
    photosLoading = true;
    loadSet(0).then(async () => {
      if (!spectrum) return;
      for (let i = 1; i < sets.length && !disposed; i++) await loadSet(i);
    });
  };

  ensurePhotos();

  return {
    uniforms,

    // Spectrum's ground: the page colour behind the section, [r, g, b] 0–255.
    // A dark ground gets a light word and a light ground a dark one.
    setGround([r, g, b]) {
      const dark = 0.299 * r + 0.587 * g + 0.114 * b < 128;
      uniforms.uGround.value.set(r / 255, g / 255, b / 255);
      uniforms.uInk.value.set(...(dark ? LIGHT_INK : DARK_INK));
      uniforms.uDark.value = dark ? 1 : 0;
      showRest();
    },

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
      // A hairline: 1px, thickening a little past a 1600px-wide window.
      uniforms.uLine.value = Math.max(1, window.innerWidth / 1600);
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

    // True until the last stroke's ink has faded below 1%, and for Spectrum
    // while the light is still travelling or a glint is crossing.
    busy(time) {
      return (
        time - lastStroke < Math.log(0.01) / Math.log(look.keep[1]) / 60 ||
        lightMoving ||
        time - glintAt < GLINT_TIME ||
        time - swapAt < PHOTO_FADE
      );
    },

    // Seconds until Spectrum's next glint or photo change, for the component
    // to wake for; null for the other looks, which have nothing scheduled.
    due(time) {
      if (!spectrum) return null;
      const next = [nextGlint, cycling() ? nextSwap : null].filter((t) => t != null);
      return next.length ? Math.max(0, Math.min(...next) - time) : null;
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

      if (spectrum) {
        // The light follows the pointer with a little lag, so the highlight
        // travels round the letters instead of jumping.
        const target = lightTarget();
        if (!lightPlaced) light.set(target.x, target.y, target.z);
        lightPlaced = true;
        const before = light.clone();
        light.lerp(target, 1 - 0.94 ** frames);
        lightMoving = before.distanceTo(light) > 0.3;
        uniforms.uLight.value.copy(light);

        if (nextGlint == null) nextGlint = time + 2.2;
        if (time >= nextGlint) {
          glintAt = time;
          nextGlint = time + GLINT_EVERY;
        }
        const g = (time - glintAt) / GLINT_TIME;
        // Eased in and out, so it slows as it enters and leaves the word.
        uniforms.uGlint.value = g < 1 ? -0.5 + 2.2 * (g * g * (3 - 2 * g)) : -9;

        // The photograph turns over every few seconds: a crossfade to the
        // next set, which then becomes the one shown.
        if (cycling()) {
          if (nextSwap == null) nextSwap = time + PHOTO_EVERY;
          if (time >= nextSwap && time - swapAt >= PHOTO_FADE) {
            swapAt = time;
            nextSwap = time + PHOTO_EVERY;
          }
          const s = Math.min(1, (time - swapAt) / PHOTO_FADE);
          if (s < 1) {
            uniforms.uSwap.value = s * s * (3 - 2 * s);
          } else if (uniforms.uSwap.value > 0) {
            shown = nextIndex();
            uniforms.uSwap.value = 0;
            showPhotos();
          }
        }
      }

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
      photosTextures.forEach((texture) => texture?.dispose());
      if (spectrum) uniforms.uSpectrum.value.dispose();
      blank.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

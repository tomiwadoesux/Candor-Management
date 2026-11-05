// A single live backdrop: refract the page already painted underneath it.
// The displacement field travels upward; the photographs themselves stay put.
let shared = null;
const SVG = "http://www.w3.org/2000/svg";
const FILTER_ID = "candor-heat-refraction";
const TILE = 128;
const RISE = 28; // CSS pixels per second, independent of scrolling.

function node(tag, attributes = {}) {
  const element = document.createElementNS(SVG, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, String(value));
  return element;
}

// Attenuate the displacement, not the final picture. A transparent filtered
// overlay would show both the original and displaced edges at once.
const envelope = `<svg xmlns="${SVG}" width="256" height="128" viewBox="0 0 256 128">
  <defs><linearGradient id="rise" x2="0" y2="1">
    <stop offset="0" stop-color="white" stop-opacity="0"/>
    <stop offset=".25" stop-color="white" stop-opacity=".06"/>
    <stop offset=".6" stop-color="white" stop-opacity=".35"/>
    <stop offset=".85" stop-color="white" stop-opacity="1"/>
    <stop offset="1" stop-color="white" stop-opacity="0"/>
  </linearGradient></defs>
  <rect width="256" height="128" fill="url(#rise)"/>
</svg>`;

function createRenderer() {
  const reference = `url("#${FILTER_ID}")`;
  if (!CSS.supports("backdrop-filter", reference) && !CSS.supports("-webkit-backdrop-filter", reference)) return null;
  const svg = node("svg", { width: 0, height: 0, "aria-hidden": "true" });
  Object.assign(svg.style, { position: "absolute", pointerEvents: "none", overflow: "hidden" });
  const defs = node("defs");
  const filter = node("filter", {
    id: FILTER_ID, filterUnits: "userSpaceOnUse", primitiveUnits: "userSpaceOnUse",
    x: 0, y: 0, "color-interpolation-filters": "sRGB",
  });
  // Two octaves give irregular small eddies, not one large rubbery wave.
  // The static, stitched tile repeats perfectly when the upward offset wraps.
  const noise = node("feTurbulence", {
    type: "fractalNoise", baseFrequency: "0.035 0.055", numOctaves: 2,
    stitchTiles: "stitch", seed: 8, x: 0, y: 0, width: 256, height: TILE,
    result: "noise",
  });
  const tiled = node("feTile", { in: "noise", x: 0, y: 0, result: "tiled" });
  const drift = node("feOffset", { in: "tiled", dx: 0, dy: 0, x: 0, y: 0, result: "rising" });
  // Heat mostly perturbs horizontal detail, with a small vertical component.
  const channels = node("feColorMatrix", {
    in: "rising", type: "matrix",
    values: "1 0 0 0 0  0 .22 0 0 .39  0 0 1 0 0  0 0 0 1 0", result: "directional",
  });
  const taper = node("feImage", {
    href: `data:image/svg+xml,${encodeURIComponent(envelope)}`,
    x: 0, y: 0, preserveAspectRatio: "none", result: "envelope",
  });
  const masked = node("feComposite", { in: "directional", in2: "envelope", operator: "in", result: "eddies" });
  const neutral = node("feFlood", { "flood-color": "rgb(50%,50%,50%)", result: "neutral" });
  const map = node("feComposite", { in: "eddies", in2: "neutral", operator: "over", result: "heat-map" });
  const displacement = node("feDisplacementMap", {
    in: "SourceGraphic", in2: "heat-map", scale: 0,
    xChannelSelector: "R", yChannelSelector: "G", x: 0, y: 0,
  });
  filter.append(noise, tiled, drift, channels, taper, masked, neutral, map, displacement);
  defs.append(filter); svg.append(defs);
  const band = document.createElement("div");
  band.dataset.heatBand = "";
  band.setAttribute("aria-hidden", "true");
  Object.assign(band.style, {
    position: "fixed", left: "0", top: "0", width: "100%", display: "none", pointerEvents: "none",
    backdropFilter: reference, webkitBackdropFilter: reference,
    zIndex: "20",
  });
  document.body.append(svg, band);
  let lastShape = "";
  return {
    owner: null,
    configure(zIndex) { band.style.zIndex = String(zIndex); },
    draw({ top, width, height, strength, time }) {
      const shape = `${width}:${height}`;
      if (shape !== lastShape) {
        band.style.height = `${height}px`;
        // One complete extra tile below the visible band supplies every
        // upward offset. No blank pixels enter at the end of a cycle.
        for (const element of [filter, tiled]) {
          element.setAttribute("width", width);
          element.setAttribute("height", Math.max(TILE, height) + TILE);
        }
        for (const element of [drift, channels, taper, masked, neutral, map, displacement]) {
          element.setAttribute("width", width);
          element.setAttribute("height", height);
        }
        lastShape = shape;
      }
      drift.setAttribute("dy", (-(time * RISE % TILE)).toFixed(3));
      displacement.setAttribute("scale", (14 * strength).toFixed(3));
      band.style.transform = `translate3d(0,${top.toFixed(2)}px,0)`;
      band.style.display = "block";
      return true;
    },
    hide() { band.style.display = "none"; },
    dispose() { band.remove(); svg.remove(); },
  };
}

export function acquireHeatRenderer(owner) {
  if (!shared) shared = createRenderer();
  if (!shared || (shared.owner && shared.owner !== owner)) return null;
  shared.owner = owner;
  return shared;
}

export function releaseHeatRenderer(owner, destroy = false) {
  if (!shared || (shared.owner && shared.owner !== owner)) return;
  shared.hide();
  shared.owner = null;
  if (destroy) { shared.dispose(); shared = null; }
}

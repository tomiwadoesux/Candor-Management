// One reusable backdrop, not a reconstruction of individual photographs.
// The browser filters whatever is painted behind the band: text, images,
// SVGs, backgrounds, and their current animations.
let shared = null;
const SVG = "http://www.w3.org/2000/svg";
const FILTER_ID = "candor-heat-refraction";

function node(tag, attributes = {}) {
  const element = document.createElementNS(SVG, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, String(value));
  return element;
}

function createRenderer() {
  const reference = `url("#${FILTER_ID}")`;
  if (!CSS.supports("backdrop-filter", reference) && !CSS.supports("-webkit-backdrop-filter", reference)) return null;
  const svg = node("svg", { width: 0, height: 0, "aria-hidden": "true" });
  Object.assign(svg.style, { position: "absolute", pointerEvents: "none", overflow: "hidden" });
  const defs = node("defs");
  const filter = node("filter", { id: FILTER_ID, x: "-5%", y: "-25%", width: "110%", height: "150%", "color-interpolation-filters": "sRGB" });
  // Tall, broad pockets of warm air. Fine horizontal noise makes straight
  // edges look corrugated; a slower vertical frequency avoids that pattern.
  const noise = node("feTurbulence", { type: "fractalNoise", baseFrequency: "0.012 0.006", numOctaves: 1, seed: 8, result: "heat-noise" });
  const drift = node("feOffset", { in: "heat-noise", dx: 0, dy: 0, result: "heat-drift" });
  const channels = node("feColorMatrix", { in: "heat-drift", type: "matrix", values: ".65 0 0 0 .175  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0", result: "heat-map" });
  const displacement = node("feDisplacementMap", { in: "SourceGraphic", in2: "heat-map", scale: 0, xChannelSelector: "R", yChannelSelector: "G", result: "refracted" });
  const softness = node("feGaussianBlur", { in: "refracted", stdDeviation: 0 });
  filter.append(noise, drift, channels, displacement, softness);
  defs.append(filter); svg.append(defs);
  const band = document.createElement("div");
  band.dataset.heatBand = "";
  band.setAttribute("aria-hidden", "true");
  Object.assign(band.style, {
    position: "fixed", left: "0", top: "0", width: "100%", display: "none", pointerEvents: "none",
    backdropFilter: reference, webkitBackdropFilter: reference,
    maskImage: "linear-gradient(to bottom, transparent, #000 30%, #000 78%, transparent)",
    webkitMaskImage: "linear-gradient(to bottom, transparent, #000 30%, #000 78%, transparent)",
    zIndex: "45",
  });
  document.body.append(svg, band);
  let lastShape = "";
  return {
    owner: null,
    configure(zIndex) { band.style.zIndex = String(zIndex); },
    draw({ top, height, strength, time }) {
      const shape = `${height}`;
      if (shape !== lastShape) { band.style.height = `${height}px`; lastShape = shape; }
      // The air has its own clock: it keeps flaring while scroll is stationary.
      // Two slow phases keep the drift from reading as one repeating wave.
      const flare = 0.5 + 0.3 * Math.sin(time * 0.83) + 0.2 * Math.sin(time * 0.47 + 1.2);
      displacement.setAttribute("scale", ((9 + flare * 9) * strength).toFixed(3));
      softness.setAttribute("stdDeviation", ((0.2 + flare * 0.65) * strength).toFixed(3));
      drift.setAttribute("dx", (Math.sin(time * 0.48) * 28 + Math.sin(time * 0.19) * 9).toFixed(3));
      drift.setAttribute("dy", (Math.cos(time * 0.36) * 38).toFixed(3));
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

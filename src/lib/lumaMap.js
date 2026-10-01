/**
 * Luminance maps for text that has to sit legibly on a photograph.
 *
 * The problem this replaces: `mix-blend-mode: exclusion` (globals.css) never
 * picks a colour, it inverts whatever is behind. Over a mid-grey that returns
 * mid-grey, and over a saturated colour it returns an off-hue — so the one
 * case the blend exists to solve is the one it fails. What we want instead is
 * a decision: each letter is either black or white, whichever actually reads
 * against the pixels behind that letter.
 *
 * So we sample the image once, downscaled hard, and keep a small grid of
 * luminance values. A letter's colour is then a lookup: find the cells under
 * the letter's box, average them, and pick the end of the scale that is
 * furthest away. No per-frame work — the map is computed on load and cached
 * against the image URL, so a hundred letters over one photo cost one
 * readback between them.
 *
 * Browser-only: this needs a canvas.
 */

// The map has to be fine enough that one cell is SMALLER than one glyph,
// otherwise neighbouring letters share a cell and all get the same answer —
// which is an approximation, not the background each letter actually covers.
//
// Worst case in this codebase is the Look credits: 14px type over a 50vw
// panel (~720px on a 1440 screen), where a letter is roughly 7x10 CSS px. At
// 128 the long edge cell is ~5.6px wide, comfortably under that; at 64 it is
// ~11px and two or three letters would share one value.
//
// Cost is 128*128 = 16k samples, a 64KB Float32Array per image, computed once
// and cached. The getImageData readback is the only expensive part and it
// happens a single time per photograph.
const GRID = 128;

// Keyed by the resolved image URL. Values are either a Float32Array of GRID*GRID
// luminances, or the in-flight promise for one, so concurrent callers for the
// same photo share a single decode instead of racing.
const cache = new Map();

// Rec. 709 luma, on sRGB values that have been linearised first. Doing this on
// the raw 0-255 channels (the common shortcut) overstates how bright dark
// blues and reds are, which is exactly where a wrong black/white call is most
// visible — a letter over a dark denim jacket comes out black and vanishes.
function channelToLinear(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r, g, b) {
  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

/**
 * WCAG contrast ratio between a relative luminance and pure black or white.
 * Exported because the hook uses it to decide when neither end of the scale is
 * good enough and the letter needs a counter-shadow to survive.
 */
export function contrastWithWhite(luma) {
  return 1.05 / (luma + 0.05);
}

export function contrastWithBlack(luma) {
  return (luma + 0.05) / 0.05;
}

/**
 * Sample `src` into a GRID x GRID luminance map.
 *
 * Resolves to null rather than throwing when the image is cross-origin without
 * CORS headers, or fails to load at all: callers treat null as "no information"
 * and fall back to their static colour, which is always the safe outcome.
 */
export function loadLumaMap(src) {
  if (!src || typeof window === "undefined") return Promise.resolve(null);

  const hit = cache.get(src);
  if (hit) return Promise.resolve(hit).then((v) => (v === null ? null : v));

  const pending = new Promise((resolve) => {
    const img = new Image();
    // Required or the canvas is tainted and getImageData throws. Same-origin
    // images in /public are unaffected; a remote CDN needs to send the header.
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        // The grid keeps the photograph's own proportions rather than being
        // squashed to a square: sampleRect has to undo `object-fit: cover` to
        // find the pixels actually on screen, and it can only do that if the
        // map still knows what shape the image is.
        const ar = img.naturalWidth / img.naturalHeight || 1;
        const w = ar >= 1 ? GRID : Math.max(1, Math.round(GRID * ar));
        const h = ar >= 1 ? Math.max(1, Math.round(GRID / ar)) : GRID;

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        // willReadFrequently: we read back once and discard, but the hint keeps
        // Chrome from promoting this to a GPU surface it then has to stall on.
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return resolve(null);

        // The downscale is the averaging step. Each destination pixel is the
        // mean of its source block, which is precisely the per-cell value we
        // want, computed by the browser's scaler instead of by us.
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);

        const cells = new Float32Array(w * h);
        for (let i = 0; i < cells.length; i++) {
          const o = i * 4;
          cells[i] = relativeLuminance(data[o], data[o + 1], data[o + 2]);
        }
        const map = { cells, w, h, ar };
        cache.set(src, map);
        resolve(map);
      } catch {
        // Tainted canvas, or the image decoded to zero area.
        cache.set(src, null);
        resolve(null);
      }
    };

    img.onerror = () => {
      cache.set(src, null);
      resolve(null);
    };

    img.src = src;
  });

  cache.set(src, pending);
  return pending;
}

/**
 * Map a rect in PANEL space to the image pixels `object-fit: cover` actually
 * puts there.
 *
 * cover scales the photo until it fills the box and crops the overflow, so the
 * panel never shows the whole image. A letter at 10% down a tall photo in a
 * shorter box is not over the image's own 10% mark — it is over whatever
 * survived the crop. Ignoring that samples content that is off screen.
 *
 * `panelAR` is the displayed box's aspect ratio. Returns the rect rewritten
 * into 0..1 image space.
 */
function coverToImage(map, panelAR, x, y, w, h) {
  const imgAR = map.ar;

  // Which axis overflows: an image wider than the box is cropped left/right,
  // a taller one is cropped top/bottom. The visible fraction on that axis is
  // the ratio of the two aspect ratios.
  let visW = 1;
  let visH = 1;
  if (imgAR > panelAR) visW = panelAR / imgAR;
  else visH = imgAR / panelAR;

  // cover centres the crop, so the visible window starts half the lost
  // fraction in.
  const offX = (1 - visW) / 2;
  const offY = (1 - visH) / 2;

  return {
    x: offX + x * visW,
    y: offY + y * visH,
    w: w * visW,
    h: h * visH,
  };
}

/**
 * Mean luminance of the map cells covered by a normalised rect.
 *
 * `x`, `y`, `w`, `h` are 0..1 fractions of the displayed panel box — the caller
 * works in element coordinates and divides, so this stays independent of how
 * the photo is sized on screen. `panelAR` is that box's aspect ratio; pass it
 * and the rect is corrected for `object-fit: cover` first, so the cells read
 * are the ones genuinely behind the letter. Omit it and the image is assumed
 * to fill the box exactly (object-fit: fill).
 *
 * Returns null when the rect falls outside the image, so a letter that has
 * scrolled off the photo keeps its last good colour rather than snapping to a
 * value sampled from the edge.
 */
export function sampleRect(map, x, y, w, h, panelAR) {
  if (!map || !map.cells) return null;

  if (panelAR) ({ x, y, w, h } = coverToImage(map, panelAR, x, y, w, h));

  if (x + w < 0 || y + h < 0 || x > 1 || y > 1) return null;

  const { cells, w: gw, h: gh } = map;

  const x0 = Math.max(0, Math.min(gw - 1, Math.floor(x * gw)));
  const y0 = Math.max(0, Math.min(gh - 1, Math.floor(y * gh)));
  const x1 = Math.max(x0, Math.min(gw - 1, Math.ceil((x + w) * gw) - 1));
  const y1 = Math.max(y0, Math.min(gh - 1, Math.ceil((y + h) * gh) - 1));

  let sum = 0;
  let n = 0;
  for (let gy = y0; gy <= y1; gy++) {
    for (let gx = x0; gx <= x1; gx++) {
      sum += cells[gy * gw + gx];
      n++;
    }
  }
  return n ? sum / n : null;
}

export { GRID };

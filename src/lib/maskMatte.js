/**
 * Turns a photograph into an alpha matte for masking text.
 *
 * Why this exists rather than just `mask-image: url(photo.jpg)`:
 *
 * A CSS mask whose source is an image uses that image's ALPHA channel — the
 * initial `mask-mode` is `match-source`, which for an `<image>` source means
 * alpha, in every engine. A JPEG has no alpha, so it decodes opaque
 * everywhere: the mask reveals the masked layer completely and the effect does
 * nothing at all. `mask-mode: luminance` is the declarative fix, but Safari
 * mishandles it (and there is no -webkit- alias to fall back on), so relying on
 * it would ship a feature that silently does the wrong thing on Safari.
 *
 * Referencing an SVG <mask> from HTML — the other declarative route — is also
 * out: Safari does not support referencing an SVG mask from a non-SVG element.
 *
 * So we bake it ourselves. The photo is drawn through a canvas filter, its
 * luminance is written into the alpha channel, and the result is exported as a
 * PNG data URL. That matte then works under the DEFAULT alpha masking, which
 * is baseline everywhere — no mask-mode, no SVG mask, no Safari caveat.
 *
 * Bright photo -> high alpha -> the masked (black) copy shows.
 * Dark photo   -> low alpha  -> the layer underneath (white) shows through.
 *
 * Browser-only: this needs a canvas.
 */

// Wide enough that a glyph-sized area of the matte still has detail, small
// enough that the readback and the resulting data URL stay cheap. The mask is
// blurred anyway, so resolution beyond this buys nothing visible.
const MATTE_W = 512;

// Keyed by src + tuning, since two callers may want different mattes from one
// photograph. Values are the finished data URL or the in-flight promise for
// one, so concurrent callers share a single decode.
const cache = new Map();

/**
 * Build (or reuse) an alpha matte for `src`.
 *
 * `blur` softens the matte so per-pixel detail cannot fray a glyph edge into
 * speckle. `contrast` pushes the midtones apart so the crossover between black
 * and white text is decisive rather than a long grey ramp. `brightness` biases
 * which side wins — below 1 it favours the white copy, which is the safer error
 * on a photograph.
 *
 * Resolves to null on a cross-origin image without CORS headers, or any decode
 * failure; callers then skip the masked layer and are left with plain white
 * text, which is legible rather than wrong.
 */
export function loadMaskMatte(src, opts = {}) {
  if (!src || typeof window === "undefined") return Promise.resolve(null);

  // `alpha`/`backdrop` describe how the photo is actually composited on screen.
  // Hero2 fades its photographs in to opacity 0.92 over a near-white card, so
  // the pixels behind the text are lighter than the file's own — matting from
  // the raw file would bias every decision toward white text. Baking the same
  // composite into the matte removes that bias at no runtime cost.
  const {
    blur = 3,
    contrast = 6,
    brightness = 0.95,
    alpha = 1,
    backdrop = 255,
  } = opts;
  const key = `${src}|${blur}|${contrast}|${brightness}|${alpha}|${backdrop}`;

  const hit = cache.get(key);
  if (hit !== undefined) return Promise.resolve(hit);

  const pending = (async () => {
    try {
      const img = new Image();
      // Required or the canvas is tainted and getImageData throws. Same-origin
      // images in /public are unaffected.
      img.crossOrigin = "anonymous";
      img.src = src;
      await img.decode();

      const w = MATTE_W;
      const h = Math.max(
        1,
        Math.round(MATTE_W * (img.naturalHeight / img.naturalWidth || 1)),
      );

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;

      // Canvas filters take the same grammar as the CSS `filter` property, so
      // the tuning here means exactly what it would mean in a stylesheet.
      ctx.filter = `grayscale(1) blur(${blur}px) brightness(${brightness}) contrast(${contrast})`;
      ctx.drawImage(img, 0, 0, w, h);

      const image = ctx.getImageData(0, 0, w, h);
      const p = image.data;
      for (let i = 0; i < p.length; i += 4) {
        // Rec. 709 on the already-filtered pixels. The colour channels are
        // irrelevant under alpha masking, so only alpha carries the signal.
        let r = p[i];
        let g = p[i + 1];
        let b = p[i + 2];
        // Match what the screen shows: the photo over its card at `alpha`.
        if (alpha !== 1) {
          r = r * alpha + backdrop * (1 - alpha);
          g = g * alpha + backdrop * (1 - alpha);
          b = b * alpha + backdrop * (1 - alpha);
        }
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        p[i] = 255;
        p[i + 1] = 255;
        p[i + 2] = 255;
        p[i + 3] = luma;
      }
      ctx.putImageData(image, 0, 0);

      // PNG, never JPEG: a JPEG would discard the alpha we just computed and
      // put us straight back to an opaque, inert mask.
      const url = canvas.toDataURL("image/png");
      cache.set(key, url);
      return url;
    } catch {
      cache.set(key, null);
      return null;
    }
  })();

  cache.set(key, pending);
  return pending;
}

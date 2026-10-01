"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { loadMaskMatte } from "@/lib/maskMatte";

/**
 * Text over a photograph, resolved PER PIXEL rather than per letter.
 *
 * The previous approach sampled a luminance map and gave each letter a single
 * black or white value. Two problems, both fatal in practice. A threshold has
 * to be right, and everything that shifts what it measures shifts the answer —
 * the photo composited at less than full opacity, a re-encoded variant, a busy
 * patch averaged flat — so a small measurement error becomes a confidently
 * wrong letter. And a letter is one colour, so a glyph straddling a light/dark
 * edge loses half of itself whichever way the decision goes.
 *
 * This draws the text twice, perfectly stacked: a white copy underneath and a
 * black copy on top, the black one masked by the photograph itself. Where the
 * photo is bright the matte is opaque and the black text shows; where it is
 * dark the matte is transparent and the white text below shows through. The
 * compositor decides per pixel, so there is no threshold to get wrong, and one
 * letter can be black on its left half and white on its right.
 *
 * ── The mask is a baked matte, not the photo ────────────────────────────────
 * `mask-image: url(photo.jpg)` does NOT do this: an image mask uses its ALPHA,
 * and a JPEG is opaque everywhere, so it would reveal the black copy
 * completely and hide the white one. `mask-mode: luminance` is the declarative
 * answer but Safari mishandles it. So lib/maskMatte.js bakes the photo's
 * luminance into an alpha PNG, which works under default alpha masking in
 * every engine. Note also that a CSS `filter` on this element would filter the
 * GLYPHS, not the mask — the blur/contrast tuning belongs in the matte, and is
 * applied there.
 *
 * ── The one geometry that must be right ─────────────────────────────────────
 * The matte has to be framed exactly like the photo, or the text is lit by the
 * wrong part of the image. The photo is `object-fit: cover` on its own box, so
 * the mask uses `mask-size: cover` on a layer spanning that SAME box. Where the
 * text sits in a smaller box than the photo — Hero2's caption is
 * `bottom-0 h-1/3` of the card — pass `frame` to stretch the layers back over
 * the photo's box.
 */

// useLayoutEffect warns during SSR; this component is client-only in practice
// but the guard keeps it quiet if it is ever rendered on the server.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function DuotoneText({
  children,
  imageSrc,
  className = "",
  as: Tag = "p",
  // Extra style for the wrapper, used to climb back onto the photo's box when
  // the text lives in a smaller one.
  frame,
  // When the text MOVES relative to the photograph — Look's credits are
  // sticky and slide down through the panels — the mask has to stay pinned to
  // the photo rather than travelling with the text. Point this at the element
  // the photo fills and the mask is sized and offset to that box on scroll.
  anchorRef,
  // Matte tuning; see lib/maskMatte.js.
  blur = 3,
  contrast = 6,
  brightness = 0.95,
  // How the photo is actually composited where the text sits; see maskMatte.
  alpha = 1,
  backdrop = 255,
  ...rest
}) {
  const [matte, setMatte] = useState(null);
  const maskRef = useRef(null);

  useEffect(() => {
    let alive = true;
    loadMaskMatte(imageSrc, {
      blur,
      contrast,
      brightness,
      alpha,
      backdrop,
    }).then((url) => {
      if (alive) setMatte(url);
    });
    return () => {
      alive = false;
    };
  }, [imageSrc, blur, contrast, brightness, alpha, backdrop]);

  // Keep the mask pinned to the anchor's box. Without this the mask is
  // anchored to the TEXT's box, so a sticky line carries its own lighting down
  // the page instead of being lit by the part of the photo it is passing over.
  // Two style writes per frame, no per-letter work.
  useIsomorphicLayoutEffect(() => {
    const anchor = anchorRef?.current;
    const el = maskRef.current;
    if (!anchor || !el || !matte) return;

    let queued = 0;
    const sync = () => {
      queued = 0;
      const a = anchor.getBoundingClientRect();
      const m = el.getBoundingClientRect();
      if (!a.width || !a.height) return;
      // Size the mask to the photo's box, then shift it by how far the text
      // currently sits inside that box.
      el.style.webkitMaskSize = `${a.width}px ${a.height}px`;
      el.style.maskSize = `${a.width}px ${a.height}px`;
      const ox = a.left - m.left;
      const oy = a.top - m.top;
      el.style.webkitMaskPosition = `${ox}px ${oy}px`;
      el.style.maskPosition = `${ox}px ${oy}px`;
    };
    const schedule = () => {
      if (!queued) queued = requestAnimationFrame(sync);
    };

    sync();
    window.addEventListener("scroll", schedule, { passive: true });
    const ro = new ResizeObserver(schedule);
    ro.observe(anchor);
    return () => {
      window.removeEventListener("scroll", schedule);
      ro.disconnect();
      if (queued) cancelAnimationFrame(queued);
    };
  }, [anchorRef, matte]);

  return (
    <span
      style={{ position: "relative", display: "block", ...(frame || {}) }}
      {...rest}
    >
      {/* The white copy. This is the real text: it keeps the flow, carries the
          accessible name, and is what shows wherever the photograph is dark.
          On its own — before the matte resolves, or if it never does — this is
          plain white text over a photo, which is legible rather than wrong. */}
      <Tag className={className} style={{ color: "#ffffff", margin: 0 }}>
        {children}
      </Tag>

      {/* The black copy, revealed only where the photograph is bright. Hidden
          from assistive tech: it is the same words a second time. Rendered only
          once the matte exists, so there is never a frame where an unmasked
          black copy covers the white one. */}
      {matte ? (
        <Tag
          ref={maskRef}
          aria-hidden="true"
          className={className}
          style={{
            position: "absolute",
            inset: 0,
            margin: 0,
            pointerEvents: "none",
            color: "#000000",
            WebkitMaskImage: `url(${matte})`,
            maskImage: `url(${matte})`,
            // cover + center, to match the photo's own object-fit framing.
            WebkitMaskSize: "cover",
            maskSize: "cover",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
          }}
        >
          {children}
        </Tag>
      ) : null}
    </span>
  );
}

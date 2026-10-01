"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  loadLumaMap,
  sampleRect,
  contrastWithBlack,
  contrastWithWhite,
} from "@/lib/lumaMap";

/**
 * Text over a photograph, with every letter independently black or white.
 *
 * Replaces the `.invert-text` blend (globals.css), which inverted the backdrop
 * rather than choosing against it — fine over near-black or near-white, wrong
 * over the mid-greys and saturated colours that make up most of a photo. Here
 * each letter reads the luminance of the image behind its own box and picks the
 * end of the scale that is further away, so a wordmark crossing a bright sky
 * into a dark jacket changes colour mid-word instead of turning to mush.
 *
 * Usage: wrap the text, point `imageSrc` at the photo behind it, and give the
 * element a positioned ancestor that shares the photo's box — `measureRef`,
 * when the overlay and the photo are not the same element.
 *
 *   <ContrastText imageSrc={image.src} measureRef={cardRef}>
 *     {model.name}
 *   </ContrastText>
 *
 * When the text crosses more than one photograph — a diptych, a split screen —
 * pass `sources` instead: one entry per panel, each with the ref of the element
 * that panel fills. Every letter is then resolved to the panel its own centre
 * lands on and sampled from that panel's map, so a title spanning the seam of a
 * pale drawing and a near-black painting goes dark on one side and light on the
 * other rather than compromising across both.
 *
 *   <ContrastText sources={[{ src: a, ref: leftRef }, { src: b, ref: rightRef }]}>
 *     {title}
 *   </ContrastText>
 *
 * Costs one 128-on-the-long-edge canvas readback per distinct image (~40-50KB
 * of luminance for a portrait photograph), cached across every
 * instance, then a measure pass per letter. Nothing runs per frame.
 */

// Black and white are the two ends of the scale, so the better of them is
// never actually bad — at the crossover (luma ~0.179) both still sit near
// 4.6:1. Absolute contrast is therefore the wrong thing to guard on; it would
// never fire. What does go wrong near that crossover is the *margin*: the two
// options are within a hair of each other, so a cell that averages a busy
// patch can pick the loser, and neighbouring letters can disagree over what
// is visually one background. Below this ratio between the choices we stop
// trusting colour alone and add the counter-shadow.
const MARGIN_BELOW = 1.3;

function decide(luma) {
  if (luma === null) return null;
  const onWhite = contrastWithWhite(luma);
  const onBlack = contrastWithBlack(luma);
  const color = onWhite >= onBlack ? "#ffffff" : "#000000";
  const margin =
    Math.max(onWhite, onBlack) / Math.min(onWhite, onBlack);
  return { color, needsShadow: margin < MARGIN_BELOW };
}

// useLayoutEffect warns during SSR; this component is client-only in practice
// but the guard keeps it quiet if it is ever rendered on the server.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function ContrastText({
  children,
  imageSrc,
  sources,
  measureRef,
  fallback = "#ffffff",
  className = "",
  as: Tag = "span",
  ...rest
}) {
  const hostRef = useRef(null);
  const letterRefs = useRef([]);
  const [map, setMap] = useState(null);

  // Split on characters but keep the string's own spacing: a space gets no
  // span (nothing to colour) and is emitted as a plain node, so the browser's
  // normal word-breaking still applies and the text can wrap.
  const chars = useMemo(() => {
    const text = typeof children === "string" ? children : String(children ?? "");
    return Array.from(text);
  }, [children]);

  // `sources` is the general form: every panel the text might cross, each with
  // the element whose box it fills. A single `imageSrc` is just the one-panel
  // case of it, so the paint loop below only ever deals with a list.
  const panels = useMemo(
    () => (sources?.length ? sources : imageSrc ? [{ src: imageSrc }] : []),
    [sources, imageSrc],
  );

  useEffect(() => {
    let alive = true;
    Promise.all(panels.map((p) => loadLumaMap(p.src))).then((maps) => {
      if (alive) setMap(maps);
    });
    return () => {
      alive = false;
    };
  }, [panels]);

  // Measure each letter against the image box and paint it. Runs on layout so
  // the colours land in the same frame the text does — a letter must never be
  // seen in the fallback colour first and then flip.
  useIsomorphicLayoutEffect(() => {
    if (!map) return;

    // The box the letters are measured AGAINST has to be the photograph's box.
    // Falling back to the text element itself is not a graceful degradation —
    // it silently renormalises every letter against the width of the text
    // instead of the image, so a short name sweeps the whole photo and the
    // colours look plausible while meaning nothing. Better to paint nothing
    // and leave the fallback colour, which is at least honest.
    const measuredAgainstPhoto =
      measureRef?.current || panels.some((p) => p.ref?.current);
    if (!measuredAgainstPhoto) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "[ContrastText] no measureRef or sources[].ref — cannot tell which " +
            "pixels are behind each letter, so no per-letter colour was applied. " +
            "Pass measureRef pointing at the element the image fills.",
        );
      }
      return;
    }

    const fallbackBox = measureRef?.current || hostRef.current;
    if (!fallbackBox) return;

    // Index assignment never shrinks the array, so a text change to something
    // shorter would leave the old tail behind. One glyph per non-space char.
    letterRefs.current.length = chars.length;

    // Each letter's box RELATIVE TO THE HOST, measured once. The glyphs never
    // move within their own line, so on scroll only the host's position
    // changes — re-reading every letter per scroll event is ~85 forced layouts
    // on the credits line, for offsets that did not change. Measuring once and
    // adding the host's current origin costs a handful of rect reads instead.
    let offsets = null;
    const measureOffsets = () => {
      const host = hostRef.current?.getBoundingClientRect();
      if (!host) return;
      offsets = letterRefs.current.map((el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          el,
          dx: r.left - host.left,
          dy: r.top - host.top,
          w: r.width,
          h: r.height,
        };
      });
    };

    const paint = () => {
      if (!offsets) measureOffsets();
      if (!offsets) return;

      const host = hostRef.current?.getBoundingClientRect();
      if (!host) return;

      // Panel boxes are read once per paint, not once per letter: they are the
      // same handful of rects for every glyph.
      const boxes = panels.map((p, i) => {
        const el = p.ref?.current || fallbackBox;
        return { rect: el?.getBoundingClientRect(), map: map[i] };
      });

      for (const o of offsets) {
        if (!o) continue;
        const el = o.el;
        // Reconstructed from the cached offset rather than re-measured.
        const r = {
          left: host.left + o.dx,
          top: host.top + o.dy,
          width: o.w,
          height: o.h,
        };
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;

        // The panel this letter actually sits on, by its own centre. A letter
        // straddling the seam belongs to whichever side holds its middle —
        // the alternative is averaging across two unrelated photographs, which
        // is how you get a grey that matches neither.
        let hit = boxes.find(
          ({ rect }) =>
            rect &&
            cx >= rect.left &&
            cx <= rect.right &&
            cy >= rect.top &&
            cy <= rect.bottom,
        );
        if (!hit) hit = boxes[0];
        if (!hit?.rect || !hit.rect.width || !hit.rect.height) continue;

        const { rect, map: panelMap } = hit;
        // The panel's own aspect ratio, so the sampler can undo object-cover
        // and read the pixels actually on screen rather than the whole photo.
        const luma = sampleRect(
          panelMap,
          (r.left - rect.left) / rect.width,
          (r.top - rect.top) / rect.height,
          r.width / rect.width,
          r.height / rect.height,
          rect.width / rect.height,
        );

        const verdict = decide(luma);
        if (!verdict) continue;

        el.style.color = verdict.color;
        // The counter-shadow is the opposite colour at sub-pixel offsets, which
        // reads as a thin edge rather than a drop shadow — enough to separate
        // the glyph from a backdrop that neither black nor white clears.
        el.style.textShadow = verdict.needsShadow
          ? verdict.color === "#ffffff"
            ? "0 0 2px rgba(0,0,0,0.85)"
            : "0 0 2px rgba(255,255,255,0.85)"
          : "none";
      }
    };

    paint();

    // A webfont landing after first paint changes every glyph's width, so the
    // cached offsets have to be thrown away and taken again.
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready
        .then(() => {
          offsets = null;
          paint();
        })
        .catch(() => {});
    }

    // Coalesce to one paint per frame. Scroll fires far more often than the
    // screen updates, and without this a fast flick queues dozens of passes
    // that all paint the same frame.
    let queued = 0;
    const schedule = () => {
      if (queued) return;
      queued = requestAnimationFrame(() => {
        queued = 0;
        paint();
      });
    };

    // The photo can move under fixed or sticky text, and the element can be
    // resized. A resize changes the glyph offsets themselves, so those are
    // dropped; a scroll only moves the block, so the cache still stands.
    const ro = new ResizeObserver(() => {
      offsets = null;
      schedule();
    });
    ro.observe(fallbackBox);
    if (hostRef.current) ro.observe(hostRef.current);
    for (const p of panels) if (p.ref?.current) ro.observe(p.ref.current);
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      ro.disconnect();
      if (queued) cancelAnimationFrame(queued);
      window.removeEventListener("scroll", schedule);
    };
  }, [map, measureRef, chars, panels]);

  return (
    <Tag ref={hostRef} className={className} style={{ color: fallback }} {...rest}>
      {chars.map((ch, i) =>
        ch === " " ? (
          " "
        ) : (
          <span
            key={i}
            // Assigned BY INDEX, not pushed: a push-based callback paired with
            // clearing the array during render double-fills it under
            // StrictMode's double invoke, and leaves stale nodes behind when
            // the text changes. Writing to a slot is idempotent, and the null
            // call on unmount clears that slot.
            ref={(el) => {
              letterRefs.current[i] = el;
            }}
            // inline-block so the glyph has a box to measure; without it a
            // span around a letter reports the whole line's height.
            style={{ display: "inline-block", willChange: "color" }}
          >
            {ch}
          </span>
        ),
      )}
    </Tag>
  );
}

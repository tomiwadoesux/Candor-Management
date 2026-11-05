"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import FitText from "@/components/FitText";
import "./wordPaint.css";

// The giant word, drawn by wordPaintGL: the letters are windows onto a
// photograph that the pointer develops. The DOM keeps the real word, fitted
// by FitText as before, so layout, selection and screen readers are
// unchanged; once the canvas is drawing, the text goes transparent and the
// canvas paints the word from the same glyph positions. Without WebGL2 the
// plain word simply stays.
//
// The pointer stirs it; scrolling past with the pointer still over the
// section stirs it too, since the word moves under it. On arrival the word is
// revealed behind one scripted stroke, which is also all a phone sees.
//
// `faces`: one photo to span the word, or several dealt one per letter; under
// Spectrum the photograph changes every few seconds (see framesFor).
// `look`: "spectrum" (the default: outlined letters the paint colours, the
// photograph faint inside the colour) or one of wordPaintGL's LOOKS, which
// compose the photograph under the paint.
//
// For a word set inside a line of other words (/agency's PEOPLE):
// `as` makes the section another element (a span, inside a heading); `fit`
// false leaves the word at the size its own CSS sets instead of fitting it to
// the width, and the word may be split into spans; `reveal` "drawn" draws it
// from the start, for a page that covers it and uncovers it itself, and
// strokes across it only when the page dispatches STROKE_EVENT on the
// section; `clear` (Spectrum) makes the canvas see-through off the letters,
// so it never paints over its neighbours; `rest` (Spectrum), { light, dark },
// is how much of the photograph shows in the letters untouched, on each
// ground, for a page that wants the faces plainer than the study's.

// Through the image optimiser, wide enough to span a word on a 2x screen.
export const photo = (src, w = 1920) => `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=70`;
const SITTERS = ["/photos/img12.jpeg", "/photos/img7.jpeg", "/photos/img25.jpeg", "/photos/img14.jpeg"];
export const PORTRAIT = [photo(SITTERS[0])];
export const FACES = SITTERS.map((src) => photo(src, 828));

// What Spectrum turns through over time: a word-wide portrait goes through
// each sitter in turn; letters with a face each pass the faces along by one.
const PORTRAITS = SITTERS.map((src) => [photo(src)]);
function framesFor(faces) {
  if (faces === PORTRAIT) return PORTRAITS;
  if (faces.length < 2) return [faces];
  return faces.map((_, i) => [...faces.slice(i), ...faces.slice(0, i)]);
}

// How far outside the section a pointer still counts, in px: enough for a
// stroke to start just off the edge and sweep in.
const REACH = 160;

// Dispatch this on window after changing a page's background, and every
// Spectrum word re-reads its ground.
export const GROUND_EVENT = "wordpaint:ground";

// Dispatch this on a `reveal="drawn"` section to send a stroke across it.
export const STROKE_EVENT = "wordpaint:stroke";

// The colour behind the section: the first ancestor that paints a background,
// [r, g, b] 0–255; white if none does, as the browser would show.
function groundOf(el) {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const m = getComputedStyle(node).backgroundColor.match(/[\d.]+/g);
    if (m && (m[3] === undefined || +m[3] > 0)) return m.slice(0, 3).map(Number);
  }
  return [255, 255, 255];
}

// `wordClassName`
// and `fitClassName` dress the word's box and its fitted span, so other pages
// can set it in another face.
export default function WordPaint({
  word,
  className = "",
  faces = PORTRAIT,
  look = "spectrum",
  wordClassName = "an-big-word an-pad",
  fitClassName = "an-big-fit",
  as: Tag = "section",
  fit = true,
  reveal: revealMode = "arrive",
  clear = false,
  rest,
  preloadMargin = "100% 0px",
  children,
}) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const wordRef = useRef(null);
  const apiRef = useRef(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const wordEl = wordRef.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let gl = null;
    let disposed = false;
    let loading = false;
    let visible = false;
    let seenEnough = false;
    let revealed = false;
    let frame = 0;
    let awakeUntil = 0;
    let pointer = null; // a real pointer, client px, while it's on the page
    let lastReal = -Infinity; // when it last moved
    let scripted = null; // the scripted stroke, section px, while it runs
    let lastSource = null;
    let strokeWanted = false; // asked for before the canvas was ready
    let resizeTimer = 0;
    let idleTimer = 0;
    let lastLayout = "";
    const tweens = [];

    // Feed the brush, draw, and keep going only while there's something to
    // draw: paint still moving, or a tween asking for frames.
    const loop = (now) => {
      frame = 0;
      if (!gl) return;
      const rect = root.getBoundingClientRect();
      let source = null;
      let at = null;
      // A real pointer that's moving wins over the scripted stroke.
      if (scripted && !(pointer && now - lastReal < 400)) {
        source = "scripted";
        at = scripted;
      } else if (
        pointer &&
        pointer.x > rect.left - REACH &&
        pointer.x < rect.right + REACH &&
        pointer.y > rect.top - REACH &&
        pointer.y < rect.bottom + REACH
      ) {
        source = "pointer";
        at = { x: pointer.x - rect.left, y: pointer.y - rect.top };
      }
      // Changing hands lifts the brush, so it never draws a line between them.
      if (source !== lastSource) gl.point(null);
      lastSource = source;
      gl.point(at?.x ?? null, at?.y);
      gl.step(now / 1000);
      if (!visible) return;
      if (gl.busy(now / 1000) || now < awakeUntil) {
        frame = requestAnimationFrame(loop);
      } else {
        // Settled; sleep until the next thing the look has scheduled.
        const due = gl.due(now / 1000);
        if (due != null) idleTimer = setTimeout(() => wake(), due * 1000);
      }
    };

    const wake = (ms = 0) => {
      clearTimeout(idleTimer);
      awakeUntil = Math.max(awakeUntil, performance.now() + ms);
      if (!frame && visible && gl) frame = requestAnimationFrame(loop);
    };

    // Where the DOM put each letter, handed to the canvas to set the word in
    // the same places.
    const measure = () => {
      const box = root.getBoundingClientRect();
      if (!gl || !box.width || !box.height) return;
      const style = getComputedStyle(wordEl);
      const range = document.createRange();
      const glyphs = [];
      // Every character, through whatever spans the word is set in.
      const walker = document.createTreeWalker(wordEl, NodeFilter.SHOW_TEXT);
      for (let text = walker.nextNode(); text; text = walker.nextNode()) {
        for (let i = 0; i < text.length; i++) {
          range.setStart(text, i);
          range.setEnd(text, i + 1);
          const r = range.getBoundingClientRect();
          const rounded = (value) => Math.round(value * 100) / 100;
          glyphs.push({ ch: text.data[i], left: rounded(r.left - box.left), top: rounded(r.top - box.top), width: rounded(r.width), height: rounded(r.height) });
        }
      }
      if (!glyphs.length) return;
      const layout = {
        width: box.width,
        height: box.height,
        font: { style: style.fontStyle, weight: style.fontWeight, family: style.fontFamily, size: parseFloat(style.fontSize) },
        glyphs,
      };
      const signature = JSON.stringify(layout);
      // ResizeObserver also fires on initial observation. Do not rebuild the
      // distance field and every photo atlas for an unchanged word layout.
      if (signature !== lastLayout) {
        gl.setLayout(layout);
        lastLayout = signature;
      }
      if (look === "spectrum") gl.setGround(groundOf(root));
      wake(100);
    };

    // One stroke through the middle of the letters, left to right, rising
    // and falling three half-waves on the way.
    const strokeAcross = (delay = 0) => {
      const box = gl?.wordBox();
      if (reduced || !box) return;
      const path = { t: 0 };
      const span = box.right - box.left;
      tweens.push(
        gsap.to(path, {
          t: 1,
          duration: 1.7,
          delay,
          ease: "power1.inOut",
          onUpdate: () => {
            scripted = {
              x: box.left - span * 0.06 + span * 1.12 * path.t,
              y: box.baseline - box.size * 0.34 + Math.sin(path.t * Math.PI * 3) * box.size * 0.24,
            };
            wake(200);
          },
          onComplete: () => {
            scripted = null;
          },
        })
      );
    };

    const reveal = () => {
      revealed = true;
      const progress = gl.uniforms.uReveal;
      if (reduced) {
        progress.value = 1;
        wake(100);
        return;
      }
      tweens.push(gsap.fromTo(progress, { value: 0 }, { value: 1, duration: 1.9, ease: "power2.inOut", onUpdate: () => wake(100) }));
      strokeAcross(0.1);
    };

    const load = () => {
      if (loading) return;
      loading = true;
      Promise.all([import("./wordPaintGL"), document.fonts?.ready])
        .then(([{ createWordPaint }]) => {
          if (disposed) return;
          try {
            gl = createWordPaint(canvas, { faces, frames: framesFor(faces), look, clear, rest, onChange: () => wake(100) });
          } catch {
            return;
          }
          measure();
          apiRef.current = { gl, wake, strokeAcross, revealed: () => revealed };
          setLive(true);
          if (revealMode === "drawn") {
            revealed = true;
            gl.uniforms.uReveal.value = 1;
            if (strokeWanted) strokeAcross();
          }
          if (seenEnough && !revealed) reveal();
        })
        .catch(() => {});
    };

    // Load a screen ahead; draw only while on screen; reveal once a third is in.
    const near = new IntersectionObserver(([e]) => e.isIntersecting && load(), { rootMargin: preloadMargin });
    const seen = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (e.intersectionRatio >= 0.3) seenEnough = true;
        if (gl && seenEnough && !revealed) reveal();
        if (visible) wake(100);
      },
      { threshold: [0, 0.3] }
    );
    near.observe(root);
    seen.observe(root);

    const resized = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measure, 120);
    });
    resized.observe(root);
    resized.observe(wordEl);

    const move = (e) => {
      pointer = { x: e.clientX, y: e.clientY };
      lastReal = performance.now();
      wake();
    };
    const lift = (e) => {
      if (e.pointerType === "touch") pointer = null;
    };
    const leave = () => {
      pointer = null;
    };
    // The page moving under a still pointer is a stroke as well.
    const scrolled = () => pointer && wake();
    // A page that changes its ground (a theme switch) says so with this event.
    const regrounded = () => {
      if (!gl || look !== "spectrum") return;
      gl.setGround(groundOf(root));
      wake(100);
    };
    // A page that reveals the word itself asks for its stroke with this one.
    const stroke = () => {
      if (gl) strokeAcross();
      else strokeWanted = true;
    };
    window.addEventListener(GROUND_EVENT, regrounded);
    root.addEventListener(STROKE_EVENT, stroke);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", move, { passive: true });
    window.addEventListener("pointerup", lift, { passive: true });
    window.addEventListener("pointercancel", lift, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("scroll", scrolled, { passive: true });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      clearTimeout(resizeTimer);
      clearTimeout(idleTimer);
      near.disconnect();
      seen.disconnect();
      resized.disconnect();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
      window.removeEventListener("pointerup", lift);
      window.removeEventListener("pointercancel", lift);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("scroll", scrolled);
      window.removeEventListener(GROUND_EVENT, regrounded);
      root.removeEventListener(STROKE_EVENT, stroke);
      tweens.forEach((t) => t.kill());
      gl?.dispose();
      apiRef.current = null;
    };
  }, []);

  const Box = Tag === "span" ? "span" : "div";
  const wordSpan = (
    <span ref={wordRef} className="wp-word">
      {word}
    </span>
  );
  return (
    <Tag
      ref={rootRef}
      className={`${className} wp${look === "spectrum" ? " wp-clear" : ""}`}
      data-wp-live={live ? "" : undefined}
    >
      <canvas ref={canvasRef} className="wp-canvas" aria-hidden="true" />
      <Box className={wordClassName}>{fit ? <FitText className={fitClassName}>{wordSpan}</FitText> : wordSpan}</Box>
      {children}
    </Tag>
  );
}

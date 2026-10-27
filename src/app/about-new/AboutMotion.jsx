"use client";

import { useEffect } from "react";

// The page's motion, attached after hydration so the server markup is
// complete without it.
//
// Two kinds, both driven by attributes in page.js:
//   [data-an-reveal]  gains .is-in once it scrolls into view; the stylesheet
//                     owns what that means (words rise, images unclip).
//   [data-an-scrub]   gets --p, 0..1, from its position on screen.
//                     "through": from its top entering to its bottom leaving.
//                     "read":    from its top at 85% of the screen to its
//                                bottom at 50%, so a paragraph is fully lit
//                                while it is still comfortably in view.
//   [data-an-pin]     a section whose sticky stage holds the screen while its
//                     [data-an-track] slides sideways. Gets --travel (how far
//                     the track overhangs the screen, which the stylesheet
//                     adds to the section's height) and --p across the pin.
//   [data-an-steps]   gets --step, the index of the [data-an-step] nearest
//                     the middle of the screen, which also gets .is-current.
//   [data-an-count]   a number the server rendered final; it is reset to zero
//                     here and counts up the first time it is half in view.
//                     data-an-pad sets its zero-padding.
//
// Lenis drives the real scroll position (components/SmoothScroll.jsx), so
// plain scroll events and getBoundingClientRect are all this needs.
export default function AboutMotion() {
  useEffect(() => {
    const root = document.querySelector("[data-an-root]");
    if (!root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reveals = root.querySelectorAll("[data-an-reveal]");
    const scrubs = [...root.querySelectorAll("[data-an-scrub]")];
    const pins = [...root.querySelectorAll("[data-an-pin]")];
    const stepped = [...root.querySelectorAll("[data-an-steps]")].map((el) => ({
      el,
      steps: [...el.querySelectorAll("[data-an-step]")],
      current: -1,
    }));

    if (reduce) {
      reveals.forEach((el) => el.classList.add("is-in"));
      scrubs.forEach((el) =>
        el.style.setProperty("--p", el.dataset.anScrub === "read" ? "1" : "0.5")
      );
      return;
    }

    // Hidden start states only apply under .is-motion, so a page that never
    // hydrates still shows everything.
    root.classList.add("is-motion");

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px" }
    );
    reveals.forEach((el) => io.observe(el));

    const fmt = (el, v) =>
      String(Math.round(v)).padStart(Number(el.dataset.anPad) || 1, "0");
    const counters = [...root.querySelectorAll("[data-an-count]")].filter(
      (el) => Number(el.dataset.anCount) > 0
    );
    const countRafs = new Set();
    const cio = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          cio.unobserve(e.target);
          const el = e.target;
          const to = Number(el.dataset.anCount);
          const t0 = performance.now();
          const dur = 1400;
          const tick = (t) => {
            const k = Math.min(1, (t - t0) / dur);
            el.textContent = fmt(el, to * (1 - Math.pow(1 - k, 3)));
            if (k < 1) {
              const id = requestAnimationFrame(tick);
              countRafs.add(id);
            }
          };
          countRafs.add(requestAnimationFrame(tick));
        }
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => {
      el.textContent = fmt(el, 0);
      cio.observe(el);
    });

    // The pinned stage only pins above phone width (see .an-dig in the
    // stylesheet); below it the track scrolls natively and overhangs nothing.
    const wide = window.matchMedia("(min-width: 641px)");
    const measure = () => {
      for (const el of pins) {
        const track = el.querySelector("[data-an-track]");
        const travel = wide.matches && track
          ? Math.max(0, track.scrollWidth - window.innerWidth)
          : 0;
        el.style.setProperty("--travel", `${travel}px`);
      }
    };

    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      for (const el of pins) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) continue;
        const span = r.height - vh;
        const p = span > 0 ? -r.top / span : 0;
        el.style.setProperty("--p", Math.min(1, Math.max(0, p)).toFixed(4));
      }
      for (const s of stepped) {
        const r = s.el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) continue;
        let current = 0;
        s.steps.forEach((step, i) => {
          if (step.getBoundingClientRect().top < vh * 0.55) current = i;
        });
        if (current !== s.current) {
          s.current = current;
          s.el.style.setProperty("--step", current);
          s.steps.forEach((step, i) => step.classList.toggle("is-current", i === current));
        }
      }
      for (const el of scrubs) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) continue;
        let p;
        if (el.dataset.anScrub === "read") {
          const start = vh * 0.85;
          const end = vh * 0.5;
          p = (start - r.top) / (r.height + start - end);
        } else {
          p = (vh - r.top) / (vh + r.height);
        }
        el.style.setProperty("--p", Math.min(1, Math.max(0, p)).toFixed(4));
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      onScroll();
    };

    measure();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    // Webfonts can widen the track's captions after the first measure.
    document.fonts?.ready.then(onResize).catch(() => {});

    return () => {
      io.disconnect();
      cio.disconnect();
      countRafs.forEach((id) => cancelAnimationFrame(id));
      // Put the numbers back, so a remount starts from the real values.
      counters.forEach((el) => {
        el.textContent = fmt(el, Number(el.dataset.anCount));
      });
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      root.classList.remove("is-motion");
    };
  }, []);

  return null;
}

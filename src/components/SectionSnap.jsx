"use client";

import { useEffect } from "react";

/**
 * Observer-driven section snapping for the post-intro part of the homepage.
 *
 * The homepage intro (see page.js) is a bespoke scroll-position animation that
 * reads window.scrollY across a 150vh track, so we must NOT hijack the wheel
 * while the intro is on screen. This component therefore:
 *
 *   1. Detects wheel/touch/trackpad *intent* with GSAP's Observer (passive —
 *      preventDefault:false — so it never blocks the intro's native scroll).
 *   2. Only acts once the viewport has reached the first post-intro section.
 *   3. Snaps to the *start* of each section, but lets a section that's taller
 *      than the viewport scroll normally until you reach its edge — so the
 *      models grid etc. are never trapped.
 *
 * It reads the direct children of [data-snap-container] as the snap targets,
 * so no per-section markup is required.
 */
export default function SectionSnap() {
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return; // native scroll only — no snapping

    const container = document.querySelector("[data-snap-container]");
    if (!container) return;

    let observer;
    let cancelled = false;

    (async () => {
      const [{ gsap }, { Observer }, { ScrollToPlugin }] = await Promise.all([
        import("gsap"),
        import("gsap/Observer"),
        import("gsap/ScrollToPlugin"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(Observer, ScrollToPlugin);

      let animating = false;
      const EDGE = 2; // px slack when deciding "at the edge of a section"

      const sections = () => Array.from(container.children);

      const snapTo = (yAbs) => {
        animating = true;
        gsap.to(window, {
          duration: 0.8,
          ease: "power2.inOut",
          scrollTo: { y: yAbs, autoKill: true },
          onComplete: () => {
            // brief cooldown so the tail of one flick can't chain into the next
            gsap.delayedCall(0.08, () => (animating = false));
          },
          onInterrupt: () => (animating = false), // user grabbed scroll — yield
        });
      };

      const handle = (dir) => {
        if (animating) return;

        const scrollY = window.scrollY;
        const vh = window.innerHeight;
        const els = sections();
        if (!els.length) return;

        // Live geometry (images/lazy content shift these as they load).
        const rects = els.map((el) => {
          const r = el.getBoundingClientRect();
          return { top: r.top + scrollY, bottom: r.bottom + scrollY };
        });

        // Below the first section's top we're still in the intro — leave the
        // wheel entirely to the native scroll the intro animation depends on.
        if (scrollY < rects[0].top - 1) return;

        // Current section = the last one whose top is at/above the viewport top.
        let cur = 0;
        for (let i = 0; i < rects.length; i++) {
          if (rects[i].top <= scrollY + 1) cur = i;
        }

        if (dir > 0) {
          // More of this section below the fold? Let it scroll naturally.
          if (rects[cur].bottom - (scrollY + vh) > EDGE) return;
          if (cur + 1 < rects.length) snapTo(rects[cur + 1].top);
        } else {
          // Scrolled down inside a tall section? Let it scroll back up first.
          if (rects[cur].top < scrollY - EDGE) return;
          if (cur - 1 >= 0) snapTo(rects[cur - 1].top);
          // else: at the first section's top — fall through to native scroll,
          // handing control back to the intro above.
        }
      };

      observer = Observer.create({
        target: window,
        type: "wheel,touch,pointer",
        preventDefault: false, // passive: never blocks the intro's scroll
        tolerance: 10,
        // Swipe semantics (as in GSAP's own snap demo): onUp = advance to the
        // next section (scroll down the page), onDown = go back to the previous.
        onUp: () => handle(1),
        onDown: () => handle(-1),
      });
    })();

    return () => {
      cancelled = true;
      if (observer) observer.kill();
    };
  }, []);

  return null;
}

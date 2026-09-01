"use client";

import { useEffect } from "react";

/**
 * Site-wide smooth scrolling, via Lenis.
 *
 * Lenis interpolates towards the wheel's target and drives the real scroll
 * position, so `position: sticky`, `getBoundingClientRect` and every
 * scroll-driven effect on the site keep working — it is not a transformed
 * fake-scroll container.
 *
 * Loaded on the client after hydration rather than bundled into first paint:
 * it is presentation, and the page scrolls natively until it arrives.
 */
export default function SmoothScroll() {
  useEffect(() => {
    // Honour the OS setting: smoothing is exactly the kind of motion someone
    // turning this on is asking not to have.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let lenis;
    let raf = 0;
    let cancelled = false;

    (async () => {
      const { default: Lenis } = await import("lenis");
      if (cancelled) return;

      lenis = new Lenis({
        // Low enough to feel like weight rather than delay. Higher values are
        // where smooth scrolling starts reading as lag.
        lerp: 0.12,
        wheelMultiplier: 1,
        // Touch devices already have momentum of their own; doubling it up
        // fights the platform.
        smoothWheel: true,
        syncTouch: false,
      });

      const frame = (time) => {
        lenis.raf(time);
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    })();

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      lenis?.destroy();
    };
  }, []);

  return null;
}

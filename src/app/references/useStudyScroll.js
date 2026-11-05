"use client";

import { useEffect, useRef } from "react";

// All scenes read the existing Lenis document scroll. A scene may request
// another frame for a brief catch-up, as Getty's distant image field does.
export function useStudyScroll(ref, render, variant) {
  const draw = useRef(render);
  draw.current = render;
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      const settling = draw.current({
        root, top: rect.top, height: window.innerHeight, width: window.innerWidth,
        progress: Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height - window.innerHeight))),
        reduced: reduce.matches,
      });
      if (settling) wake();
    };
    const wake = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);
    reduce.addEventListener("change", wake);
    const observer = new ResizeObserver(wake);
    observer.observe(root);
    update();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
      reduce.removeEventListener("change", wake);
    };
  }, [ref, variant]);
}

export function jumpTo(top) {
  // Cancel document smoothing momentum when selecting another study/chapter.
  window.scrollTo({ top, behavior: "instant" });
}

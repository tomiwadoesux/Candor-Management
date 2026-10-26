"use client";

import { useEffect, useRef } from "react";
import { heatTransition } from "../lib/heatTransition";

/** The wrapper fades the departing group. The shared backdrop is independent
 * of that group's contents: anything behind the raised band refracts.
 */
export default function HeatTransition({ children, enabled = true, targetSelector, zIndex = 45 }) {
  const sourceRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const source = sourceRef.current;
    const target = document.querySelector(targetSelector);
    if (!source || !target) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const owner = {};
    let disposed = false, near = false, dirty = true, unavailable = false;
    let frame = 0, lastPaint = -Infinity, clock = 0, lastTime = 0;
    let heatModule = null, loading = null, renderer = null, layout = null;
    let lastOpacity = "", lastEdge = NaN;

    const measure = () => {
      layout = { height: window.innerHeight, targetTop: target.getBoundingClientRect().top + window.scrollY };
      dirty = false;
    };
    const release = () => {
      if (renderer) heatModule.releaseHeatRenderer(owner);
      renderer = null;
      lastTime = 0;
    };
    const prepare = () => {
      if (motion.matches || unavailable || loading || heatModule) return;
      loading = import("../lib/heatRenderer").then((loaded) => {
        if (disposed) return;
        heatModule = loaded;
        request();
      }).catch(() => { unavailable = true; });
    };

    function tick(time) {
      frame = 0;
      if (disposed || document.hidden) { release(); return; }
      if (dirty || !layout) measure();
      const edge = layout.targetTop - window.scrollY;
      const state = heatTransition(edge, layout.height, motion.matches);
      const opacity = state.opacity.toFixed(4);
      if (opacity !== lastOpacity) {
        source.style.opacity = state.opacity === 1 ? "" : opacity;
        source.inert = state.opacity < 0.08;
        lastOpacity = opacity;
      }
      if (near) prepare();
      if (!state.active || !near || unavailable) { release(); return; }
      if (!heatModule) return;
      if (!renderer) {
        renderer = heatModule.acquireHeatRenderer(owner);
        if (!renderer) return;
        renderer.configure(zIndex);
        lastPaint = -Infinity;
      }
      clock += lastTime ? Math.min((time - lastTime) / 1000, 0.064) : 0;
      lastTime = time;
      // Follow scroll each frame; the quiet stationary shimmer runs at 30fps.
      if (edge !== lastEdge || time - lastPaint >= 1000 / 30 - 0.5) {
        renderer.draw({ ...state, time: clock });
        lastPaint = time; lastEdge = edge;
      }
      frame = requestAnimationFrame(tick);
    }
    function request() {
      if (!frame && !disposed && !document.hidden) frame = requestAnimationFrame(tick);
    }
    const remeasure = () => { dirty = true; request(); };
    const onVisibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; release(); }
      else remeasure();
    };
    const observer = new IntersectionObserver(([entry]) => { near = entry.isIntersecting; request(); }, { rootMargin: "25% 0px" });
    observer.observe(target);
    const resize = new ResizeObserver(remeasure);
    resize.observe(source); resize.observe(target);
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", remeasure, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    motion.addEventListener("change", remeasure);
    request();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      release();
      heatModule?.releaseHeatRenderer(owner, true);
      observer.disconnect(); resize.disconnect();
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", remeasure);
      document.removeEventListener("visibilitychange", onVisibility);
      motion.removeEventListener("change", remeasure);
      source.style.opacity = ""; source.inert = false;
    };
  }, [enabled, targetSelector, zIndex]);

  return <div ref={sourceRef} data-heat-source className="pointer-events-none absolute inset-0">{children}</div>;
}

"use client";

import { useEffect } from "react";

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const smoothstep = (value) => value * value * (3 - 2 * value);

// Keep the section heading and wordmark together without measuring layout
// during scrolling. CSS sticky owns the vertical movement.
export default function useLogoDock() {
  useEffect(() => {
    const title = document.querySelector("[data-dock-title]");
    const sticky = title?.closest("[data-dock-sticky]");
    const section = sticky?.parentElement;
    const host = document.querySelector(".candor-intro-logo-host");
    const logo = host?.querySelector(".candor-logo");
    if (!title || !sticky || !section || !host || !logo) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const start = () => {
      let raf = 0;
      let disposed = false;
      let needsMeasure = true;
      let geometry;
      let lastPhase;
      const gap = 14;
      const original = [
        [title, "transform"],
        [title, "willChange"],
        [sticky, "top"],
        [host, "transform"],
        [host, "willChange"],
      ].map(([node, property]) => [node, property, node.style[property]]);
      const applied = new WeakMap();
      const setStyle = (node, property, value) => {
        let styles = applied.get(node);
        if (!styles) applied.set(node, (styles = {}));
        if (styles[property] === value) return;
        styles[property] = value;
        node.style[property] = value;
      };

      const measure = () => {
        // Layout dimensions ignore both the heading's current scale and the
        // logo's intro animation. Neither transform needs to be reset.
        const titleStyle = getComputedStyle(title);
        const titleWidth = parseFloat(titleStyle.width);
        const titleHeight = parseFloat(titleStyle.height);
        const logoWidth = logo.offsetWidth;
        const logoHeight = logo.offsetHeight;
        if (!titleWidth || !titleHeight || !logoWidth || !logoHeight) {
          geometry = null;
          return;
        }

        const rect = section.getBoundingClientRect();
        const style = getComputedStyle(section);
        const y = window.scrollY;
        const naturalTop =
          rect.top + y + parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop);
        const limit =
          rect.bottom + y - parseFloat(style.borderBottomWidth)
          - parseFloat(style.paddingBottom) - sticky.offsetHeight;
        const scale = (logoHeight / titleHeight) * 0.95;
        const dockTop = host.getBoundingClientRect().top + logoHeight * 0.025;
        const startTop = Math.max(window.innerHeight * 0.6, dockTop + 1);
        const dockedWidth = titleWidth * scale;

        geometry = {
          naturalTop,
          limit,
          dockTop,
          startTop,
          scale,
          logoWidth,
          dockedWidth,
          shift: (dockedWidth + gap) / 2,
          releaseSpan: logoHeight * 2.5,
        };
        // All geometry reads precede this one layout write.
        setStyle(sticky, "top", `${dockTop.toFixed(2)}px`);
        lastPhase = undefined;
      };

      const phaseAt = (y) => {
        const g = geometry;
        if (y <= g.naturalTop - g.startTop) return "before";
        if (y < g.naturalTop - g.dockTop) return "enter";
        if (y <= g.limit - g.dockTop) return "pinned";
        if (y < g.limit - g.dockTop + g.releaseSpan) return "leave";
        return "after";
      };

      const render = () => {
        raf = 0;
        if (needsMeasure) {
          needsMeasure = false;
          measure();
        }
        if (!geometry) return;
        const g = geometry;
        const y = window.scrollY;
        const phase = phaseAt(y);
        // This is the browser's sticky clamp, using cached document positions.
        const top = Math.min(Math.max(g.naturalTop - y, g.dockTop), g.limit - y);
        const inward = smoothstep(
          clamp01((g.startTop - top) / (g.startTop - g.dockTop)),
        );
        const release = smoothstep(clamp01((g.dockTop - top) / g.releaseSpan));
        const pin = inward * (1 - release);
        const scale = 1 + (g.scale - 1) * inward;
        const dx =
          (-g.shift * pin + g.logoWidth / 2 + gap + g.dockedWidth / 2) * inward;
        const moving = phase === "enter" || phase === "leave";

        setStyle(host, "transform", `translateX(${(-g.shift * pin).toFixed(2)}px)`);
        setStyle(
          title,
          "transform",
          `translateX(${dx.toFixed(2)}px) scale(${scale.toFixed(4)})`,
        );
        setStyle(host, "willChange", moving ? "transform" : "");
        setStyle(title, "willChange", moving ? "transform" : "");
        lastPhase = phase;
      };

      const schedule = () => {
        if (!raf && !disposed) raf = requestAnimationFrame(render);
      };
      const onScroll = () => {
        if (!geometry) return;
        const phase = phaseAt(window.scrollY);
        // No frame, measurements or style writes while settled, even when
        // the rest of the long landing page is scrolling.
        if (phase === lastPhase && phase !== "enter" && phase !== "leave") return;
        schedule();
      };
      const invalidate = () => {
        needsMeasure = true;
        schedule();
      };

      render();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", invalidate);
      window.addEventListener("load", invalidate);
      const observer = new ResizeObserver(invalidate);
      // Preceding sections and the page can shift the dock when media loads.
      for (const node of [title, logo, section, document.body]) {
        observer.observe(node);
      }
      for (
        let sibling = section.previousElementSibling;
        sibling;
        sibling = sibling.previousElementSibling
      ) {
        observer.observe(sibling);
      }
      document.fonts?.ready.then(() => {
        if (!disposed) invalidate();
      });

      return () => {
        disposed = true;
        cancelAnimationFrame(raf);
        observer.disconnect();
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", invalidate);
        window.removeEventListener("load", invalidate);
        original.forEach(([node, property, value]) => {
          node.style[property] = value;
        });
      };
    };

    let stop;
    const syncMotion = () => {
      stop?.();
      stop = motion.matches ? undefined : start();
    };
    syncMotion();
    motion.addEventListener("change", syncMotion);
    return () => {
      motion.removeEventListener("change", syncMotion);
      stop?.();
    };
  }, []);
}

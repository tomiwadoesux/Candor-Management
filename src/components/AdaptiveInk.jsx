"use client";

import { useEffect } from "react";
import { comparePaintOrder, composite, inkForLuminance, luminance, mediaPoint } from "../lib/adaptiveInk";
import "../styles/adaptive-ink.css";

const SKIP = "script,style,noscript,template,svg,select,option,.sr-only,[data-ink-fixed],nextjs-portal";
const inside = (r, x, y) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
const visible = (r) => r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;

/** One sampler for the whole site. It changes ink, never React's text nodes.
 * Photos are decoded once; moving media is sampled at 30fps only while visible.
 * Reading the rendered crop, stacking order and light overlays avoids the grey
 * and coloured text produced by difference/exclusion blending.
 */
export default function AdaptiveInk() {
  useEffect(() => {
    let targets = [];
    let targetSet = new Set();
    let candidates = [];
    let order = new Map();
    let refreshTimer = 0;
    let lastPaint = 0;
    let queued = 0;
    let stopped = false;
    let liveMedia = false;
    const painted = new Set();
    const unblended = new Set();
    const mediaCache = new WeakMap();
    const backgroundImages = new Map();
    const logos = new Map();
    let logoId = 0;
    const colors = new Map();
    const colorCanvas = document.createElement("canvas");
    colorCanvas.width = colorCanvas.height = 1;
    const colorContext = colorCanvas.getContext("2d", { willReadFrequently: true });
    if (!colorContext) return;

    const color = (value) => {
      if (!value || value === "transparent" || value === "rgba(0, 0, 0, 0)") return [0, 0, 0, 0];
      if (!colors.has(value)) {
        colorContext.clearRect(0, 0, 1, 1);
        colorContext.fillStyle = value;
        colorContext.fillRect(0, 0, 1, 1);
        const p = colorContext.getImageData(0, 0, 1, 1).data;
        colors.set(value, [p[0], p[1], p[2], p[3] / 255]);
      }
      return colors.get(value);
    };

    const refresh = () => {
      refreshTimer = 0;
      // The root survives route changes; released pages must not stay retained.
      for (const el of painted) if (!el.isConnected) painted.delete(el);
      for (const el of unblended) if (!el.isConnected) unblended.delete(el);
      for (const el of logos.keys()) if (!el.isConnected) logos.delete(el);
      const all = [document.body, ...document.body.querySelectorAll("*")].filter(el => !el.closest(SKIP));
      order = new Map(all.map((el, i) => [el, i + 1]));
      candidates = all.filter(el => {
        const s = getComputedStyle(el);
        return el.matches("img,video,canvas") || color(s.backgroundColor)[3] > 0 || s.backgroundImage.includes("url(");
      });
      targets = all.filter(el => el.matches("input,textarea") || [...el.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim()));
      // The wordmark is drawn with currentColor, so it follows the same rule.
      targets.push(...Array.from(document.querySelectorAll("svg.logo-text")).filter(el => !el.closest("[data-ink-fixed]")));
      targetSet = new Set(targets);
      for (const el of targets) {
        for (let parent = el; parent && parent !== document.body; parent = parent.parentElement) {
          if (getComputedStyle(parent).mixBlendMode !== "normal") {
            parent.setAttribute("data-adaptive-blend", "");
            unblended.add(parent);
          }
        }
      }
      schedule();
    };

    const readMedia = (el) => {
      const video = el.tagName === "VIDEO";
      const canvas = el.tagName === "CANVAS";
      const width = video ? el.videoWidth : canvas ? el.width : el.naturalWidth;
      const height = video ? el.videoHeight : canvas ? el.height : el.naturalHeight;
      if (!width || !height || (video && el.readyState < 2)) return null;
      const source = el.currentSrc || el.src;
      let map = mediaCache.get(el);
      if (map && map.source === source && ((!video && !canvas) || (video && map.time === el.currentTime) || map.blocked)) return map.blocked ? null : map;
      if (!map || map.source !== source) {
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(192 * Math.min(1, width / height)));
        canvas.height = Math.max(1, Math.round(192 * Math.min(1, height / width)));
        map = { source, canvas, ctx: canvas.getContext("2d", { willReadFrequently: true }) };
        mediaCache.set(el, map);
      }
      try {
        map.ctx.drawImage(el, 0, 0, map.canvas.width, map.canvas.height);
        map.pixels = map.ctx.getImageData(0, 0, map.canvas.width, map.canvas.height).data;
        map.width = width;
        map.height = height;
        map.time = el.currentTime;
        return map;
      } catch {
        // Unreadable remote media keeps its underlying surface as the fallback.
        // Do not repeatedly attempt a canvas read that the browser disallows.
        map.blocked = true;
        return null;
      }
    };

    const paint = () => {
      if (stopped || document.hidden) return;
      const cache = new Map();
      const info = (el) => {
        if (cache.has(el)) return cache.get(el);
        const s = getComputedStyle(el);
        const parent = el.parentElement ? info(el.parentElement) : null;
        const rect = el.getBoundingClientRect();
        const clips = parent ? [...parent.clips] : [];
        if (parent && /hidden|clip|scroll|auto/.test(`${parent.style.overflowX} ${parent.style.overflowY}`)) clips.push(parent.rect);
        const context = s.position === "fixed" || s.position === "sticky" ||
          s.zIndex !== "auto" || s.transform !== "none" || s.filter !== "none" ||
          s.isolation === "isolate" || Number(s.opacity) < 1;
        const parents = parent?.contexts || [];
        const path = [...parents, Number.parseInt(s.zIndex, 10) || 0, order.get(el) || 0];
        const entry = {
          rect, style: s, clips, path, contexts: context ? path : parents,
          opacity: (parent?.opacity ?? 1) * Number(s.opacity),
          hidden: parent?.hidden || s.display === "none" || s.visibility === "hidden",
        };
        cache.set(el, entry);
        return entry;
      };

      const active = targets.filter(el => el.isConnected && visible(el.getBoundingClientRect()));
      if (!active.length) return;
      const layers = candidates.map(el => ({ el, ...info(el) }))
        .filter(l => !l.hidden && l.opacity > 0.01 && visible(l.rect))
        .sort((a, b) => comparePaintOrder(a.path, b.path));
      liveMedia = layers.some(({ el }) => el.tagName === "CANVAS" ||
        (el.tagName === "VIDEO" && !el.paused && el.readyState >= 2));
      for (const l of layers) {
        l.fill = color(l.style.backgroundColor);
        l.media = l.el.matches("img,video,canvas") ? readMedia(l.el) : null;
        l.fit = l.style.objectFit;
        l.position = l.style.objectPosition.split(" ").map(v => Number.parseFloat(v) / 100);
        const url = l.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1];
        if (!l.media && url) {
          let image = backgroundImages.get(url);
          if (!image) {
            image = new Image();
            image.crossOrigin = "anonymous";
            image.onload = schedule;
            image.src = url;
            backgroundImages.set(url, image);
          }
          l.media = readMedia(image);
          l.fit = /cover|contain/.test(l.style.backgroundSize) ? l.style.backgroundSize : "fill";
          l.position = l.style.backgroundPosition.split(" ").map(v => Number.parseFloat(v) / 100);
        }
      }

      const writes = [];
      const range = document.createRange();
      const sample = (behind, x, y) => {
        let pixel = [250, 250, 250];
        for (const l of behind) {
          if (!inside(l.rect, x, y) || l.clips.some(c => !inside(c, x, y))) continue;
          if (l.fill[3]) pixel = composite(l.fill, pixel, l.opacity);
          const m = l.media;
          if (!m) continue;
          const uv = mediaPoint(x, y, l.rect, m.width, m.height, l.fit, l.position);
          if (!uv) continue;
          const offset = (Math.min(m.canvas.height - 1, Math.floor(uv[1] * m.canvas.height)) * m.canvas.width +
            Math.min(m.canvas.width - 1, Math.floor(uv[0] * m.canvas.width))) * 4;
          pixel = composite([m.pixels[offset], m.pixels[offset + 1], m.pixels[offset + 2], m.pixels[offset + 3] / 255], pixel, l.opacity);
        }
        return luminance(pixel);
      };
      for (const el of active) {
        const target = info(el);
        if (target.hidden || target.opacity < 0.03) continue;
        // Sample the ink's line boxes, not a full-width heading's empty space.
        const textRects = [];
        for (const node of el.childNodes) {
          if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue;
          range.selectNodeContents(node);
          textRects.push(...range.getClientRects());
        }
        if (!textRects.length) textRects.push(target.rect);
        let sum = 0;
        let count = 0;
        const r = target.rect;
        const behind = layers.filter(l => (l.el === el || comparePaintOrder(l.path, target.path) <= 0) &&
          l.rect.right >= r.left && l.rect.left <= r.right && l.rect.bottom >= r.top && l.rect.top <= r.bottom);
        if (el.matches("svg.logo-text")) {
          // A streamed wordmark can be visible before React hydrates its SVG.
          if (!el.hasAttribute("data-logo-ready")) continue;
          const bands = Array.from({ length: 64 }, (_, i) => {
            const x = r.left + r.width * (i + 0.5) / 64;
            const luma = [0.25, 0.5, 0.75].reduce((sum, y) => sum + sample(behind, x, r.top + r.height * y), 0) / 3;
            return inkForLuminance(luma, logos.get(el)?.inks[i]);
          });
          writes.push([el, bands]);
          continue;
        }
        for (const r of textRects) {
          if (!visible(r)) continue;
          const columns = Math.min(15, Math.max(3, Math.ceil(r.width / 24)));
          for (let iy = 0; iy < 3; iy++) for (let ix = 0; ix < columns; ix++) {
            const x = r.left + r.width * (ix + 0.5) / columns;
            const y = r.top + r.height * (iy + 0.5) / 3;
            sum += sample(behind, x, y);
            count++;
          }
        }
        if (!count) continue;
        const ink = inkForLuminance(sum / count, el.style.getPropertyValue("--adaptive-ink"));
        if (el.style.getPropertyValue("--adaptive-ink") !== ink) writes.push([el, ink]);
      }
      // Keep all layout reads above the writes.
      for (const [el, ink] of writes) {
        if (Array.isArray(ink)) {
          let logo = logos.get(el);
          if (!logo) {
            const svg = "http://www.w3.org/2000/svg";
            const defs = document.createElementNS(svg, "defs");
            const gradient = document.createElementNS(svg, "linearGradient");
            const id = `adaptive-logo-${++logoId}`;
            const viewBox = el.viewBox.baseVal;
            gradient.id = id;
            gradient.setAttribute("gradientUnits", "userSpaceOnUse");
            gradient.setAttribute("x1", String(viewBox.x));
            gradient.setAttribute("x2", String(viewBox.x + viewBox.width));
            const stops = ink.map((_, i) => [i, i + 1].map(edge => {
              const stop = document.createElementNS(svg, "stop");
              stop.setAttribute("offset", `${edge / ink.length * 100}%`);
              gradient.appendChild(stop);
              return stop;
            }));
            defs.appendChild(gradient);
            el.appendChild(defs);
            el.style.setProperty("--adaptive-logo-fill", `url(#${id})`);
            el.setAttribute("data-adaptive-logo", "");
            logo = { defs, stops, inks: [] };
            logos.set(el, logo);
          }
          ink.forEach((color, i) => {
            if (color !== logo.inks[i]) logo.stops[i].forEach(stop => stop.setAttribute("stop-color", color));
          });
          logo.inks = ink;
          continue;
        }
        el.style.setProperty("--adaptive-ink", ink);
        el.setAttribute("data-adaptive-ink", "");
        painted.add(el);
      }
    };

    const schedule = () => {
      if (queued || stopped) return;
      queued = requestAnimationFrame(() => {
        queued = 0;
        lastPaint = performance.now();
        paint();
      });
    };
    refresh();
    const observer = new MutationObserver(records => {
      const structureChanged = records.some(r => r.type === "attributes" ||
        [...r.addedNodes, ...r.removedNodes].some(n => n.nodeType === Node.ELEMENT_NODE) || !targetSet.has(r.target));
      const adaptiveCopyChanged = records.some(r => r.target.nodeType === Node.ELEMENT_NODE && r.target.closest("[data-adaptive-text]"));
      if (structureChanged && !refreshTimer) refreshTimer = setTimeout(refresh, adaptiveCopyChanged ? 0 : 80);
    });
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "hidden"] });
    // Includes CSS hover transitions and playing frames; one shared cadence,
    // paused by document visibility, rather than one loop per text element.
    const timer = setInterval(() => {
      if (!document.hidden && performance.now() - lastPaint > (liveMedia ? 30 : 90)) schedule();
    }, 33);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("loadeddata", schedule, true);
    document.fonts.ready.then(schedule);
    return () => {
      stopped = true;
      observer.disconnect();
      clearTimeout(refreshTimer);
      clearInterval(timer);
      cancelAnimationFrame(queued);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("loadeddata", schedule, true);
      painted.forEach(el => { el.removeAttribute("data-adaptive-ink"); el.style.removeProperty("--adaptive-ink"); });
      unblended.forEach(el => el.removeAttribute("data-adaptive-blend"));
      logos.forEach(({ defs }, el) => {
        defs.remove();
        el.removeAttribute("data-adaptive-logo");
        el.style.removeProperty("--adaptive-logo-fill");
      });
    };
  }, []);
  return null;
}

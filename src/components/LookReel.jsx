"use client";

import { useEffect, useRef, useState } from "react";
import Look from "./Look";
import FilmCarousel from "./FilmCarousel";
import { REEL_FOCUS, REEL_TIMELINE as T, REEL_TRAVEL, REEL_HOLD, advanceHandoff, eased, lerpRect, reelProgress } from "../lib/lookReel";
import { handoffFrame } from "../lib/textHandoff";
import { setAdaptiveText } from "../lib/adaptiveText";
import "../styles/look-reel.css";

// The look opens into the reel as the portrait fills the stage. Its two supporting lines
// travel into the active card's heading while the film row stays in place.
export default function LookReel({ films }) {
  const rootRef = useRef(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const look = root?.querySelector("[data-look]");
    const frame = root?.querySelector("[data-reel-frame]");
    const traveller = look?.querySelector("[data-look-traveller]");
    const photo = traveller?.querySelector("img");
    const [kept, aside] = look?.querySelectorAll("[data-look-panel]") ?? [];
    if (!look || !frame || !traveller || !kept || !aside) return;

    const arrows = [...look.querySelectorAll("[data-look-controls]")];
    const lines = [...look.querySelectorAll("[data-handoff-line]")];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const flights = ["kicker", "credits"].map(key => {
      const source = look.querySelector(`[data-handoff-line="${key}"]`);
      const copy = document.createElement("div");
      copy.setAttribute("aria-hidden", "true");
      copy.className = "look-reel__travelling-line";
      document.body.appendChild(copy);
      return { key, source, copy };
    });

    let from;
    let to;
    let stacked;
    let stageHeight;
    let travel;
    let raf = 0;
    let last = null;
    let handoff = null;
    let dirty = true;
    let active = false;
    let disposed = false;

    const measure = () => {
      stageHeight = look.offsetHeight;
      travel = parseFloat(getComputedStyle(root).getPropertyValue("--reel-travel"));
      from = { left: kept.offsetLeft, top: kept.offsetTop, width: kept.offsetWidth, height: kept.offsetHeight };
      to = { left: 0, top: 0, width: look.offsetWidth, height: look.offsetHeight };
      stacked = aside.offsetTop > kept.offsetTop + 1;
    };

    const updateScene = (q, box) => {
      const dominant = box.top <= 0 && box.bottom > window.innerHeight * 0.5;
      document.documentElement.toggleAttribute("data-reel-active", q > 0.1 && dominant);
      document.documentElement.toggleAttribute("data-reel-logo", q > 0.1 && box.top <= 0 && box.bottom > 80);
      const next = q >= 0.9 && dominant;
      if (next !== active) {
        active = next;
        setEnabled(next);
      }
    };

    const tick = (now) => {
      raf = 0;
      if (disposed) return;
      const box = root.getBoundingClientRect();
      // Use the stable stage height so a mobile address bar cannot shift the timeline.
      const p = reelProgress(box.top, (1 + travel) * stageHeight, stageHeight);
      const previousValue = handoff?.value;
      handoff = advanceHandoff(handoff, p, now);
      // Visibility keeps updating after p reaches 1 as the section leaves.
      updateScene(reduced ? eased(p, T.fadeIn) : handoff.value, box);
      if (p === last && !dirty && handoff.value === previousValue && !handoff.running) return;
      last = p;
      dirty = false;

      if (reduced) {
        look.style.opacity = String(1 - eased(p, T.fadeOut));
        const shown = eased(p, T.fadeIn);
        frame.style.opacity = String(shown);
        frame.style.setProperty("--reel-cards", String(shown));
        frame.style.setProperty("--reel-copy", "1");
        frame.style.setProperty("--reel-background", "1");
        frame.style.setProperty("--reel-media", "1");
        frame.inert = shown < 0.9;
        look.inert = shown === 1;
        return;
      }

      const lift = eased(p, T.aside);
      aside.style.transform = lift ? `translate3d(0, ${(stacked ? 100 : -100) * lift}%, 0)` : "";
      const open = eased(p, T.grow);
      const at = lerpRect(from, to, open);
      Object.assign(traveller.style, {
        left: `${at.left}px`, top: `${at.top}px`, width: `${at.width}px`, height: `${at.height}px`,
      });
      if (photo) photo.style.objectPosition = `50% ${50 + (REEL_FOCUS - 50) * open}%`;
      const shy = 1 - eased(p, T.arrows);
      arrows.forEach((group) => {
        group.style.opacity = shy === 1 ? "" : String(shy);
        group.style.visibility = shy === 0 ? "hidden" : "";
      });

      const q = handoff.value;
      const shown = eased(q, [0, 0.25]);
      const preview = eased(p, T.preview);
      frame.style.opacity = String(Math.max(preview, shown));
      frame.style.setProperty("--reel-background", String(shown));
      frame.style.setProperty("--reel-media", String(eased(q, [0.25, 1])));
      frame.style.setProperty("--reel-cards", String(Math.max(preview, eased(q, [0.2, 1]))));
      frame.style.setProperty("--reel-copy", q === 1 ? "1" : "0");
      frame.inert = q < 0.9;
      look.inert = q === 1;
      lines.forEach((line) => {
        line.style.opacity = q === 0 ? "" : line.dataset.handoffLine === "title" ? String(1 - eased(q, [0, 0.2])) : "0";
      });
      for (const { key, source, copy } of flights) {
        const destination = frame.querySelector(`[data-reel-caption] [data-reel-line="${key}"]`);
        if (!source || !destination || q <= 0 || q >= 1) {
          copy.style.display = "none";
          continue;
        }
        const from = source.getBoundingClientRect();
        const to = destination.getBoundingClientRect();
        const sourceStyle = getComputedStyle(source);
        const targetStyle = getComputedStyle(destination);
        const e = eased(q, [0, 1]);
        const text = handoffFrame(source.textContent, destination.dataset.adaptiveText ?? destination.textContent, q, key === "kicker");
        const startScale = parseFloat(sourceStyle.fontSize) / parseFloat(targetStyle.fontSize);
        const scale = startScale + (1 - startScale) * e;
        const x = (from.left + from.width / 2) * (1 - e) + to.left * e;
        const y = from.top + (to.top - from.top) * e;
        setAdaptiveText(copy, text.text);
        for (const prop of ["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "textTransform"]) {
          copy.style[prop] = targetStyle[prop];
        }
        Object.assign(copy.style, {
          display: "block",
          maxWidth: `${Math.min(window.innerWidth - 32, Math.max(from.width / startScale, to.width))}px`,
          opacity: String(text.opacity),
          transform: `translate3d(${x}px, ${y}px, 0) scale(${scale}) translateX(${-50 * (1 - e)}%)`,
        });
      }
      if (handoff.running) request();
    };

    const request = () => {
      if (!raf && !disposed) raf = requestAnimationFrame(tick);
    };
    const remeasure = () => {
      if (disposed) return;
      measure();
      dirty = true;
      request();
    };
    measure();
    const resized = new ResizeObserver(remeasure);
    resized.observe(look);
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", remeasure, { passive: true });
    document.fonts?.ready.then(remeasure).catch(() => {});
    request();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resized.disconnect();
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", remeasure);
      flights.forEach(({ copy }) => copy.remove());
      lines.forEach((line) => { line.style.opacity = ""; });
      arrows.forEach((group) => { group.style.opacity = ""; group.style.visibility = ""; });
      aside.style.transform = "";
      traveller.removeAttribute("style");
      photo?.style.removeProperty("object-position");
      look.style.opacity = "";
      look.inert = false;
      frame.style.removeProperty("opacity");
      frame.style.removeProperty("--reel-cards");
      frame.style.removeProperty("--reel-copy");
      frame.style.removeProperty("--reel-background");
      frame.style.removeProperty("--reel-media");
      frame.inert = false;
      document.documentElement.removeAttribute("data-reel-active");
      document.documentElement.removeAttribute("data-reel-logo");
    };
  }, []);

  return (
    <section ref={rootRef} className="look-reel" style={{ "--reel-travel-desktop": REEL_TRAVEL, "--reel-hold-desktop": REEL_HOLD }}>
      <div className="look-reel__stage">
        <Look scene />
        <div className="look-reel__frame" data-reel-frame>
          <FilmCarousel films={films} enabled={enabled} />
        </div>
      </div>
    </section>
  );
}

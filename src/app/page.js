"use client";

import React, { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Footer from "../components/footer";
import Header from "../components/header";
import Hero2 from "../components/Hero2";
import BlackLogo from "../components/black-logo";
import Loader from "../components/loader.jsx";
import Body from "../components/body";
import NewFaces from "../components/NewFaces";
import Showcase2 from "../components/Showcase2";
import Gridd from "../components/gridd";
import Choose from "../components/Choose";
import News from "../components/News";
import Look from "@/components/Look";
import Runaway from "./Runaway/page";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  const [hasSeenIntro, setHasSeenIntro] = useState(true);
  const contentRef = useRef(null);
  const logoRef = useRef(null);
  const logoNatRef = useRef(null);

  // Check sessionStorage on client-side mount
  useEffect(() => {
    const seenIntro = sessionStorage.getItem("hasSeenIntro");
    if (!seenIntro) {
      setHasSeenIntro(false);
    }
  }, []);

  // Loader completes and moves directly to main content after animations finish
  useEffect(() => {
    if (!hasSeenIntro) {
      // Wait for loader animations to complete (~5.5s — boxes fade in, lists cascade, boxes close)
      const timer = setTimeout(() => {
        setHasSeenIntro(true);
        sessionStorage.setItem("hasSeenIntro", "true");
      }, 5600);
      return () => clearTimeout(timer);
    }
  }, [hasSeenIntro]);

  // While the hero boxes zoom out, the next section stays pinned and cross-dissolves
  // in (blur -> sharp, transparent -> opaque) instead of scrolling up over the hero.
  useEffect(() => {
    if (!hasSeenIntro) return;
    const el = contentRef.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      // No intro animation — undo the render-time hiding so the section shows.
      el.style.opacity = "";
      return;
    }

    let raf = 0;
    let lastY = window.scrollY;
    let lastT = performance.now();
    let sp = 0; // smoothed intro progress — every animation reads from this
    let dim = 1; // smoothed idle-dim level for the search island

    // Skip redundant style writes: each frame only touches the DOM for values
    // that actually changed (compared against the last string we wrote). A
    // settled intro then costs zero layout/paint, and an animating one never
    // double-writes — this is the core of keeping the scroll buttery.
    const applied = new WeakMap();
    const setStyle = (node, prop, value) => {
      if (!node) return;
      let m = applied.get(node);
      if (!m) applied.set(node, (m = {}));
      if (m[prop] === value) return;
      m[prop] = value;
      node.style[prop] = value;
    };
    // Frame-rate-independent easing toward a target. With dt clamped by the
    // caller, a slow frame or a return from a background tab produces a
    // bounded catch-up step instead of a jump or a stutter — so 60Hz, 120Hz
    // and dropped frames all feel identical.
    const approach = (cur, target, tau, dt) =>
      cur + (target - cur) * (1 - Math.exp(-dt / tau));

    // Island idle dim: after 6s with no scrolling and no interaction on the
    // bar, it fades to 35% (never fully out); any activity brings it back.
    let lastActive = performance.now();
    const markActive = () => {
      lastActive = performance.now();
    };
    window.addEventListener("keydown", markActive);

    const titles = el.querySelector("[data-choose-titles]");
    const chooseRoot = el.querySelector("[data-choose-root]");
    // The Body "models" heading that docks next to the CANDOR logo on scroll.
    const dockTitle = document.querySelector("[data-dock-title]");
    // Rows marked data-fast (MODELS / CREATIVES) start smaller and scale up
    // faster than the rest, so the stack doesn't move as one block — they read
    // as coming from deeper and converge to the same size at the landing.
    const fastRows = titles
      ? Array.from(titles.querySelectorAll("[data-fast]"))
      : [];
    // Clear any per-row opacity/blur a previous build may have left inline, so
    // the whole stack fades in as one block (each row inherits the container's
    // opacity) with no leftover blur.
    if (titles)
      Array.from(titles.children).forEach((r) => {
        r.style.opacity = "";
        r.style.filter = "";
      });
    // Promote the fading section to its own compositor layer once (never
    // toggled — toggling would thrash layer creation), so the per-frame
    // opacity change composites cheaply instead of repainting.
    el.style.willChange = "opacity";
    el.style.filter = "";

    // The bottom bar only moves on resize — measure it once, not per frame.
    // Measured with its reveal transform stripped, since we slide it in/out.
    let barW = 252;
    let topGap = 40;
    let barFound = false;
    let barEl = null;
    const measureBar = () => {
      const bar = document.querySelector("[data-bottombar]");
      if (!bar) return;
      if (barEl !== bar) {
        bar.addEventListener("pointermove", markActive);
        bar.addEventListener("pointerdown", markActive);
      }
      barEl = bar;
      const prev = bar.style.transform;
      bar.style.transform = "none";
      const r = bar.getBoundingClientRect();
      bar.style.transform = prev;
      barW = r.width;
      topGap = window.innerHeight - r.bottom;
      barFound = true;
    };
    measureBar();
    // A resize invalidates the viewport-relative logo metrics and the bar
    // geometry; recompute them lazily on the next frame so a resize drag can't
    // thrash layout (many resize events coalesce into a single measure).
    const remeasure = () => {
      logoNatRef.current = null;
      barFound = false;
    };
    window.addEventListener("resize", remeasure);
    // Returning from a background tab: reset timing so the first frame back
    // can't see a huge dt or a stale idle timer.
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      lastT = performance.now();
      lastActive = performance.now();
    };
    document.addEventListener("visibilitychange", onVisible);

    const frame = () => {
      const vh = window.innerHeight;
      const H = vh; // release point (matches the intro track's 100vh spacer)
      const y = window.scrollY;
      if (!barFound) measureBar();

      // Clamp dt so a slow frame or a return from a background tab produces a
      // bounded catch-up step rather than a jump or a stutter.
      const now = performance.now();
      const dt = Math.min(100, Math.max(1, now - lastT));
      lastT = now;
      if (Math.abs(y - lastY) > 0.5) lastActive = now; // scrolling = activity
      lastY = y;

      // One shared smoothed progress across the whole 0..H intro. Everything
      // (logo, fade, title fly-in) reads from it, so nothing jumps on discrete
      // wheel steps and every animation lands together at the release point.
      const p = Math.min(1, Math.max(0, y / H));
      sp = approach(sp, p, 80, dt);
      if (Math.abs(p - sp) < 0.0006) sp = p;

      // --- CANDOR logo: sits still until 75% of the intro, then scales down and
      // rises to become the top header (width matches the bottom search+menu bar). ---
      const logo = logoRef.current;
      if (logo) {
        if (!logoNatRef.current) {
          const targetEl =
            logo.querySelector(".logo-text") || logo.firstElementChild;
          if (targetEl) {
            const prev = logo.style.transform;
            logo.style.transform = "none";
            const sr = targetEl.getBoundingClientRect();
            const wr = logo.getBoundingClientRect();
            logo.style.transform = prev;
            logoNatRef.current = {
              w: sr.width,
              h: sr.height,
              top: sr.top,
              wrapTop: wr.top,
            };
          }
        }
        const nat = logoNatRef.current;
        // Guard a not-yet-laid-out logo: a zero width would divide to Infinity
        // and blow the transform up. Skip until it measures cleanly.
        if (nat && nat.w > 0) {
          // Strong ease-out: shoots toward its header position as soon as
          // scrolling starts, but still lands together with everything else.
          const q = 1 - Math.pow(1 - sp, 3);
          // The upward rise uses a gentler (linear) curve so the wordmark
          // travels less per unit of scroll than the front-loaded ease-out
          // above — it still drifts up from the first scroll and lands in the
          // exact same docked spot at sp=1, just more slowly along the way.
          const qRise = sp;
          const targetScale = (barW / nat.w) * 0.55; // 55% of the bar width
          const S = 1 + (targetScale - 1) * q;
          const centeredTop = (vh - nat.h) / 2;
          const targetTop = centeredTop + (topGap - centeredTop) * qRise;
          const ty = targetTop - nat.wrapTop - (nat.top - nat.wrapTop) * S;

          // --- "models" docking: as the Body heading approaches the docked
          // CANDOR, it shrinks to the logo's height and slides right while
          // CANDOR eases left, meeting as one centered line: CANDOR models. ---
          let logoShiftX = 0;
          if (dockTitle) {
            // Natural (untransformed) rect; only strip when a transform is on.
            let dr;
            const curT = dockTitle.style.transform;
            if (curT && curT !== "none") {
              dockTitle.style.transform = "none";
              dr = dockTitle.getBoundingClientRect();
              dockTitle.style.transform = curT;
            } else {
              dr = dockTitle.getBoundingClientRect();
            }
            const startT = vh * 0.6; // docking begins (natural top hits here)
            const endT = Math.max(topGap + 8, vh * 0.08); // fully docked here
            const d = Math.min(
              1,
              Math.max(0, (startT - dr.top) / (startT - endT))
            );
            const de = d * d * (3 - 2 * d); // smoothstep
            if (de > 0 && dr.height > 0) {
              const candorW = nat.w * targetScale;
              const candorH = nat.h * targetScale;
              const gapPx = 14; // space between CANDOR and models
              const s = candorH / dr.height; // shrink to logo height
              const mW = dr.width * s;
              const shift = (mW + gapPx) / 2; // recenters the pair as one line
              logoShiftX = -shift * de;
              const candorCX = window.innerWidth / 2;
              const targetCX = candorCX - shift + candorW / 2 + gapPx + mW / 2;
              const targetCY = topGap + candorH / 2;
              const natCX = dr.left + dr.width / 2;
              const natCY = dr.top + dr.height / 2;
              const sc = 1 + (s - 1) * de;
              const dx = (targetCX - natCX) * de;
              const dy = (targetCY - natCY) * de;
              setStyle(
                dockTitle,
                "transform",
                `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${sc.toFixed(4)})`
              );
            } else {
              setStyle(dockTitle, "transform", "");
            }
          }

          if (Number.isFinite(ty) && Number.isFinite(S)) {
            setStyle(
              logo,
              "transform",
              `translate(${logoShiftX.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${S.toFixed(4)})`
            );
          }
        }
      }

      // Bottom search island: hidden at rest, fades straight in (no rise)
      // within the first ~6% of the intro, and fades straight back out on the
      // way up. No transform — a transformed ancestor would become the
      // containing block for the fixed search/menu overlays.
      if (barEl) {
        const bv = Math.min(1, sp / 0.06);
        // The open search panel locks body scroll — always counts as active,
        // so the panel (a DOM child of the bar) never dims mid-use.
        if (document.body.style.overflow === "hidden") lastActive = now;
        const dimTarget = now - lastActive > 6000 ? 0.35 : 1;
        dim = approach(dim, dimTarget, 260, dt);
        if (Math.abs(dimTarget - dim) < 0.002) dim = dimTarget;
        setStyle(barEl, "opacity", (bv * dim).toFixed(3));
        setStyle(barEl, "pointerEvents", bv > 0.5 ? "auto" : "none");
      }

      if (y >= H) {
        // Released — the sticky track lets go, normal flow from here. Land
        // every driven value on its resting state (deduped: written once).
        sp = 1; // stay consistent if the user scrolls back into the intro
        setStyle(el, "opacity", "");
        setStyle(el, "pointerEvents", "");
        setStyle(titles, "transform", "");
        setStyle(titles, "opacity", "");
        fastRows.forEach((r) => setStyle(r, "transform", ""));
        setStyle(chooseRoot, "filter", "");
        setStyle(chooseRoot, "backgroundColor", ""); // back to its bg-white class
        return;
      }

      if (p === 0 && sp < 0.005) {
        // Resting at the very top — fully hidden, titles parked far away.
        sp = 0;
        setStyle(el, "opacity", "0");
        setStyle(el, "pointerEvents", "none");
        setStyle(titles, "transform", "scale(0.3)");
        setStyle(titles, "opacity", "0");
        fastRows.forEach((r) => setStyle(r, "transform", ""));
        setStyle(chooseRoot, "filter", "");
        setStyle(chooseRoot, "backgroundColor", "rgba(255,255,255,0)");
        return;
      }

      // Reveal window (the whole intro): the sticky track holds the section at
      // the viewport top; this loop only drives opacity / zoom / blur.
      // Hover unlocks once the titles are ~85% in — early enough to feel
      // responsive, late enough that rows flying under a resting cursor
      // don't trigger the background-image reveal mid-flight.
      setStyle(el, "opacity", Math.pow(sp, 0.7).toFixed(3));
      setStyle(el, "pointerEvents", sp >= 0.85 ? "auto" : "none");
      if (chooseRoot) {
        // No white film while flying in: the section stays transparent over
        // the hero (only its content fades), and the white background floods
        // in over the last stretch as it lands. (No per-frame motion blur —
        // blurring the whole section every frame was the main stutter.)
        const landAlpha = Math.min(1, Math.max(0, (sp - 0.7) / 0.3));
        setStyle(
          chooseRoot,
          "backgroundColor",
          `rgba(255,255,255,${landAlpha.toFixed(3)})`
        );
        setStyle(chooseRoot, "filter", "none");
      }

      // The category titles fly in from depth: small (far away) at the start
      // of the reveal, decelerating to full size as the section lands.
      if (titles) {
        const arrive = 1 - Math.pow(1 - sp, 2);
        const base = 0.3 + 0.7 * arrive;
        setStyle(titles, "transform", `scale(${base.toFixed(4)})`);
        // Stay hidden while still deep in the zoom; fade in as one block once
        // the stack is around 55% of its final size so it never reads as a
        // tiny speck.
        setStyle(
          titles,
          "opacity",
          Math.min(1, Math.max(0, (arrive - 0.4) / 0.45)).toFixed(3)
        );
        // Fast rows start much deeper and cover more distance on the same
        // curve — visibly smaller than the rest for the whole flight, growing
        // faster, and converging to the same scale exactly at the landing.
        const fast = 0.1 + 0.9 * arrive;
        const fastTransform = `scale(${(fast / base).toFixed(4)})`;
        fastRows.forEach((r) => setStyle(r, "transform", fastTransform));
      }
    };

    // A single bad frame must never kill the loop — swallow any error and
    // always schedule the next one. This is what makes the intro unbreakable
    // no matter how hard the page is scrolled, resized or thrashed.
    const render = () => {
      try {
        frame();
      } catch (_) {
        // ignore this frame and keep going
      }
      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => {
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("keydown", markActive);
      document.removeEventListener("visibilitychange", onVisible);
      if (barEl) {
        barEl.removeEventListener("pointermove", markActive);
        barEl.removeEventListener("pointerdown", markActive);
      }
      if (dockTitle) dockTitle.style.transform = "";
      el.style.willChange = "";
      cancelAnimationFrame(raf);
    };
  }, [hasSeenIntro]);

  if (!hasSeenIntro) {
    return <Loader />;
  }

  return (
    <section className="relative">
      <Header />

      {/* Fixed hero: the field of boxes zooms out until it leaves the screen. */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <Hero2 />
      </div>

      {/* CANDOR logo overlay: big & centered, then shrinks and rises into the header. */}
      <div className="mix-blend-exclusion text-white fixed inset-0 z-30 pointer-events-none flex justify-center items-start">
        <div
          ref={logoRef}
          style={{ transformOrigin: "top center", willChange: "transform" }}
        >
          <BlackLogo />
        </div>
      </div>

      {/* Intro track: Choose rides position:sticky at the viewport top for
          100vh of scroll (matches H in the effect). The browser pins it
          natively — no per-frame transform, so it can't drift or jitter —
          then it releases into normal flow at the end of the track. The
          spacer must be real content (not padding): sticky elements can only
          travel within the containing block's content box. */}
      <div className="relative z-10">
        {/* Starts hidden so it can't flash before the intro effect's first
            frame; the effect (or its reduced-motion branch) takes over. */}
        <div ref={contentRef} className="sticky top-0" style={{ opacity: 0 }}>
          <Choose />
        </div>
        {/* 100vh of intro travel + 50vh of hold after the titles land, so the
            section doesn't start scrolling away the moment it arrives. */}
        <div className="h-[150vh]" aria-hidden="true" />
      </div>

      {/* Rest of the page scrolls in normally right after the release point. */}
      <div className="relative z-10 bg-white">
        <Look />
        <Body />

        <News />

        <Showcase2 />
        <Footer />
      </div>
    </section>
  );
}

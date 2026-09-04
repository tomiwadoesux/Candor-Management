"use client";

import React, { useState, useEffect, useRef } from "react";
import SphereFooter from "../components/SphereFooter";
import Header from "../components/header";
import Hero2 from "../components/Hero2";
import LogoAnimation from "../components/LogoAnimation";
import Loader from "../components/loader.jsx";
import Body from "../components/body";
// The showreel is the /video player, placed inline — same component, same
// data/films.js, so the section and the film page can never drift apart.
// Showcase2 is still on disk if this needs to go back.
import FilmPlayer from "../components/FilmPlayer";
import { films } from "../../data/films";
import "../styles/film-player.css";
import Choose from "../components/Choose";
import Look from "@/components/Look";
import SectionSnap from "../components/SectionSnap";

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
    let barRO = null;
    // The closing sphere section and the menu inside its chrome. Both arrive
    // late (the section mounts its scene on approach), so they're looked up
    // each frame until they exist and cached from then on.
    let sphereEl = null;
    let sphereMenuEl = null;
    const measureBar = () => {
      const bar = document.querySelector("[data-bottombar]");
      if (!bar) return;
      if (barEl !== bar) {
        bar.addEventListener("pointermove", markActive);
        bar.addEventListener("pointerdown", markActive);
        // The bar's content (Search / InNav) is lazy-loaded, so its width can
        // grow after first paint — re-measure whenever its box size changes so
        // the CANDOR dock keeps matching the bar width. (Transforms don't
        // affect box size, so our own transform toggling won't retrigger it.)
        if (typeof ResizeObserver !== "undefined") {
          barRO = new ResizeObserver(() => {
            barFound = false;
          });
          barRO.observe(bar);
        }
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
    // The wordmark uses a custom font that loads after first paint. If the logo
    // was measured with the fallback font, its width (and thus the docked scale,
    // the docked position, and the models pin line derived from it) is wrong.
    // Re-measure once the real fonts are ready so the numbers are always exact.
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(remeasure).catch(() => {});
    }
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
      const H = vh; // intro completion point (titles fully landed)
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
          const targetScale = (barW / nat.w) * 0.62; // 62% of the bar width
          const S = 1 + (targetScale - 1) * q;
          const centeredTop = (vh - nat.h) / 2;
          const targetTop = centeredTop + (topGap - centeredTop) * qRise;
          const ty = targetTop - nat.wrapTop - (nat.top - nat.wrapTop) * S;

          // --- "models" docking: as the Body heading approaches the docked
          // CANDOR, it shrinks to the logo's height and slides right while
          // CANDOR eases left, meeting as one centered line: CANDOR models. ---
          let logoShiftX = 0;
          if (dockTitle) {
            const sticky = dockTitle.closest("[data-dock-sticky]");
            // Natural (untransformed) size of the heading — strip the transform
            // to read it, then restore.
            let dr;
            const curT = dockTitle.style.transform;
            if (curT && curT !== "none") {
              dockTitle.style.transform = "none";
              dr = dockTitle.getBoundingClientRect();
              dockTitle.style.transform = curT;
            } else {
              dr = dockTitle.getBoundingClientRect();
            }
            if (sticky && dr.height > 0) {
              const candorW = nat.w * targetScale;
              const candorH = nat.h * targetScale;
              const gapPx = 14; // space between CANDOR and models
              // CANDOR and models share the same font & size, so tie models'
              // scale directly to CANDOR's (robust — no reliance on the two
              // line-boxes measuring identically). 0.95 keeps models just a
              // hair smaller so CANDOR still reads as the lead wordmark.
              const s = targetScale * 0.95;
              const mW = dr.width * s; // docked width
              const mH = dr.height * s; // docked height
              const shift = (mW + gapPx) / 2; // recenters the pair as one line

              // Pin line: set the wrapper's sticky `top` so the heading's docked
              // box centres on CANDOR's centre. The browser holds this natively
              // (position: sticky) and releases it at the section's end, so the
              // steady pinned state has NO per-frame vertical transform chasing
              // the scroll — it can't jitter.
              const dockTop = topGap + candorH / 2 - mH / 2;
              setStyle(sticky, "top", `${dockTop.toFixed(2)}px`);

              // Dock-in progress from how close the sticky row is to its pin
              // line; it reaches (and holds) 1 once stuck.
              const wr = sticky.getBoundingClientRect();
              const startTop = vh * 0.6;
              const d = Math.min(
                1,
                Math.max(0, (startTop - wr.top) / (startTop - dockTop))
              );
              const de = d * d * (3 - 2 * d); // smoothstep

              // Release: once the section scrolls the stuck row back up past its
              // pin line (section ending), ease CANDOR back to centre. models
              // itself rides up natively with the sticky release.
              const relSpan = candorH * 2.5;
              const r = Math.min(1, Math.max(0, (dockTop - wr.top) / relSpan));
              const rel = r * r * (3 - 2 * r); // smoothstep

              // "pin" = how present models is beside CANDOR: grows as it docks,
              // fades as it releases, so CANDOR and models track each other
              // horizontally and un-form cleanly.
              const pin = de * (1 - rel);
              logoShiftX = -shift * pin;
              const candorCX = window.innerWidth / 2;
              const candorCXNow = candorCX - shift * pin;
              const targetCX = candorCXNow + candorW / 2 + gapPx + mW / 2;

              // Horizontal slide + scale only — vertical is native sticky. The
              // heading is flex-centred and scales about its top-centre, so its
              // centre stays at candorCX; translate it to sit beside CANDOR.
              const sc = 1 + (s - 1) * de;
              const dx = (targetCX - candorCX) * de;
              setStyle(
                dockTitle,
                "transform",
                `translate(${dx.toFixed(2)}px, 0px) scale(${sc.toFixed(4)})`
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

      // --- Chrome handover to the closing sphere. The page ends on the
      // sphere board, which carries its own chrome, so as that section rises
      // into view the bottom search island scales away and the menu scales in
      // at the sphere's top-right corner. Both sides read this one progress,
      // so the two can never be present at once or arrive out of step. ---
      let gate = 0;
      if (!sphereEl) sphereEl = document.querySelector("[data-sphere-footer]");
      if (sphereEl) {
        // 0 as the section's first sliver appears, 1 once it covers 60% of
        // the screen — well before it's the only thing on it.
        const gp = Math.min(
          1,
          Math.max(0, (vh - sphereEl.getBoundingClientRect().top) / (vh * 0.6))
        );
        gate = gp * gp * (3 - 2 * gp); // smoothstep
      }
      if (!sphereMenuEl)
        sphereMenuEl = document.querySelector("[data-sphere-menu]");
      if (sphereMenuEl) {
        setStyle(sphereMenuEl, "opacity", gate.toFixed(3));
        setStyle(
          sphereMenuEl,
          "transform",
          gate > 0.999 ? "" : `scale(${(0.7 + 0.3 * gate).toFixed(4)})`
        );
        setStyle(sphereMenuEl, "pointerEvents", gate > 0.5 ? "auto" : "none");
      }

      // Bottom search island: hidden at rest, fades straight in (no rise)
      // within the first ~6% of the intro, and fades straight back out on the
      // way up — then scales out for good once the sphere takes the chrome.
      if (barEl) {
        const bv = Math.min(1, sp / 0.06);
        // The open search panel locks body scroll — always counts as active,
        // so the panel (a DOM child of the bar) never dims mid-use.
        if (document.body.style.overflow === "hidden") lastActive = now;
        const dimTarget = now - lastActive > 6000 ? 0.35 : 1;
        dim = approach(dim, dimTarget, 260, dt);
        if (Math.abs(dimTarget - dim) < 0.002) dim = dimTarget;
        setStyle(barEl, "opacity", (bv * dim * (1 - gate)).toFixed(3));
        setStyle(
          barEl,
          "pointerEvents",
          bv > 0.5 && gate < 0.5 ? "auto" : "none"
        );
        // Scaled ONLY while it is actually leaving. At rest the bar must carry
        // no transform, or it becomes the containing block for the fixed
        // search panel that lives inside it. (measureBar strips the transform
        // before reading the width, so the docked logo stays sized to the bar.)
        setStyle(
          barEl,
          "transform",
          gate > 0.001 ? `scale(${(1 - 0.3 * gate).toFixed(4)})` : ""
        );
      }

      if (y >= H) {
        // Intro done — titles have landed. Choose now rests pinned while the
        // rest of the page reveals up over it. Land every driven value on its
        // resting state (deduped: written once).
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
        // Fade in as one block early in the flight (once the stack is ~44% of
        // its final size) so the ALL / TALENT / MODELS / CREATIVES column shows
        // sooner, while still deep enough that it never reads as a tiny speck.
        setStyle(
          titles,
          "opacity",
          Math.min(1, Math.max(0, (arrive - 0.2) / 0.45)).toFixed(3)
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
        barEl.style.transform = "";
      }
      if (barRO) barRO.disconnect();
      if (dockTitle) {
        dockTitle.style.transform = "";
        dockTitle.style.fontStyle = "";
      }
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

      {/* CANDOR logo overlay: the animated wordmark (® loops out and back),
          big & centered, then shrinks and rises into the header. */}
      <div className="mix-blend-exclusion text-white fixed inset-0 z-30 pointer-events-none flex justify-center items-start">
        <div
          ref={logoRef}
          style={{ transformOrigin: "top center", willChange: "transform" }}
        >
          <LogoAnimation className="w-[260px] md:w-[420px] lg:w-[560px]" />
        </div>
      </div>

      {/* Intro + pinned reveal: Choose rides position:sticky at the viewport
          top and then STAYS pinned — it never scrolls away. Everything after it
          (Look, Body, …) lives in the SAME containing block with a higher paint
          order and an opaque background, so it scrolls UP from the bottom and
          reveals over the still-pinned Choose. The browser pins Choose natively
          (no per-frame transform), so it can't drift or jitter. */}
      <div className="relative z-10">
        {/* Starts hidden so it can't flash before the intro effect's first
            frame; the effect (or its reduced-motion branch) takes over. */}
        <div ref={contentRef} className="sticky top-0" style={{ opacity: 0 }}>
          <Choose />
        </div>
        {/* 100vh of intro travel + 50vh hold after the titles land, before the
            next section begins sliding up over Choose. Transparent (no
            background) so the fixed hero shows through while the titles land.
            Real content, not padding: a sticky element can only travel within
            its containing block's content box. */}
        <div className="h-[150vh]" aria-hidden="true" />

        {/* The rest of the page. Higher z-index + opaque background, so from
            ~150vh it scrolls UP over the pinned Choose instead of pushing it
            away. data-snap-container marks its children as SectionSnap targets. */}
        <div className="relative z-10 bg-white" data-snap-container>
          <Look />
          <Body />
          <section className="pt-14 md:pt-28 lg:pt-20">
            <div className="px-4">
              <FilmPlayer films={films} inline />
            </div>
          </section>
          <SphereFooter />
        </div>
      </div>

      {/* Observer-driven section snapping (post-intro only). */}
      {/* Temporarily disabled — smooth snap scroll commented out for now. */}
      {/* <SectionSnap /> */}
    </section>
  );
}

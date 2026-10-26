"use client";

import useLogoDock from "../hooks/useLogoDock";
import SphereFooter from "../components/SphereFooter";
import Header from "../components/header";
import Hero2, { NUMBER_CARDS } from "../components/Hero2";
import LogoAnimation from "../components/LogoAnimation";
import Body from "../components/body";
// The showreel is the /video player, placed inline — same component, same
// data/films.js, so the section and the film page can never drift apart.
// Showcase2 is still on disk if this needs to go back.
import FilmPlayer from "../components/FilmPlayer";
import JoinCandor from "../components/JoinCandor";
import { films } from "../../data/films";
import "../styles/film-player.css";
import Choose from "../components/Choose";
import Look from "@/components/Look";
import SectionSnap from "../components/SectionSnap";
// The intro. Same component /hero3 uses, so the two pages cannot drift apart.
import CandorLine, { CandorFloatingLogo, SEEN_KEY } from "./hero3/CandorLine";

export default function Home() {
  // Used only by the commented-out hero intro below.
  // const contentRef = useRef(null);
  // const logoRef = useRef(null);
  // const logoNatRef = useRef(null);

  useLogoDock();

  // ---------------------------------------------------------------------------
  // THE OLD HERO INTRO, kept for reference.
  //
  // This drove the previous landing sequence: the Hero2 field of boxes zooming
  // out, the big CANDOR wordmark shrinking and rising into the header, and
  // Choose cross-dissolving in behind it. All of it is replaced by the hero3
  // intro (CandorLine) below, which is self-contained and needs no scroll
  // listener at all.
  //
  // Left commented rather than deleted so the old sequence can be brought back
  // without going through git. The three refs it used (contentRef, logoRef,
  // logoNatRef) are commented out with it.
  // ---------------------------------------------------------------------------
  //   // While the hero boxes zoom out, the next section stays pinned and cross-dissolves
  //   // in (blur -> sharp, transparent -> opaque) instead of scrolling up over the hero.
  //   useEffect(() => {
  //     const el = contentRef.current;
  //     if (!el) return;
  //
  //     const prefersReduced = window.matchMedia(
  //       "(prefers-reduced-motion: reduce)"
  //     ).matches;
  //     if (prefersReduced) {
  //       // No intro animation — undo the render-time hiding so the section shows.
  //       el.style.opacity = "";
  //       return;
  //     }
  //
  //     let raf = 0;
  //     let lastY = window.scrollY;
  //     let lastT = performance.now();
  //     let sp = 0; // smoothed intro progress — every animation reads from this
  //     let dim = 1; // smoothed idle-dim level for the search island
  //
  //     // Skip redundant style writes: each frame only touches the DOM for values
  //     // that actually changed (compared against the last string we wrote). A
  //     // settled intro then costs zero layout/paint, and an animating one never
  //     // double-writes — this is the core of keeping the scroll buttery.
  //     const applied = new WeakMap();
  //     const setStyle = (node, prop, value) => {
  //       if (!node) return;
  //       let m = applied.get(node);
  //       if (!m) applied.set(node, (m = {}));
  //       if (m[prop] === value) return;
  //       m[prop] = value;
  //       node.style[prop] = value;
  //     };
  //     // Frame-rate-independent easing toward a target. With dt clamped by the
  //     // caller, a slow frame or a return from a background tab produces a
  //     // bounded catch-up step instead of a jump or a stutter — so 60Hz, 120Hz
  //     // and dropped frames all feel identical.
  //     const approach = (cur, target, tau, dt) =>
  //       cur + (target - cur) * (1 - Math.exp(-dt / tau));
  //
  //     // Island idle dim: after 6s with no scrolling and no interaction on the
  //     // bar, it fades to 35% (never fully out); any activity brings it back.
  //     let lastActive = performance.now();
  //     const markActive = () => {
  //       lastActive = performance.now();
  //     };
  //     window.addEventListener("keydown", markActive);
  //
  //     const titles = el.querySelector("[data-choose-titles]");
  //     const chooseRoot = el.querySelector("[data-choose-root]");
  //     // The two board cards, their photo frames, their labels, and the flanking
  //     // detail columns — each driven separately by the intro below.
  //     const cardEls = Array.from(el.querySelectorAll("[data-board-card]"));
  //     const labelEls = Array.from(el.querySelectorAll("[data-board-label]"));
  //     const detailEls = Array.from(el.querySelectorAll("[data-choose-detail]"));
  //     // The Body "models" heading that docks next to the CANDOR logo on scroll.
  //     const dockTitle = document.querySelector("[data-dock-title]");
  //     // Rows marked data-fast (MODELS / CREATIVES) start smaller and scale up
  //     // faster than the rest, so the stack doesn't move as one block — they read
  //     // as coming from deeper and converge to the same size at the landing.
  //     const fastRows = titles
  //       ? Array.from(titles.querySelectorAll("[data-fast]"))
  //       : [];
  //     // Clear any per-row opacity/blur a previous build may have left inline, so
  //     // the whole stack fades in as one block (each row inherits the container's
  //     // opacity) with no leftover blur.
  //     if (titles)
  //       Array.from(titles.children).forEach((r) => {
  //         r.style.opacity = "";
  //         r.style.filter = "";
  //       });
  //     // Promote the fading section to its own compositor layer once (never
  //     // toggled — toggling would thrash layer creation), so the per-frame
  //     // opacity change composites cheaply instead of repainting.
  //     el.style.willChange = "opacity";
  //     el.style.filter = "";
  //     // Each card's resting photo box. Choose is pinned for the whole intro, so
  //     // these boxes never move on screen — measured once here and again only on
  //     // resize, never per frame (a per-frame measure with the transform stripped
  //     // first forced a full layout every frame).
  //     let restBoxes = [];
  //     const measureRest = () => {
  //       restBoxes = cardEls.map((card) => {
  //         const frame = card.querySelector("[data-board-frame]");
  //         if (!frame) return null;
  //         // Strip BOTH the card's flight transform and the frame's driven size
  //         // before measuring — a resize mid-flight would otherwise record the
  //         // frame's current in-flight box as its resting box and the cards would
  //         // land on the wrong shape.
  //         const prevT = card.style.transform;
  //         const prevW = frame.style.width;
  //         const prevH = frame.style.height;
  //         const prevA = frame.style.aspectRatio;
  //         card.style.transform = "none";
  //         frame.style.width = "";
  //         frame.style.height = "";
  //         // Back to the frame's own 2:3 rule (an inline style from Choose, so
  //         // blanking it leaves NO ratio at all and the box measures zero-height).
  //         frame.style.aspectRatio = "2 / 3";
  //         const r = frame.getBoundingClientRect();
  //         card.style.transform = prevT;
  //         frame.style.width = prevW;
  //         frame.style.height = prevH;
  //         frame.style.aspectRatio = prevA;
  //         return r.width === 0 ? null : r;
  //       });
  //     };
  //     measureRest();
  //
  //     // Puts both board cards at an eased position between their hero slot and
  //     // their resting slot. e = 0 sits a card exactly on its hero card; e = 1
  //     // sits it on its own layout position. Shared by the at-rest branch (which
  //     // returns early and still has to park the cards on the hero slots) and by
  //     // the flight below, so the two can never drift apart.
  //     const placeCards = (e) => {
  //       // While the field is being laid out by number, the two board cards do
  //       // not fly: they sit locked on their hero slot (e = 0) for the whole
  //       // intro, so every grey box keeps its position and nothing travels
  //       // across the layout being edited.
  //       if (NUMBER_CARDS) e = 0;
  //       cardEls.forEach((card, idx) => {
  //         const frame = card.querySelector("[data-board-frame]");
  //         if (!frame) return;
  //
  //         // Resting box from the cache (see measureRest). If the first measure
  //         // ran before layout settled, try once more here.
  //         let rest = restBoxes[idx];
  //         if (!rest) {
  //           measureRest();
  //           rest = restBoxes[idx];
  //           if (!rest) return;
  //         }
  //
  //         // Start box = wherever the hero card that this card REPLACES actually
  //         // is on screen right now — zoom, pan, magnet drift and all. Measured
  //         // every frame, so the card stays locked to that slot while the field
  //         // is still moving underneath it.
  //         let startCX = rest.left + rest.width / 2;
  //         let startCY = rest.top + rest.height / 2;
  //         let startW = rest.width;
  //         let startH = rest.height;
  //         const src = document.querySelector(`[data-board-src="${idx}"]`);
  //         if (src) {
  //           const b = src.getBoundingClientRect();
  //           if (b.width > 0) {
  //             // POSITION comes from the live rect (so the card tracks the slot
  //             // as the field pans), but SIZE comes from the card's own layout
  //             // box. The rect is inflated by the field's zoom, which climbs to
  //             // 7x — feeding that in stretched the frame into a wide flat bar.
  //             startCX = b.left + b.width / 2;
  //             startCY = b.top + b.height / 2;
  //             startW = src.offsetWidth || b.width;
  //             startH = src.offsetHeight || b.height;
  //           }
  //         }
  //
  //         if (e >= 1) {
  //           // Home: every driven value cleared, so the card sits on its natural
  //           // layout box with no leftover transform or inline size.
  //           setStyle(card, "transform", "");
  //           setStyle(card, "transformOrigin", "");
  //           setStyle(frame, "width", "");
  //           setStyle(frame, "height", "");
  //           setStyle(frame, "aspectRatio", "2 / 3");
  //           const m = frame.querySelector("[data-board-media]");
  //           if (m) setStyle(m, "transform", "");
  //           return;
  //         }
  //
  //         // The frame RESHAPES rather than being scaled: its real width and
  //         // height are animated, so the box changes proportion while every pixel
  //         // inside it keeps its own. A transform: scale() on the frame would
  //         // stretch its contents with it — the photograph included — and no
  //         // counter-scale on the image can truly undo that, it only trades
  //         // squashing for cropping. Driving the actual box means object-cover
  //         // re-crops each frame against the new shape, which is exactly the
  //         // behaviour wanted: the card morphs, the image never does.
  //         const w = startW + (rest.width - startW) * e;
  //         const h = startH + (rest.height - startH) * e;
  //         setStyle(frame, "width", `${w.toFixed(1)}px`);
  //         setStyle(frame, "height", `${h.toFixed(1)}px`);
  //         // The frame's resting size comes from an aspect-ratio rule; that must
  //         // be off while an explicit height is driving the box, or the two fight.
  //         setStyle(frame, "aspectRatio", "auto");
  //         // Nothing counter-scales the photography any more — there is no
  //         // distortion left to cancel.
  //         const media = frame.querySelector("[data-board-media]");
  //         if (media) setStyle(media, "transform", "");
  //
  //         // Position with a TRANSLATE ONLY — no scale, so nothing in the card
  //         // (photograph, label, veil) is ever stretched. The frame has already
  //         // taken the new size above, and because it is centred in the card
  //         // (mx-auto) the card's own box tracks it, so translating the card by
  //         // the difference between the two centres lands the frame exactly on
  //         // the target. Measured from the frame's live box rather than computed,
  //         // so the label underneath follows without a second calculation.
  //         const cx = startCX + (rest.left + rest.width / 2 - startCX) * e;
  //         const cy = startCY + (rest.top + rest.height / 2 - startCY) * e;
  //         const prevT = card.style.transform;
  //         card.style.transform = "none";
  //         const now = frame.getBoundingClientRect();
  //         card.style.transform = prevT;
  //         const dx = cx - (now.left + now.width / 2);
  //         const dy = cy - (now.top + now.height / 2);
  //         setStyle(card, "transformOrigin", "center center");
  //         setStyle(
  //           card,
  //           "transform",
  //           `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`
  //         );
  //       });
  //     };
  //
  //     // The bottom bar only moves on resize — measure it once, not per frame.
  //     // Measured with its reveal transform stripped, since we slide it in/out.
  //     let barW = 252;
  //     let topGap = 40;
  //     let barFound = false;
  //     let barEl = null;
  //     let barRO = null;
  //     // The closing sphere section and the menu inside its chrome. Both arrive
  //     // late (the section mounts its scene on approach), so they're looked up
  //     // each frame until they exist and cached from then on.
  //     let sphereEl = null;
  //     let sphereMenuEl = null;
  //     // The section that scrolls up over the pinned Choose. The search island is
  //     // gated on THIS rather than on the intro progress: the intro finishes
  //     // (sp = 1) while Choose is still pinned and being read, so keying the bar
  //     // to sp alone brought it back on screen over the section.
  //     let lookEl = null;
  //     const measureBar = () => {
  //       const bar = document.querySelector("[data-bottombar]");
  //       if (!bar) return;
  //       if (barEl !== bar) {
  //         bar.addEventListener("pointermove", markActive);
  //         bar.addEventListener("pointerdown", markActive);
  //         // The bar's content (Search / InNav) is lazy-loaded, so its width can
  //         // grow after first paint — re-measure whenever its box size changes so
  //         // the CANDOR dock keeps matching the bar width. (Transforms don't
  //         // affect box size, so our own transform toggling won't retrigger it.)
  //         if (typeof ResizeObserver !== "undefined") {
  //           barRO = new ResizeObserver(() => {
  //             barFound = false;
  //           });
  //           barRO.observe(bar);
  //         }
  //       }
  //       barEl = bar;
  //       const prev = bar.style.transform;
  //       bar.style.transform = "none";
  //       const r = bar.getBoundingClientRect();
  //       bar.style.transform = prev;
  //       // Search and InNav are dynamic({ssr:false}), so at first paint this bar
  //       // is an EMPTY div: width 0, and its bottom edge collapsed up to its top.
  //       // Committing that would set barW to 0 (docked scale 0) and topGap to
  //       // nearly the full viewport height — which makes the intro drive the
  //       // wordmark DOWN the screen instead of up into the header. Keep the
  //       // sensible defaults until the bar has real content; the ResizeObserver
  //       // above re-runs this the moment the lazy chunks land.
  //       if (r.width < 1) return;
  //       barW = r.width;
  //       topGap = window.innerHeight - r.bottom;
  //       barFound = true;
  //     };
  //     measureBar();
  //     // A resize invalidates the viewport-relative logo metrics and the bar
  //     // geometry; recompute them lazily on the next frame so a resize drag can't
  //     // thrash layout (many resize events coalesce into a single measure).
  //     const remeasure = () => {
  //       logoNatRef.current = null;
  //       barFound = false;
  //     };
  //     window.addEventListener("resize", remeasure);
  //     window.addEventListener("resize", measureRest);
  //     // The wordmark uses a custom font that loads after first paint. If the logo
  //     // was measured with the fallback font, its width (and thus the docked scale,
  //     // the docked position, and the models pin line derived from it) is wrong.
  //     // Re-measure once the real fonts are ready so the numbers are always exact.
  //     if (typeof document !== "undefined" && document.fonts) {
  //       document.fonts.ready.then(remeasure).catch(() => {});
  //     }
  //     // Returning from a background tab: reset timing so the first frame back
  //     // can't see a huge dt or a stale idle timer.
  //     const onVisible = () => {
  //       if (document.visibilityState !== "visible") return;
  //       lastT = performance.now();
  //       lastActive = performance.now();
  //     };
  //     document.addEventListener("visibilitychange", onVisible);
  //
  //     const frame = () => {
  //       const vh = window.innerHeight;
  //       const vw = window.innerWidth;
  //       const H = vh; // intro completion point (titles fully landed)
  //       const y = window.scrollY;
  //       if (!barFound) measureBar();
  //
  //       // Clamp dt so a slow frame or a return from a background tab produces a
  //       // bounded catch-up step rather than a jump or a stutter.
  //       const now = performance.now();
  //       const dt = Math.min(100, Math.max(1, now - lastT));
  //       lastT = now;
  //       if (Math.abs(y - lastY) > 0.5) lastActive = now; // scrolling = activity
  //       lastY = y;
  //
  //       // One shared smoothed progress across the whole 0..H intro. Everything
  //       // (logo, fade, title fly-in) reads from it, so nothing jumps on discrete
  //       // wheel steps and every animation lands together at the release point.
  //       const p = Math.min(1, Math.max(0, y / H));
  //       sp = approach(sp, p, 80, dt);
  //       if (Math.abs(p - sp) < 0.0006) sp = p;
  //
  //       // --- CANDOR logo: sits still until 75% of the intro, then scales down and
  //       // rises to become the top header (width matches the bottom search+menu bar). ---
  //       const logo = logoRef.current;
  //       if (logo) {
  //         if (!logoNatRef.current) {
  //           const targetEl =
  //             logo.querySelector(".logo-text") || logo.firstElementChild;
  //           // Only cache a measurement once the SVG has actually laid out. A
  //           // zero-size read here would otherwise be cached forever and the
  //           // wordmark would sit at the wrong height for the whole session.
  //           if (targetEl && targetEl.getBoundingClientRect().height > 0) {
  //             const prev = logo.style.transform;
  //             logo.style.transform = "none";
  //             // Force a synchronous reflow so the reads below see the
  //             // untransformed layout rather than a cached pre-clear rect.
  //             void logo.offsetHeight;
  //             const sr = targetEl.getBoundingClientRect();
  //             const wr = logo.getBoundingClientRect();
  //             // Restore immediately. Leaving the wrapper at "none" would park
  //             // the wordmark at its untransformed position until the next frame
  //             // recomputed it — which is exactly the jump you see when a late
  //             // re-measure (fonts landing, a resize) lands mid-scroll.
  //             logo.style.transform = prev;
  //             // The wordmark is an SVG whose viewBox (0 0 206 80) carries ~21
  //             // units of empty space above the letters and ~20 below. Centering
  //             // that BOX leaves the ink itself sitting low. Read the real ink
  //             // box with getBBox() and convert it to screen px, so what gets
  //             // centred is the letters — not the padding around them.
  //             let inkTop = sr.top;
  //             let inkH = sr.height;
  //             let inkW = sr.width;
  //             if (typeof targetEl.getBBox === "function" && targetEl.viewBox) {
  //               try {
  //                 const vb = targetEl.viewBox.baseVal;
  //                 // Measure ONLY the wordmark glyphs (#Vector) — never the whole
  //                 // SVG. #to1/#to2 are the ®'s motion paths and run far outside
  //                 // the letters, so a full-SVG getBBox() would report a box
  //                 // roughly twice as tall as the ink and centre it wrongly.
  //                 const glyphEl = targetEl.querySelector("#Vector") || targetEl;
  //                 const bb = glyphEl.getBBox();
  //                 if (vb && vb.width > 0 && vb.height > 0 && bb.height > 0) {
  //                   const kx = sr.width / vb.width;
  //                   const ky = sr.height / vb.height;
  //                   inkTop = sr.top + (bb.y - vb.y) * ky;
  //                   inkH = bb.height * ky;
  //                   inkW = bb.width * kx;
  //                 }
  //               } catch (_) {
  //                 // getBBox throws on a not-yet-rendered SVG — keep the box
  //                 // values for this frame; the next frame re-measures.
  //               }
  //             }
  //             logoNatRef.current = {
  //               w: inkW,
  //               h: inkH,
  //               top: inkTop,
  //               wrapTop: wr.top,
  //             };
  //           }
  //         }
  //         const nat = logoNatRef.current;
  //         // Guard a not-yet-laid-out logo: a zero width would divide to Infinity
  //         // and blow the transform up. Skip until it measures cleanly.
  //         if (nat && nat.w > 0) {
  //           // IN SYNC WITH THE HERO FIELD. The cards hold their size early and
  //           // accelerate away late (Hero2 drives them on sp^2.4), so a
  //           // front-loaded ease-out here made the wordmark shoot off while the
  //           // boxes were still sitting still — at 20% scroll the logo was
  //           // already 49% docked against 2% for the cards. Both now share the
  //           // same held-back shape, so the logo starts moving WHEN the boxes do
  //           // and they travel together.
  //           const move = Math.pow(sp, 2.0);
  //           // Scale trails the rise slightly (a touch softer curve) so the
  //           // wordmark reads as receding rather than simply shrinking in place,
  //           // but both still land exactly at sp = 1.
  //           const q = Math.pow(sp, 1.7);
  //           const qRise = move;
  //           const targetScale = (barW / nat.w) * 0.62; // 62% of the bar width
  //           const S = 1 + (targetScale - 1) * q;
  //           // targetTop is where the INK's top edge should land. The wrapper is
  //           // what we actually transform, and it scales about "top center", so
  //           // the ink sits (nat.top - nat.wrapTop) * S below the wrapper's top
  //           // once scaled — solve for the wrapper translation that puts the ink
  //           // exactly on targetTop.
  //           const centeredTop = (vh - nat.h) / 2;
  //           const targetTop = centeredTop + (topGap - centeredTop) * qRise;
  //           const ty = targetTop - nat.wrapTop - (nat.top - nat.wrapTop) * S;
  //
  //           // --- "models" docking: as the Body heading approaches the docked
  //           // CANDOR, it shrinks to the logo's height and slides right while
  //           // CANDOR eases left, meeting as one centered line: CANDOR models. ---
  //           let logoShiftX = 0;
  //           if (dockTitle) {
  //             const sticky = dockTitle.closest("[data-dock-sticky]");
  //             // Natural (untransformed) size of the heading — strip the transform
  //             // to read it, then restore.
  //             let dr;
  //             const curT = dockTitle.style.transform;
  //             if (curT && curT !== "none") {
  //               dockTitle.style.transform = "none";
  //               dr = dockTitle.getBoundingClientRect();
  //               dockTitle.style.transform = curT;
  //             } else {
  //               dr = dockTitle.getBoundingClientRect();
  //             }
  //             if (sticky && dr.height > 0) {
  //               const candorW = nat.w * targetScale;
  //               const candorH = nat.h * targetScale;
  //               const gapPx = 14; // space between CANDOR and models
  //               // CANDOR and models share the same font & size, so tie models'
  //               // scale directly to CANDOR's (robust — no reliance on the two
  //               // line-boxes measuring identically). 0.95 keeps models just a
  //               // hair smaller so CANDOR still reads as the lead wordmark.
  //               const s = targetScale * 0.95;
  //               const mW = dr.width * s; // docked width
  //               const mH = dr.height * s; // docked height
  //               const shift = (mW + gapPx) / 2; // recenters the pair as one line
  //
  //               // Pin line: set the wrapper's sticky `top` so the heading's docked
  //               // box centres on CANDOR's centre. The browser holds this natively
  //               // (position: sticky) and releases it at the section's end, so the
  //               // steady pinned state has NO per-frame vertical transform chasing
  //               // the scroll — it can't jitter.
  //               const dockTop = topGap + candorH / 2 - mH / 2;
  //               setStyle(sticky, "top", `${dockTop.toFixed(2)}px`);
  //
  //               // Dock-in progress from how close the sticky row is to its pin
  //               // line; it reaches (and holds) 1 once stuck.
  //               const wr = sticky.getBoundingClientRect();
  //               const startTop = vh * 0.6;
  //               const d = Math.min(
  //                 1,
  //                 Math.max(0, (startTop - wr.top) / (startTop - dockTop))
  //               );
  //               const de = d * d * (3 - 2 * d); // smoothstep
  //
  //               // Release: once the section scrolls the stuck row back up past its
  //               // pin line (section ending), ease CANDOR back to centre. models
  //               // itself rides up natively with the sticky release.
  //               const relSpan = candorH * 2.5;
  //               const r = Math.min(1, Math.max(0, (dockTop - wr.top) / relSpan));
  //               const rel = r * r * (3 - 2 * r); // smoothstep
  //
  //               // "pin" = how present models is beside CANDOR: grows as it docks,
  //               // fades as it releases, so CANDOR and models track each other
  //               // horizontally and un-form cleanly.
  //               const pin = de * (1 - rel);
  //               logoShiftX = -shift * pin;
  //               const candorCX = window.innerWidth / 2;
  //               const candorCXNow = candorCX - shift * pin;
  //               const targetCX = candorCXNow + candorW / 2 + gapPx + mW / 2;
  //
  //               // Horizontal slide + scale only — vertical is native sticky. The
  //               // heading is flex-centred and scales about its top-centre, so its
  //               // centre stays at candorCX; translate it to sit beside CANDOR.
  //               const sc = 1 + (s - 1) * de;
  //               const dx = (targetCX - candorCX) * de;
  //               setStyle(
  //                 dockTitle,
  //                 "transform",
  //                 `translate(${dx.toFixed(2)}px, 0px) scale(${sc.toFixed(4)})`
  //               );
  //             } else {
  //               setStyle(dockTitle, "transform", "");
  //             }
  //           }
  //
  //           if (Number.isFinite(ty) && Number.isFinite(S)) {
  //             setStyle(
  //               logo,
  //               "transform",
  //               `translate(${logoShiftX.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${S.toFixed(4)})`
  //             );
  //           }
  //         }
  //       }
  //
  //       // --- Chrome handover to the closing sphere. The page ends on the
  //       // sphere board, which carries its own chrome, so as that section rises
  //       // into view the bottom search island scales away and the menu scales in
  //       // at the sphere's top-right corner. Both sides read this one progress,
  //       // so the two can never be present at once or arrive out of step. ---
  //       let gate = 0;
  //       if (!sphereEl) sphereEl = document.querySelector("[data-sphere-footer]");
  //       if (sphereEl) {
  //         // 0 as the section's first sliver appears, 1 once it covers 60% of
  //         // the screen — well before it's the only thing on it.
  //         const gp = Math.min(
  //           1,
  //           Math.max(0, (vh - sphereEl.getBoundingClientRect().top) / (vh * 0.6))
  //         );
  //         gate = gp * gp * (3 - 2 * gp); // smoothstep
  //       }
  //       if (!sphereMenuEl)
  //         sphereMenuEl = document.querySelector("[data-sphere-menu]");
  //       if (sphereMenuEl) {
  //         setStyle(sphereMenuEl, "opacity", gate.toFixed(3));
  //         setStyle(
  //           sphereMenuEl,
  //           "transform",
  //           gate > 0.999 ? "" : `scale(${(0.7 + 0.3 * gate).toFixed(4)})`
  //         );
  //         setStyle(sphereMenuEl, "pointerEvents", gate > 0.5 ? "auto" : "none");
  //       }
  //
  //       // Bottom search island: stays hidden for the WHOLE intro — it used to
  //       // appear within the first 6% of the scroll, which put it on screen over
  //       // the Choose section while that was still being read. It now only fades
  //       // in once the intro has fully landed (the titles are home and the
  //       // section is scrolled past), and fades back out on the way up. It still
  //       // scales out for good once the sphere takes over the chrome.
  //       if (barEl) {
  //         // Appears only once Look has genuinely started covering Choose — 0 as
  //         // its top edge reaches the bottom of the viewport, 1 by the time it
  //         // has risen a third of the way up.
  //         if (!lookEl) lookEl = document.querySelector("[data-look]");
  //         let bv = 0;
  //         if (lookEl) {
  //           const lookTop = lookEl.getBoundingClientRect().top;
  //           bv = Math.min(1, Math.max(0, (vh - lookTop) / (vh * 0.33)));
  //         }
  //         // The open search panel locks body scroll — always counts as active,
  //         // so the panel (a DOM child of the bar) never dims mid-use.
  //         if (document.body.style.overflow === "hidden") lastActive = now;
  //         const dimTarget = now - lastActive > 6000 ? 0.35 : 1;
  //         dim = approach(dim, dimTarget, 260, dt);
  //         if (Math.abs(dimTarget - dim) < 0.002) dim = dimTarget;
  //         setStyle(barEl, "opacity", (bv * dim * (1 - gate)).toFixed(3));
  //         setStyle(
  //           barEl,
  //           "pointerEvents",
  //           bv > 0.5 && gate < 0.5 ? "auto" : "none"
  //         );
  //         // Scaled ONLY while it is actually leaving. At rest the bar must carry
  //         // no transform, or it becomes the containing block for the fixed
  //         // search panel that lives inside it. (measureBar strips the transform
  //         // before reading the width, so the docked logo stays sized to the bar.)
  //         setStyle(
  //           barEl,
  //           "transform",
  //           gate > 0.001 ? `scale(${(1 - 0.3 * gate).toFixed(4)})` : ""
  //         );
  //       }
  //
  //       if (y >= H) {
  //         // Intro done — titles have landed. Choose now rests pinned while the
  //         // rest of the page reveals up over it. Land every driven value on its
  //         // resting state (deduped: written once).
  //         sp = 1; // stay consistent if the user scrolls back into the intro
  //         setStyle(el, "opacity", "");
  //         setStyle(el, "pointerEvents", "");
  //         setStyle(titles, "transform", "");
  //         setStyle(titles, "opacity", "");
  //         // Landed: the cards are home. Clear the flight transform entirely so
  //         // they sit on their natural layout position with no leftover matrix —
  //         // a resting card must carry no transform, or it becomes a containing
  //         // block for anything fixed inside it.
  //         cardEls.forEach((card) => {
  //           setStyle(card, "opacity", "1");
  //           setStyle(card, "transform", "");
  //           setStyle(card, "transformOrigin", "");
  //           const f = card.querySelector("[data-board-frame]");
  //           if (f) setStyle(f, "opacity", "1");
  //           const m = card.querySelector("[data-board-media]");
  //           if (m) {
  //             setStyle(m, "transform", "");
  //             setStyle(m, "transformOrigin", "");
  //           }
  //         });
  //         [0, 1].forEach((i) => {
  //           const src = document.querySelector(`[data-board-src="${i}"]`);
  //           // Kept visible in the temporary numbering mode so every slot can
  //           // be read; otherwise hidden — the board card covers this slot.
  //           if (src) setStyle(src, "opacity", NUMBER_CARDS ? "1" : "0");
  //         });
  //         if (chooseRoot && !chooseRoot.hasAttribute("data-landed"))
  //           chooseRoot.setAttribute("data-landed", "");
  //         labelEls.forEach((t) => setStyle(t, "opacity", ""));
  //         detailEls.forEach((t) => setStyle(t, "opacity", ""));
  //         fastRows.forEach((r) => setStyle(r, "transform", ""));
  //         setStyle(chooseRoot, "filter", "");
  //         setStyle(chooseRoot, "backgroundColor", ""); // back to its bg-white class
  //         return;
  //       }
  //
  //       if (p === 0 && sp < 0.005) {
  //         // Resting at the very top — fully hidden, titles parked far away.
  //         sp = 0;
  //         setStyle(el, "opacity", "1");
  //         setStyle(el, "pointerEvents", "none");
  //         setStyle(titles, "transform", "");
  //         setStyle(titles, "opacity", "1");
  //         // The two board cards TAKE OVER their hero slots outright: the hero
  //         // card in each slot is held at opacity 0 for the whole intro (and at
  //         // rest), and the real MODELS / TALENTS card sits in its place from the
  //         // first frame, tracking it as the field pans. Nothing ever dissolves
  //         // into anything — there is only one card in that spot, and it is the
  //         // real one. Its transform is written by the flight block below; this
  //         // branch only has to make sure it is visible.
  //         // Position FIRST, then reveal. The card renders at opacity 0, so if it
  //         // were shown before placeCards ran it would paint for one frame at its
  //         // resting layout spot — a visible flash of the card in the wrong
  //         // place — before jumping onto the hero slot.
  //         placeCards(0);
  //         cardEls.forEach((card) => {
  //           setStyle(card, "opacity", "1");
  //           const f = card.querySelector("[data-board-frame]");
  //           if (f) setStyle(f, "opacity", "1");
  //         });
  //         [0, 1].forEach((i) => {
  //           const src = document.querySelector(`[data-board-src="${i}"]`);
  //           // Kept visible in the temporary numbering mode so every slot can
  //           // be read; otherwise hidden — the board card covers this slot.
  //           if (src) setStyle(src, "opacity", NUMBER_CARDS ? "1" : "0");
  //         });
  //         if (chooseRoot) chooseRoot.removeAttribute("data-landed");
  //         labelEls.forEach((t) => setStyle(t, "opacity", "0"));
  //         detailEls.forEach((t) => setStyle(t, "opacity", "0"));
  //         fastRows.forEach((r) => setStyle(r, "transform", ""));
  //         setStyle(chooseRoot, "filter", "");
  //         setStyle(chooseRoot, "backgroundColor", "rgba(255,255,255,0)");
  //         return;
  //       }
  //
  //       // Reveal window (the whole intro): the sticky track holds the section at
  //       // the viewport top; this loop only drives opacity / zoom / blur.
  //       // Hover unlocks once the titles are ~85% in — early enough to feel
  //       // responsive, late enough that rows flying under a resting cursor
  //       // don't trigger the background-image reveal mid-flight.
  //       // The section stays opaque; each piece inside carries its own fade (the
  //       // labels and detail columns fade in late, the frames stay hidden while
  //       // the flying hero cards stand in for them). A blanket fade here made the
  //       // whole section — labels included — invisible for most of the scroll.
  //       setStyle(el, "opacity", "1");
  //       setStyle(el, "pointerEvents", sp >= 0.85 ? "auto" : "none");
  //       if (chooseRoot) {
  //         // No white film while flying in: the section stays transparent over
  //         // the hero (only its content fades), and the white background floods
  //         // in over the last stretch as it lands. (No per-frame motion blur —
  //         // blurring the whole section every frame was the main stutter.)
  //         // Arrives only at the very end: any earlier and the white ground
  //         // covers the hero field while the two cards are still travelling
  //         // across it, hiding the handover behind a blank page.
  //         const landAlpha = Math.min(1, Math.max(0, (sp - 0.86) / 0.14));
  //         setStyle(
  //           chooseRoot,
  //           "backgroundColor",
  //           `rgba(255,255,255,${landAlpha.toFixed(3)})`
  //         );
  //         setStyle(chooseRoot, "filter", "none");
  //       }
  //
  //       // --- Board cards travel to their slots ---
  //       // Each card IS the real MODELS / TALENTS link, and it has been sitting
  //       // in its hero card's slot since the first frame (that hero card is held
  //       // at opacity 0 throughout — it is never seen). Nothing dissolves into
  //       // anything here: the one card in that spot simply travels from the hero
  //       // slot to its own resting position as the field leaves.
  //       if (titles) {
  //         const arrive = 1 - Math.pow(1 - sp, 2);
  //         // Held back at the start so the hero field is visibly on its way out
  //         // before these two begin to move.
  //         // Starts later and runs over a longer stretch of the scroll, so the
  //         // two drift slowly into place instead of darting across.
  //         const k = Math.min(1, Math.max(0, (arrive - 0.2) / 0.8));
  //         const e = 1 - Math.pow(1 - k, 1.6); // gentler ease-out
  //
  //         setStyle(titles, "transform", "");
  //         setStyle(titles, "opacity", "1");
  //
  //         // Position before revealing, for the same reason as the at-rest
  //         // branch: a card shown before it is placed flashes at its resting spot.
  //         placeCards(e);
  //
  //         cardEls.forEach((card) => {
  //           setStyle(card, "opacity", "1");
  //           const frame = card.querySelector("[data-board-frame]");
  //           if (frame) setStyle(frame, "opacity", "1");
  //         });
  //         // The hero cards these two replace stay invisible for the whole intro.
  //         [0, 1].forEach((i) => {
  //           const src = document.querySelector(`[data-board-src="${i}"]`);
  //           // Kept visible in the temporary numbering mode so every slot can
  //           // be read; otherwise hidden — the board card covers this slot.
  //           if (src) setStyle(src, "opacity", NUMBER_CARDS ? "1" : "0");
  //         });
  //
  //         // Text fades in late and never moves.
  //         const textFade = Math.min(1, Math.max(0, (arrive - 0.72) / 0.28));
  //         labelEls.forEach((t) => setStyle(t, "opacity", textFade.toFixed(3)));
  //         detailEls.forEach((t) => setStyle(t, "opacity", textFade.toFixed(3)));
  //       }
  //     };
  //
  //     // A single bad frame must never kill the loop — swallow any error and
  //     // always schedule the next one. This is what makes the intro unbreakable
  //     // no matter how hard the page is scrolled, resized or thrashed.
  //     const render = () => {
  //       try {
  //         frame();
  //       } catch (_) {
  //         // ignore this frame and keep going
  //       }
  //       raf = requestAnimationFrame(render);
  //     };
  //
  //     raf = requestAnimationFrame(render);
  //     return () => {
  //       window.removeEventListener("resize", remeasure);
  //       window.removeEventListener("resize", measureRest);
  //       window.removeEventListener("keydown", markActive);
  //       document.removeEventListener("visibilitychange", onVisible);
  //       if (barEl) {
  //         barEl.removeEventListener("pointermove", markActive);
  //         barEl.removeEventListener("pointerdown", markActive);
  //         barEl.style.transform = "";
  //       }
  //       if (barRO) barRO.disconnect();
  //       if (dockTitle) {
  //         dockTitle.style.transform = "";
  //         dockTitle.style.fontStyle = "";
  //       }
  //       el.style.willChange = "";
  //       cancelAnimationFrame(raf);
  //     };
  //   }, []);

  return (
    <section className="relative">
      {/* The bottom search island is held back through the intro and then
          arrives WITH the rest of the furniture.
          1930ms is --at-furniture / --at-cards from styles/candor-intro.css —
          the single moment the wordmark, the corner chrome and the two cards
          all begin coming in, just before CANDOR finishes forming.
          The cards finish appearing at 2130ms, before the letters fall.
          These are two separate clocks — a CSS animation delay and a JS
          timeout — so they are kept in step by hand; if the intro's timeline
          moves, this moves with it.
          SEEN_KEY is the intro's own sessionStorage flag: on a repeat visit
          the intro does not play, and the island skips the wait rather than
          holding off for an animation that is not running.
          <Header /> must stay ABOVE <CandorLine /> for that check to work —
          it reads the flag in an effect, and the intro writes it in one. */}
      <Header delayMs={1930} skipWhenSeen={SEEN_KEY} />

      {/* THE INTRO, from /hero3.
          Rides position:sticky at the top of the viewport and STAYS pinned;
          the section after it lives in the same containing block with a higher
          paint order and an opaque background, so it scrolls UP from the
          bottom and reveals over the still-pinned intro. The browser pins it
          natively — no per-frame transform — so it cannot drift or jitter.
          This replaces the Hero2 / LogoAnimation / Choose sequence that used
          to open the page; that code is commented out above. */}
      {/* The wordmark, mounted OUTSIDE the sticky wrapper below.
          It has to be: that wrapper is overflow-hidden, which clips even a
          fixed child, and the page's content sits in a z-10 stacking context
          that would paint over anything inside the intro whatever its own
          z-index said. Together those were slicing the mark in half as the
          Selena Forrest section scrolled past it.
          Out here it is fixed at z-40 — above the content, below Header's
          menu overlay at z-50 — so it stays put for the whole page. */}
      <CandorFloatingLogo>
        <span className="block text-[#0c0c0c]">
          <LogoAnimation tight className="w-[124px] md:w-[200px]" />
        </span>
      </CandorFloatingLogo>

      <div className="sticky top-0 h-screen w-full overflow-hidden px-3 py-5 md:px-5">
        <CandorLine floatingLogo />
      </div>

      {/* Travel before the next section begins sliding up. Real content rather
          than padding: a sticky element can only move within its containing
          block's content box, so the intro needs this much room below it to
          stay pinned through the sequence.
          Transparent and pointer-events-none, so the pinned intro shows
          through and stays interactive underneath. */}
      <div className="h-[60vh]" aria-hidden="true" />

      {/* The rest of the page. Opaque and a layer up, which is what makes it
          cover the pinned intro rather than push it.
          data-snap-container marks its children as SectionSnap targets. */}
      <div className="relative z-10 bg-white" data-snap-container>
        <Look />
        <Body />
        <section className="pt-14 md:pt-28 lg:pt-20">
          <div className="px-4">
            <FilmPlayer films={films} inline bar="index" />
          </div>
        </section>

        {/* The invitation to apply, last before the footer. It sits here
            rather than higher up because it asks the reader for something,
            and the page should have shown them the work first — the roster,
            the look and the showreel are the argument, and this is the thing
            to do about it. */}
        <JoinCandor />

        <SphereFooter />
      </div>

      {/* Observer-driven section snapping (post-intro only). */}
      {/* Temporarily disabled — smooth snap scroll commented out for now. */}
      {/* <SectionSnap /> */}
    </section>
  );
}

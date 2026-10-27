"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { models } from "../../../data/models";
import { agency, contactMailto, divisions } from "../../../data/agency";
import { StraightArrow } from "../ChromeLink";
import "./CastingMenu.css";

// What the island opens into: the three boards (then Archives and About) on
// the left, a portrait
// window on the right, and the two answer each other. Hover a board and its
// lead face rises into the window through a liquid front while the cursor
// develops colour in an otherwise monochrome print (castingGL.js). Each
// board's name rolls over letter by letter and a marker glides to it. At
// rest the window is the scouting card.
const SCOUT_FACE = "/photos/img19.jpeg";

const BOARDS = divisions.map((division) => {
  const people = models.filter((model) => model.division === division.division);
  return { label: division.label, href: division.href, count: people.length, people };
});
const faceOf = (person) => person?.face ?? person?.coverImage ?? SCOUT_FACE;
// Who fronts each board's preview. The server (and the first client render)
// takes whoever was signed first so the markup matches; after mount every page
// load draws someone at random, so the menu shows a different face each visit.
const firstPicks = () => BOARDS.map((board) => board.people[0]);
const randomPicks = () => BOARDS.map(({ people }) => people[Math.floor(Math.random() * people.length)]);
// The index runs the three boards, then the two pages that aren't a board.
// Only the boards have a face; hovering the last two leaves the window on
// the scouting card.
const ENTRIES = [
  ...BOARDS,
  { label: "Archives", href: "/archives" },
  { label: "About", href: "/about" },
];
// The small links at the foot of the index, on the same line as the
// window's own "Get scouted".
const SUBLINKS = [
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
];
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function CastingMenu({ pathname, onNavigate, open }) {
  const linksRef = useRef(null);
  const markerRef = useRef(null);
  const canvasRef = useRef(null);
  const windowRef = useRef(null);
  const glRef = useRef(null);
  const [hovered, setHovered] = useState(-1);
  const [picks, setPicks] = useState(firstPicks);
  const picksRef = useRef(picks);
  useEffect(() => {
    const next = randomPicks();
    picksRef.current = next;
    setPicks(next);
  }, []);

  // The board names come up out of their own line, one after another, as the
  // panel finishes opening — the one move this menu makes on arrival.
  useEffect(() => {
    const words = linksRef.current?.querySelectorAll(".cm-line");
    if (!open || !words?.length || reducedMotion()) return;
    const tween = gsap.fromTo(words, { yPercent: 105 }, {
      yPercent: 0, duration: 0.9, delay: 0.14, stagger: 0.07, ease: "candor-island", clearProps: "transform",
    });
    return () => tween.kill();
  }, [open]);

  // The marker sits beside whichever board is live: the hovered one, else
  // the page you are on, else nowhere.
  const routeIndex = ENTRIES.findIndex((entry) => pathname?.startsWith(entry.href));
  const markIndex = hovered !== -1 ? hovered : routeIndex;
  useEffect(() => {
    const marker = markerRef.current;
    const link = linksRef.current?.children[markIndex];
    if (!marker) return;
    if (!link || !link.matches("a")) { gsap.to(marker, { scale: 0, duration: 0.3, ease: "candor-island", overwrite: true }); return; }
    const y = link.offsetTop + link.offsetHeight * 0.55;
    const first = gsap.getProperty(marker, "scale") === 0;
    if (first || reducedMotion()) gsap.set(marker, { y });
    gsap.to(marker, { y, scale: 1, duration: first ? 0.4 : 0.55, ease: "candor-island", overwrite: true });
  }, [markIndex, open]);

  // The renderer lives only while the menu is open.
  useEffect(() => {
    if (!open) return;
    const reduced = reducedMotion();
    let disposed = false, frame = 0, gl = null, observer = null;
    const lens = { value: 0 };
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const frameWindow = windowRef.current;

    const tick = (now) => {
      frame = requestAnimationFrame(tick);
      if (document.hidden) return;
      mouse.x += (mouse.tx - mouse.x) * 0.12;
      mouse.y += (mouse.ty - mouse.y) * 0.12;
      gl.uniforms.uMouse.value.set(mouse.x, mouse.y);
      gl.uniforms.uLens.value = lens.value;
      gl.render(now / 1000);
    };
    const move = (event) => {
      const rect = frameWindow.getBoundingClientRect();
      mouse.tx = (event.clientX - rect.left) / rect.width;
      mouse.ty = 1 - (event.clientY - rect.top) / rect.height;
    };
    const enter = () => gsap.to(lens, { value: 1, duration: 0.6, ease: "candor-island", overwrite: true });
    const leave = () => gsap.to(lens, { value: 0, duration: 0.8, ease: "candor-island", overwrite: true });

    import("./castingGL").then(({ createCastingRenderer }) => {
      if (disposed) return;
      try { gl = createCastingRenderer(canvasRef.current, [SCOUT_FACE, ...picksRef.current.map(faceOf)]); } catch { return; }
      glRef.current = { gl, reduced };
      const size = () => {
        const rect = frameWindow.getBoundingClientRect();
        gl.resize(Math.max(1, rect.width), Math.max(1, rect.height));
      };
      observer = new ResizeObserver(size);
      observer.observe(frameWindow);
      size();
      frameWindow.addEventListener("pointermove", move);
      frameWindow.addEventListener("pointerenter", enter);
      frameWindow.addEventListener("pointerleave", leave);
      gl.ready.then(() => { if (!disposed) frameWindow.dataset.ready = ""; });
      frame = requestAnimationFrame(tick);
    }).catch(() => {});

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      gsap.killTweensOf(lens);
      frameWindow.removeEventListener("pointermove", move);
      frameWindow.removeEventListener("pointerenter", enter);
      frameWindow.removeEventListener("pointerleave", leave);
      delete frameWindow.dataset.ready;
      if (glRef.current) gsap.killTweensOf(glRef.current.gl.uniforms.uProgress);
      gl?.dispose();
      glRef.current = null;
    };
  }, [open]);

  // Hover (or keyboard focus) on a board drives the window to its face;
  // leaving the index altogether returns it to the scouting card.
  useEffect(() => {
    const entry = glRef.current;
    if (!entry) return;
    const { gl, reduced } = entry;
    gl.beginTo(hovered < BOARDS.length ? hovered + 1 : 0);
    gsap.killTweensOf(gl.uniforms.uProgress);
    if (reduced) gl.uniforms.uProgress.value = 1;
    else gsap.to(gl.uniforms.uProgress, { value: 1, duration: 1.1, ease: "power3.out" });
  }, [hovered]);

  const board = BOARDS[hovered];
  const person = picks[hovered];
  const focusBoard = (index) => (event) => event.currentTarget.matches(":focus-visible") && setHovered(index);

  return (
    <div className="cm">
      <div className="cm-index" onPointerLeave={() => setHovered(-1)}>
        <nav ref={linksRef} className="cm-links" aria-label="Our people" data-hovering={hovered !== -1 || undefined}>
          {ENTRIES.map((entry, index) => (
            <Link key={entry.href} href={entry.href} data-nav-first={index === 0 ? "" : undefined}
              data-active={hovered === index || undefined} aria-current={pathname === entry.href ? "page" : undefined}
              onPointerEnter={() => setHovered(index)} onFocus={focusBoard(index)} onClick={onNavigate}>
              <span className="cm-visually-hidden">{entry.label}</span>
              {/* Every letter carries a copy of itself below (::after) and
                  rolls up to it, a few ms behind its neighbour. */}
              <span className="cm-mask" aria-hidden="true">
                <span className="cm-line">
                  {[...entry.label].map((char, i) => (
                    <span key={i} className="cm-char" data-char={char} style={{ "--i": i }}>{char}</span>
                  ))}
                </span>
              </span>
              <span className="cm-arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
          <span ref={markerRef} className="cm-marker" aria-hidden="true" />
        </nav>

        {/* Leaving the index for this hands the window back to the
            scouting card. */}
        <div className="cm-foot" onPointerEnter={() => setHovered(-1)}>
          <p className="cm-fine">
            <a href={contactMailto}>{agency.contact.email}</a>
            <span>Lagos · Manchester · Dallas</span>
          </p>
          <nav className="cm-sub" aria-label="More">
            {SUBLINKS.map((item) => (
              <Link key={item.href} href={item.href} onClick={onNavigate}>{item.label}</Link>
            ))}
          </nav>
        </div>
      </div>

      <Link ref={windowRef} href={board ? board.href : "/get-scouted"} className="cm-window" onClick={onNavigate}
        aria-label={board ? `View the ${board.label} board` : "Get scouted"}>
        <img className="cm-fallback" src={SCOUT_FACE} alt="" />
        <canvas ref={canvasRef} aria-hidden="true" />
        <span className="cm-veil" aria-hidden="true" />
        <span className="cm-top">{board ? person?.name ?? board.label : "New faces. New possibilities."}</span>
        <span className="cm-copy">
          <span className="cm-title" key={hovered}>{board ? board.label : <>Your story<br />starts here.</>}</span>
          {/* A ruled line rather than a button: the whole window is the
              link, so this only names where it goes. */}
          <span className="cm-cta">{board ? "View board" : "Get scouted"} <StraightArrow /></span>
        </span>
      </Link>
    </div>
  );
}

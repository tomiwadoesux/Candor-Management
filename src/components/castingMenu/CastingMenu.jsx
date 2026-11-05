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
// board's name rolls over letter by letter and an arrow draws on after it. At
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
  { label: "Archives", href: "/archive" },
  { label: "About", href: "/agency" },
];
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// Archives turns into Coral Pixels and back, a letter at a time from A to s,
// on a steady loop. Each letter carries its pixel twin; as it turns, its
// slot eases out to the pixel letter's width (the twin wiping in with it)
// and the rest of the word slides along, so the change runs through the word
// like a wave. Turning back, the slot eases in again.
const GLITCH_HREF = "/archive";
const GLITCH = {
  firstDelay: 2000, // after the menu opens
  stagger: 110, // between one letter and the next, both ways
  hold: 3200, // the word all in pixels
  rest: 6000, // the word all in Arno, before the next pass
  gap: 0.05, // em after each pixel letter
};

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

  useEffect(() => {
    const link = linksRef.current && [...linksRef.current.children].find((child) => child.getAttribute("href") === GLITCH_HREF);
    if (!open || !link || reducedMotion()) return;
    const chars = [...link.querySelectorAll(".cm-char")];
    let serifWidths = null, pixelWidths = null;
    // Both widths of every letter, in em so they ride the menu's fluid type
    // size. Taken on the first turn, once the island has finished opening,
    // with any scale left on it divided out (the computed width is the
    // exact, untransformed one).
    const measure = () => {
      const style = getComputedStyle(link);
      const size = parseFloat(style.fontSize);
      const scale = link.getBoundingClientRect().width / parseFloat(style.width) || 1;
      const em = (rect) => rect.width / scale / size;
      serifWidths = chars.map((char) => em(char.getBoundingClientRect()));
      pixelWidths = chars.map((char) => em(char.querySelector(".cm-px > span").getBoundingClientRect()) + GLITCH.gap);
      // Pinned to their own widths (no change to look at) so the first
      // turn has a width to ease from.
      chars.forEach((char, index) => { char.style.width = `${serifWidths[index]}em`; });
      void link.offsetWidth;
    };
    const turn = (index, pixel) => {
      chars[index].style.width = `${(pixel ? pixelWidths : serifWidths)[index]}em`;
      if (pixel) chars[index].dataset.px = "";
      else delete chars[index].dataset.px;
    };

    // The loop as a list of steps, each with the wait before the next: every
    // letter into pixels, the hold, every letter back, the rest.
    const steps = [
      ...chars.map((_, index) => [() => turn(index, true), index === chars.length - 1 ? GLITCH.hold : GLITCH.stagger]),
      ...chars.map((_, index) => [() => turn(index, false), index === chars.length - 1 ? GLITCH.rest : GLITCH.stagger]),
    ];
    let step = 0, timer = 0, wait = GLITCH.firstDelay;
    const schedule = (ms) => { clearTimeout(timer); wait = ms; timer = setTimeout(run, ms); };
    function run() {
      // Not while it has keyboard focus, or the tab is in the background.
      if (link.matches("[data-active]") || document.hidden) { schedule(1000); return; }
      if (!serifWidths) measure();
      const [act, next] = steps[step];
      act();
      step = (step + 1) % steps.length;
      schedule(next);
    }
    // Pointing at Archives holds it exactly as it is, mid-wave or not, so
    // hovering never changes its face; leaving restarts the wait it was on.
    const enter = () => clearTimeout(timer);
    const leave = () => schedule(wait);

    link.addEventListener("pointerenter", enter);
    link.addEventListener("pointerleave", leave);
    // Both faces in before the first turn, so neither is measured on a fallback.
    Promise.all([document.fonts.load('1em "Coral Pixels"'), document.fonts.ready]).catch(() => {}).then(() => {
      if (link.isConnected && !timer) schedule(GLITCH.firstDelay);
    });
    return () => {
      clearTimeout(timer);
      timer = -1;
      link.removeEventListener("pointerenter", enter);
      link.removeEventListener("pointerleave", leave);
      chars.forEach((char) => { char.style.width = ""; delete char.dataset.px; });
    };
  }, [open]);

  // The marker sits beside the page you are on (it doesn't follow the
  // hover), else nowhere.
  const markIndex = ENTRIES.findIndex((entry) => pathname?.startsWith(entry.href));
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
              {/* Every letter sits in its own box with a copy of itself
                  waiting just left of it (::after); on hover the letter slides
                  out to the right as the copy slides in, a few ms behind its
                  neighbour. */}
              <span className="cm-mask" aria-hidden="true">
                <span className="cm-line">
                  {[...entry.label].map((char, i) => (
                    <span key={i} className="cm-char" style={{ "--i": i }}>
                      <span className="cm-roll" data-char={char}>
                        {char}
                        {/* Archives' letters carry their pixel twin, laid
                            over from the same start and baseline, and a
                            copy of it to roll in with. */}
                        {entry.href === GLITCH_HREF && <>
                          <span className="cm-px"><span>{char}</span></span>
                          <span className="cm-px cm-px-copy"><span>{char}</span></span>
                        </>}
                      </span>
                    </span>
                  ))}
                </span>
              </span>
              {/* Drawn rather than typed (Arno has no arrows): the shaft, then
                  each side of the head from the tip, so it can draw itself on. */}
              <svg className="cm-arrow" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path pathLength="1" d="M1 6H10.5" />
                <path pathLength="1" d="M10.5 6L6.5 2" />
                <path pathLength="1" d="M10.5 6L6.5 10" />
              </svg>
            </Link>
          ))}
          <span ref={markerRef} className="cm-marker" aria-hidden="true" />
        </nav>

        {/* Leaving the index for this hands the window back to the
            scouting card. */}
        <div className="cm-foot" onPointerEnter={() => setHovered(-1)}>
          <p className="cm-fine">
            <a href={contactMailto}>{agency.contact.email}</a>
          </p>
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

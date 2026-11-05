"use client"; // if using Next.js 13+

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

import { SearchProvider, useSearch } from "./SearchContext";

// The bottom island loads after hydration; its search and navigation share state.
const Search = dynamic(() => import("./Search"), { ssr: false });
const InNav = dynamic(() => import("./InNav"), { ssr: false });

// `delayMs` holds the bottom search island back for that long after mount,
// then fades it in. It defaults to 0, so every page that renders <Header />
// with no props behaves exactly as it always has — only the landing page
// passes a value, to keep the island out of its opening animation.
export default function Header({ delayMs = 0, skipWhenSeen }) {
  // Starts hidden only when there is a delay to wait out. With delayMs = 0
  // this is true from the first render, so the island paints immediately and
  // no page that does not opt in ever sees a transition.
  //
  // It must also start hidden on the SERVER render whenever a delay is set,
  // which is why this is derived from the prop alone — reading sessionStorage
  // here would not match the server's output and would hydrate as a mismatch.
  // The repeat-visit case is handled in the effect instead.
  const [barShown, setBarShown] = useState(delayMs <= 0);

  useEffect(() => {
    if (delayMs <= 0) return;

    // `skipWhenSeen` names a sessionStorage key that some other component sets
    // once it has played. If it is already set, whatever this delay was
    // waiting for is not going to happen this visit, so the island shows at
    // once rather than after a wait for nothing.
    //
    // This read has to happen BEFORE that component's own effect writes the
    // key, or a first visit would look like a repeat one. It does, because
    // Header is rendered above it on the page and React runs effects in mount
    // order — but that is a load-bearing detail of the page's JSX order, so
    // whoever moves <Header /> below the intro needs to know it.
    if (skipWhenSeen) {
      let seen = false;
      try {
        seen = sessionStorage.getItem(skipWhenSeen) === "1";
      } catch {
        // Private mode, or storage disabled. Fall through and serve the delay:
        // showing the island late is a far smaller fault than showing it over
        // an animation that is still running.
      }
      if (seen) {
        setBarShown(true);
        return;
      }
    }

    const t = setTimeout(() => setBarShown(true), delayMs);
    return () => clearTimeout(t);
  }, [delayMs, skipWhenSeen]);

  return (
    <SearchProvider>
      {/* Centered bottom Search + Nav bar */}
      <div style={{ bottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }} className="fixed inset-x-0 flex justify-center z-50 pointer-events-none">
        <Island barShown={barShown} />
      </div>
    </SearchProvider>
  );
}

// How long after a scroll down the island waits before tucking away, and
// what it tucks to: faint and a little smaller, still there to be found.
const TUCK_DELAY = 2000;
const TUCK_OPACITY = 0.15;
const TUCK_SCALE = 0.9;
const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";

// The island itself. Inside the provider so it can tell when search or the
// menu is open: it never tucks while either is in use.
function Island({ barShown }) {
  const { isSearchOpen, isMenuOpen } = useSearch();
  const [tucked, setTucked] = useState(false);
  // Reveal with no transition. Set by a press, so the search panel and the
  // menu measure (and inherit) the island at full size, not mid-way back.
  const [snap, setSnap] = useState(false);
  const hovering = useRef(false);
  const timer = useRef(0);
  const reduced = useRef(false);
  const inUse = isSearchOpen || isMenuOpen;

  const reveal = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = 0;
    setTucked(false);
  }, []);

  // Scroll down arms a single timer (continuing down doesn't restart it);
  // any scroll back up, or reaching the top, brings the island straight back.
  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      if (y < 80 || dy < -3) { reveal(); return; }
      if (dy <= 0 || timer.current || hovering.current) return;
      timer.current = setTimeout(() => {
        timer.current = 0;
        if (hovering.current) return;
        setSnap(false);
        setTucked(true);
      }, TUCK_DELAY);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer.current);
    };
  }, [reveal]);

  useEffect(() => {
    if (inUse) reveal();
  }, [inUse, reveal]);

  const shown = tucked && !inUse ? "tucked" : "full";
  const transition = !barShown
    ? "none"
    : snap || inUse
      ? "none"
      : shown === "tucked"
        ? `opacity 600ms ${EASE_OUT}, transform 600ms ${EASE_OUT}`
        : `opacity 380ms ${EASE_OUT}, transform 380ms ${EASE_OUT}`;

  return (
    <div
      data-bottombar
      className="flex flex-row items-center pointer-events-auto"
      onPointerEnter={() => { hovering.current = true; setSnap(false); reveal(); }}
      onPointerLeave={() => { hovering.current = false; }}
      onPointerDown={() => { if (tucked) { setSnap(true); reveal(); } }}
      onFocus={reveal}
      style={{
        opacity: !barShown ? 0 : shown === "tucked" ? TUCK_OPACITY : 1,
        // Rises as it fades, the same gesture the intro's cards make when
        // they land — the island is arriving WITH them, so it should not
        // simply switch on while everything around it settles into place.
        // Tucked, it shrinks toward its bottom edge.
        transform: !barShown
          ? "translateY(10px)"
          : shown === "tucked" && !reduced.current
            ? `scale(${TUCK_SCALE})`
            : "none",
        transformOrigin: "50% 100%",
        // 380ms and this curve are the cards' own --card-in-ms and
        // --ease-out from styles/candor-intro.css. Matched deliberately:
        // at 500ms the island was still fading up after the wordmark and
        // the cards had finished, which read as a fourth thing arriving
        // rather than as part of the same moment. Tucking takes longer, so
        // going away is quieter than coming back.
        transition,
        // Not just invisible — unclickable too while it is waiting, so a
        // stray click during the intro cannot land on a control that is
        // not on screen yet.
        pointerEvents: barShown ? undefined : "none",
      }}
    >
      <BottomBar />
    </div>
  );
}

// Consumes the shared search state so the menu icon can react to the morph.
function BottomBar() {
  const { isSearchOpen } = useSearch();
  return (
    <>
      <Search />
      <InNav searchOpen={isSearchOpen} />
    </>
  );
}

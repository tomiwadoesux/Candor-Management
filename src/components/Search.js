"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { models } from "../../data/models";
import { useSearchOptional } from "./SearchContext";
import HoverText from "./HoverText";

const BAR_H = 46; // uniform search-bar height (closed === bottom row when open)
const BOTTOM_GAP = 20; // matches the fixed bottom-5 offset

// Drawer-style curve (iOS sheet): quick confident start, long gentle settle —
// none of expo's snap, none of ease-in-out's slow wind-up.
const EASE = [0.32, 0.72, 0, 1];
const H_DUR = 0.55; // horizontal growth
const V_DUR = 0.5; // vertical growth
const V_DELAY = 0.1; // vertical starts a beat after horizontal, overlapping it

const SEARCH_WORDS = ["talent", "model", "creative"];
const OPEN_LABEL = "name";
const SCRAMBLE_CHARS = "abcdefghijklmnopqrstuvwxyz";

export default function Search() {
  const ctx = useSearchOptional();
  const [localOpen, setLocalOpen] = useState(false);
  const isOpen = ctx ? ctx.isSearchOpen : localOpen;

  const [search, setSearch] = useState("");
  const [viewport, setViewport] = useState({ w: 1280, h: 800 });
  const [origin, setOrigin] = useState({
    left: 0,
    top: 0,
    width: 210,
    height: BAR_H,
  });

  const closedBarRef = useRef(null);
  const prefersReduced = useReducedMotion();

  // Track viewport so we can position/size the morphed panel.
  useEffect(() => {
    const measure = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Lock body scroll + Escape to close while open.
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && closeSearch();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Type-to-search: typing anywhere on the page (outside a form field) opens
  // the panel and seeds the query with the character that was typed.
  useEffect(() => {
    const onType = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length !== 1) return; // printable characters only
      const t = e.target;
      if (
        t instanceof HTMLElement &&
        (t.isContentEditable ||
          t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT")
      )
        return;
      if (!isOpen && e.key === " ") return; // leave space to page scrolling
      e.preventDefault();
      setSearch((s) => s + e.key);
      if (!isOpen) openSearch();
      else inputRef.current?.focus();
    };
    window.addEventListener("keydown", onType);
    return () => window.removeEventListener("keydown", onType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const filteredModels = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return models;
    return models.filter((m) =>
      m.name
        .toLowerCase()
        .split(" ")
        .some((word) => word.startsWith(q))
    );
  }, [search]);

  const setOpen = (v) => {
    if (ctx) v ? ctx.openSearch() : ctx.closeSearch();
    else setLocalOpen(v);
  };

  const openSearch = () => {
    // Capture the exact rect of the closed bar so the panel morphs out of it.
    const el = closedBarRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      setOrigin({ left: r.left, top: r.top, width: r.width, height: r.height });
    }
    setOpen(true);
  };

  const closeSearch = () => {
    setOpen(false);
    setSearch("");
    // The exiting input is frozen by AnimatePresence — clear it directly so
    // typed text doesn't linger through the close morph.
    if (inputRef.current) inputRef.current.value = "";
  };

  // Target (open) geometry — full panel, bottom aligned with the closed bar.
  const panelW = Math.min(viewport.w * 0.94, 820);
  const panelH = Math.min(viewport.h * 0.86, 860);
  const bottomY = viewport.h - BOTTOM_GAP;
  const target = {
    left: (viewport.w - panelW) / 2,
    top: bottomY - panelH,
    width: panelW,
    height: panelH,
  };

  const collapsed = {
    left: origin.left,
    top: origin.top,
    width: origin.width,
    height: origin.height,
  };

  const morphTransition = prefersReduced
    ? { duration: 0 }
    : {
        left: { duration: H_DUR, ease: EASE },
        width: { duration: H_DUR, ease: EASE },
        top: { duration: V_DUR, ease: EASE, delay: V_DELAY },
        height: { duration: V_DUR, ease: EASE, delay: V_DELAY },
      };

  // Exit collapses the width FIRST so the icon + input land back on the island
  // rect right away (and stay put while the label scrambles back), then the
  // panel drops down onto the bar. Runs ~25% faster than the entrance.
  const exitTransition = prefersReduced
    ? { duration: 0 }
    : {
        left: { duration: 0.4, ease: EASE },
        width: { duration: 0.4, ease: EASE },
        top: { duration: 0.38, ease: EASE, delay: 0.08 },
        height: { duration: 0.38, ease: EASE, delay: 0.08 },
      };

  // Cards start revealing while the morph is still finishing, not after it.
  const contentReveal = prefersReduced ? 0 : 0.35;

  // ---- Placeholder scrambles in place between labels ----
  // One shared string drives both the closed bar and the open input, so the
  // text never jumps when the panel mounts/unmounts. A shared prefix (e.g.
  // "Search ") is held fixed and only the changing tail scrambles.
  const [display, setDisplay] = useState(`Search ${SEARCH_WORDS[0]}`);
  const displayRef = useRef(`Search ${SEARCH_WORDS[0]}`);
  const scrambleTimer = useRef(null);
  const [wordIdx, setWordIdx] = useState(0);
  const inputRef = useRef(null);

  // Also write straight to the input's DOM node: while the panel is
  // exit-animating, AnimatePresence freezes its React props, so state updates
  // alone never reach it — the label would stick instead of scrambling back.
  const applyDisplay = useCallback((next) => {
    displayRef.current = next;
    setDisplay(next);
    if (inputRef.current) inputRef.current.placeholder = next;
  }, []);

  const scrambleTo = useCallback(
    (to) => {
      const from = displayRef.current;
      if (from === to) return;
      clearInterval(scrambleTimer.current);
      if (prefersReduced) {
        applyDisplay(to);
        return;
      }
      let p = 0;
      while (p < from.length && p < to.length && from[p] === to[p]) p += 1;
      const prefix = to.slice(0, p);
      const fromTail = from.slice(p);
      const toTail = to.slice(p);
      const ticks = 14;
      let tick = 0;
      scrambleTimer.current = setInterval(() => {
        tick += 1;
        if (tick >= ticks) {
          clearInterval(scrambleTimer.current);
          applyDisplay(to);
          return;
        }
        const t = tick / ticks;
        const reveal = Math.round(t * toTail.length);
        const len = Math.round(fromTail.length + (toTail.length - fromTail.length) * t);
        let out = toTail.slice(0, reveal);
        for (let i = reveal; i < len; i += 1) {
          out += SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
        }
        applyDisplay(prefix + out);
      }, 26);
    },
    [prefersReduced, applyDisplay]
  );

  // While closed, the label cycles talent → model → creative every 6s.
  useEffect(() => {
    if (isOpen || prefersReduced) return;
    const t = setInterval(
      () => setWordIdx((i) => (i + 1) % SEARCH_WORDS.length),
      6000
    );
    return () => clearInterval(t);
  }, [isOpen, prefersReduced]);

  useEffect(() => {
    scrambleTo(isOpen ? OPEN_LABEL : `Search ${SEARCH_WORDS[wordIdx]}`);
  }, [isOpen, wordIdx, scrambleTo]);

  useEffect(() => () => clearInterval(scrambleTimer.current), []);

  const cardVariants = {
    closed: { opacity: 0, y: 12 },
    open: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  };

  const magnifier = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );

  return (
    <>
      {/* Closed bar — stays in the flow so the cluster is centered and always
          rendered underneath the (opaque) morphing panel, so the panel can
          collapse straight back onto it with no second rectangle appearing. */}
      <button
        ref={closedBarRef}
        onClick={openSearch}
        aria-label="Open search"
        style={{ height: BAR_H, pointerEvents: isOpen ? "none" : "auto" }}
        className="flex w-[210px] items-center gap-2 bg-[#141414] px-4 text-white cursor-pointer"
      >
        {magnifier}
        {/* Metrics mirror the open input exactly (same leading, text starts at
            the same x) so the open/close handoff doesn't shift the label. */}
        <span className="relative flex items-center text-sm leading-5 text-neutral-400">
          <span
            aria-hidden
            className="search-caret absolute left-0 top-1/2 -translate-y-1/2"
          />
          {display}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="search-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={closeSearch}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
        )}

        {isOpen && (
          <motion.div
            key="search-panel"
              initial={collapsed}
              animate={{ ...target, transition: morphTransition }}
              exit={{ ...collapsed, transition: exitTransition }}
              style={{ position: "fixed", willChange: "width, height, top, left" }}
              className="z-50 flex flex-col overflow-hidden bg-[#0c0c0c] shadow-2xl"
            >
              {/* Grid area — its scale-up is locked to the panel's vertical
                  growth (same delay, duration, and curve), so the cards grow
                  with the background instead of on their own clock. */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: {
                    opacity: { duration: 0.3, ease: "easeOut", delay: V_DELAY + 0.05 },
                    scale: { duration: V_DUR, ease: EASE, delay: V_DELAY },
                    staggerChildren: 0.012,
                    delayChildren: V_DELAY + 0.1,
                  },
                }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                style={{ transformOrigin: "50% 100%" }}
                className="flex-1 min-h-0 overflow-hidden bg-[#0c0c0c]"
              >
                {/* No padding on the flex child above — a border-box can't
                    shrink below its own padding, so any padding there shoves
                    the bottom row out of the panel while the panel is short
                    (start of open / end of close). All spacing lives on the
                    scroller inside instead, plus a soft top fade. */}
                <div
                  className="no-scrollbar h-full overflow-y-auto px-8 pb-6 pt-10 md:px-10"
                  style={{
                    maskImage:
                      "linear-gradient(to bottom, transparent 0, black 28px)",
                    WebkitMaskImage:
                      "linear-gradient(to bottom, transparent 0, black 28px)",
                  }}
                >
                {filteredModels.length === 0 ? (
                  <div className="pt-14 text-center text-base text-neutral-400">
                    No models found.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-10 gap-y-12">
                    {filteredModels.map((model, idx) => {
                      const isModel =
                        (model.talent || "").toLowerCase() === "model";
                      return (
                        <motion.div
                          key={model.id ?? idx}
                          variants={cardVariants}
                          className="flex h-[220px] flex-row gap-5 text-white"
                        >
                          <div className="relative h-full w-[44%] shrink-0 overflow-hidden bg-[#1a1a1a] ring-1 ring-white/10">
                            <HoverText className="absolute inset-0 h-full w-full object-cover" />
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col gap-2 overflow-hidden text-[13px] leading-relaxed">
                            <h6 className="truncate text-[15px] font-medium">{model.name}</h6>
                            {isModel ? (
                              <>
                                <h6 className="truncate">
                                  <span className="font-bold">Nat:</span> {model.nationality}
                                </h6>
                                <h6 className="truncate">
                                  <span className="font-bold">Height:</span> {model.height}
                                </h6>
                                <h6 className="truncate">
                                  <span className="font-bold">Chest:</span> {model.chest}
                                </h6>
                                <h6 className="truncate">
                                  <span className="font-bold">Waist:</span> {model.waist}
                                </h6>
                                <h6 className="truncate">
                                  <span className="font-bold">Shoe:</span> {model.shoe}
                                </h6>
                              </>
                            ) : (
                              <>
                                <h6 className="truncate">
                                  <span className="font-bold">Nat:</span> {model.nationality}
                                </h6>
                                <h6 className="truncate">
                                  <span className="font-bold">Based:</span> {model.based}
                                </h6>
                                <h6 className="truncate">
                                  <span className="font-bold">Focus:</span> {model.focus}
                                </h6>
                                <h6 className="truncate">
                                  <span className="font-bold">Since:</span> {model.since}
                                </h6>
                              </>
                            )}
                            <h5 className="mt-auto truncate text-[13px] tracking-wide italic text-[#00749E]">
                              {model.talent?.toLowerCase()}
                            </h5>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
                </div>
              </motion.div>

              {/* Search bar row — thin, uniform height, pinned at the bottom.
                  This is the visual continuation of the closed bar; padding and
                  height match the closed bar exactly so the text never shifts. */}
              <div
                style={{ height: BAR_H }}
                className="relative shrink-0 flex items-center gap-2 bg-[#141414] px-4 text-white"
              >
                <span className="pointer-events-none flex items-center text-white">
                  {magnifier}
                </span>
                {/* type="text" (not "search") — WebKit's search styling nudges
                    the placeholder a few px off the closed bar's label. */}
                <input
                  ref={inputRef}
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    // Backspacing an already-empty query closes the panel.
                    if (e.key === "Backspace" && search === "") closeSearch();
                  }}
                  placeholder={display}
                  className="w-full appearance-none bg-transparent p-0 pr-16 text-sm leading-5 text-white placeholder-neutral-400 focus:outline-none"
                />
                <motion.button
                  onClick={closeSearch}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.85, transition: { delay: contentReveal, duration: 0.2 } }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  className="absolute right-4 text-sm italic text-white cursor-pointer hover:opacity-60 transition-opacity"
                >
                  Close.
                </motion.button>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

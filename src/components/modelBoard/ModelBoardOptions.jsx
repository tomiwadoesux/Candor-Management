"use client";

import { useEffect, useRef, useState } from "react";
import NewsFeature from "../NewsFeature";
import BoardSpread from "./BoardSpread";
import BoardSheet from "./BoardSheet";
import BoardCinema from "./BoardCinema";
import "./model-board.css";

// TEMPORARY — three takes on the landing page's model board, side by side
// with the current one, behind a small switcher that shows while the board
// is on screen. Pick one, then: mount it in components/body.js in place of
// <ModelBoardOptions />, and delete this file and the two layouts not chosen.
// ?board=a|b|c opens on a take directly; the last pick is remembered.
const OPTIONS = [
  { key: "now", label: "Now", Board: NewsFeature },
  { key: "a", label: "A · Spread", Board: BoardSpread },
  { key: "b", label: "B · Contact sheet", Board: BoardSheet },
  { key: "c", label: "C · Cinema", Board: BoardCinema },
];
const STORE = "candor:model-board";

export default function ModelBoardOptions() {
  const [choice, setChoice] = useState("a");
  const [inView, setInView] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    let initial = null;
    try {
      initial = new URLSearchParams(window.location.search).get("board") || window.localStorage.getItem(STORE);
    } catch {}
    if (OPTIONS.some((option) => option.key === initial)) setChoice(initial);
    const watcher = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.25 });
    watcher.observe(rootRef.current);
    return () => watcher.disconnect();
  }, []);

  const pick = (key) => {
    setChoice(key);
    try { window.localStorage.setItem(STORE, key); } catch {}
  };

  const { Board } = OPTIONS.find((option) => option.key === choice);
  return (
    <div ref={rootRef}>
      <Board key={choice} />
      <div className="mb-switch" data-show={inView || undefined} role="radiogroup" aria-label="Model board design">
        {OPTIONS.map((option) => (
          <button key={option.key} type="button" role="radio" aria-checked={choice === option.key} onClick={() => pick(option.key)}>
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

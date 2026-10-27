"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { models } from "../../../data/models";

// The roster and stepping logic shared by the three board layouts — the same
// rules NewsFeature uses, lifted out so each layout is only its look.

export const roster = models.filter((model) => model.division === "models" && !model.placeholder);
export const pad = (n) => String(n).padStart(2, "0");
export const picturesOf = (model) => (model.images?.length ? model.images : [model.coverImage]);
export const firstSentence = (model) => model.bio.split(/(?<=\.)\s/)[0];
export const SPEC = [
  ["Height", "height"],
  ["Bust", "chest"],
  ["Waist", "waist"],
  ["Hips", "hips"],
];
export const measure = (model, key) => (model[key] || "—").split(" / ")[0];

// `turn` counts steps so every change — even back to a model already seen —
// remounts the animated copy. `origin` is where the step was asked for, in
// the frame's own 0..1 space (y up), for the iris to open from.
export default function useRoster() {
  const [state, setState] = useState({ index: 0, direction: 1, turn: 0, origin: null });
  const touchX = useRef(null);

  const go = useCallback((target, dir, origin = null) => {
    setState((s) => {
      const next = (target + roster.length) % roster.length;
      if (next === s.index) return s;
      return { index: next, direction: dir ?? (next > s.index ? 1 : -1), turn: s.turn + 1, origin };
    });
  }, []);

  const step = useCallback((dir, origin = null) => {
    setState((s) => ({
      index: (s.index + dir + roster.length) % roster.length,
      direction: dir,
      turn: s.turn + 1,
      origin,
    }));
  }, []);

  // Warm the neighbours' pictures so a step never waits on the network. The
  // renderer's TextureLoader asks for the same URLs, so this fills its cache too.
  useEffect(() => {
    [state.index + 1, state.index - 1].forEach((i) => {
      const m = roster[(i + roster.length) % roster.length];
      picturesOf(m).slice(0, 2).forEach((src) => {
        const img = new window.Image();
        img.src = src;
      });
    });
  }, [state.index]);

  const handlers = {
    tabIndex: -1,
    onKeyDown: (e) => {
      if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else return;
      e.preventDefault();
    },
    onTouchStart: (e) => (touchX.current = e.touches[0].clientX),
    onTouchEnd: (e) => {
      if (touchX.current === null) return;
      const dx = e.changedTouches[0].clientX - touchX.current;
      touchX.current = null;
      if (Math.abs(dx) > 48) step(dx < 0 ? 1 : -1);
    },
  };

  const { index } = state;
  return {
    ...state,
    model: roster[index],
    next: roster[(index + 1) % roster.length],
    go,
    step,
    handlers,
  };
}

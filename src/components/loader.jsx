"use client";

import { useEffect, useState } from "react";

const LINE_H = 26; // px per list line
const BEAT = 300; // ms per fill/drain step

const LEFT_LINES = [
  "Ayotomiwa Durojaye",
  "Chioma Nwosu",
  "Marcus Adeyemi",
  "Zainab Hassan",
  "Sofia Okonkwo",
  "Emeka Eze",
  "Amara Obi",
  "Isabella Adesina",
];

const RIGHT_LINES = [
  "Lagos, Nigeria",
  "Harmony Studios — Montreal",
  "Manchester, UK",
  "Neue Haus — Brooklyn",
  "Dallas, USA",
  "High Pavilion — Portland",
  "Elevation — Denver",
  "Berlin, DE",
];

// Local lightweight images (webp first, then the smallest jpegs) — the
// montage flickers through these; all preloaded on mount so cuts never blank.
const IMAGE_POOL = [
  "/images/06.webp",
  "/images/17.webp",
  "/images/22.webp",
  "/images/23.webp",
  "/images/51.webp",
  "/images/64.webp",
  "/images/img4.jpeg",
  "/images/img14.jpeg",
  "/images/img16.jpeg",
  "/images/img19.jpeg",
  "/images/img20.jpeg",
  "/images/img2.jpeg",
];

// Tight scatter around the center like the reference — top, flanks, bottom,
// middle — each flickering on its own clock so the montage never syncs up.
const SLOTS = [
  { left: "46%", top: "19%", big: true, interval: 520, offset: 0 },
  { left: "36%", top: "43%", interval: 640, offset: 2 },
  { left: "59%", top: "46%", interval: 580, offset: 4 },
  { left: "48%", top: "66%", big: true, interval: 700, offset: 6 },
  { left: "51%", top: "38%", interval: 460, offset: 3 },
];

// Fill-then-drain: lines fade in one by one going down (left) / up (right),
// hold briefly when full, then disappear one by one from where they started.
function FillDrainList({ items, fromBottom = false, tick, align }) {
  const n = items.length;
  const cycle = 2 * n + 2; // n fill beats, 2 hold beats, n drain beats
  const t = tick % cycle;
  let start = 0;
  let end = n;
  if (t < n) end = t + 1; // filling
  else if (t >= n + 2) start = t - (n + 1); // draining
  return (
    <div className="relative" style={{ height: n * LINE_H }}>
      {items.map((txt, j) => {
        const slot = fromBottom ? n - 1 - j : j;
        const on = j >= start && j < end;
        return (
          <div
            key={j}
            className="absolute left-0 right-0 whitespace-nowrap uppercase text-[9px] tracking-[0.18em] text-black/50 md:text-[10px]"
            style={{
              top: slot * LINE_H,
              height: LINE_H,
              lineHeight: `${LINE_H}px`,
              textAlign: align,
              opacity: on ? 1 : 0,
              transform: on ? "translateY(0)" : "translateY(5px)",
              transition: "opacity 0.26s ease, transform 0.26s ease",
            }}
          >
            {txt}
          </div>
        );
      })}
    </div>
  );
}

function Slot({ conf, active }) {
  const [i, setI] = useState(conf.offset % IMAGE_POOL.length);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(
      () => setI((v) => (v + 1) % IMAGE_POOL.length),
      conf.interval
    );
    return () => clearInterval(t);
  }, [active, conf.interval]);

  return (
    <div
      className="absolute -translate-x-1/2 overflow-hidden bg-neutral-200"
      style={{
        left: conf.left,
        top: conf.top,
        width: conf.big ? 112 : 96,
        height: conf.big ? 140 : 120,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={IMAGE_POOL[i]}
        alt=""
        className="h-full w-full object-cover"
        draggable={false}
      />
    </div>
  );
}

export default function Loader() {
  const [active, setActive] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    setActive(!reduced);
    // Warm every montage image so slot swaps are hard cuts, never blanks.
    IMAGE_POOL.forEach((src) => {
      const im = new window.Image();
      im.src = src;
    });
    if (reduced) {
      setTick(LEFT_LINES.length); // hold both lists fully visible
      return;
    }
    const t = setInterval(() => setTick((v) => v + 1), BEAT);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[#fafafa]">
      {/* Left list — fills top-to-bottom, then drains from the top */}
      <div className="absolute left-[8%] top-1/2 w-[19%] -translate-y-1/2">
        <FillDrainList items={LEFT_LINES} tick={tick} align="right" />
      </div>

      {/* Right list — mirror: fills bottom-to-top, drains from the bottom */}
      <div className="absolute right-[8%] top-1/2 w-[19%] -translate-y-1/2">
        <FillDrainList items={RIGHT_LINES} tick={tick} fromBottom align="left" />
      </div>

      {/* Flickering montage cluster */}
      {SLOTS.map((conf, i) => (
        <Slot key={i} conf={conf} active={active} />
      ))}
    </div>
  );
}

"use client";

import Image from "next/image";
import BracketLink from "./BracketLink";
import { initialCaps } from "./FitText";

// The two board frames. Real board images rather than a flat fill: the section
// is a comp card, so the pictures ARE the content — the grey blocks that used
// to sit here read as an unloaded page. Portrait sources, cropped to the 4:5
// frame the boards are set in.
const BOARDS = [
  { src: "/images/img20.jpeg", alt: "OWOLABI MOSIMABALE — board" },
  { src: "/images/img33.jpeg", alt: "OWOLABI MOSIMABALE — board" },
];

// One board: the picture fills the frame and the arrow that was already here
// sits over it. The frame keeps its dark fill underneath, so the layout is
// correct for the moment before the image decodes — the same way the Look
// panels hold their tint. `sizes` matches how wide a board actually gets:
// a third of the viewport once the caption takes its column, half below that.
function Board({ image, className = "", children }) {
  return (
    <div className={`relative flex aspect-4/5 overflow-hidden bg-black/40 ${className}`}>
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        quality={85}
        className="object-cover"
      />
      {/* The controls have to outrank the fill, or the picture buries them. */}
      <div className="relative z-10 flex w-full">{children}</div>
    </div>
  );
}

// The model on the board. Placeholder until the board data lands — one entry
// here feeds every width.
const NAME = ["OWOLABI", "MOSIMABALE"];

// No bio under the name: this is a comp card, so the only facts are the
// measurements. Metric only (the records carry "175 cm / 5'9\"" — the
// imperial half is dropped the same way the model page's `metric()` drops it),
// which is what keeps the block to the two lines it is allowed.
const MEASUREMENTS = [
  ["Height", "175 cm"],
  ["Chest", "81 cm"],
  ["Waist", "58 cm"],
  ["Hips", "86 cm"],
  ["Shoe", "38 EU"],
];

// Name, copy and the portfolio button — the same block at every width; only
// the display size of the name changes.
function Caption({ nameClass = "text-5xl", className = "" }) {
  return (
    <div className={`flex flex-col ${className}`}>
      <h1 className={`uppercase leading-none tracking-wider ${nameClass}`}>
        {NAME.map((word) => (
          // Raised initials, as the name is set on /models. An em bump rather
          // than the rail's fixed 10px, so the step stays proportional at this
          // display size.
          <span key={word} className="block">
            {initialCaps(word, "0.16em")}
          </span>
        ))}
      </h1>

      {/* Measurements, not a bio. They run inline and wrap, so the block stays
          within its two allowed lines at every width instead of becoming a
          five-row table. max-w caps the measure so it can't stretch into a
          third line on a wide third column. */}
      <p className="max-w-[46ch] pt-3 text-[13px] leading-[1.5] text-[#0c0c0c]/70">
        {MEASUREMENTS.map(([label, value], i) => (
          <span key={label} className="whitespace-nowrap">
            {i > 0 && <span className="px-2 text-[#0c0c0c]/30">/</span>}
            <span className="uppercase tracking-wide">{label}</span> {value}
          </span>
        ))}
      </p>

      {/* The bracket pair is the site's button shape. On the model page the
          brackets open when a tab is selected; here there is nothing to select,
          so they open on hover — the closing bracket travelling out the way the
          footer's arrow scales out. See components/BracketLink.jsx. */}
      <BracketLink
        href="/models"
        className="mt-5 text-xs font-bold uppercase text-[#00749E]"
      >
        Model Portfolio
      </BracketLink>
    </div>
  );
}

export default function News() {
  // No heading of its own: the section's title is the "MODELS" wordmark that
  // docks beside CANDOR above it, so a second heading here only repeated it and
  // pushed the boards a screenful down. Removing it also removed the section's
  // own top padding — that pt-14/pt-28 was stacking on top of the wrapper's in
  // body.js, which is where the dead space under the docked line came from.
  return (
    <section className="px-4">
      {/* md and up: two boards side by side, with the caption taking the third
          column from lg. gap-4 matches the page's px-4 edge, so the gutters
          between the boards read the same as the page margin. */}
      <div className="hidden md:block">
        <div className="flex flex-row gap-4">
          <div className="hidden flex-1 items-center lg:flex">
            <Caption nameClass="text-5xl" />
          </div>

          <div className="flex-1">
            <Board image={BOARDS[0]} className="items-center justify-end">
              <button className="ml-auto flex h-10 w-10 items-center justify-center self-center bg-black transition hover:bg-gray-800">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            </Board>
          </div>

          {/* The second board hangs lower than the first — the step is what
              keeps the pair from reading as one wide picture. */}
          <div className="flex-1 pt-11">
            <Board image={BOARDS[1]} className="items-center justify-start">
              <button className="relative -top-11 flex h-10 w-10 items-center justify-center self-center bg-black transition hover:bg-gray-800">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </Board>
          </div>
        </div>

        {/* Below lg there is no third column, so the caption sits under the
            boards instead of beside them. */}
        <Caption className="pt-5 lg:hidden" nameClass="text-5xl" />
      </div>

      {/* Mobile: a single board, both arrows on it, caption underneath. */}
      <div className="pt-14 md:hidden">
        <Board image={BOARDS[0]} className="items-end justify-end">
          <div className="mt-auto ml-auto flex flex-row gap-4 p-4">
            <button className="flex h-8 w-8 items-center justify-center bg-black transition hover:bg-gray-800">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button className="flex h-8 w-8 items-center justify-center bg-black transition hover:bg-gray-800">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </Board>

        <Caption className="pt-5" nameClass="text-3xl" />
      </div>
    </section>
  );
}

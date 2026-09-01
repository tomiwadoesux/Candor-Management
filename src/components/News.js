"use client";

import Link from "next/link";
import { initialCaps } from "./FitText";

// The model behind the campaign currently on the board. Placeholder until the
// campaigns data lands — one entry here feeds every width.
const NAME = ["OWOLABI", "MOSIMABALE"];
const COPY =
  "Amet minim mollit non deserunt ullamco est sit aliqua dolor do hdfjuh iudwygyer iyutvd uyvtwd fi uyv udguvef uyvutsv fdyuevfyefvy, consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam.";

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

      {/* Inter, and a step down from the name's face: the copy is a caption
          under the headline, not a second heading. */}
      <p className="max-w-[52ch] pt-3 text-[13px] leading-[1.5] text-[#0c0c0c]/70">
        {COPY}
      </p>

      {/* Same filled accent button as the model card on a profile — the
          bracket pair is the site's button shape. */}
      <Link
        href="/models"
        className="mt-5 w-fit cursor-pointer bg-[#00749E] px-1 py-1 text-white"
      >
        <h4 className="text-xs font-bold uppercase">[ models portfolio ]</h4>
      </Link>
    </div>
  );
}

export default function News() {
  return (
    <section className="px-4 pt-14 md:pt-28">
      <div className="flex justify-center pb-6">
        <h1 className="text-center text-5xl font-normal text-black md:text-7xl lg:text-8xl">
          campaigns
        </h1>
      </div>

      {/* md and up: two boards side by side, with the caption taking the third
          column from lg. gap-4 matches the page's px-4 edge, so the gutters
          between the boards read the same as the page margin. */}
      <div className="hidden md:block">
        <div className="flex flex-row gap-4">
          <div className="hidden flex-1 items-center lg:flex">
            <Caption nameClass="text-5xl" />
          </div>

          <div className="flex-1">
            <div className="flex aspect-4/5 items-center justify-end bg-black/40">
              <button className="flex h-10 w-10 items-center justify-center bg-black transition hover:bg-gray-800">
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
            </div>
          </div>

          {/* The second board hangs lower than the first — the step is what
              keeps the pair from reading as one wide picture. */}
          <div className="flex-1 pt-11">
            <div className="flex aspect-4/5 items-center justify-start bg-black/40">
              <button className="relative -top-11 flex h-10 w-10 items-center justify-center bg-black transition hover:bg-gray-800">
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
          </div>
        </div>

        {/* Below lg there is no third column, so the caption sits under the
            boards instead of beside them. */}
        <Caption className="pt-5 lg:hidden" nameClass="text-5xl" />
      </div>

      {/* Mobile: a single board, both arrows on it, caption underneath. */}
      <div className="pt-14 md:hidden">
        <div className="flex aspect-4/5 items-end justify-end bg-black/40">
          <div className="flex flex-row gap-4">
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
        </div>

        <Caption className="pt-5" nameClass="text-3xl" />
      </div>
    </section>
  );
}

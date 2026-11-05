"use client";

import { useState } from "react";
import AgencyPage from "../AgencyPage";
import TakeReel from "./TakeReel";
import TakeIndex from "./TakeIndex";
import TakeFrame from "./TakeFrame";

// The agency page in four takes behind a switcher (top centre), the current
// page first, so they can be compared in place. Each take is a whole page and
// self-contained: keep the chosen one, delete the others and this file, and
// point app/agency/page.js back at it. Styles live in about-takes.css, one
// block per take.
//
//   Current — the page as it stands (AgencyPage).
//   Reel    — the chapter list is the nav; pointing at a line swaps the
//             full-bleed picture behind it (OddCommon), at Exo Ape's pace.
//   Index   — print discipline on paper: ruled rows, mono numbers, and a
//             manifesto that leans with the scroll (Obys / Locomotive).
//   Frame   — one GL moment (the name, painted) on near-black, masked line
//             reveals, and a footer that is a destination (Unseen / Basement).

const OPTIONS = ["Current", "Reel", "Index", "Frame"];
const TAKES = { Current: AgencyPage, Reel: TakeReel, Index: TakeIndex, Frame: TakeFrame };

export default function AboutTakes() {
  const [take, setTake] = useState(OPTIONS[0]);
  const Take = TAKES[take];

  return (
    <div className={`at at--${take.toLowerCase()}`}>
      <div className="at-switch" role="group" aria-label="About page design">
        {OPTIONS.map((name) => (
          <button key={name} type="button" aria-pressed={take === name} onClick={() => { setTake(name); window.scrollTo(0, 0); }}>
            {name}
          </button>
        ))}
      </div>
      <Take key={take} />
    </div>
  );
}

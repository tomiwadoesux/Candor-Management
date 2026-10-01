"use client";

import Image from "next/image";
import BracketLink from "./BracketLink";
import { scouting } from "../../data/scouting";
import { agency, joinMailto } from "../../data/agency";
import { models } from "../../data/models";

// The invitation to apply, sitting between the showreel and the footer.
//
// It is an INVITATION, not a second application page. /get-scouted already
// carries the requirements, the digitals brief, the process and the form; a
// landing section that repeated any of that would be a second thing to keep
// correct, and the two would drift. So this says only what a stranger needs
// to decide whether the page is for them — the facts that answer "is this me,
// does it cost anything, and what do I send" — and hands them through.
//
// The copy comes from data/scouting.js, the same source /get-scouted reads, so
// a change to the requirements shows up in both places at once.

// The six shots, each paired with the polaroid that demonstrates it.
//
// The brief is the one part worth SHOWING rather than listing. "Six pictures,
// on a phone, against a plain wall" is abstract until you see six of them; a
// strip of real digitals says what the words cannot.
const REFERENCE = models[0];
const SHOTS = scouting.digitals.shots.map((s, i) => ({
  shot: s.shot,
  // The shot's own reference where the data has one, falling back to the
  // reference model's polaroids — which are digitals shot to this brief, so
  // they stand in correctly rather than as decoration.
  src: s.reference || REFERENCE.polaroids?.[i] || REFERENCE.coverImage,
}));

// Requirements pulled out by LABEL rather than by index — the list is editable
// data, and reordering it should not silently change what this section says.
const requirement = (label) =>
  scouting.requirements.find((r) => r.label === label)?.detail;

// The metric half is dropped: the ranges read as
// `5'8" – 6'0" (173 – 183 cm)` in the data, and both halves in a summary is
// more numbers than this section is for. The full detail is on /get-scouted,
// which is where someone measuring themselves will be.
const imperial = (v) => (v ? String(v).split("(")[0].trim() : "");

const FACTS = [
  ["Women", imperial(requirement("Women"))],
  ["Men", imperial(requirement("Men"))],
  ["Age", requirement("Age")],
  ["Fee", "None, ever"],
].filter(([, value]) => value);

export default function JoinCandor() {
  return (
    // Black, against the white sections either side of it. The showreel above
    // and the footer below are both light, so an invitation set in the same
    // white would read as more of the same page rather than as the one place
    // it asks the reader for something.
    <section className="relative overflow-hidden bg-[#0c0c0c] text-white">
      {/* ---- the statement ---- */}
      {/* Full-bleed and enormous, in the WORDMARK face rather than the body
          serif. Gwyner Condensed is what the logo and the docked MODELS
          heading are set in, so at this size the words read as the agency
          speaking rather than as another heading on the page.
          Sized in vw so it fills the measure at every width — the point of a
          statement is that it reaches both edges. */}
      <div className="px-4 pt-24 md:pt-32">
        <h2
          className="select-none text-center uppercase leading-[0.82] tracking-[0.01em] text-[19vw]"
          style={{ fontFamily: "'Gwyner Condensed', Bitter, serif" }}
        >
          Join Candor
        </h2>
      </div>

      {/* ---- the brief, shown ---- */}
      {/* A strip of the six digitals. It is the argument the copy cannot
          make: this is all we are asking for, and it takes an afternoon.
          Horizontally scrollable below lg rather than wrapped — six 2:3
          frames on a phone would either be postage stamps or six rows deep,
          and a strip that runs off the edge reads as a contact sheet, which
          is what it is. */}
      <div className="mt-16 md:mt-20">
        <ol className="flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:gap-3 [&::-webkit-scrollbar]:hidden">
          {SHOTS.map(({ shot, src }, i) => (
            <li
              key={shot}
              className="w-[38vw] shrink-0 sm:w-[26vw] lg:w-auto lg:flex-1"
            >
              <div className="relative aspect-[2/3] overflow-hidden bg-white/[0.06]">
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 38vw, (max-width: 1024px) 26vw, 16vw"
                  className="object-cover opacity-90"
                />
              </div>
              <div className="flex items-baseline gap-2 pt-2.5">
                {/* tabular-nums so the numerals sit on one column. */}
                <span className="shrink-0 text-[10px] tabular-nums text-white/25">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[11px] leading-[1.3] text-white/55">
                  {shot}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* ---- what it takes, and the way through ---- */}
      <div className="px-4 pb-24 pt-16 md:pb-32 md:pt-20">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 border-t border-white/15 pt-10 lg:grid-cols-[1fr_auto] lg:gap-20">
          <div className="max-w-xl">
            <p className="text-[15px] leading-[1.55] text-white/70 md:text-[17px]">
              {scouting.intro}
            </p>

            <p className="mt-6 text-[13px] leading-[1.55] text-white/40">
              {scouting.digitals.intro}
            </p>

            {/* The anti-scam line, carried through from /get-scouted rather
                than left on that page alone. Someone being approached by a
                fake scout is more likely to land here than on the application
                page, and the rule is only useful where it is read. */}
            <p className="mt-6 text-[13px] leading-[1.55] text-white/40">
              <span className="text-white/70">{scouting.noFees.heading}.</span>{" "}
              Applications are read only at{" "}
              <a
                href={joinMailto}
                className="text-white/70 underline underline-offset-4 transition-opacity hover:opacity-60"
              >
                {agency.join.email}
              </a>
              .
            </p>

            <BracketLink
              href="/get-scouted"
              className="mt-10 text-xs font-bold uppercase text-white"
            >
              Apply to Candor
            </BracketLink>
          </div>

          {/* The facts, ranged right on desktop so the block closes the
              section against the same edge the strip above it ends on.
              The label and value swap order there (lg:order-1/2) so the
              VALUES range against the edge and the labels sit inside them —
              a right-ranged list reads outside-in. */}
          <dl className="flex flex-col gap-2.5">
            {FACTS.map(([label, value]) => (
              <div
                key={label}
                className="flex items-baseline gap-5 lg:justify-end"
              >
                {/* 64px, set by WOMEN — the longest of the four labels. */}
                <dt className="w-[64px] shrink-0 text-[10px] uppercase tracking-[0.1em] text-white/30 lg:order-2 lg:w-auto">
                  {label}
                </dt>
                <dd className="min-w-0 whitespace-nowrap text-[13px] leading-[1.4] text-white/80 lg:order-1">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

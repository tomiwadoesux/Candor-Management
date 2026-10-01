"use client";

import Image from "next/image";
import BracketLink from "./BracketLink";
import { initialCaps } from "./FitText";
import { models } from "../../data/models";

// The model this section features, read from the records rather than restated
// here. It was a set of hardcoded constants, which meant the name, the
// pictures and the measurements on the landing page could all drift from the
// same model's own page.
const FEATURED = models[0];

// The two board frames. Real board images rather than a flat fill: the section
// is a comp card, so the pictures ARE the content — the grey blocks that used
// to sit here read as an unloaded page. Portrait sources, cropped to the 4:5
// frame the boards are set in.
// Taken from the record's own images, and the alt text from its own name, so
// the pictures cannot end up belonging to a different model than the heading.
const BOARD_ALT = `${FEATURED.stageName || FEATURED.name} — board`;
const BOARDS = (
  FEATURED.images?.length ? FEATURED.images : [FEATURED.coverImage]
)
  .slice(0, 2)
  .map((src) => ({ src, alt: BOARD_ALT }));

// One board: the picture fills the frame and the arrow that was already here
// sits over it. The frame keeps its dark fill underneath, so the layout is
// correct for the moment before the image decodes — the same way the Look
// panels hold their tint. `sizes` matches how wide a board actually gets:
// a third of the viewport once the caption takes its column, half below that.
function Board({ image, className = "", children }) {
  return (
    <div
      className={`relative flex aspect-4/5 overflow-hidden bg-black/40 ${className}`}
    >
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
//
// The block reads top to bottom as a comp card does: who it is, a rule, what
// the numbers are, then the way through to the rest of the work.
// The records carry both halves — "175 cm / 5'9\"" — and only the metric one
// is shown, the same way the model page's own `metric()` drops the imperial.
const metric = (v) => (v ? String(v).split("/")[0].trim() : "");

// The heading is the STAGE NAME: it is what the model is booked and credited
// as, and it is the short form the display size is built around. Split on
// whitespace so a two-word stage name still sets as two lines.
const NAME = String(FEATURED.stageName || FEATURED.name)
  .toUpperCase()
  .split(/\s+/);

// No bio: this is a comp card, so the only facts are the ones a booker needs.
// The full legal name and the nationality sit here rather than under the
// heading — they are information about the person, the same kind of fact as
// the measurements, and putting them in the list keeps the heading to the one
// name the work is credited to.
const INFO = [
  ["Name", FEATURED.name],
  ["Nationality", FEATURED.nationality],
  ["Height", metric(FEATURED.height)],
  ["Chest", metric(FEATURED.chest)],
  ["Waist", metric(FEATURED.waist)],
  ["Hips", metric(FEATURED.hips)],
  ["Shoe", metric(FEATURED.shoe)],
].filter(([, value]) => value);

// Name, measurements and the portfolio button.
//
// The block reads top to bottom as a comp card does: who it is, a rule, what
// the numbers are, then the way through to the rest of the work.
function Caption({
  nameClass = "text-5xl",
  // The name's own measure. A prop rather than a constant because the three
  // call sites set the name at three different sizes, and the width that
  // holds the longer word on one line at 44px does not hold it at 48px.
  nameWidth = "w-[320px]",
  // "left" or "right" — which edge the block ranges against. Right is for the
  // desktop column, where the caption sits beside a board and shares its
  // gutter; the stacked layouts below lg keep left.
  align = "left",
  className = "",
}) {
  const right = align === "right";
  return (
    <div
      className={`flex flex-col ${right ? "items-end text-right" : "items-start"} ${className}`}
    >
      {/* A FIXED width, not the column's. The name is the one part of this
          block whose line breaks matter — the two words are two lines by
          design, and letting it size to the column means any later change to
          the column silently re-breaks it.
          A width rather than a max-width: max-w would let the h1
          shrink-to-fit its text, and the name would range against a different
          edge from the block below it.
          max-w-full caps that fixed width at the column, which matters now the
          desktop column is proportional (25%, matching the /models rail): below
          about 1280px the 300px measure is wider than the column, and without
          the cap the name would hang out of it. Above that the cap never binds
          and the fixed width governs, so the line breaks stay as set. */}
      <h1
        className={`${nameWidth} max-w-full uppercase leading-[0.92] tracking-wider ${nameClass}`}
      >
        {NAME.map((word) => (
          // Raised initials, as the name is set on /models. An em bump rather
          // than the rail's fixed 10px, so the step stays proportional at this
          // display size.
          <span key={word} className="block">
            {initialCaps(word, "0.16em")}
          </span>
        ))}
      </h1>

      {/* A hairline between the name and the numbers. The block has three
          parts and no other separation; without it the measurements read as a
          caption hanging off the name rather than as their own section. */}
      <span className="mt-4 block h-px w-10 bg-[#0c0c0c]/25" />

      {/* w-full so the rows resolve against the caption's own width rather
          than their content: without it the <dd> is free to run as wide as its
          text and a long value — a full legal name, where every other row is a
          short measurement — pushes the row past the column instead of
          wrapping inside it.
          text-left even when the block ranges right: the LIST is placed
          against the right edge by the parent, but the rows inside it keep
          their two columns, so the labels stay on one right edge and the
          values on one left edge. */}
      <dl className="mt-3.5 flex w-full flex-col gap-1.5 text-left text-[12px] leading-none">
        {INFO.map(([label, value]) => (
          // justify-end when the block ranges right, so the label/value pair
          // sits against the column's right edge. The list itself is w-full
          // (it has to be, or a long value overflows instead of wrapping), so
          // the rows cannot be pushed over by items-end on the parent — the
          // pushing has to happen inside each row.
          <div
            key={label}
            className={`flex items-baseline gap-3 ${right ? "justify-end" : ""}`}
          >
            {/* Fixed width, so every value starts on the same x however long
                its label is. 96px is set by NATIONALITY, the longest of the
                seven — at 52px, which held when the list was measurements
                only, it wrapped onto a second line and broke the row. */}
            <dt
              className={`w-[96px] shrink-0 uppercase tracking-[0.08em] text-[#0c0c0c]/40 ${right ? "text-right" : ""}`}
            >
              {label}
            </dt>
            {/* min-w-0 lets it shrink below its content width, which is what
                permits the wrap — a flex item defaults to min-width: auto and
                would otherwise refuse to go narrower than its longest word and
                overflow the column instead. */}
            <dd
              className={`min-w-0 leading-[1.25] tabular-nums text-[#0c0c0c] ${right ? "" : "flex-1"}`}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>

      {/* The bracket pair is the site's button shape. On the model page the
          brackets open when a tab is selected; here there is nothing to select,
          so they open on hover — the closing bracket travelling out the way the
          footer's arrow scales out. See components/BracketLink.jsx. */}
      <BracketLink
        href="/models"
        className="mt-8 text-xs font-bold uppercase text-[#00749E]"
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
    // px-3 md:px-5 and the gap-5 below are the /models page's measurements,
    // not this section's own. The caption column here reads as the same left
    // rail that /models carries (app/models/page.js <main> + [data-slot=
    // models-rail]), so the two pages have to agree on the page edge, the
    // gutter and the column's width — see the caption column below.
    <section className="px-3 md:px-5">
      {/* md and up: two boards side by side, with the caption taking the third
          column from lg. */}
      <div className="hidden md:block">
        <div className="flex flex-row gap-4 lg:gap-5">
          {/* The caption column, to the left of both boards.
              lg:w-[25%] + lg:pr-5, matching the /models left rail exactly
              (app/models/page.js, [data-slot=models-rail]). It used to be a
              fixed w-[340px], which meant the two pages' left columns landed
              on different edges at every width but one — proportional here
              tracks the rail through the whole range instead.
              Top-aligned and RIGHT-ranged, against the board beside it: the
              text and the picture share one edge, so the gap between them
              reads as a deliberate gutter.
              STICKY, so the block stays with you for the length of the
              section — see the note on the two nested divs below. */}
          {/* The column is two elements, not one, because the rule and the
              text want opposite things from the flex row.
              The OUTER div carries the width, the padding and the divider,
              and is a normal (stretching) flex child — so the border runs the
              full height of the row, the way [data-slot=models-rail]'s does
              against the grid on /models. self-start here would collapse it
              to the height of the caption and the line would stop a third of
              the way down.
              The INNER div is the sticky one. Stickiness needs slack to
              travel within, which is exactly what the stretched parent now
              provides, so the block still rides down the section. */}
          <div className="hidden shrink-0 lg:block lg:w-[25%] lg:border-r lg:border-black/10 lg:pr-5">
            <div className="sticky top-24">
              <Caption
                nameClass="text-[44px]"
                nameWidth="w-[300px]"
                className="pt-1"
                align="right"
              />
            </div>
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
              keeps the pair from reading as one wide picture.
              It is also NARROWER: basis-[38%] against the first board's
              flex-1, so the two no longer split the space evenly. The width
              the second one gives up falls into the gap between them, which
              is the point — the pair reads as two separate pictures with air
              between rather than a diptych with a seam. The aspect-4/5 on the
              board itself means the narrower column is a shorter picture too,
              which deepens the step the comment above describes. */}

          {/* pt-44 below lg, where this column is only the board. From lg the
              padding is replaced by the facts block, which is given that same
              height (h-44) and fills it — so the BOARD still starts on the
              same line, but the space above it is occupied rather than blank.
              h-44 and pt-44 are one number in two places. */}
          <div className="flex-1 pt-44 lg:max-w-[38%] lg:flex-none lg:basis-[38%] lg:pt-0">
            {/* The three facts, TAKING the room the drop above opens up
                rather than sitting at the top of it: h-44 is the column's own
                pt-44, so the block is exactly as tall as the gap was, and
                justify-between drives the name to the top edge and the
                numbers to the bottom, where they meet the board.
                Deliberately only name / height / waist — the full list is
                already in the caption column to the left, so repeating it
                whole would read as a duplicate. These three are the short
                form: who, and the two numbers that get asked first.
                Values come from the same FEATURED record and the same
                metric() helper the caption uses, so the two blocks cannot
                disagree about the model they describe. */}
            <dl className="hidden h-44 flex-col justify-between pb-5 lg:flex">
              <div>
                <dt className="sr-only">Name</dt>
                {/* Set at the size the space can carry — the block is display
                    type here, not a label. leading-[0.92] matches the
                    caption's name so the two read as one family. */}
                <dd className="text-[32px] uppercase leading-[0.92] tracking-wider text-[#0c0c0c] xl:text-[40px]">
                  {FEATURED.stageName || FEATURED.name}
                </dd>
              </div>

              {/* The numbers, on one line along the foot of the space. A rule
                  above them separates the pair from the name the way the
                  caption's hairline does. */}
              <div>
                <span className="mb-3 block h-px w-10 bg-[#0c0c0c]/25" />
                <div className="flex items-baseline gap-8 text-[12px] leading-none">
                  {[
                    ["Height", metric(FEATURED.height)],
                    ["Waist", metric(FEATURED.waist)],
                  ]
                    .filter(([, value]) => value)
                    .map(([label, value]) => (
                      <div key={label} className="flex flex-col gap-1.5">
                        <dt className="uppercase tracking-[0.08em] text-[#0c0c0c]/40">
                          {label}
                        </dt>
                        <dd className="tabular-nums text-[#0c0c0c]">
                          {value}
                        </dd>
                      </div>
                    ))}
                </div>
              </div>
            </dl>

            <Board image={BOARDS[1]} className="items-center justify-start">
              {/* -top-28 cancels the column's pt-28 exactly. The button is
                  centred within THIS board, which now hangs lower than the
                  first, so without the pull-up the two arrows would sit on
                  different lines. The two values are one number in two
                  places: if the drop changes, this changes with it. */}
              <button className="relative -top-44 flex h-10 w-10 items-center justify-center self-center bg-black transition hover:bg-gray-800">
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
        <Caption
          className="pt-8 lg:hidden"
          nameClass="text-5xl"
          nameWidth="w-[340px]"
        />
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

        <Caption className="pt-5" nameClass="text-3xl" nameWidth="w-[220px]" />
      </div>
    </section>
  );
}

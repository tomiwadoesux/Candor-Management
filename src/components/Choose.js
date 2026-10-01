"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { initialCaps } from "./FitText";
import ChromeLink from "./ChromeLink";
import { NUMBER_CARDS, BOARD_SLOT_NUMBERS } from "./Hero2";
import { agency, joinMailto, contactMailto } from "../../data/agency";

// Mirrors the chrome on the closing sphere board (app/sphere2/Sphere2.jsx), so
// the contact details read as the same set of controls in both places. Those
// are module-local there, so they are restated here rather than exported —
// keeping the footer's own markup untouched.
const TOPIC = "text-[12px] font-bold uppercase tracking-[0.02em]";

// The gap down the middle, between the two cards.
const GUTTER = "2rem";

// The two boards the section offers. Each carries its own set of images, which
// cycle inside the card — that quiet change is what signals there is a whole
// portfolio behind the box, before you have clicked anything.
// Image 0 of each board is the photograph on the hero card this card grows
// out of (Hero2 layoutData, board: 0 / board: 1). The card starts the intro
// sitting exactly on that hero card and dissolves in over it, so the two must
// show the same picture or the replacement is visible. Change one, change
// the other. The carousel holds on image 0 until the card has landed.
const BOARDS = [
  {
    label: "MODELS",
    href: "/models",
    images: [
      "/images/img1.jpeg", // = Hero2 board: 0
      "/images/img8.jpeg",
      "/images/img14.jpeg",
      "/images/img3.jpeg",
    ],
  },
  {
    label: "TALENTS",
    href: "/talents",
    images: [
      "/images/img24.jpeg", // = Hero2 board: 1
      "/images/img15.jpeg",
      "/images/img25.jpeg",
      "/images/img31.jpeg",
    ],
  },
];


const CYCLE_MS = 3400; // how long each image holds before the next fades in

export default function Choose() {
  // One index per board. They advance on the same interval but start offset,
  // so the two cards never change at the same instant — simultaneous swaps
  // read as a glitch, staggered ones read as two independent portfolios.
  const [frames, setFrames] = useState(() => BOARDS.map(() => 0));
  const [hovered, setHovered] = useState(null);
  const reducedRef = useRef(false);
  // Set once the intro has put the cards home (page.js flags the root with
  // data-landed). Until then each card holds image 0 — the hero's photograph.
  // Scrolling back up clears the flag and resets both to image 0 again.
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    const root = document.querySelector("[data-choose-root]");
    if (!root) return;
    const sync = () => {
      const on = root.hasAttribute("data-landed");
      setLanded(on);
      if (!on) setFrames(BOARDS.map(() => 0));
    };
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ["data-landed"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    reducedRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    // No cycling under reduced motion — each card simply keeps its first image.
    if (reducedRef.current) return;
    if (!landed) return;

    const timers = BOARDS.map((board, i) =>
      setInterval(
        () =>
          setFrames((prev) => {
            const next = [...prev];
            next[i] = (next[i] + 1) % board.images.length;
            return next;
          }),
        CYCLE_MS
      )
    );
    // Offset the second card by half a cycle so the swaps interleave.
    const offset = setTimeout(() => {
      setFrames((prev) => {
        const next = [...prev];
        next[1] = (next[1] + 1) % BOARDS[1].images.length;
        return next;
      });
    }, CYCLE_MS / 2);

    return () => {
      timers.forEach(clearInterval);
      clearTimeout(offset);
    };
  }, [landed]);

  return (
    <div data-choose-root className="relative bg-white w-full overflow-hidden">
      <div
        // px-3 md:px-5 is the site-wide page padding (12px, then 20px from
        // desktop) — the same rule the models page and the sphere footer use,
        // so this section's edges line up with every other page.
        className="relative z-10 w-full h-[80vh] lg:h-[100vh] flex flex-col justify-center px-3 md:px-5"
        style={{
          // Top padding runs ahead of the bottom so the block sits below centre:
          // at dead centre it crowds the CANDOR logo docked above it. Eased
          // back from 9vh since the card block now carries its own downward
          // margin — without that the two stacked and overflowed the section
          // on shorter screens.
          paddingTop: "clamp(3rem, 6vh, 6rem)",
          paddingBottom: "3.25rem",
        }}
      >
        {/* The intro effect in app/page.js scales and raises this whole block,
            so it keeps the data-choose-titles hook and the willChange hint. */}
        <div
          data-choose-titles
          className="relative flex w-full flex-col items-center"
          style={{
            willChange: "transform",
            // Nudges the cards and their titles down the section. Applied as
            // a margin on THIS block rather than as section padding, so the
            // flanking INFO / MODELS & TALENT columns keep their own anchoring
            // to the card block and are not pushed down with it.
            // Eased back a little from 3vh — the pair was sitting slightly low.
            marginTop: "clamp(0.5rem, 1.5vh, 2rem)",
          }}
        >
          {/* --- the two boards --- */}
          {/* Relative wrapper spanning exactly the card block, so the two
              detail columns can anchor to the cards' real top and bottom
              edges rather than to the section (whose height includes the
              padding above and below). */}
          <div className="relative w-full">
        {/* The contact details that also close the page on the sphere
                board, brought up here to flank the two cards. Absolutely
                positioned against the section so they hold the left and right
                edges without widening the grid or shifting the cards off centre.
                Hidden below lg, where there is no room beside them.

                The two are anchored to OPPOSITE edges of the card block: INFO to
                its top, MODELS & TALENT to its bottom.

                INFO sits beside the LEFT CARD rather than at the grid's edge.
                The card is centred in its own grid column and narrower than
                it, by an amount that changes with the viewport (70px of slack
                at 1440x900, 26px at 1920x1080) — so a fixed inset would drift
                off the card. Instead the column's right edge is pinned to the
                card's left edge, computed from the same width rule the card
                itself uses: half the grid, less half the gutter, less half the
                card's width. Text is right-aligned into that edge, so it
                always ends a fixed 1.25rem short of the photograph. */}
            <div
              data-choose-detail
              className="pointer-events-none absolute left-0 top-0 hidden text-[14px] leading-[1.45] text-black lg:block"
            >
              <div className="flex flex-col items-start">
                <span className={TOPIC}>INFO</span>
                <div className="mt-3 flex flex-col items-start">
                  <ChromeLink left>Instagram</ChromeLink>
                  <ChromeLink left>Linkedin</ChromeLink>
                  <ChromeLink left>Youtube</ChromeLink>
                  <ChromeLink left href={contactMailto}>
                    {agency.contact.email}
                  </ChromeLink>
                  <ChromeLink left href={agency.contact.phoneHref}>
                    {agency.contact.phone}
                  </ChromeLink>
                </div>
              </div>
            </div>

            {/* Bottom-aligned with the bottom edge of the CARD IMAGE, not of
                the whole card block — the block also contains the label under
                each photograph, so bottom-0 would sit this column a heading's
                height too low. The offset is the label block's own height:
                its mt-4 (1rem) plus the heading's line box. */}
            <div
              data-choose-detail
              className="pointer-events-none absolute right-0 hidden text-[14px] leading-[1.45] text-black lg:block"
              style={{ bottom: "calc(1rem + clamp(2.25rem, 5.4vw, 4.25rem))" }}
            >
              <div className="flex flex-col items-end">
                <span className={TOPIC}>MODELS &amp; TALENT</span>
                <div className="mt-3 flex flex-col items-end">
                  <ChromeLink href={joinMailto}>{agency.join.email}</ChromeLink>
                  <ChromeLink href={agency.join.phoneHref}>
                    {agency.join.phone}
                  </ChromeLink>
                  <ChromeLink href="/get-scouted">Become a Talent</ChromeLink>
                  <ChromeLink href="/get-scouted">Submit Polaroids</ChromeLink>
                </div>
              </div>
            </div>


          {/* Narrower than the old max-w-6xl so the two cards read as a
              considered pair rather than filling the width edge to edge. */}
          <div
            className="mx-auto grid w-full max-w-4xl grid-cols-1 grid-rows-1 lg:max-w-5xl md:grid-cols-2"
            style={{ gap: GUTTER }}
          >
            {BOARDS.map((board, i) => {
              const isDimmed = hovered !== null && hovered !== i;
              return (
                <Link
                  key={board.label}
                  href={board.href}
                  data-board-card
                  // data-fast on the second card so the intro flies the two in
                  // from slightly different depths rather than as one block.
                  data-fast={i === 1 ? "" : undefined}
                  // The veil below already carries the hovered/not-hovered
                  // contrast, so the old blur(6px) + 0.55 opacity dim on the
                  // whole card is dropped: stacked on the veil it buried the
                  // other card, and it blurred the labels underneath the frame
                  // too, which should stay crisp. A light opacity step is all
                  // that is left.
                  // NO inline opacity and NO opacity transition here. The
                  // intro's scroll loop writes this element's opacity every
                  // frame to cross-fade it with the hero card it morphs out
                  // of; a React-managed inline value would overwrite that on
                  // each render, and a 500ms transition would make every
                  // per-frame write lag behind the scroll. The hover dim moves
                  // onto the frame inside instead.
                  className="group block"
                  style={{ opacity: 0 }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* The photograph, with a light black veil that lifts on
                      hover. No text is drawn over it — the labels live below
                      the frame — so the only thing on the image is the veil. */}
                  {/* Taller, narrower frame (2:3 rather than 4:5). The
                      section is height-capped, so the ratio alone is not
                      enough — maxHeight keeps a tall card from pushing the
                      labels below it out of the viewport on short screens,
                      and the image simply gets narrower instead. */}
                  <div
                    data-board-frame
                    className="relative mx-auto overflow-hidden bg-neutral-100"
                    data-dimmed={isDimmed ? "" : undefined}
                    style={{
                      // NO inline opacity here. The intro's scroll loop writes
                      // this element's opacity every frame to cross-fade it
                      // with the flying hero card it takes over from, and a
                      // React-managed value would overwrite that on every
                      // hover render. The hover dim is carried by the veil
                      // below (which already goes 0.35 -> 0) plus the
                      // brightness filter here, neither of which touches
                      // opacity.
                      filter: isDimmed ? "brightness(0.82)" : "none",
                      transition: "filter 500ms",
                      aspectRatio: "2 / 3",
                      // Sized by WIDTH, not height. Capping maxHeight on an
                      // aspect-ratio box shrinks the height but leaves the
                      // width alone, which letterboxes the frame instead of
                      // scaling it. Deriving the width from the viewport
                      // height (a 2:3 box 71vh tall is 47.3vh wide) keeps the
                      // ratio exact while still guaranteeing the card and its
                      // labels fit the height-capped section.
                      width: "min(100%, 47.3vh, 470px)",
                    }}
                  >
                    {/* Every image is mounted and stacked; only opacity
                        changes, so a swap is a cross-dissolve with nothing to
                        load at the moment it happens. */}
                    {/* One layer holding every image. The intro reshapes the
                        frame by its real width/height rather than scaling it,
                        so nothing in here is ever counter-transformed — the
                        images just re-crop against the new box. */}
                    <div
                      data-board-media
                      className="absolute inset-0"
                      style={{ willChange: "transform" }}
                    >
                    {board.images.map((src, f) => (
                      <Image
                        key={src}
                        src={src}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority={f === 0}
                        className="object-cover transition-opacity duration-[1200ms] ease-in-out"
                        style={{ opacity: frames[i] === f ? 1 : 0 }}
                      />
                    ))}
                    </div>

                    {/* Black veil over the photograph at rest, lifting on
                        hover so the image comes forward. Kept light (35%) —
                        enough to hold the two cards back as a quiet pair
                        without burying the photograph underneath it. Sits
                        above the stacked images and below nothing else, since
                        all the text now lives outside this frame. */}
                    <div
                      className="pointer-events-none absolute inset-0 bg-black transition-opacity duration-500 ease-out"
                      style={{ opacity: hovered === i ? 0 : 0.35 }}
                    />
                    {/* Temporary: this card sits on hero slot N — show N so
                        the field can be rearranged by number (see Hero2). */}
                    {NUMBER_CARDS && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <span className="bg-white/85 px-4 py-2 text-black font-medium text-4xl tabular-nums">
                          {BOARD_SLOT_NUMBERS[i]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* The board name sits UNDER the photograph, in the page's
                      own black-on-white, centred on the card.
                      Same width rule as the frame above (and mx-auto), so
                      the labels centre on the PHOTOGRAPH rather than on the
                      link box — the image is narrower than its link once the
                      viewport-height cap kicks in, and centring on the link
                      would leave the text visibly off to one side of it. */}
                  <div
                    data-board-label
                    className="mx-auto mt-4 flex flex-col items-center"
                    style={{ width: "min(100%, 47.3vh, 470px)" }}
                  >
                    <h2
                      className="text-center font-medium leading-none tracking-[0.025em] text-black"
                      style={{ fontSize: "clamp(2.25rem, 5.4vw, 4.25rem)" }}
                    >
                      {initialCaps(board.label, "0.22em")}
                    </h2>

                  </div>
                </Link>
              );
            })}
          </div>
          {/* closes the relative wrapper that spans the card block */}
          </div>

        </div>
      </div>
    </div>
  );
}

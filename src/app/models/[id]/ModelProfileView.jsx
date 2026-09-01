"use client";

import Image from "next/image";
import Link from "next/link";
import Header from "@/components/header";
import LogoAnimation from "@/components/LogoAnimation";
import FitText, { initialCaps } from "@/components/FitText";
import { useEffect, useRef, useState } from "react";
import MorphGallery from "@/components/MorphGallery";
import Lightbox from "@/components/Lightbox";
import { countryCode } from "@/lib/countryCode";

// The four boards, in the order they run across the top of the page. `key`
// doubles as the link label and as the lookup into `galleries` (lower-cased),
// so adding a board is one entry here plus one in the page's gallery builder.
//
// No titles: a board used to open with its own "Selected Campaigns / Featured
// Works" heading, which competed with the name it was sitting under. The text
// behind the work is the profile itself — the pinned hero below — so the
// boards now start straight into pictures.
// The profile alternates rows of four and rows of three. A constant so the
// array identity is stable — MorphGallery re-packs and re-binds its scroll
// listeners when it changes.
const ROW_SIZES = [4, 3];

const TABS = [
  { key: "COVERS", label: "Covers" },
  { key: "CAMPAIGNS", label: "Campaigns" },
  { key: "RUNWAY", label: "Runway" },
  { key: "VIDEOS", label: "Videos" },
];

export default function ModelProfileView({ model, galleries }) {
  // Campaigns is the board with photographs behind it, so the page opens on
  // it rather than on an empty Covers state. Move this back to TABS[0].key
  // once covers has its own imagery.
  const [activeCategory, setActiveCategory] = useState("CAMPAIGNS");

  // The tile a viewer picked out of whichever board is showing.
  const [lightbox, setLightbox] = useState(null);

  // Clips the hero's pictures away from the bottom up once the board starts
  // arriving, and brings them back once it has gone again.
  //
  // Scroll is the trigger here, not the scrubber. Tying the clip to scroll
  // position made it march up in lockstep with the wheel, which reads as a
  // mechanism rather than a move. Crossing the threshold instead fires a fixed
  // eased run that owns itself: it plays to the end at its own speed, and
  // scrolling the other way mid-flight does not interrupt it. Only once it has
  // settled does the threshold matter again — so scrolling back up past it
  // plays the return.
  //
  // The threshold is the board's own top edge crossing 85% of the viewport, so
  // it lands on the same beat at any height. See styles/model-profile.css.
  const pageRef = useRef(null);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const DURATION = 240; // ms — the whole clip, however fast you scroll
    const TRIGGER = 0.85; // fraction of the viewport the board's top must pass

    // easeInOutCubic: leaves and lands soft, quick through the middle.
    const ease = (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    let raf = 0;
    let anim = 0;
    let clipped = false; // where the pictures currently are
    let running = false; // a run owns the clip until it finishes

    const set = (v) => page.style.setProperty("--hero-clip", v.toFixed(4));

    // How far each hero block has to travel to sit flush on the page's left
    // edge. Measured with the blocks pinned back to their resting positions,
    // since a rect already includes whatever transform is on them.
    const PAD = 16; // px-4 — the edge the wordmark and the board sit on

    // Wrap each rendered line of the bio in its own block so it can be moved
    // independently. The wrap points come from the shaped column in the CSS;
    // this only freezes them. Re-run on resize, since the lines break
    // differently at another width.
    const splitBio = () => {
      const bio = page.querySelector(".hero-slide--bio");
      if (!bio) return;

      if (bio.dataset.split === "true") {
        bio.innerHTML = bio.dataset.source || bio.innerHTML;
      } else {
        bio.dataset.source = bio.innerHTML;
      }
      // Clear the flag before measuring, not after: the shaping float is
      // switched off by [data-split="true"], so leaving it set would let a
      // re-split wrap the text in a plain rectangle and lose the taper.
      delete bio.dataset.split;
      // eslint-disable-next-line no-unused-expressions
      bio.offsetHeight; // reflow, so the restored text is laid out shaped

      if (!bio.getBoundingClientRect().width) return; // display:none below lg

      // One rect per rendered line, walked over the paragraph's text.
      const range = document.createRange();
      const walker = document.createTreeWalker(bio, NodeFilter.SHOW_TEXT);
      const breaks = [];
      let last = null;
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        for (let i = 0; i < n.length; i++) {
          range.setStart(n, i);
          range.setEnd(n, i + 1);
          const top = Math.round(range.getBoundingClientRect().top);
          if (last !== null && top !== last) breaks.push([n, i]);
          last = top;
        }
      }
      if (!breaks.length) return;

      // Build each line by cloning the range between consecutive break points.
      // Cloning rather than extracting matters: extracting mutates the tree the
      // later ranges still point into, which nests the line spans inside one
      // another and stacks their offsets into a staircase.
      const frag = document.createDocumentFragment();
      const bounds = [null, ...breaks, null];
      for (let i = 0; i < bounds.length - 1; i++) {
        const r = document.createRange();
        if (bounds[i]) r.setStart(bounds[i][0], bounds[i][1]);
        else r.setStartBefore(bio.firstChild);
        if (bounds[i + 1]) r.setEnd(bounds[i + 1][0], bounds[i + 1][1]);
        else r.setEndAfter(bio.lastChild);

        const line = document.createElement("span");
        line.className = "hero-line";
        line.appendChild(r.cloneContents());
        frag.appendChild(line);
      }

      // Four lines is the whole bio's allowance. Anything past that is cut and
      // signposted rather than shown — the profile is a caption, not a page of
      // copy. The link is inert for now; it is there so the truncation reads as
      // deliberate rather than as text that ran out.
      const MAX_LINES = 4;
      const lines = [...frag.children];
      if (lines.length > MAX_LINES) {
        for (const extra of lines.slice(MAX_LINES)) extra.remove();
        const last = lines[MAX_LINES - 1];
        last.appendChild(document.createTextNode("… "));
        const more = document.createElement("span");
        more.className = "hero-more";
        more.textContent = "read more";
        last.appendChild(more);
      }

      bio.replaceChildren(frag);
      bio.dataset.split = "true";
    };

    const measure = () => {
      page.dataset.measuring = "true";

      // The text blocks all go to the same left edge. The wordmark is not one
      // of them — it stays put at the top left.
      for (const el of page.querySelectorAll(".hero-slide")) {
        const pad = parseFloat(getComputedStyle(el).paddingLeft) || 0;
        const left = el.getBoundingClientRect().left + pad;
        el.style.setProperty("--shift", `${Math.round(PAD - left)}px`);
      }

      const bio = page.querySelector(".hero-slide--bio");

      // Each line is offset right by half its own slack, which reads as
      // centred; the offsets run out to zero when the block goes flush left.
      if (bio) {
        const cs = getComputedStyle(bio);
        const inner =
          bio.getBoundingClientRect().width -
          (parseFloat(cs.paddingLeft) || 0) -
          (parseFloat(cs.paddingRight) || 0);
        for (const line of bio.querySelectorAll(".hero-line")) {
          const slack = inner - line.getBoundingClientRect().width;
          line.style.setProperty(
            "--line-shift",
            `${Math.max(Math.round(slack / 2), 0)}px`
          );
        }
      }

      delete page.dataset.measuring;
    };

    const run = (to) => {
      running = true;
      const started = performance.now();
      const from = to ? 0 : 1;
      const span = to ? 1 : -1;

      const step = (now) => {
        const t = Math.min((now - started) / DURATION, 1);
        set(from + span * ease(t));
        if (t < 1) {
          anim = requestAnimationFrame(step);
        } else {
          anim = 0;
          running = false;
          clipped = to;
          check(); // the page may have moved on while we were busy
        }
      };

      cancelAnimationFrame(anim);
      anim = requestAnimationFrame(step);
    };

    const check = () => {
      raf = 0;
      const board = page.querySelector("[data-board]");
      if (!board) return;
      const past =
        board.getBoundingClientRect().top < window.innerHeight * TRIGGER;

      // The text follows the threshold straight away — it is a CSS transition
      // and owns its own timing, so it has no reason to wait on the clip.
      page.dataset.shifted = past ? "true" : "false";

      if (running) return; // clip mid-flight: it finishes on its own terms
      if (past !== clipped) run(past);
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };

    const layout = () => {
      splitBio();
      measure();
    };

    layout();
    // Fonts land after first paint and move everything sideways.
    document.fonts?.ready.then(layout).catch(() => {});

    const onResize = () => {
      layout();
      schedule();
    };

    // Settle to whichever end the page already sits at, with no animation.
    const board = page.querySelector("[data-board]");
    if (board) {
      clipped = board.getBoundingClientRect().top < window.innerHeight * TRIGGER;
      set(clipped ? 1 : 0);
    }

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("load", onResize);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(anim);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", onResize);
    };
    // The board is swapped out on a tab change, so re-measure against the new
    // one — its top edge is what the trigger is keyed to.
  }, [activeCategory]);

  // Download card is decorative for now — clicking runs no download, it just
  // bounces the arrow. Keying the arrow on this count replays the animation
  // on every click (a fresh mount restarts the CSS animation).
  const [downloadClicks, setDownloadClicks] = useState(0);
  const handleDownloadClick = () => setDownloadClicks((c) => c + 1);

  const categories = TABS;

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
  };

  // The big frame keeps the cover shot; the strip shows four other polaroids,
  // so the same picture is never on screen twice.
  const heroSrc = model.face;
  const stripPolaroids = model.polaroids
    .filter((src) => src !== heroSrc)
    .slice(0, 4);

  // The data stores both systems ("180 cm / 5'11\""); the page shows metric,
  // matching the rail on /models.
  const metric = (v) => (v ? String(v).split("/")[0].trim() : "");

  // The record stores the board as "MAIN BOARD"; under a "Board:" label the
  // second word is just the label again, so drop it.
  const boardName = (v) => (v ? String(v).replace(/\s*board\s*$/i, "") : "");

  // Comp-card facts. Rows with nothing behind them are dropped rather than
  // printed as a dash — `based` only exists on a few models.
  const factColumns = [
    [
      ["Height", metric(model.height)],
      ["Waist", metric(model.waist)],
      ["Chest", metric(model.chest)],
      ["Shoe", metric(model.shoe)],
    ],
    [
      // Alpha-3, and uppercase: the column is lowercase everywhere else, but a
      // country code set in lower case reads as a clipped word rather than a
      // code. See lib/countryCode.js.
      ["Nationality", countryCode(model.nationality), "uppercase"],
      ["Eyes", model.eyeColor],
      ["Board", boardName(model.board)],
      ["Hair", model.hairColor],
    ],
  ].map((col) => col.filter(([, value]) => value));

  return (
    <section ref={pageRef} className="bg-[#fafafa] text-[#0c0c0c] min-h-screen">
      <Header />

      {/* One row: the wordmark's half matches the info column and the links'
          half matches the hero column, so the links justify across exactly the
          image's width. Below lg the links simply take the space left over, so
          they stay reachable when the hero column is hidden. The row's py is
          the only thing between the top of the page and the image. */}
      <div className="sticky top-0 z-30 flex h-14 items-center bg-[#fafafa] py-4">
        <div className="shrink-0 px-4 lg:w-2/3">
          <Link
            href="/"
            aria-label="CANDOR home"
            className="block w-fit text-black"
          >
            <LogoAnimation animate={false} tight className="w-[110px]" />
          </Link>
        </div>

        {/* -mx-1 cancels the px-1 the accent chips carry, so the first link
            starts on the image's left edge and the last ends on the page's
            content edge. */}
        <div className="flex-1 pr-4 lg:w-1/3 lg:flex-none">
          <div className="-mx-1 md:-mx-2 flex flex-row justify-between">
            {categories.map(({ key: category, label }) => (
              <div key={category} onClick={() => handleCategoryClick(category)}>
                <div className="group relative flex flex-row cursor-pointer px-1 md:px-2">
                  <div
                    className={`absolute inset-0 bg-[#00749E] transition-transform duration-200 ease-out origin-left ${
                      activeCategory === category ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                  <h4
                    data-active={activeCategory === category}
                    // Four labels have to clear the logo on a 375px screen,
                    // so they step down a size below md rather than wrapping —
                    // the row is a fixed 56px tall and can't take a second line.
                    className={`tab-link relative z-10 flex items-center whitespace-nowrap text-[10px] md:text-xs font-normal transition-colors duration-200 ${
                      activeCategory === category ? "text-white" : ""
                    }`}
                  >
                    {/* Idle the pair sits ahead of the word — [ ] Campaigns —
                        and selecting opens them around it. The label's track
                        grows from 0fr, which pushes the closing bracket out;
                        see styles/tab-link.css.

                        The sizer is an invisible copy that holds the link's
                        width open. The animated layer floats above it, and
                        while the track is closed the label spills out of a
                        zero-width box — so without this the row would lay the
                        links out as if they were only "[ ]" wide and the last
                        label would run off the edge. It also means switching
                        tabs never reflows the row. */}
                    <span className="tab-link__sizer" aria-hidden="true">
                      [&nbsp;]&nbsp;{label}
                    </span>
                    <span className="tab-link__live">
                      <span>[</span>
                      <span className="tab-link__well">
                        <span className="tab-link__label">{label}</span>
                      </span>
                      <span>]</span>
                    </span>
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* The profile pins under the wordmark/tabs row and stays there: it is
          the text that shows behind the work, so the boards ride up over it
          rather than pushing it off the page. Sticky at every width now — it
          used to pin only on lg, which left the name scrolling away on a
          laptop or a phone.

          Below lg the height is left natural rather than forced to the
          viewport: the narrow layouts stack a face image into this column, and
          pinning a box that is a little taller than the screen just means its
          last few rows sit behind the incoming board, which is the intended
          read anyway.

          No overflow: hidden here. The name below is FitText scaled to fill a
          fixed-height slot, and a display face's ascenders run past that line
          box — clipping this container took the tops off the letters. The
          overhang needs no clip anyway: the boards are an opaque z-20 panel
          over this z-0 one, so whatever hangs below is covered. */}
      <div className="sticky z-0 top-14 max-h-[calc(100vh-3.5rem)] min-h-auto md:min-h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-3.5rem)] lg:min-h-0 flex flex-row ">
        {/* Slim rule down the gutter between the info column and the hero
            image. left-2/3 is the column boundary; -ml-2 pulls it back half the
            16px gutter so it sits centred in the gap rather than against the
            image's edge. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-2/3 -ml-2 hidden w-px bg-black/15 lg:block"
        />
        {/* The hero image is pinned to a third of the screen, so the info
            column is always the other two thirds — and the name, which scales
            to fill this column, follows from that. */}
        <div className="relative w-full shrink-0 lg:w-2/3 flex flex-col pb-4">
          <div className="px-4">
            {/* One line, scaled to span the column. The slot has a fixed
                height with the line centred, so a short name and a long one
                take up exactly the same room and nothing below shifts. */}
            <h1 className="h-20 uppercase md:h-28 lg:h-36">
              {/* Stage names are single words, so the height cap leaves slack
                  in the column — centring it balances that instead of leaving
                  a long empty right side. No optical-left nudge: that pulls
                  against the centring. */}
              <FitText
                capToHeight
                align="center"
                className="font-normal leading-none hero-slide hero-slide--name"
              >
                {/* Same raised initials as the /models rail. An em bump rather
                    than the rail's fixed 10px, so the step stays proportional
                    at this display size. */}
                {initialCaps(model.stageName || model.name, "0.22em")}
              </FitText>
            </h1>

            {/* Bio takes the slot directly under the name, held to a measure so
                it does not run the full width of a large column. */}
          </div>
          {/* Bio, facts and the button sit as one block on a tight rhythm
              under the name. The leftover height falls into a single gap above
              the strip rather than being split above and below the block —
              centring it in a full-height column pushed every gap past 70px. */}
          <div className="flex flex-col">
          {(model.bio || model.name) && (
            <p className="hero-slide hero-slide--bio hidden lg:block w-full max-w-[64ch] self-center px-4 pt-2 text-[14px] leading-[1.45] text-[#0c0c0c]/70">
              {/* The headline carries the stage name, so the full name opens
                  the bio instead of being dropped from the page. */}
              <span className="font-bold text-[#0c0c0c]">{model.name}</span>
              {model.bio ? ` — ${model.bio}` : ""}
            </p>
          )}

          {/* Comp-card facts under the name: measurements on the left, the
              rest of the record beside them. */}
          <div className="hero-slide hero-slide--facts hero-facts mx-auto hidden w-fit lg:grid grid-cols-[auto_auto] gap-x-4 gap-y-2 px-4 pt-6">
            {factColumns.map((column, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 text-[14px] leading-[1.45] lowercase"
              >
                {column.map(([label, value, valueClass = ""]) => (
                  <h4 key={label}>
                    {/* Labels run in the display face against Inter values.
                        14px, not the values' 12px: Arno's caps are 0.615em to
                        Inter's 0.728em, so matching px would render them a
                        size smaller. No bold — Arno has one weight, and a
                        synthetic bold muddies caps at this size; the serif and
                        the caps already separate label from value. */}
                    <span className="font-display text-[14px] uppercase tracking-[0.02em]">
                      {label}:
                    </span>{" "}
                    <span className={valueClass}>{value}</span>
                  </h4>
                ))}
              </div>
            ))}
          </div>
          {/* Download card (left) and measurements (right) anchored to the
              bottom of the column so a long name never pushes them out. */}
          <div className="flex flex-row pt-6 px-4">
            <div className="flex flex-1 flex-col sm:gap-5 justify-between">
              {/* Measurements on the left, download card at the top-right,
                  both anchored to the top of the row. */}
              <div className="flex flex-row items-start justify-center gap-4">
                {/* Download model card — a filled accent button matching the
                    category tabs. No real download yet; the click only bounces
                    the arrow. The icon sits inside the [ ] of the label. */}
                <div className="hero-slide hero-slide--button hidden md:block">
                  <button
                    type="button"
                    onClick={handleDownloadClick}
                    className="w-fit cursor-pointer bg-[#00749E] px-1 py-1 text-left text-white"
                  >
                    <h4 className="text-xs uppercase font-bold flex items-center gap-1.5">
                      <span>[ model card</span>
                      <svg
                        width="14"
                        className="self-center"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g clipPath="url(#clip0_1484_262)">
                          <path
                            d="M1.16797 7.18945V11.6063C1.16797 11.9409 1.30452 12.2619 1.54757 12.4986C1.79063 12.7352 2.12028 12.8682 2.46402 12.8682H11.5364C11.8801 12.8682 12.2098 12.7352 12.4528 12.4986C12.6959 12.2619 12.8324 11.9409 12.8324 11.6063V7.18945"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {/* Shaft + head — bounces on each click. Keyed by the
                              click count so the animation replays every time. */}
                          <g
                            key={downloadClicks}
                            className={
                              downloadClicks > 0 ? "animate-download-arrow" : ""
                            }
                          >
                            <path
                              d="M4.34375 7.19043L7.00065 9.71432L9.65755 7.19043"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M7 1.13232V8.3885"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </g>
                        </g>
                        <defs>
                          <clipPath id="clip0_1484_262">
                            <rect width="14" height="14" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                      <span>]</span>
                    </h4>
                  </button>
                </div>
              </div>
              <div className="hero-clip md:hidden pt-6 relative w-full aspect-[2/3]">
                <Image
                  src={model.face}
                  alt={`${model.name}'s face`}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/20"></div>
              </div>
              <div className=" md:hidden text-xs pt-2 opacity-75 uppercase  ">
                <h4>©2025 Candor models</h4>
              </div>
            </div>
            <div className=" hidden md:block flex-1  lg:hidden">
              <div className="hero-clip relative w-full aspect-[2/3]">
                <Image
                  src={model.face}
                  alt={`${model.name}'s face`}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/20"></div>
              </div>
            </div>
          </div>
          </div>

          {/* Four polaroids pinned to the bottom of the column, so it bottoms
              out level with the hero image instead of trailing off after the
              button. Bounded on both axes so they can never clip or collide:
              `flex-1` shares the column width so four always fit, and `max-w`
              caps each tile at the height still free under the text block —
              The cap is deliberately loose (32rem) so width drives the size on
              short laptop screens too — the hero may then run a little past one
              screenful rather than shrinking the images. It still covers
              button and bio
              plus the column's own padding, and min-w keeps the tiles usable on
              short windows (the page scrolls instead of shrinking them away). The
              gap matches the column's px-4, so
              gutter between the last tile and the hero image reads the same as
              the gaps between the tiles. */}
          <div className="hidden lg:block mt-auto px-4">
            {/* Centred like the stage name: when the height cap makes the
                tiles narrower than their share of the column, the row balances
                instead of packing to the left. */}
            <div className="flex justify-center gap-4">
              {stripPolaroids.map((src, i) => (
                <div
                  key={src}
                  className="hero-scale relative aspect-[4/5] min-w-[96px] flex-1 max-w-[calc((100vh-32rem)*0.8)] overflow-hidden bg-black"
                  style={{ "--out": `${i * 70}ms` }}
                >
                  <Image
                    src={src}
                    alt={`${model.name} polaroid ${i + 1}`}
                    fill
                    sizes="(min-width: 1024px) 16vw, 40vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Top/right inset to the 16px grid rhythm; the bottom inset matches the
            info column's pb-4 so the image's bottom edge lines up with where the
            measurements text ends (a shared baseline). The inner box holds the
            fill image, since a fill image ignores its parent's padding. */}
        <div className="hidden lg:block lg:w-1/3 shrink-0 pb-4 pr-4">
          <div className="hero-clip relative w-full h-full bg-black">
            <Image
              src={heroSrc}
              alt={model.alt || model.name}
              fill
              sizes="33vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* Every tab renders the same morphing board — tiles on an irregular
          grid that scale open in sequence as you scroll past them, sized to
          each photo's true proportions. Keying the board on the category
          remounts it on a tab switch, so the new set enters rather than
          appearing already open.

          The boards scroll up over the pinned hero on a higher layer than it
          (z-0) but under the pinned wordmark/tabs row (z-30). The panel
          carries no ground of its own — the pictures travel over the profile
          and the page's own background is all that is behind them. That only
          works because the board keeps to the right half from lg up: the
          profile goes flush left on scroll, so the two occupy different
          columns and no picture ever crosses the name or the bio. */}
      <div data-board className="board-hold relative z-20">
        {TABS.filter(({ key }) => key === activeCategory).map(({ key }) => {
          const items = galleries[key.toLowerCase()] ?? [];
          return (
            <section key={key} className="pb-20 animate-in fade-in duration-500">
              {items.length === 0 ? (
                <p className="pt-16 text-center text-xs uppercase tracking-widest opacity-40">
                  No {key.toLowerCase()} yet
                </p>
              ) : (
                <MorphGallery
                  key={key}
                  items={items}
                  onSelect={setLightbox}
                  rowSizes={ROW_SIZES}
                  className="px-4 pt-16 lg:pl-[30%]"
                />
              )}
            </section>
          );
        })}
      </div>

      <Lightbox item={lightbox} onClose={() => setLightbox(null)} />

    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import LogoAnimation from "@/components/LogoAnimation";
import EvolveStudy from "../references/EvolveStudy";
import WordPaint, { GROUND_EVENT, STROKE_EVENT, photo } from "../about-new/wordPaint/WordPaint";
import { agency, contactMailto } from "../../../data/agency";
import { aboutNew } from "../../../data/aboutNew";

const clamp = (value) => Math.max(0, Math.min(1, value));
// Join the lava's moving and held phases without jumps in speed or acceleration.
const fluidRamp = (value) => {
  const t = clamp(value);
  return t * t * t * (t * (6 * t - 15) + 10);
};
// Same corner reveal, cubic falloff and 90ms settling as the model gallery.
// The inner image counter-scales so its subject never shrinks to a thumbnail.
const revealEase = (value) => 1 - (1 - value) ** 3;
// Pixels the manifesto slides left for each pixel scrolled, once final line
// is up: the final phrase is several screens wide, and at 1:1 the run outstays it.
const RUN_SPEED = 1.5;
// How far beyond its landing lane each note starts, relative to the run.
const NOTE_DRIFT = 0.35;
// A note over the big type blurs (nobody could read it there) and comes into
// focus as it clears the letters: up to this many px; sharp while no more
// than the first share of it is over ink, fully blurred from the second.
const NOTE_BLUR = 4;
const NOTE_BLUR_SHARE = [0, 0.5];
// How long, in ms, a note's blur takes to follow it: long, so a note
// working its way out of the letters develops slowly rather than snapping.
const NOTE_FOCUS = 420;
// Notes coming in at the right edge are scaled down (NOTE_ENTER_SCALE), and
// grow to full size over the first NOTE_ENTER_SPAN of the screen.
const NOTE_ENTER_SCALE = 0.78;
const NOTE_ENTER_SPAN = 0.35;

// Both highlighted words use the existing Spectrum portrait shader.
const MANIFESTO = "Building creatives that shape culture through diverse perspectives.";
const PAINT_PHOTOS = ["/photos/img12.jpeg", "/photos/img7.jpeg", "/photos/img1.jpeg", "/photos/img25.jpeg", "/photos/img33.jpeg", "/photos/img14.jpeg"];
// The atlas deals these six faces across any number of letters. Repeating
// URLs to match the letter count only creates redundant rotation frames.
const MANIFESTO_FACES = PAINT_PHOTOS.map((src) => photo(src, 828));
const PAINT_REST = { light: 0.5, dark: 0.3 };

function ManifestoPaint({ word, faces, className = "" }) {
  return <WordPaint as="span" fit={false} reveal="drawn" clear faces={faces} rest={PAINT_REST} preloadMargin="150% 200%" className={`ca-word-paint ${className}`} wordClassName="ca-word-paint__word"
    word={Array.from(word, (letter, index) => <span key={index} className="ca-word-paint__letter" data-letter>{letter}</span>)} />;
}

// Three pictures between the manifesto and the mission, laid out and opened
// on scroll exactly as a model's page lays out its board (ProfileGallery): a
// loose pair, then one alone. Landscape frames (the tiles take their shape
// from pxW × pxH and cover-crop the photo into it), set larger than a
// profile's in agency-page.css.
const GALLERY = [
  { id: "img3", src: "/photos/img3.jpeg", alt: "Portrait of a Candor model", pxW: 1500, pxH: 1000 },
  { id: "img20", src: "/photos/img20.jpeg", alt: "Portrait of a Candor model", pxW: 1500, pxH: 1000 },
  { id: "img9", src: "/photos/img9.jpeg", alt: "Portrait of a Candor model", pxW: 1600, pxH: 900 },
];

// Mission, vision and values, in the agency's own words. The mission leads.
const CHAPTERS = [
  {
    id: "mission",
    label: "Our part in it",
    statement: "We develop and represent talent, equipping them with the knowledge to understand their craft and create from a place of candor. We respect individuality and broaden access to opportunity.",
  },
  {
    id: "vision",
    label: "The future we see",
    statement: "A generation of talent equipped to shape global culture through distinct perspectives and empower the next generation through their work.",
  },
  {
    id: "beliefs",
    label: "What we believe",
    heading: "Accurate, not flattering.",
    sub: "Daylight. No make-up. No retouching.",
  },
];
const BELIEFS = [
  ["Development", "We invest in the knowledge, training and experience talent needs to create with substance. Through guidance and room to experiment, we help each person build confidence, sharpen their craft and find their own direction."],
  ["Individuality", "Individuality is the starting point. We value the backgrounds, experiences and perspectives that make each person distinct, giving talent room to develop their own voice and bring it into the work."],
  ["Access", "Opportunity should reach beyond familiar circles. We look for potential across different backgrounds and experiences, creating space for emerging talent to be seen, develop their craft and take part in the industry."],
  ["Clarity", "Good representation starts with clear communication. Honest conversations about expectations, opportunities and next steps help everyone understand their role and make decisions with confidence."],
];
const BELIEF_PREVIEWS = [
  "We invest in the knowledge, training and experience…",
  "Individuality is the starting point…",
  "Opportunity should reach beyond familiar circles…",
  "Good representation starts with clear communication…",
];

// The last line travels horizontally, ending on the second painted word.

// The manifesto's small print, set in the gaps the big words leave. The
// first sits beside a line, on the page's own columns (agency-page.css
// places each by its id). The rest enter from the right,
// in the order of the words of the final phrase they annotate (`word`), each on its own
// tier of four above the row (`tier`: 0 lowest), zig-zagging so neighbours
// are far apart both ways. The first is set as a dictionary entry
// (`entry`): headword, pronunciation, part of speech, then the sense.
const NOTES = [
  {
    id: "candor",
    label: "Candor, n.",
    entry: { word: "can·dor", say: "/ˈkan·dər/", kind: "noun" },
    text: "The quality of being open and honest in what you say.",
  },
  ...BELIEFS.map(([label, text], index) => ({
    id: label.toLowerCase(), label, text, preview: BELIEF_PREVIEWS[index], word: 3 - index, tier: [1, 2, 0, 3][index],
  })).reverse(),
];

// The ink of every letter in a line of the manifesto, as boxes in the
// track's own coordinates, which neither the run nor the line's rise moves:
// each character's place is read against the line's moving span (which
// carries both alike) and that span's offset in the track, and its ink from
// the font's own measure of the glyph.
function inkOf(line, track) {
  const probe = document.createElement("canvas").getContext("2d");
  const range = document.createRange();
  const lineBox = line.getBoundingClientRect();
  let x = 0;
  let y = 0;
  for (let node = line; node && node !== track; node = node.offsetParent) {
    x += node.offsetLeft;
    y += node.offsetTop;
  }
  const boxes = [];
  const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
  for (let text = walker.nextNode(); text; text = walker.nextNode()) {
    const style = getComputedStyle(text.parentElement);
    probe.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    for (let index = 0; index < text.length; index++) {
      const ch = style.textTransform === "uppercase" ? text.data[index].toUpperCase() : text.data[index];
      if (!ch.trim()) continue;
      range.setStart(text, index);
      range.setEnd(text, index + 1);
      const r = range.getBoundingClientRect();
      const m = probe.measureText(ch);
      const left = x + r.left - lineBox.left;
      const baseline = y + r.top - lineBox.top + m.fontBoundingBoxAscent;
      boxes.push({ left: left - m.actualBoundingBoxLeft, right: left + m.actualBoundingBoxRight, top: baseline - m.actualBoundingBoxAscent, bottom: baseline + m.actualBoundingBoxDescent });
    }
  }
  return boxes;
}

// How much of a note (its box at rest, carried `dx` along the run) lies over
// the letters, 0–1.
function overInk(note, dx, inks) {
  const left = note.left + dx;
  const right = left + note.width;
  let area = 0;
  for (const ink of inks) {
    const w = Math.min(right, ink.right) - Math.max(left, ink.left);
    const h = Math.min(note.bottom, ink.bottom) - Math.max(note.top, ink.top);
    if (w > 0 && h > 0) area += w * h;
  }
  return Math.min(1, area / (note.width * (note.bottom - note.top)));
}

function useAgencyScroll(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    const intro = root.querySelector("[data-introduction]");
    const introStage = root.querySelector("[data-intro-stage]");
    const introFrame = root.querySelector("[data-intro-frame]");
    const introPhoto = root.querySelector("[data-intro-photo]");
    const introPortrait = root.querySelector("[data-intro-portrait]");
    const introCopy = root.querySelector("[data-intro-copy]");
    const introNotes = root.querySelector("[data-intro-notes]");
    const introAside = root.querySelector("[data-intro-aside]");
    const lines = [...root.querySelectorAll("[data-line]")];
    const creativesLine = root.querySelector("[data-creatives]");
    const letters = [...creativesLine.querySelectorAll("[data-letter]")];
    const perspectivePaint = root.querySelector(".ca-perspectives");
    const perspectiveLetters = [...perspectivePaint.querySelectorAll("[data-letter]")];
    const finalLine = root.querySelector("[data-horizontal-line]");
    const finalType = finalLine.firstElementChild;
    const edgeFocus = finalLine.querySelector("[data-edge-focus]");
    const fluidType = finalLine.querySelector("[data-fluid-type]");
    const fluidReservoir = root.querySelector("[data-fluid-reservoir]");
    const fluidNeck = root.querySelector("[data-fluid-neck]");
    const fluidFilter = root.querySelector("[data-fluid-filter]");
    const fluidBlur = root.querySelector("[data-fluid-blur]");
    const fluidBlobs = [...root.querySelectorAll("[data-fluid-blob]")];
    const softStart = finalLine.querySelector("[data-soft-start]");
    const dictionary = root.querySelector(".ca-note--candor");
    const manifesto = finalLine.parentElement;
    const run = root.querySelector("[data-run]");
    const track = root.querySelector("[data-track]");
    const runway = root.querySelector("[data-runway]");
    const wordNotes = [...root.querySelectorAll("[data-note-word]")];
    const pinnedNotes = [...root.querySelectorAll("[data-pinned-note]")];
    const notes = [...root.querySelectorAll("[data-note]")];
    const cultureLine = root.querySelector("[data-culture]");
    const services = root.querySelector("#agency-services");
    // The notes arrive right-to-left; pair each with the card below that lane.
    const noteCards = [...services.querySelectorAll(".evolve-card")].reverse();
    const noteCardTitles = noteCards.map((card) => card.querySelector(".evolve-card__title"));
    const noteIndices = notes.map((note) => wordNotes.indexOf(note));
    const creativesPaint = creativesLine.firstElementChild;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animation = 0;
    let lastTime = 0;
    let dirty = true;
    let relayout = true;
    let disposed = false;
    let dark = false;
    let servicesView = false;
    let regroundUntil = 0;
    let stroked = false;
    let perspectiveStroked = false;
    let perspectiveOffset = 0;
    let softStartOffset = 0;
    let fluidWidth = 1;
    let fluidHeight = 1;
    let lastFluidStep = "";
    let lastEntryMask = "";
    let notesPinned = false;
    // The big type's ink and each note's box at rest (null while hidden),
    // in the track's coordinates, taken on layout changes; and each note's
    // blur as shown and as last written.
    let inks = [];
    let noteBoxes = [];
    let wordBoxes = [];
    let noteRoutes = [];
    let lineTravel = lines.map(() => 0);
    const mobileRevealed = new Set();
    const mobileEntered = new Map();
    const mobileRevealTimers = new Set();
    const blurs = notes.map(() => 0);
    const lastBlurs = notes.map(() => "");
    let lastHold = "";
    let lastTravel = "";
    let lastTrack = "";
    let lastRunway = "";
    // final line's row, in screen pixels as laid out (before the run moves
    // it): where it starts, how wide it is, where the screen's right margin
    // is, how far it has to travel, how far it rises before it is held, and
    // how far it rises before the run starts.
    const row = { track: 0, left: 0, width: 1, end: 0, view: 0, travel: 0, rise: 1, lead: 0, held: 0 };
    // Every scroll-driven value is a target the page eases toward, so they
    // all settle together on the same 90ms curve.
    const target = { intro: 0, creatives: 0, run: 0, lines: lines.map(() => 0), pans: lines.map(() => 0) };
    const shown = { intro: 0, creatives: 0, run: 0, lines: lines.map(() => 0), pans: lines.map(() => 0) };
    // Each word note's scale as last written.
    const lastScales = wordNotes.map(() => "");

    function measure() {
      const height = window.innerHeight;

      // The note beside the portrait (desktop, where it is sticky) rises from
      // near the foot of the screen and lands on the portrait's top edge at
      // the moment the portrait finishes developing; the two then rest
      // together before the stage lets go. `land` is the scroll that takes,
      // and the pin is lengthened, if the copy alone is too short, so the
      // rest lasts a quarter of a screen.
      let land = 0;
      if (getComputedStyle(introAside).position === "sticky") {
        const portraitTop = introPortrait.offsetTop;
        const start = height - introAside.firstElementChild.offsetHeight - introAside.lastElementChild.offsetHeight - 40;
        land = Math.max(1, start - portraitTop);
        const hold = `${Math.max(0, Math.round(land + height * 0.25 - introCopy.offsetHeight))}px`;
        const travel = `${Math.round(land)}px`;
        if (hold !== lastHold) intro.style.setProperty("--ca-intro-hold", (lastHold = hold));
        if (travel !== lastTravel) introNotes.style.setProperty("--ca-aside-travel", (lastTravel = travel));
      } else if (lastHold !== "0px") {
        intro.style.setProperty("--ca-intro-hold", (lastHold = "0px"));
      }

      // The pin lasts until the copy clears and the handoff labels enter.
      // Use the actual layout so wrapping and viewport changes keep that timing.
      const introBox = intro.getBoundingClientRect();
      const pinTravel = introBox.height - introStage.offsetHeight;
      target.intro = clamp(-introBox.top / Math.max(1, land || pinTravel));

      // The run. From the moment final line's top clears the foot of the
      // screen, the manifesto slides left (RUN_SPEED pixels for every pixel
      // scrolled): first while it is still rising, then held by its sticky track until
      // the end of the row reaches the right margin. The runway under the
      // track is the scroll that hold needs. Sizes are taken on layout
      // changes only. The run waits until the track is held, plus a short
      // reading pause, so Culture stays readable before anything slides.
      const sliding = !reduce.matches;
      const runBox = run.getBoundingClientRect();
      const finalTop = manifesto.offsetTop + finalLine.offsetTop;
      row.view = document.documentElement.clientWidth;
      row.track = runBox.left;
      row.left = runBox.left + finalLine.offsetLeft;
      row.width = Math.max(1, finalLine.offsetWidth);
      row.end = row.view - runBox.left;
      row.travel = sliding ? Math.max(0, row.left + row.width - row.end) : 0;
      if (relayout) {
        relayout = false;
        // Both share the line's entrance transform, so a resize midway
        // through its reveal cannot bake that temporary offset into the run.
        perspectiveOffset = perspectivePaint.getBoundingClientRect().left - finalType.getBoundingClientRect().left;
        softStartOffset = softStart.getBoundingClientRect().left - finalType.getBoundingClientRect().left;
        fluidWidth = Math.max(1, fluidType.offsetWidth);
        fluidHeight = fluidType.offsetHeight;
        fluidBlur.setAttribute("stdDeviation", `${(fluidHeight * 0.055 / fluidWidth).toFixed(5)} 0.055`);
        lastFluidStep = "";
        const trackHeight = `${track.offsetHeight}px`;
        if (trackHeight !== lastTrack) run.style.setProperty("--ca-track-h", (lastTrack = trackHeight));
        row.held = sliding ? parseFloat(getComputedStyle(track).top) : 0;
        lineTravel = lines.map((line) => line === finalLine ? 0 : Math.max(0, line.offsetLeft + line.offsetWidth - (row.view - runBox.left * 2)));
        // Finish each note at its card's actual inner edge. A shared distance
        // keeps the lanes separated while they enter together from the right.
        noteRoutes = wordNotes.map((note, index) => {
          note.style.top = "";
          note.style.bottom = "";
          const card = noteCards[index];
          const bounds = card.getBoundingClientRect();
          const padding = getComputedStyle(card);
          const insetX = parseFloat(padding.paddingLeft);
          const insetY = parseFloat(padding.paddingTop);
          note.style.setProperty("--ca-card-inner-width", `${bounds.width - insetX - parseFloat(padding.paddingRight)}px`);
          const land = bounds.left + insetX;
          const start = land + Math.max(NOTE_DRIFT * row.travel, row.view + 24);
          const left = Math.round(start - runBox.left);
          if (note.style.left !== `${left}px`) note.style.left = `${left}px`;
          // Longer copy grows downward rather than losing its first lines
          // above the viewport at the end of the horizontal passage.
          if (sliding) {
            const naturalTop = parseFloat(getComputedStyle(note).top);
            const firstVisibleTop = 72 - row.held;
            if (naturalTop < firstVisibleTop) {
              note.style.top = `${firstVisibleTop}px`;
              note.style.bottom = "auto";
            }
          }
          return { start: runBox.left + left, travel: land - runBox.left - left, insetY, top: bounds.top + insetY, laneLeft: land, laneRight: bounds.right - parseFloat(padding.paddingRight) };
        });
        if (sliding) {
          const overlap = (a, b) => Math.min(a.laneRight, b.laneRight) - Math.max(a.laneLeft, b.laneLeft) > 1;
          const stackedLanes = noteRoutes.some((route, index) => noteRoutes.slice(index + 1).some((other) => overlap(route, other)));
          const safeTop = row.view <= 540 ? 116 : 72;
          if (stackedLanes) {
            // Follow the rendered card lanes, including the alternating
            // single-column phone layout. No duplicated CSS breakpoint.
            const placed = [];
            for (let index = wordNotes.length - 1; index >= 0; index--) {
              const note = wordNotes[index];
              const route = noteRoutes[index];
              const viewportTop = placed.reduce((top, previous) => overlap(route, previous.route) ? Math.max(top, previous.bottom + 20) : top, safeTop);
              note.style.top = `${viewportTop - row.held}px`;
              note.style.bottom = "auto";
              placed.push({ route, bottom: viewportTop + note.offsetHeight });
            }
          } else if (height - 234 - row.view * 0.26 < 0) {
            // On wide, shallow screens the original tier gap turns negative.
            // Keep a small stagger in the space above the horizontal type.
            const noteHeight = Math.max(...wordNotes.map((note) => note.offsetHeight));
            const band = Math.max(0, height - safeTop - finalLine.offsetHeight - noteHeight - 24);
            wordNotes.forEach((note) => {
              note.style.top = `${safeTop + (3 - Number(note.dataset.noteTier)) * band / 3 - row.held}px`;
              note.style.bottom = "auto";
            });
          }
        }
        inks = lines.flatMap((line) => {
          const lineInk = inkOf(line.firstElementChild, track);
          if (line === cultureLine && lineInk.length) {
            const capTop = Math.min(...lineInk.map((ink) => ink.top));
            dictionary.style.top = `${capTop - (row.view <= 700 ? dictionary.offsetHeight + 20 : 0)}px`;
          }
          return lineInk;
        });
        noteBoxes = notes.map((note) => {
          if (!note.offsetParent) return null;
          const style = getComputedStyle(note);
          const top = parseFloat(style.top) || note.offsetTop;
          return {
            left: note.offsetLeft,
            top,
            width: Math.max(1, parseFloat(style.width) || note.offsetWidth),
            bottom: top + Math.max(1, parseFloat(style.height) || note.offsetHeight),
            textOffset: note.querySelector(".ca-note__text")?.offsetTop || 0,
          };
        });
        wordBoxes = wordNotes.map((note) => noteBoxes[notes.indexOf(note)]);
      }
      row.rise = sliding ? Math.max(1, height - row.held - finalTop) : height * 0.5;
      // Read the stacked lines first, then hold for a short beat before
      // moving sideways — including on desktops where the track is taller.
      row.lead = sliding ? row.rise + height * 0.3 : 0;
      const runwayHeight = `${Math.round(Math.max(0, row.lead + row.travel / RUN_SPEED - row.rise))}px`;
      if (runwayHeight !== lastRunway) runway.style.height = (lastRunway = runwayHeight);
      target.run = row.travel ? clamp((RUN_SPEED * (height - runBox.top - finalTop - row.lead)) / row.travel) : 0;

      // Return to paper once the completed horizontal phrase reaches the top
      // quarter of the screen, before the belief cards take over.
      const pastManifesto = (!sliding || target.run === 1) && finalLine.getBoundingClientRect().top < height * 0.24;
      const night = creativesLine.getBoundingClientRect().top < height * 0.85 && !pastManifesto;
      if (night !== dark) {
        root.dataset.theme = (dark = night) ? "dark" : "light";
        regroundUntil = performance.now() + 1100;
      }

      // Keep the service spread clear of the page's fixed logo and take picker.
      const servicesBox = services.getBoundingClientRect();
      noteRoutes.forEach((route, index) => {
        const bounds = noteCards[index].getBoundingClientRect();
        route.bounds = { top: bounds.top, bottom: bounds.bottom, left: bounds.left, right: bounds.right };
        route.top = bounds.top + route.insetY;
        route.titleRevealed = noteCardTitles[index].getBoundingClientRect().bottom <= height;
      });
      const readingServices = servicesBox.top <= 72 && servicesBox.bottom > 72;
      if (readingServices !== servicesView) {
        root.dataset.servicesView = String(servicesView = readingServices);
      }

      // Manifesto: each line is set as it comes up the lower half of the
      // screen (final line, which is held lower, by the time it is held);
      // CREATIVES develops as it crosses the middle.
      lines.forEach((line, index) => {
        const span = line === finalLine ? Math.min(height * 0.5, row.rise) : height * 0.5;
        target.lines[index] = clamp((height - line.getBoundingClientRect().top) / span);
        // Oversized phone lines read from their first letter to their last
        // as they cross the viewport, before the final phrase's held run.
        target.pans[index] = row.view <= 700 && !reduce.matches
          ? clamp((height * 0.74 - line.getBoundingClientRect().top) / (height * 0.5)) : 0;
      });
      target.creatives = clamp((height * 0.8 - creativesLine.getBoundingClientRect().top) / (height * 0.45));
      // A stroke of colour crosses CREATIVES as its ink starts to drain, once
      // each time it comes up.
      if (target.creatives > 0.05 && !stroked) {
        stroked = true;
        creativesPaint.dispatchEvent(new Event(STROKE_EVENT));
      } else if (!target.creatives) {
        stroked = false;
      }
    }

    function paint() {
      // Match the paragraph's first line to the card padding, excluding the
      // small heading's reserved space, so the preview and full copy meet.
      const mobile = row.view <= 700;
      const pinNotes = !mobile && !reduce.matches && row.travel > 0 && target.run === 1;
      if (pinNotes !== notesPinned) {
        root.dataset.notesPinned = String(notesPinned = pinNotes);
      }
      pinnedNotes.forEach((note, index) => {
        const route = noteRoutes[index];
        const box = wordBoxes[index];
        const card = noteCards[index];
        const focused = card.matches(":focus-visible");
        if (mobile && route?.top < window.innerHeight && !mobileEntered.has(index)) {
          mobileEntered.set(index, performance.now());
          const timer = window.setTimeout(() => { mobileRevealTimers.delete(timer); schedule(); }, 660);
          mobileRevealTimers.add(timer);
        }
        if (mobile && route?.top <= window.innerHeight * 0.62 && performance.now() - mobileEntered.get(index) >= 650) mobileRevealed.add(index);
        const localReveal = mobile && mobileRevealed.has(index);
        const docked = focused || localReveal || (pinNotes && route && box && route.top <= row.held + box.top + box.textOffset);
        const arriving = focused || localReveal || (pinNotes && route && box && route.top <= row.held + box.bottom);
        if (card.dataset.noteArriving !== String(Boolean(arriving))) card.dataset.noteArriving = String(Boolean(arriving));
        if (card.dataset.noteDocked !== String(Boolean(docked))) card.dataset.noteDocked = String(Boolean(docked));
        if (note.dataset.docked !== String(Boolean(docked))) note.dataset.docked = String(Boolean(docked));
        // Each card hands the heading off independently, as soon as its
        // bottom title can be read. Preserve the paragraph's position.
        const titleRevealed = String(Boolean(focused || (pinNotes && route?.titleRevealed)));
        if (note.dataset.titleRevealed !== titleRevealed) note.dataset.titleRevealed = titleRevealed;
        // A later note waits while an earlier card passes through its lane.
        // Routes are reversed from DOM order; the card's own handoff still
        // uses docking above, and the horizontal notes remain untouched.
        const covered = Boolean(pinNotes && route && box && noteRoutes.some((other, otherIndex) => {
          if (otherIndex <= index || !other.bounds) return false;
          const left = route.start + route.travel;
          return left < other.bounds.right + 16 && left + box.width > other.bounds.left - 16
            && row.held + box.top < other.bounds.bottom + 16 && row.held + box.bottom > other.bounds.top - 16;
        }));
        if (note.dataset.covered !== String(covered)) note.dataset.covered = String(covered);
        if (pinNotes) {
          if (!box || !route) return;
          const x = route.start + route.travel * shown.run;
          const y = Math.min(row.held + box.top, route.top - box.textOffset);
          const grow = Math.max(shown.run, revealEase(clamp((row.view - x) / (row.view * NOTE_ENTER_SPAN))));
          const scale = (NOTE_ENTER_SCALE + (1 - NOTE_ENTER_SCALE) * grow).toFixed(3);
          note.style.width = `${box.width}px`;
          note.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale})`;
        }
      });
      if (reduce.matches) {
        introFrame.style.transform = "none";
        introPhoto.style.transform = "none";
        introFrame.style.opacity = "1";
        lines.forEach((line) => { line.firstElementChild.style.transform = "none"; });
        [...letters, ...perspectiveLetters].forEach((letter) => letter.style.setProperty("--ink", "0"));
        finalType.style.maskImage = "none";
        edgeFocus.style.opacity = "0";
        fluidType.dataset.filled = "true";
        lastFluidStep = "";
        lastEntryMask = "";
        track.style.transform = "";
        track.style.removeProperty("--ca-run");
        track.style.removeProperty("--ca-drift");
        wordNotes.forEach((note, index) => { note.style.translate = ""; note.style.removeProperty("--ca-scale"); lastScales[index] = ""; });
        notes.forEach((note, index) => { note.style.filter = lastBlurs[index] = ""; });
        return;
      }
      const introProgress = revealEase(shown.intro);
      const introScale = 0.72 + 0.28 * introProgress;
      introFrame.style.transform = `scale(${introScale})`;
      introPhoto.style.transform = `scale(${(1 + 0.14 * (1 - introProgress)) / introScale})`;
      // The print sits behind the opening copy, then develops as it clears it.
      introFrame.style.opacity = String(0.18 + 0.82 * shown.intro ** 2);


      // Each line rises out of its own baseline and slides the last few
      // degrees into its indent, alternating sides, like type being set.
      // The first line instead comes out from under the portrait above it:
      // it waits tucked behind the card's foot (its mask, --ca-we-mask, ends
      // there) and slides down into place as the card scrolls away, slower
      // than the page, so the card seems to uncover it.
      lines.forEach((line, index) => {
        const rest = 1 - revealEase(shown.lines[index]);
        const inner = line.firstElementChild;
        const pan = mobile ? shown.pans[index] * lineTravel[index] : 0;
        if (mobile && line !== finalLine) {
          const entrance = (index % 2 ? 1 : -1) * row.view * 0.7 * rest;
          inner.style.transform = `translate3d(${(entrance - pan).toFixed(2)}px, 0, 0)`;
          return;
        }
        if (!rest) { inner.style.transform = ""; return; }
        if (line.hasAttribute("data-from-card")) {
          inner.style.transform = `translate3d(0, calc(${(-rest).toFixed(4)} * (100% + var(--ca-we-mask))), 0)`;
          return;
        }
        const side = index % 2 ? 1 : -1;
        inner.style.transform = `translate3d(${(side * 6 * rest).toFixed(3)}vw, ${(108 * rest).toFixed(2)}%, 0)`;
      });
      // The ink drains out of CREATIVES letter by letter, left to right.
      letters.forEach((letter, index) => {
        letter.style.setProperty("--ink", clamp(1 - (shown.creatives * 1.6 - (index / Math.max(1, letters.length - 1)) * 0.6)).toFixed(3));
      });

      // The run, and the ink that follows it. final line's row starts as an
      // outline; the fill's front sweeps out from the left edge as the row
      // comes up, holds at 72% of the screen so each word of the final phrase develops
      // as it slides past, and runs out to the right margin as the row ends.
      const shift = shown.run * row.travel;
      // Fade the entering edge into the page's background colour, then
      // clear the gradient over the last part of the horizontal run.
      const endFocus = fluidRamp((shown.run - 0.82) / 0.18);
      edgeFocus.style.transform = `translate3d(${(row.view - row.left + shift).toFixed(1)}px, 0, 0) translateX(-100%)`;
      edgeFocus.style.opacity = String(row.travel ? 1 - endFocus : 0);
      // A feathered front starts at ERSE, then uncovers the photographic
      // letters from left to right as that end of the phrase enters view.
      const entryFeather = Math.min(row.view * 0.22, fluidHeight * 1.1);
      const entryFront = Math.max(softStartOffset, row.view * 0.98 - row.left + shift + entryFeather * endFocus);
      const entrySolid = Math.max(softStartOffset, entryFront - entryFeather);
      const entryMask = endFocus === 1 ? "none" : `linear-gradient(90deg, #000 ${entrySolid.toFixed(1)}px, transparent ${entryFront.toFixed(1)}px)`;
      if (entryMask !== lastEntryMask) finalType.style.maskImage = (lastEntryMask = entryMask);
      // Reveal the second word only as it actually enters from the right.
      const perspectiveProgress = clamp((row.view * 0.9 - (row.left + perspectiveOffset - shift)) / (row.view * 0.65));
      perspectiveLetters.forEach((letter, index) => {
        const stagger = (index / Math.max(1, perspectiveLetters.length - 1)) * 0.6;
        letter.style.setProperty("--ink", clamp(1 - (perspectiveProgress * 1.6 - stagger)).toFixed(3));
      });
      if (perspectiveProgress > 0.05 && !perspectiveStroked) {
        perspectiveStroked = true;
        perspectivePaint.dispatchEvent(new Event(STROKE_EVENT));
      } else if (!perspectiveProgress) perspectiveStroked = false;
      track.style.transform = shift ? `translate3d(${(-shift).toFixed(1)}px, 0, 0)` : "";
      // The track's paper stays still under the screen (--ca-run undoes the
      // slide), and the notes ride against it (--ca-drift).
      track.style.setProperty("--ca-run", `${shift.toFixed(1)}px`);
      const drift = (1 + NOTE_DRIFT) * shift;
      track.style.setProperty("--ca-drift", `${drift.toFixed(1)}px`);
      // The notes grow into view from the right, finishing in their card lanes.
      wordNotes.forEach((note, index) => {
        const box = wordBoxes[index];
        const route = noteRoutes[index];
        note.style.translate = `${(shift + route.travel * shown.run).toFixed(2)}px 0`;
        const x = box ? route.start + route.travel * shown.run : row.view;
        const grow = Math.max(shown.run, revealEase(clamp((row.view - x) / (row.view * NOTE_ENTER_SPAN))));
        const scale = (NOTE_ENTER_SCALE + (1 - NOTE_ENTER_SCALE) * grow).toFixed(3);
        if (scale !== lastScales[index]) note.style.setProperty("--ca-scale", (lastScales[index] = scale));
      });
      notes.forEach((note, index) => {
        const blur = blurs[index] > 0.05 ? `blur(${blurs[index].toFixed(2)}px)` : "";
        if (blur !== lastBlurs[index]) note.style.filter = lastBlurs[index] = blur;
      });
      let fillX = fluidWidth + fluidHeight;
      if (row.travel) {
        const hold = row.view * 0.72;
        const out = Math.min(window.innerHeight * 0.8, row.travel * 0.5);
        const back = Math.min(window.innerHeight * 0.5, row.travel * 0.3);
        const front = row.left + (hold - row.left) * fluidRamp(shift / out) + (row.end - hold) * fluidRamp((shift - row.travel + back) / back);
        fillX = front - row.left + shift;
      }
      // Lava-like lobes rise, stretch, pinch apart and merge into the fill.
      // Only a strip around the moving front is filtered; settled text is a
      // plain rectangle, avoiding a filter across the whole horizontal run.
      const step = fillX.toFixed(1);
      if (step !== lastFluidStep) {
        lastFluidStep = step;
        const ratio = fluidHeight / fluidWidth;
        const edge = fillX / fluidWidth;
        const filled = edge > 1 + ratio;
        fluidType.dataset.filled = String(filled);
        if (!filled) {
          const phase = shift / Math.max(1, fluidHeight) * 1.2;
          fluidReservoir.setAttribute("width", Math.max(0, edge - ratio * 0.55 + 0.1).toFixed(5));
          fluidNeck.setAttribute("x", (edge - ratio * 1.3).toFixed(5));
          fluidNeck.setAttribute("width", (ratio * 0.95).toFixed(5));
          fluidFilter.setAttribute("x", (edge - ratio * 1.5).toFixed(5));
          fluidFilter.setAttribute("width", (ratio * 3.1).toFixed(5));
          fluidBlobs.forEach((blob, index) => {
            const droplet = index >= 5;
            const angle = phase * (droplet ? 0.85 : 0.6) + index * 1.9;
            const cx = edge + ratio * (droplet ? 0.65 + 0.24 * Math.sin(angle) : 0.08 + 0.3 * Math.sin(angle));
            const cy = droplet ? 0.5 + 0.48 * Math.sin(angle * 0.7) : index * 0.25 + 0.14 * Math.sin(angle * 0.8);
            const rx = ratio * (droplet ? 0.13 + 0.035 * Math.cos(angle) : 0.32 + 0.075 * Math.cos(angle * 1.2));
            const ry = droplet ? 0.15 + 0.05 * Math.sin(angle) : 0.29 + 0.08 * Math.sin(angle * 0.9);
            blob.setAttribute("cx", cx.toFixed(5));
            blob.setAttribute("cy", cy.toFixed(5));
            blob.setAttribute("rx", rx.toFixed(5));
            blob.setAttribute("ry", ry.toFixed(5));
          });
        }
      }
    }

    function frame(time) {
      animation = 0;
      const elapsed = lastTime ? Math.min(time - lastTime, 48) : 16;
      lastTime = time;
      if (dirty) {
        measure();
        dirty = false;
      }
      const settle = reduce.matches ? 1 : 1 - Math.exp(-elapsed / 90);
      let moving = false;
      const ease = (from, to) => {
        const next = from + (to - from) * settle;
        if (Math.abs(to - next) > 0.0001) { moving = true; return next; }
        return to;
      };
      shown.intro = ease(shown.intro, target.intro);
      shown.creatives = ease(shown.creatives, target.creatives);
      shown.run = ease(shown.run, target.run);
      shown.lines = shown.lines.map((value, index) => ease(value, target.lines[index]));
      shown.pans = shown.pans.map((value, index) => ease(value, target.pans[index]));
      // Each note's blur follows how much of it is over the letters where
      // the run has carried it, a little behind, so it softens and focuses
      // rather than switching.
      const focus = 1 - Math.exp(-elapsed / NOTE_FOCUS);
      noteBoxes.forEach((box, index) => {
        const [from, to] = NOTE_BLUR_SHARE;
        const route = noteRoutes[noteIndices[index]];
        const noteDrift = route ? (row.travel + route.travel) * shown.run : 0;
        const over = box && !reduce.matches ? clamp((overInk(box, noteDrift, inks) - from) / (to - from)) : 0;
        const want = NOTE_BLUR * over * over * (3 - 2 * over);
        let next = reduce.matches ? want : blurs[index] + (want - blurs[index]) * focus;
        if (Math.abs(want - next) > 0.02) moving = true;
        else next = want;
        blurs[index] = next;
      });
      // While the papers ease from one theme to the other, CREATIVES's canvas
      // re-reads the ground every frame, so its letters ease with them.
      if (time < regroundUntil) {
        window.dispatchEvent(new Event(GROUND_EVENT));
        moving = true;
      }
      paint();
      if (moving) animation = requestAnimationFrame(frame);
      else lastTime = 0;
    }

    function schedule() {
      if (disposed) return;
      dirty = true;
      if (!animation) animation = requestAnimationFrame(frame);
    }
    function reschedule() {
      relayout = true;
      schedule();
    }

    measure();
    Object.assign(shown, { ...target, lines: [...target.lines], pans: [...target.pans] });
    paint();
    const resize = new ResizeObserver(reschedule);
    resize.observe(root);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", reschedule);
    root.addEventListener("focusin", schedule);
    root.addEventListener("focusout", schedule);
    reduce.addEventListener("change", reschedule);
    document.fonts.ready.then(reschedule);

    return () => {
      disposed = true;
      mobileRevealTimers.forEach((timer) => window.clearTimeout(timer));
      cancelAnimationFrame(animation);
      resize.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", reschedule);
      root.removeEventListener("focusin", schedule);
      root.removeEventListener("focusout", schedule);
      reduce.removeEventListener("change", reschedule);
      delete root.dataset.servicesView;
      delete root.dataset.notesPinned;
      dictionary.style.top = "";
      finalType.style.maskImage = "";
      edgeFocus.style.transform = "";
      edgeFocus.style.opacity = "";
      delete fluidType.dataset.filled;
      wordNotes.forEach((note) => {
        note.style.translate = "";
        note.style.removeProperty("--ca-card-inner-width");
        note.style.top = "";
        note.style.bottom = "";
      });
      noteCards.forEach((card) => { delete card.dataset.noteDocked; delete card.dataset.noteArriving; });
      pinnedNotes.forEach((note) => { delete note.dataset.titleRevealed; delete note.dataset.docked; delete note.dataset.covered; });
    };
  }, [rootRef]);
}

// Mission, vision, beliefs. The index on the left stays put while the three
// chapters pass on the right; a blue bar marks the one being read (whichever
// crosses the middle of the screen). Each block rises in once, on arrival.
function Beliefs() {
  const rootRef = useRef(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    const chapters = [...root.querySelectorAll("[data-chapter]")];
    const reveals = [...root.querySelectorAll("[data-reveal]")];
    if (!("IntersectionObserver" in window)) {
      reveals.forEach((element) => { element.dataset.in = ""; });
      return;
    }
    const reading = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(chapters.indexOf(entry.target));
      });
    }, { rootMargin: "-50% 0px -50% 0px" });
    const arriving = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.dataset.in = "";
        arriving.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px" });
    chapters.forEach((chapter) => reading.observe(chapter));
    reveals.forEach((element) => arriving.observe(element));
    return () => { reading.disconnect(); arriving.disconnect(); };
  }, []);

  return (
    <section ref={rootRef} id="agency-mission" className="ca-beliefs" aria-labelledby="beliefs-title">
      <div className="ca-beliefs__head">
        <h2 id="beliefs-title">Our mission</h2>
        <span>(03)</span>
      </div>
      <div className="ca-beliefs__grid">
        <nav className="ca-beliefs__rail" aria-label="Our mission">
          <ol style={{ "--active": active }}>
            {CHAPTERS.map(({ id, label }, index) => (
              <li key={id}>
                <a href={`#belief-${id}`} aria-current={active === index ? "true" : undefined}>
                  <span>0{index + 1}</span>{label}
                </a>
              </li>
            ))}
          </ol>
          <div className="ca-beliefs__motto">
            <p>People<br />Opportunity<br />Culture<br />What’s next</p>
            <p>Candor<br />Management</p>
          </div>
        </nav>
        <div className="ca-beliefs__chapters">
          {CHAPTERS.map(({ id, label, statement, heading, sub }, index) => (
            <article key={id} id={`belief-${id}`} className="ca-beliefs__chapter" data-chapter aria-labelledby={`belief-${id}-title`}>
              <h3 id={`belief-${id}-title`} className="ca-beliefs__label" data-reveal><span>0{index + 1}</span>{label}</h3>
              {statement ? (
                <p className="ca-beliefs__statement" data-reveal>{statement}</p>
              ) : (
                <>
                  <div className="ca-beliefs__header" data-reveal>
                    <p className="ca-beliefs__statement">{heading}</p>
                    <p className="ca-beliefs__sub">{sub}</p>
                  </div>
                  <ol className="ca-beliefs__list">
                    {BELIEFS.map(([title, text], item) => (
                      <li key={title} data-reveal style={{ "--delay": `${item * 70}ms` }}>
                        <span className="ca-beliefs__num">0{item + 1}</span>
                        <div>
                          <h4>{title}</h4>
                          <p>{text}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// The mission builds vertically before its final line travels horizontally.
// The notes rise in once each, as they arrive: from below, or from the right
// on the run.
function Manifesto() {
  const rootRef = useRef(null);

  useEffect(() => {
    const notes = [...rootRef.current.querySelectorAll("[data-note]")];
    if (!("IntersectionObserver" in window)) {
      notes.forEach((note) => { note.dataset.in = ""; });
      return;
    }
    const arriving = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.dataset.in = "";
        arriving.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px" });
    notes.forEach((note) => arriving.observe(note));
    return () => arriving.disconnect();
  }, []);

  return (
    <section ref={rootRef} id="agency-manifesto" className="ca-approach" aria-labelledby="approach-title">
      <svg className="ca-motion-defs" aria-hidden="true" width="0" height="0">
        <defs>
          <filter id="agency-lava-goo" data-fluid-filter filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x="0" y="-0.4" width="0.3" height="1.8" colorInterpolationFilters="sRGB">
            <feGaussianBlur data-fluid-blur stdDeviation="0.005 0.055" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" />
          </filter>
          <mask id="agency-fluid-fill" maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox" x="-0.1" y="-0.3" width="1.2" height="1.6" style={{ maskType: "alpha" }}>
            <rect data-fluid-reservoir x="-0.1" y="-0.3" width="0" height="1.6" fill="white" />
            <g filter="url(#agency-lava-goo)" fill="white">
              <rect data-fluid-neck x="-0.1" y="-0.3" width="0.1" height="1.6" />
              {Array.from({ length: 7 }, (_, index) => <ellipse key={index} data-fluid-blob cx="0" cy="0.5" rx="0.03" ry="0.3" />)}
            </g>
          </mask>
        </defs>
      </svg>
      <div className="ca-approach__run" data-run>
        <div className="ca-approach__track" data-track>
          <h2 id="approach-title" className="ca-manifesto" aria-label={MANIFESTO} data-ink-fixed>
            <span aria-hidden="true" className="ca-manifesto__build" data-line data-from-card><span>Building</span></span>
            <span aria-hidden="true" className="ca-manifesto__creatives" data-line data-creatives>
              <ManifestoPaint word="CREATIVES" faces={MANIFESTO_FACES} />
            </span>
            <span aria-hidden="true" className="ca-manifesto__shape" data-line><span>that shape</span></span>
            <span aria-hidden="true" className="ca-manifesto__culture" data-line data-culture><span>culture</span></span>
            <span aria-hidden="true" className="ca-manifesto__through" data-line><span>through</span></span>
            <span aria-hidden="true" className="ca-manifesto__finish" data-line data-horizontal-line>
              <span>
                <span className="ca-fluid-type" data-fluid-type data-copy="through diverse"><span className="ca-fluid-type__through" data-word>through{" "}</span><span data-word>div<span data-soft-start>erse</span></span></span>{" "}
                <ManifestoPaint word="PERSPECTIVES" faces={MANIFESTO_FACES} className="ca-perspectives" /><span className="ca-manifesto__period">.</span>
              </span>
              <i className="ca-edge-focus" data-edge-focus aria-hidden="true" />
            </span>
          </h2>
          <div className="ca-manifesto__notes">
            {NOTES.map(({ id, label, entry, text, preview, word, tier }) => (
              <p key={id} className={`ca-note ca-note--${id}${entry ? " ca-entry" : ""}`} data-note data-note-word={word} data-note-tier={tier}>
                {entry ? (
                  <>
                    <span className="ca-note__label" aria-label={label}>
                      <span className="ca-entry__word">{entry.word}</span>
                      <span className="ca-entry__say">{entry.say}</span>
                      <span className="ca-entry__kind">{entry.kind}</span>
                    </span>
                    <span className="ca-entry__sense">{text}</span>
                  </>
                ) : (
                  <>
                    <span className="ca-note__label">{label}</span>
                    <span className="ca-note__text"><span className="ca-note__preview">{preview}</span><span className="ca-note__full">{text}</span></span>
                  </>
                )}
              </p>
            ))}
          </div>
        </div>
        <div className="ca-approach__runway" data-runway aria-hidden="true" />
      </div>
    </section>
  );
}

// The founder, as the gallery's last row: the photo opens out of its corner
// like the pictures above it (ProfileGallery), with the label at the left
// edge and the quote beside it, as /about-new sets them. The text rises in
// once as it arrives.
const FOUNDER = aboutNew.founder;
const FOUNDER_PHOTO = [{ id: "founder", src: FOUNDER.image, alt: FOUNDER.name, pxW: 4, pxH: 5 }];

function Founder() {
  const textRef = useRef(null);

  useEffect(() => {
    const text = textRef.current;
    if (!("IntersectionObserver" in window)) {
      text.dataset.in = "";
      return;
    }
    const arriving = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      text.dataset.in = "";
      arriving.disconnect();
    }, { rootMargin: "0px 0px -12% 0px" });
    arriving.observe(text);
    return () => arriving.disconnect();
  }, []);

  return (
    <div className="ca-founder">
      <div className="ca-founder__label"><p>{FOUNDER.label}</p></div>
      <div className="ca-founder__photo"><ProfileGallery items={FOUNDER_PHOTO} /></div>
      <div ref={textRef} className="ca-founder__text">
        <p>{FOUNDER.quote}</p>
        <p>{FOUNDER.name}<br /><span>{FOUNDER.role}</span></p>
        <p><a href={FOUNDER.link.href}>{FOUNDER.link.label} <span aria-hidden="true">↗</span></a></p>
      </div>
    </div>
  );
}

export default function AgencyPage() {
  const rootRef = useRef(null);
  useAgencyScroll(rootRef);

  return (
    <div ref={rootRef} className="candor-agency">
      <a href="#agency-introduction" className="ca-skip">Skip to content</a>
      <header className="ca-header">
        <Link href="/" className="ca-wordmark" aria-label="Candor home">
          <LogoAnimation tight animate={false} />
        </Link>
      </header>

      {/* Visual continuation of the original notes; read once by assistive
          technology in the manifesto. This layer never intercepts controls. */}
      <div className="ca-pinned-notes" aria-hidden="true">
        {NOTES.filter(({ word }) => word !== undefined).map(({ id, label, preview }, index) => (
          <p key={id} className="ca-note ca-note--pinned" data-pinned-note data-card-index={3 - index}>
            <span className="ca-note__label">{label}</span>
            <span className="ca-note__text">{preview}</span>
          </p>
        ))}
      </div>

      <main>
        <section id="agency-introduction" data-introduction className="ca-introduction" aria-labelledby="agency-title">
          <div className="ca-introduction__stage" data-intro-stage>
            <figure className="ca-introduction__portrait" data-intro-portrait>
              <div className="ca-reveal-frame" data-intro-frame>
                <div className="ca-reveal-photo" data-intro-photo>
                  <Image src="/photos/img12.jpeg" alt="A close portrait, looking directly into the camera" fill priority sizes="(max-width: 700px) 72vw, 48vw" />
                </div>
              </div>
              <figcaption><span>A face. A story. A point of view.</span></figcaption>
            </figure>
          </div>
          <div className="ca-introduction__flow">
            <div className="ca-introduction__copy" data-intro-copy>
              <h1 id="agency-title">Candor is a model and talent agency based in <span>Lagos, Manchester and Dallas.</span></h1>
              <p>Developing and representing talent by equipping them with the knowledge to understand their craft and create from a place of candor.</p>
              <p>We respect individuality and broaden access to opportunity.</p>
              <p className="ca-introduction__label"><span>MISSION</span><a href="#belief-vision">Our vision <span aria-hidden="true">↓</span></a></p>
            </div>

            <div className="ca-introduction__notes" data-intro-notes>
              <p className="ca-introduction__footnote">Based: Manchester. Lagos.</p>
              <aside className="ca-introduction__aside" data-intro-aside>
                <p>Models. Talents. Creatives.<br />A different point of view.<br />Est. {agency.founded}.</p>
                <div><span>For the next possibility:</span><a href={contactMailto}>{agency.contact.email}</a></div>
              </aside>
            </div>

            <div className="ca-introduction__handoff" />
          </div>
        </section>

        <Manifesto />

        <EvolveStudy embedded beliefs={BELIEFS} previews={BELIEF_PREVIEWS} />

      </main>
    </div>
  );
}

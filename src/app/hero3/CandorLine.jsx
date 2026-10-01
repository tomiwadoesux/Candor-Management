"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "../../styles/candor-intro.css";

// The intro: the mission line types itself in, the rest of it drains away and
// the six letters hiding CANDOR inside it fly out to spell the name, the name
// holds long enough to be read and then blurs away, the block leaves, and the
// page's furniture arrives in the space it vacates.
//
// THE TIMING LIVES IN CSS (styles/candor-intro.css). This file does only the
// three things a stylesheet cannot:
//
//   1. waits for the display face, so nothing paints in the fallback first
//   2. measures where each of the six letters rests and where its slot in
//      the assembled name is — no CSS expression can know where the "c" of
//      "culture" sits on a wrapped line
//   3. pre-eases the typing stagger, whose curve is piecewise where calc()
//      has no conditional, and hands each character a finished delay
//
// It then flips one attribute and stands back: there are two renders in the
// life of the page and no script runs per frame, so the animations sit on the
// compositor and a busy main thread cannot stutter them.
//
// The letters are picked by their exact position in the sentence rather than
// by matching characters, because most of them occur many times over and only
// one instance of each is wanted:
//
//   C  culture          A  "..to build a…"    N  generation
//   D  diverse          O  global             R  diverse
//
// D and R both come out of "diverse" — the d that opens it and the r in its
// middle, four characters apart, so they are two distinct letters rather than
// one reused twice.
//
// READING ORDER is why this animates at all. In the sentence the six land as
// a, n, o, c, d, r — left to right they do NOT spell CANDOR, and no
// arrangement of these words would. So the letters travel.

const LINE =
  "..to build a generation of creatives to shape global culture through their diverse perspectives..";

// Index in LINE -> which letter of CANDOR it stands in for, and where it sits
// in the assembled name. Verified against the string: any edit to LINE must
// re-check these or they silently point at the wrong characters.
const PICKS = {
  11: { letter: "A", order: 1 }, // "..to build [a] generation"
  15: { letter: "N", order: 2 }, // "ge[n]eration"
  48: { letter: "O", order: 4 }, // "gl[o]bal"
  53: { letter: "C", order: 0 }, // "[c]ulture"
  75: { letter: "D", order: 3 }, // "[d]iverse"
  79: { letter: "R", order: 5 }, // "dive[r]se"
};

// The six in name order, for laying out the target row.
const ORDERED = Object.entries(PICKS)
  .map(([index, pick]) => ({ index: Number(index), ...pick }))
  .sort((a, b) => a.order - b.order);

// Gap between letters in the assembled name, as a multiple of font size.
const TRACKING_EM = 0.42;

// The write's easing, applied to the SWEEP rather than to each character's
// own fade. Each character fades on a delay proportional to its position, so
// the curve shaping the write as a whole is the one mapping index -> delay.
// That mapping is a number, not a transition, and CSS has no conditional, so
// it is evaluated here and handed down per character as a pre-eased delay.
//
// THE CURVE HERE IS INVERTED RELATIVE TO THE FEEL IT PRODUCES, and that is
// the one thing to understand before touching it.
//
// These functions do not ease motion. They map a character's index to its
// DELAY, and a delay map runs backwards from a motion curve: to make letters
// arrive quickly and then decelerate, the delays must start bunched and then
// spread out. That is t^1.5 — the shape usually written as an ease-IN — even
// though what you see on screen is an ease-OUT.
//
// The exponent is 1.5, not the 3 a literal power3 would use. t^3 was tried
// and is too severe: it puts over half the characters on screen inside the
// first tenth of the write, so the line reads as a flash however long the
// total is set to. Raising the duration does not fix that — it stretches the
// thin tail and leaves the flash intact. Softening the exponent is what
// actually spreads the front.
//
// 1.2, softened from the 1.5 this ran at. The exponent controls how much of
// the line lands in the opening moments, and 1.5 was still front-loading it:
// a dozen characters inside the first 60ms — four frames — which is a chunk
// of sentence appearing at once however long the write is stretched. At 1.2
// that opening burst is down to eight and the sweep is even across the line.
//
// Lowering it further flattens toward linear, which loses the deceleration
// into the final characters that makes the write settle rather than stop.
const EASE_POWER = 1.2;

// ...but a bare power curve has ONE end. t^1.5 has zero derivative at t = 0,
// which in a DELAY map means the first characters are bunched hardest of all
// — several of them share almost the same delay and land together on the
// first frame. That is the snap at the head of the line: the write does not
// begin, it arrives already moving.
//
// So the front is eased separately. `smoothstep` is flat at both ends, and
// blending it into the power curve over the opening stretch spreads those
// first few characters apart instead of stacking them. The result reads as
// the write PICKING UP — a couple of letters, then the sweep proper — rather
// than as a chunk of sentence appearing and the rest trailing it.
//
// Only the opening is touched. Past EASE_IN_FRAC the curve is t^1.5 exactly
// as before, so the deceleration into the final characters is unchanged.
const EASE_IN_FRAC = 0.22;
const smoothstep = (t) => t * t * (3 - 2 * t);

const EASE = (t) => {
  const base = Math.pow(t, EASE_POWER);
  if (t >= EASE_IN_FRAC) return base;
  // How far into the eased-in opening this character sits, 0..1.
  const k = t / EASE_IN_FRAC;
  // The value the power curve reaches at the end of that opening — the two
  // must meet there, or the write would jump at the handover.
  const edge = Math.pow(EASE_IN_FRAC, EASE_POWER);
  // Blend from a smoothstepped ramp to the power curve across the opening,
  // so the join is continuous in value AND in slope.
  return edge * (smoothstep(k) * (1 - k) + k * k * k * k);
};

// The write's duration, in ms. This MUST match --type-ms in candor-intro.css:
// the stagger is computed here (see the --t comment below for why it cannot be
// left to CSS), while every cumulative mark in the timeline is still expressed
// against the stylesheet's copy. Change one and you must change the other.
//
// 1700, up from 1250. The line is ~96 characters and at the old duration the
// sweep crossed them faster than the sentence could be taken in — it read as
// the line being switched on in pieces rather than written. The extra 450ms
// is spent on the sweep itself, not on the hold afterwards, so the sentence
// is being READ while it is being drawn instead of only once it is whole.
//
// Every cumulative mark in candor-intro.css moves with this — they are
// absolute times, not offsets, so they do not follow it on their own.
const TYPE_MS = 1700;

// A character's delay: its position along the write, eased, scaled to the
// write's length.
const charDelay = (i, n) => EASE(n > 1 ? i / (n - 1) : 0) * TYPE_MS;

// The two boards. These are the photographs Choose used for the same pair —
// img1 for MODELS, img24 for TALENTS — kept deliberately, so the association
// between picture and board survives Choose being removed from the page.
//
// Served from /photos, the model photography, rather than /images, which now
// holds the public-domain painted portraits (see public/images/CREDITS.md).
// The landing page fronts the agency, so it shows the roster, not the art.
const CARDS = [
  { label: "Models", href: "/models", src: "/photos/img1.jpeg" },
  { label: "Talents", href: "/talents", src: "/photos/img24.jpeg" },
];

// The fall, per letter. The six do not drop as one word — each goes on its
// own, with its own spin, its own speed and its own moment of letting go.
// These are the ranges those are drawn from.
//
// The stagger is deliberately TIGHT. The six should read as one event coming
// apart, not as a queue of letters taking turns, so the last to go leaves
// within FALL_STAGGER_MS of the first.
const FALL_STAGGER_MS = 110;

// Duration spread. A letter that falls slower is not lighter — it is the same
// gravity over a longer screen, so the variation reads as depth rather than
// as inconsistency. Kept narrow for the same reason as the stagger.
const FALL_MIN_MS = 760;
const FALL_MAX_MS = 980;

// How far each letter has turned by the time it leaves frame. Signed, so some
// letters spin clockwise and others anticlockwise — a word coming apart has
// no shared sense of rotation. The magnitude is wide because the letters are
// small and a subtle turn on a falling glyph simply does not read.
const SPIN_MIN_DEG = 28;
const SPIN_MAX_DEG = 96;

// Sideways drift as they fall, in vw. Signed and small: enough that the six
// separate as they go rather than dropping in a rigid column.
const DRIFT_MAX_VW = 4.5;

// Which visit this is, kept for the life of the TAB. sessionStorage rather
// than localStorage: the intro should play again tomorrow, or in a new tab,
// just not on a reload or an in-app navigation back to this page. And rather
// than a module-level variable, which a full reload would wipe — the whole
// point is to survive one.
// Exported so a page that holds something back for the length of the intro
// can tell whether the intro is going to play at all — on a repeat visit it
// is skipped, and waiting out its duration would be waiting for nothing.
export const SEEN_KEY = "candor:intro-seen";

// `floatingLogo` tells this component NOT to render the wordmark, because the
// page is rendering it itself as a fixed overlay outside the intro's wrapper.
//
// On /hero3 the intro is all there is, so the mark can live inside it. On the
// landing page the sections below scroll up over the intro, and a mark inside
// it is both clipped by the sticky wrapper's overflow-hidden and painted
// under the content's own stacking context — which is why the wordmark was
// being sliced in half as Look passed it. Moving it out is the only fix;
// position: fixed is not, since that is clipped by overflow-hidden too.
//
// The page still passes `logo` when it sets this, so the CSS class and the
// entry animation stay in one place — the page just mounts the element
// somewhere the intro cannot reach, using <CandorFloatingLogo> below to carry
// the data-mode the animation is keyed off.
// The wordmark, mounted OUTSIDE the intro so nothing can clip or cover it.
//
// It carries `candor-intro` and `data-mode` itself because the entry
// animation is written as `[data-mode="play"] .candor-logo` — the class is
// what holds the timing, and repeating it here means the floating mark and
// the in-intro one can never drift apart.
//
// `delayMs` is not needed: the animation's own --at-furniture delay does the
// waiting, exactly as it does inside the intro.
export function CandorFloatingLogo({ children }) {
  const [mode, setMode] = useState(null);

  // The same resolution CandorLine does, and deliberately a separate copy:
  // this mounts before CandorLine in the page's JSX, and by the time
  // CandorLine's effect writes SEEN_KEY this one has already read it. Sharing
  // one read would mean sharing state across two trees for no gain.
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      // Private mode, or storage disabled. Play it.
    }
    setMode(seen ? "done" : "play");
  }, []);

  return (
    <div
      className="candor-intro-logo-host pointer-events-none fixed inset-x-0 top-5 z-40 flex justify-center"
      data-mode={mode ?? undefined}
    >
      <div className="candor-logo">{children}</div>
    </div>
  );
}

export default function CandorLine({
  logo,
  chrome,
  copyright,
  floatingLogo = false,
}) {
  // null while undecided — sessionStorage cannot be read during the server
  // render, and guessing either way would hydrate to a mismatch. Resolved in
  // an effect on the client, to "play" or "done".
  const [mode, setMode] = useState(null);
  // Set once the measurement is in and the CSS may start.
  const [running, setRunning] = useState(false);
  // Bumped by the replay button. It is used as a React `key` on the animating
  // subtree, which is the only reliable way to re-run a finished CSS
  // animation: flipping data-mode off and on again does not do it, because
  // the browser sees the same animation names on the same elements and leaves
  // them sitting on their filled end state. Changing the key throws those
  // elements away and mounts new ones, so every animation starts from zero.
  const [take, setTake] = useState(0);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      // Private mode, or storage disabled. Play it: an intro that runs when
      // it should not is a far smaller fault than a blank page.
    }
    if (seen) {
      setMode("done");
      return;
    }
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Not fatal — it just means the next visit plays it again.
    }
    setMode("play");
  }, []);
  const paraRef = useRef(null);
  const spanRefs = useRef({});
  const [deltas, setDeltas] = useState(null);

  // Each letter's own fall. Redrawn per TAKE, not once for the life of the
  // component: `take` is bumped by the replay button, so every replay gets a
  // genuinely different fall rather than repeating the first one. It cannot be
  // drawn on every render — a letter would jump to a new spin mid-drop — so
  // the take is the dependency, and within one take it is stable.
  //
  // The remount does not cover this: `key` sits on the .candor-intro div
  // INSIDE this component, so that subtree is rebuilt on replay while
  // CandorLine itself never unmounts and its memos survive.
  //
  // Spin and drift are signed — sign is drawn separately from magnitude, so a
  // letter is equally likely to turn either way whatever its size of turn.
  // Drawing a signed value directly would cluster the small rotations around
  // zero, and a letter that barely turns reads as one that failed to.
  const fall = useMemo(() => {
    const out = {};
    const pick = (min, max) => min + Math.random() * (max - min);
    const sign = () => (Math.random() < 0.5 ? -1 : 1);
    for (const p of ORDERED) {
      out[p.index] = {
        delay: Math.random() * FALL_STAGGER_MS,
        dur: pick(FALL_MIN_MS, FALL_MAX_MS),
        spin: sign() * pick(SPIN_MIN_DEG, SPIN_MAX_DEG),
        drift: sign() * Math.random() * DRIFT_MAX_VW,
      };
    }
    return out;
  }, [take]);

  // Declared here rather than beside the other state above, because it
  // touches setDeltas — referencing it earlier would be a temporal dead zone
  // error the moment the button was pressed.
  const replay = () => {
    setRunning(false);
    setDeltas(null);
    // "play" regardless of what this visit was: the button's whole purpose is
    // to see the intro, including on a repeat visit that would otherwise skip
    // straight to the settled state.
    setMode("play");
    setTake((n) => n + 1);
  };

  // The display face (Arno Pro) is a @font-face with font-display: swap, so
  // the browser paints the fallback — Inter — and swaps when Arno arrives.
  // That flash is visible on its own, and it also moves the goalposts: the
  // flight vectors are computed from real glyph widths, and those change when
  // the face swaps. So nothing starts until the font is actually in.
  const [fontReady, setFontReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const done = () => {
      if (!cancelled) setFontReady(true);
    };
    if (typeof document === "undefined" || !document.fonts) {
      done();
      return;
    }
    Promise.race([
      // ONLY Arno, and only the upright face.
      //
      // This used to also await document.fonts.ready, which is what made the
      // intro sit still for a second or more before it began. That promise
      // waits for EVERY font the document uses to settle — and this page
      // pulls Bitter and Inter from a third-party CDN (two @import lines in
      // globals.css, five weights each) plus four more faces in
      // carousel.css. Arno is a 36KB local file that is ready almost
      // immediately; the intro was waiting on ten remote files it does not
      // draw a single glyph with.
      //
      // The upright face, not italic: there is only ever
      // `arnopro-regular.woff2` — no italic @font-face exists, so the
      // sentence's italic is SYNTHESISED by the browser from this same file.
      // Asking for a face that is not declared cannot resolve any sooner and
      // risks resolving against nothing at all.
      document.fonts.load('17px "Arno Pro"'),
      // Never hang the page on a font that fails to arrive. 2000ms was the
      // ceiling when this waited on the whole document; against one local
      // file it is a backstop that should never be reached.
      new Promise((r) => setTimeout(r, 1200)),
    ]).then(done, done);
    return () => {
      cancelled = true;
    };
  }, []);

  // Measure, then start. Layout effect so the measurement and the attribute
  // flip land in the same frame — measuring in a passive effect would let one
  // frame paint with the letters already marked as running but not yet
  // carrying their vectors.
  //
  // Typing only animates opacity, so the glyphs are at their final positions
  // from the first frame and can be measured straight away.
  useLayoutEffect(() => {
    // Only the playing visit measures and runs. On a repeat visit the CSS
    // paints the settled state directly and there is nothing to fly.
    if (mode !== "play" || !fontReady || running) return;

    const para = paraRef.current;
    if (!para) return;

    const rects = ORDERED.map((pick) => {
      const el = spanRefs.current[pick.index];
      return el ? { pick, rect: el.getBoundingClientRect() } : null;
    });
    if (rects.some((r) => !r || r.rect.width === 0)) return;

    const paraRect = para.getBoundingClientRect();
    const fontSize = parseFloat(getComputedStyle(para).fontSize) || 16;
    const gap = fontSize * TRACKING_EM;

    // Real glyph widths rather than a fixed step, so the spacing stays even
    // between letters of different widths.
    const widths = rects.map((r) => r.rect.width);
    const totalW =
      widths.reduce((sum, w) => sum + w, 0) + gap * (widths.length - 1);

    const startX = paraRect.left + (paraRect.width - totalW) / 2;
    const centerY = paraRect.top + paraRect.height / 2;

    const next = {};
    let cursorX = startX;
    rects.forEach(({ pick, rect }, i) => {
      next[pick.index] = {
        x: cursorX - rect.left,
        // Align on the glyphs' vertical centres, so letters of differing
        // height sit on one line rather than one baseline-of-origin.
        y: centerY - (rect.top + rect.height / 2),
      };
      cursorX += widths[i] + gap;
    });

    setDeltas(next);
    setRunning(true);
  }, [mode, fontReady, running]);

  const chars = LINE.split("");

  return (
    // Fragment, so the replay button can sit OUTSIDE the keyed subtree — it
    // must survive the remount that restarts the animations, or pressing it
    // would destroy the very element that was pressed.
    <>
      {/* Dev affordance: replays the intro without a reload.
          Top-right because every other corner is spoken for — the wordmark
          lands top-centre, JOIN/INFO sits bottom-left and the copyright
          bottom-right — and outside the keyed div so it survives the
          remount that restarts the animations. */}
      <button
        type="button"
        onClick={replay}
        className="pointer-events-auto absolute right-3 top-5 z-50 rounded-full border border-black/15 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-black/60 backdrop-blur transition-colors hover:border-black/30 hover:text-black/90"
      >
        Replay
      </button>

      {/* "play" only once the measurement is in, so the animations never start
          against letters that have no flight vectors yet. "done" paints the
          settled state outright. Undecided renders neither, which is what
          keeps the server markup and the first client render identical.

          The key is what makes replay work: a CSS animation that has finished
          will not run again just because an attribute changed, so the whole
          subtree is thrown away and rebuilt instead. */}
      <div
        key={take}
        className="candor-intro"
        data-mode={mode === "done" ? "done" : running ? "play" : undefined}
        style={{
          // NOTHING paints until the first frame of the intro can actually be
          // drawn — that is, until the visit has been resolved against
          // sessionStorage and, on a playing visit, the face has arrived and
          // the measurement is in.
          //
          // Most of the intro already hides itself: the logo, the chrome and
          // the cards all sit at opacity 0 and the sentence at
          // visibility:hidden. The copyright did not — it is deliberately on
          // screen for the whole sequence — so on entry it painted alone in
          // the corner of an otherwise empty page while the font resolved.
          // Gating the whole block is what makes that impossible to
          // reintroduce: any element added here later is covered by the same
          // rule rather than needing its own.
          //
          // The page's own background shows through, so the screen is simply
          // white until there is something to show.
          visibility: mode === "done" || running ? "visible" : "hidden",
        }}
      >
        {/* Omitted entirely when the page is rendering the wordmark itself
            (see `floatingLogo`). It cannot simply be switched to position:
            fixed here — a fixed element is still clipped by an ancestor's
            overflow-hidden, which the sticky wrapper on the landing page has,
            so the mark has to be rendered OUTSIDE that wrapper to survive. */}
        {!floatingLogo && (
          <div className="candor-logo pointer-events-none absolute inset-x-0 top-5 z-20 flex justify-center">
            {logo}
          </div>
        )}

        <div className="candor-chrome">{chrome}</div>

        {/* No class that hides it and no entry animation: the copyright is on
          screen from the first frame, through the whole intro, and stays.
          Rendered as a bare fragment so its own absolutely-positioned div
          still resolves against .candor-intro and holds its corner. */}
        {copyright}

        {/* The two placeholders, centred. They begin arriving while the name is
          still clearing the top of the frame, so the middle of the page is
          filling as it empties rather than after. */}
        {/* 2:3, the house portrait ratio — the same box the board cards and the
          rail's polaroids use, so these read as standing in for real imagery
          rather than as generic blocks. Sized by HEIGHT with the ratio doing
          the width, so the proportion holds at every viewport instead of
          drifting as two independent dimensions would. */}
        <div className="candor-cards pointer-events-none absolute inset-0 z-0 flex items-center justify-center gap-3 md:gap-6">
          {CARDS.map(({ label, href, src }) => (
            // h-full, and not decorative: the card inside is sized at a
            // percentage of its parent, and a percentage height against a flex
            // item whose own height is `auto` resolves to nothing. The anchor
            // has to carry the container's height down for that to work.
            <a
              key={label}
              href={href}
              className="pointer-events-auto flex h-full items-center"
            >
              {/* The placeholder IS the frame: the photograph fades in over the
                breathing grey once it has decoded, so the card forms in place
                rather than being swapped for a different element.

                Sized by HEIGHT, with aspect-[2/3] deriving the width, so the
                proportion is identical at every viewport instead of drifting
                as two independent dimensions would.

                MOBILE (the unprefixed value) keeps the pair side by side, so
                the binding constraint is WIDTH, not height: two cards plus a
                12px gap inside ~30px of rail on each side is (100vw-72px),
                halved, and a 2:3 card that wide is 1.5x as tall — 0.75 is
                that half times 1.5. 30px is what the ROTATED chrome needs —
                only as wide as 10px type is tall, plus its padding — which is
                why the rails can be this narrow at all; set horizontally the
                same text would want 64px a side and leave the cards unusable.
                The 62% ceiling only binds on unusually tall narrow phones.

                FROM md UP the pair sits side by side and the three terms are
                a floor race — whichever binds first wins:
                  76%               of the CONTAINER, not a vh of the viewport.
                                    That distinction is what makes the space
                                    above and below the cards identical: the
                                    container is already inset by the page's
                                    py-5, so a percentage of it is symmetric by
                                    construction, whereas a vh value is
                                    measured against a box 40px taller than
                                    the one the cards actually sit in.
                  700px             stops the pair becoming absurd on very
                                    large displays
                  (100vw-120px)*.75 narrow screens: each card can take half of
                                    (viewport - 120px of gutter and gap), and
                                    a 2:3 card that wide is 1.5x as tall —
                                    0.75 is that half times 1.5 */}
              <div
                className="candor-card relative aspect-[2/3] h-[min(62%,(100vw-72px)*0.75)] md:h-[min(76%,700px,(100vw-120px)*0.75)]"
                style={{ containerType: "inline-size" }}
              >
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="candor-card-img absolute inset-0 h-full w-full object-cover"
                  onLoad={(e) => {
                    e.currentTarget.dataset.loaded = "1";
                  }}
                />

                {/* The overlay. Two layers doing two different jobs, in one
                    element: a flat tint across the whole photograph so the
                    pair reads as a set rather than as two unrelated pictures,
                    and a radial darkening at the centre so the white label has
                    ground to sit on.
                    Both are needed. The flat tint alone leaves the word
                    fighting whatever happens to be behind it — the Sargent on
                    the left is almost entirely pale dress — and the radial
                    alone reads as a smudge laid over an otherwise untouched
                    image. */}
                <div
                  aria-hidden="true"
                  className="candor-card-overlay absolute inset-0"
                />

                {/* The label, centred ON the card. An h1 so it picks up the
                    display face globals.css gives headings — that rule is
                    un-layered and beats Tailwind's utilities, which is why the
                    size and line-height are set inline here rather than with
                    text-[…] classes that would lose to it. Same trap as the
                    one noted in models/page.js and talents/page.js. */}
                <h1
                  className="candor-card-label absolute inset-0 flex items-center justify-center text-center uppercase tracking-[0.14em] text-white"
                  style={{
                    // Sized against the CARD, not the viewport. 11.2cqw is
                    // what makes the longer of the two words fill ~80% of the
                    // frame: TALENTS is eight characters, and with the initial
                    // at 1.34x plus 0.14em tracking it advances ~7.1x the font
                    // size. A vw-based clamp cannot do this — the card is a
                    // proportion of the viewport HEIGHT on desktop and of its
                    // WIDTH on mobile, so a size that fitted one broke the
                    // other, and TALENTS overflowed its card at every width.
                    // clamp() still floors and caps it, so the word stays
                    // legible on a small phone and does not become a poster on
                    // a large display.
                    fontSize: "clamp(16px, 11.2cqw, 62px)",
                    lineHeight: 1,
                    // The type is over a photograph, so it carries its own
                    // shadow as well as the scrim: between them the word holds
                    // whether the pixels behind it land light or dark.
                    textShadow: "0 1px 24px rgba(0,0,0,0.55)",
                  }}
                >
                  {/* The initial is set larger than the rest of the word, so
                      MODELS and TALENTS read as display type rather than as
                      two labels in the same size.
                      It has to be a SPAN rather than ::first-letter: the label
                      is uppercased in CSS, so the M and the odels arrive as
                      one run of text and a pseudo-element could size the glyph
                      but not carry the tighter tracking the larger size needs.
                      Splitting it in the markup also keeps the accessible name
                      intact — it is still one word to a screen reader. */}
                  {/* An inner flex row so the two spans can sit on a shared
                      BASELINE while the h1 above still centres the word in the
                      card. Doing both on one element is not possible:
                      items-baseline would align the letters correctly but
                      stop centring the block vertically. */}
                  <span
                    aria-hidden="true"
                    className="flex items-baseline justify-center"
                  >
                    <span style={{ fontSize: "1.34em", lineHeight: 1 }}>
                      {label.charAt(0)}
                    </span>
                    <span>{label.slice(1)}</span>
                  </span>
                  <span className="sr-only">{label}</span>
                </h1>
              </div>
            </a>
          ))}
        </div>

        <div className="candor-block pointer-events-none relative z-10 flex h-full flex-col items-center justify-center">
          <p
            ref={paraRef}
            className="max-w-[34ch] text-center text-[15px] italic leading-[1.45] md:text-[17px]"
            style={{
              fontFamily: "var(--font-h1)",
              // Held back until Arno is in — otherwise the first thing on screen
              // is the sentence set in Inter, which then reflows as the face
              // swaps under it.
              // Hidden until Arno is in, and hidden for good on a repeat visit:
              // the sentence has already been read once this tab, and the page
              // should open on the state the intro leaves behind.
              visibility: fontReady && mode !== "done" ? "visible" : "hidden",
            }}
            // The whole sentence stays the accessible text however the effect is
            // playing — it is decorative, and a screen reader should not be
            // handed six loose letters.
            aria-label={LINE}
          >
            {chars.map((char, i) => {
              const isPick = Boolean(PICKS[i]);
              const delta = deltas?.[i];
              const drop = fall[i];

              return (
                <span
                  key={i}
                  aria-hidden="true"
                  ref={
                    isPick
                      ? (el) => {
                          spanRefs.current[i] = el;
                        }
                      : undefined
                  }
                  className={`candor-char${isPick ? " candor-pick" : ""}`}
                  style={{
                    // This character's delay, as a FINISHED TIME VALUE with its
                    // unit — "73.20ms", not the bare number 0.122.
                    //
                    // It has to carry the unit here. A custom property that CSS
                    // has not been told the type of is substituted as raw text,
                    // so calc(var(--t) * var(--type-ms)) was multiplying the
                    // string "0.12200" by a time and producing an invalid value
                    // — which makes the whole animation-delay fall back to 0 and
                    // fires every character at once, with no stagger at all and
                    // no error anywhere to say so.
                    //
                    // Doing the multiplication in JS sidesteps that completely:
                    // what reaches CSS is already a time, so there is nothing
                    // left for it to compute and nothing to mistype. The cost
                    // is that --type-ms no longer drives the stagger from the
                    // stylesheet; TYPE_MS is the source of truth, and the CSS
                    // variable is kept in step with it only so the timeline
                    // reads in one place.
                    "--t": `${charDelay(i, chars.length).toFixed(2)}ms`,
                    ...(isPick
                      ? {
                          // The flight vector, measured above.
                          "--dx": `${(delta?.x ?? 0).toFixed(2)}px`,
                          "--dy": `${(delta?.y ?? 0).toFixed(2)}px`,
                          // This letter's own fall: when it lets go, how long
                          // it takes, how far it turns and how far it drifts.
                          "--fall-delay": `${drop.delay.toFixed(0)}ms`,
                          "--fall-dur": `${drop.dur.toFixed(0)}ms`,
                          "--spin": `${drop.spin.toFixed(1)}deg`,
                          "--drift": `${drop.drift.toFixed(2)}vw`,
                        }
                      : null),
                  }}
                >
                  {char}
                </span>
              );
            })}
          </p>
        </div>
      </div>
    </>
  );
}

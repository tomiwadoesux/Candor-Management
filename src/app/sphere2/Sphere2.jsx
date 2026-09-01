"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";

import { models } from "../../../data/models";
import ChromeLink from "@/components/ChromeLink";
import CreativeSphere from "@/components/CreativeSphere";
import LogoAnimation from "@/components/LogoAnimation";

// gsap + MorphSVG, same as the header mounts it
const InNav = dynamic(() => import("@/components/InNav"), { ssr: false });

// The hero's box pattern (Hero2's layoutDataDesktop) relative to the screen
// centre at the 1920×1080 design size — first-set boxes sit at x − 2000, the
// wordmark channel in the middle stays empty. Hero2 repeats this every
// 2000px; here it's also repeated vertically every 1500px (the board height)
// so the pattern carries on past every edge of the screen.
const HERO_PATTERN = [
  { dx: -710, dy: -520, w: 320, h: 460 },
  { dx: -340, dy: -530, w: 340, h: 250 },
  { dx: -710, dy: -10, w: 350, h: 260 },
  { dx: -300, dy: 130, w: 300, h: 400 },
  { dx: -710, dy: 300, w: 360, h: 240 },
  { dx: -1960, dy: -510, w: 380, h: 260 },
  { dx: -1530, dy: -570, w: 300, h: 440 },
  { dx: -1650, dy: -70, w: 370, h: 270 },
  { dx: -1940, dy: 250, w: 320, h: 420 },
  { dx: -1560, dy: 260, w: 360, h: 250 },
  { dx: -1170, dy: -530, w: 340, h: 480 },
  { dx: -1150, dy: 10, w: 400, h: 280 },
  { dx: -1170, dy: 350, w: 360, h: 240 },
];
const PERIOD_X = 2000;
const PERIOD_Y = 1500;

// Tile the pattern 4 across × 3 down around the centre. The component fills
// the slots nearest the centre first, so the screen shows the hero's boxes
// and the rest park just beyond the edges.
const BOARD = [];
for (let ky = -1; ky <= 1; ky++) {
  for (let kx = -1; kx <= 2; kx++) {
    for (const b of HERO_PATTERN) {
      BOARD.push({ ...b, dx: b.dx + kx * PERIOD_X, dy: b.dy + ky * PERIOD_Y });
    }
  }
}

// Scale with the viewport width like the hero and convert to centre-based
// screen px (px/py = tile centre).
const heroBoard = ({ W, H }) => {
  const s = Math.min(1.2, Math.max(0.55, W / 1920));
  return BOARD.map(({ dx, dy, w, h }) => ({
    px: W / 2 + (dx + w / 2) * s,
    py: H / 2 + (dy + h / 2) * s,
    w: w * s,
    h: h * s,
  }));
};

// Same 53 looks as /sphere, but from /public/thumbs/sphere — 448px JPEGs
// (~10× smaller than the originals). The cards are 60px on the globe and the
// open one sits in a ~400px channel, so nothing bigger is ever shown.
// Every look is credited to somebody on the roster. There is no real link in
// the data yet, so the looks are dealt round-robin over it — swap this one
// line for the real relation once the works carry their own credit.
const items = Array.from({ length: 53 }, (_, i) => ({
  src: `/thumbs/sphere/${i + 1}.jpg`,
  label: `Look ${String(i + 1).padStart(2, "0")}`,
  meta: "CANDOR",
  person: models[i % models.length],
}));

// first look credited to each person — where the globe turns to on a click
const FIRST_LOOK = new Map();
items.forEach((it, i) => {
  if (!FIRST_LOOK.has(it.person.id)) FIRST_LOOK.set(it.person.id, i);
});

const config = {
  // the globe fills the viewport — the rim rides just inside the edges, so
  // radius is left high and the viewport clamp is what actually sets it
  radius: 1200,
  radiusInsetX: 28,
  radiusInsetY: 60,
  // slightly larger cards to match the larger globe, with a bit more lift on
  // the ones passing through the centre
  planeSize: 72,
  mobilePlaneSize: 54,
  lensBoost: 1.15,
  // cards swell as the pointer closes on them
  cursorBoost: 0.2,
  cursorReach: 260,
  // depth: the inside of the globe recedes into the page white — the haze
  // runs from the centre plane out, so a shorter reach = a whiter far side
  fogDepth: 1.15,
  depthScaleBack: 0.38,
  depthFadeBack: 0.6,
  // a touch slower than the default, open and close alike so they stay a
  // matched pair
  expandDuration: 0.95,
  // open card lives in the hero's wordmark channel
  expandHeightVh: 36,
  expandCenterY: 0.47,
  gridOpacity: 1,
  // the board holds still — no easing towards the pointer
  hoverPan: 0,
  // the wheel does nothing here; the orb is drag-only, and the drag turns the
  // globe well under 1:1 with the pointer so it takes a long pull to spin
  wheelSpeed: 0,
  dragSpeed: 0.0014, // rad per px (default 0.0022)
  // the orb's own motion is a slow drift that changes its mind every so often
  // rather than a fixed spin
  idleWander: true,
};

// ---------------------------------------------------------------------------
// Page chrome: the wordmark, the menu and the two text blocks that frame the
// sphere. Page padding matches the rest of the site (px-3 md:px-5, 20px top
// and bottom — the same rhythm as /models and the bottom search island). It
// takes no pointer events except on the links themselves, so the orb stays
// draggable through it, and the whole lot fades out the moment a card opens.
// ---------------------------------------------------------------------------
const Rule = () => <span className="my-1.5 block h-px w-6 bg-black/25" />;

// every heading on the page reads the same: small, all caps, bold
const TOPIC = "text-[12px] font-bold uppercase tracking-[0.02em]";

const FADE = "transition-opacity duration-500";
const fade = (hidden) => ({ opacity: hidden ? 0 : 1 });

function PageChrome({ hidden, embedded }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between px-3 py-5 text-black md:px-5">
      <div className="flex items-start justify-between">
        {/* the wordmark holds through every state — it is the page's anchor,
            not part of the furniture that clears away for an open card.
            Embedded in the landing page there is already a docked CANDOR
            fixed at the top, so the anchor is inherited and not repeated. */}
        {!embedded && (
          <span
            className="select-none text-[30px] uppercase leading-none tracking-[0.06em]"
            style={{ fontFamily: "var(--font-h1)" }}
          >
            Candor
            <sup className="ml-0.5 align-super text-[8px] tracking-normal">
              ®
            </sup>
          </span>
        )}
        {/* the same menu that lives in the bottom search island — one
            component, so a change there lands on both */}
        <div
          className={`ml-auto pointer-events-auto ${FADE}`}
          style={fade(hidden)}
        >
          {embedded ? (
            // Embedded, the menu is the half of the handover that arrives: the
            // landing page's scroll loop scales it in from this corner as the
            // bottom search island scales away. Starts at 0 so it can't flash
            // in before that loop's first frame. The outer wrapper still owns
            // the open-card fade, so the two opacities simply multiply.
            <div
              data-sphere-menu
              style={{
                opacity: 0,
                transformOrigin: "top right",
                willChange: "transform, opacity",
              }}
            >
              <InNav />
            </div>
          ) : (
            <InNav />
          )}
        </div>
      </div>

      {/* centred on the viewport, not on the gap between the rows above and
          below it, so it holds the middle of the right edge */}
      <div
        aria-hidden={hidden}
        className={`absolute inset-y-0 right-3 flex items-center md:right-5 ${FADE}`}
        style={fade(hidden)}
      >
        <div className="flex flex-col items-end text-[14px] leading-[1.45]">
          <span className={TOPIC}>MODELS &amp; TALENT</span>
          <div className="mt-3 flex flex-col items-end">
            <ChromeLink href="mailto:join@candormanagement.com">
              join@candormanagement.com
            </ChromeLink>
            <ChromeLink href="tel:+448127518055">+44 812 751 8055</ChromeLink>
            <Rule />
            <ChromeLink>Become a Talent</ChromeLink>
            <ChromeLink>Submit Polaroids</ChromeLink>
            <Rule />
            <ChromeLink>Model Policy</ChromeLink>
          </div>
        </div>
      </div>

      {/* items-end sits the locations on the copyright's own line */}
      <div
        aria-hidden={hidden}
        className={`flex items-end justify-between text-[14px] leading-[1.45] ${FADE}`}
        style={fade(hidden)}
      >
        <div>
          <span className={TOPIC}>INFO</span>
          <div className="mt-3 flex flex-col items-start">
            <ChromeLink left>Instagram</ChromeLink>
            <ChromeLink left>Linkedin</ChromeLink>
            <ChromeLink left>Youtube</ChromeLink>
            <Rule />
            <ChromeLink left href="mailto:contact@candormanagement.com">
              contact@candormanagement.com
            </ChromeLink>
            <ChromeLink left href="tel:+2348177518066">
              +234 817 751 8066
            </ChromeLink>
            <Rule />
            <ChromeLink left>privacy policy</ChromeLink>
            <ChromeLink left>terms and conditions</ChromeLink>
          </div>
          <span className="mt-6 block text-[12px] text-black/45">
            © {new Date().getFullYear()} Candor Management Agency
          </span>
        </div>
        <span className="text-[12px] text-black/45">Lagos</span>
      </div>
    </div>
  );
}

// The roster, right-aligned down the right edge while one card is forward. It
// centres itself vertically on however many names there are rather than
// stretching to the edges. No width either: it shrink-wraps the longest name,
// taking only the room it needs.
//
// Hidden below xl, where the open card's own details column reaches too far
// right for the two to sit side by side. Renders above the frosted sheet, so
// it stays crisp on it.
// Ordered into a lens: longest name at the top, next longest at the bottom,
// working inwards to the shortest in the middle. Sorting by length and then
// dealing the names alternately to the two ends gets there in one pass, so
// the shape holds itself however the roster changes.
const TALENT_ORDER = (() => {
  const byLength = [...models].sort((a, b) => b.name.length - a.name.length);
  const top = [];
  const bottom = [];
  byLength.forEach((m, i) => (i % 2 === 0 ? top : bottom).push(m));
  return [...top, ...bottom.reverse()];
})();

function TalentIndex({ show, onPick }) {
  return (
    <div
      aria-hidden={!show}
      className="pointer-events-none absolute inset-y-0 right-0 z-20 hidden flex-col items-end justify-center gap-2 whitespace-nowrap py-5 pr-3 text-right text-[13px] leading-none text-black transition-opacity duration-500 md:pr-5 xl:flex"
      style={{ opacity: show ? 1 : 0 }}
    >
      {TALENT_ORDER.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onPick(m)}
          className="pointer-events-auto opacity-50 transition-opacity duration-200 hover:opacity-100"
        >
          {m.name}
        </button>
      ))}
    </div>
  );
}

// Whose work is on screen, down the left edge. A model is the subject of the
// picture rather than its author, so that panel is measurements and a link to
// the portfolio; everyone else authored it, so theirs leads with the credit.
function WorkDetails({ item }) {
  const p = item?.person;
  const isModel = !p || p.talent === "Model";
  const rows = !p
    ? []
    : isModel
      ? [
          ["Height", p.height],
          ["Chest", p.chest],
          ["Waist", p.waist],
          ["Hips", p.hips],
          ["Shoe", p.shoe],
        ]
      : [
          ["Talent", p.talent],
          ["Focus", p.focus],
          ["Based", p.based],
          ["Since", p.since],
        ];

  return (
    <div
      aria-hidden={!item}
      className="pointer-events-none absolute inset-y-0 left-3 z-20 flex max-w-[260px] flex-col justify-center py-5 text-[14px] leading-[1.45] text-black transition-opacity duration-500 md:left-5"
      style={{ opacity: item ? 1 : 0 }}
    >
      {p && (
        <>
          <span className={TOPIC}>
            {isModel ? p.board : `By: ${p.name}`}
          </span>
          <span className="mt-3 text-[15px] leading-tight">
            {isModel ? p.name : item.label}
          </span>
          <dl className="mt-4 flex flex-col gap-1">
            {rows
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="flex items-baseline gap-3">
                  <dt className={`w-[58px] shrink-0 ${TOPIC}`}>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
          </dl>
          <Rule />
          <ChromeLink left href={`/models/${p.id}`}>
            View portfolio
          </ChromeLink>
        </>
      )}
    </div>
  );
}

export default function Sphere2({ embedded = false }) {
  const [stage, setStage] = useState(null);
  const [item, setItem] = useState(null);
  const sphere = useRef(null);

  return (
    <div className="relative h-full w-full">
      <CreativeSphere
        items={items}
        title=""
        config={config}
        openSlots={heroBoard}
        apiRef={sphere}
        onOpenChange={(open, next, openItem) => {
          setStage(open ? next : null);
          setItem(open ? openItem : null);
        }}
      />
      {/* The board deliberately reuses Hero2's central wordmark channel. When
          it is opened without a selected look, restore the same mark there so
          the negative space reads as a purposeful part of the shared layout. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[15] flex items-center justify-center text-black transition-opacity duration-500"
        style={{ opacity: stage === "board" ? 1 : 0 }}
      >
        <LogoAnimation
          animate={false}
          tight
          className="w-[260px] md:w-[420px] lg:w-[560px]"
        />
      </div>
      <PageChrome hidden={!!stage} embedded={embedded} />
      <TalentIndex
        show={stage === "focus"}
        onPick={(m) => sphere.current?.show(FIRST_LOOK.get(m.id) ?? 0)}
      />
      <WorkDetails item={stage === "focus" ? item : null} />
    </div>
  );
}

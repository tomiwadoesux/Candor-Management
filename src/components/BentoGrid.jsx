"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

// Savee-style masonry board: a screen-high grid of mixed-size tiles that pans
// a little further as the cursor moves down it. Used full-page at /bento (where
// it is tuned) and as the models section on the landing page.

// Deterministic PRNG (mulberry32). The tile sizes have to be IDENTICAL on the
// server and the client — Math.random() would render one layout during SSR and a
// different one on hydration, which React rejects as a mismatch. Seeding it
// keeps the board looking randomly sized while staying perfectly stable.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// width ÷ height. Weighted toward portrait, like a real moodboard — with a few
// squares, a couple of wide crops and the odd very tall one to break the rhythm.
const RATIOS = [
  0.66, 0.75, 0.75, 0.8, 0.8, 1, 1, 1.25, 1.33, 1.5, 1.78, 0.56, 0.9, 0.7,
];

const TILE_COUNT = 32;
const BASE_W = 640;

const TILES = (() => {
  const rand = mulberry32(20260826);
  return Array.from({ length: TILE_COUNT }, (_, i) => {
    const ratio = RATIOS[Math.floor(rand() * RATIOS.length)];
    const height = Math.round(BASE_W / ratio);
    return {
      id: i,
      width: BASE_W,
      height,
      // A per-tile seed pins each slot to the same picture across reloads, so
      // the board stops reshuffling every time you refresh to check a tweak.
      src: `https://picsum.photos/seed/bento-${i}/${BASE_W}/${height}`,
      isVideo: rand() < 0.14,
    };
  });
})();

// How far into the screen the pan reaches its extremes. With a dead band at each
// end the board rests fully at top and fully at bottom, instead of only touching
// those states when the cursor is pinned to the very edge of the screen.
const PAN_DEADBAND = 0.12;
// Time constant of the glide, in ms. Higher = heavier, more trailing.
const PAN_EASE = 220;
// Ceiling on the whole board, in screens. Left to itself the grid runs 1.3x to
// 1.9x the viewport depending on the window's SHAPE — column count and column
// width set the board's height, the window sets the screen's — so the amount
// hiding below the fold, and with it the reveal, would differ on every machine.
// Clipping the board here fixes it: the grid is never taller than this, and the
// slice past the first screen is exactly what the hover pans into view. One
// number, so raising it grows the board and the reveal together.
const BOARD_MAX_VH = 1.2;

export default function BentoGrid({ className = "" }) {
  const stageRef = useRef(null);
  const boardRef = useRef(null);
  // Tiles start lazy so dropping the board halfway down the landing page does
  // not pull 32 images on first paint. Once it nears the viewport they all
  // switch to eager together: the slice below the fold is clipped, not
  // off-screen, so leaving those lazy would pop them in mid-pan.
  const [armed, setArmed] = useState(false);

  // The board is taller than the screen but the page can't scroll, so the
  // cursor's height in the window drives it: sit near the top and you see the
  // first rows, move down and the board glides up to reveal the rest.
  useEffect(() => {
    const stage = stageRef.current;
    const board = boardRef.current;
    if (!stage || !board) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setArmed(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(stage);

    // Touch has no hover, so a pointer-driven pan would strand the tiles below
    // the fold with no way to reach them — give those devices a normal scroll.
    if (
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      stage.style.overflowY = "auto";
      return () => io.disconnect();
    }

    let range = 0;
    const measure = () => {
      // offsetHeight already reflects the max-height clamp, so this is the
      // clipped board's overflow — at most (BOARD_MAX_VH - 1) screens.
      range = Math.max(0, board.offsetHeight - stage.clientHeight);
    };
    measure();
    // Column balancing changes the board's height whenever the width does, and
    // again when the webfonts land — re-measure rather than trusting first paint.
    const ro = new ResizeObserver(measure);
    ro.observe(board);
    window.addEventListener("resize", measure);

    let target = 0;
    let current = 0;
    let raf = 0;
    let last = 0;

    const frame = (now) => {
      const dt = Math.min(100, now - (last || now));
      last = now;
      // Frame-rate-independent easing: a slow frame produces a bounded catch-up
      // step, so 60Hz and 120Hz feel identical.
      current += (target - current) * (1 - Math.exp(-dt / PAN_EASE));
      if (Math.abs(target - current) < 0.15) current = target;
      board.style.transform = `translate3d(0, ${current.toFixed(2)}px, 0)`;
      // Park the loop once it has settled; the next pointer move restarts it, so
      // an idle board costs nothing.
      if (current === target) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    };

    const onMove = (e) => {
      const r = stage.getBoundingClientRect();
      const t = (e.clientY - r.top) / r.height;
      const p = Math.min(
        1,
        Math.max(0, (t - PAN_DEADBAND) / (1 - PAN_DEADBAND * 2)),
      );
      target = -p * range;
      kick();
    };
    const onLeave = () => {
      target = 0;
      kick();
    };

    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);

    return () => {
      io.disconnect();
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", measure);
      ro.disconnect();
      cancelAnimationFrame(raf);
      board.style.transform = "";
    };
  }, []);

  return (
    <section
      ref={stageRef}
      className={`h-screen overflow-hidden bg-white text-[#0c0c0c] ${className}`}
    >
      {/* CSS multi-column masonry: the browser balances the columns itself, so
          the board reflows at every width with no JS and no layout shift. Each
          tile keeps its natural aspect ratio and break-inside-avoid stops one
          being sliced across a column boundary.

          The board is capped at one screen by the h-screen/overflow-hidden on
          the section, so it never adds scroll of its own. The columns themselves keep their
          natural auto height — pinning them to h-full instead would stop the
          browser balancing them, leaving ragged half-empty columns and spilling
          the remainder into sliced extra columns off the right edge. Balanced
          and clipped, every column runs full-bleed to the bottom edge. */}
      <div
        ref={boardRef}
        className="overflow-hidden px-3 py-3 md:px-5 md:py-5"
        style={{
          maxHeight: `${BOARD_MAX_VH * 100}vh`,
          willChange: "transform",
        }}
      >
        <div className="columns-2 gap-3 sm:columns-3 md:columns-4 md:gap-4 lg:columns-5 xl:columns-6">
          {TILES.map((tile) => (
            <Tile key={tile.id} tile={tile} armed={armed} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Tile({ tile, armed }) {
  return (
    <figure className="group relative mb-3 break-inside-avoid overflow-hidden bg-[#ececec] md:mb-4">
      <Image
        src={tile.src}
        alt=""
        width={tile.width}
        height={tile.height}
        // Tells the optimiser how wide the tile actually renders at each
        // breakpoint, so it never ships a 640px file into a 200px column.
        loading={armed ? "eager" : "lazy"}
        sizes="(min-width: 1280px) 16vw, (min-width: 1024px) 19vw, (min-width: 768px) 23vw, (min-width: 640px) 31vw, 48vw"
        className="h-auto w-full transition-transform duration-500 ease-out group-hover:scale-[1.02]"
      />

      {/* Always on, so you can read the board's media mix at a glance. */}
      {tile.isVideo && (
        <span className="absolute bottom-3 left-3 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-bold tracking-[0.12em] text-white/90 backdrop-blur-sm">
          VIDEO
        </span>
      )}
    </figure>
  );
}

"use client";

import { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { packRows, entranceOrder, originFor } from "@/lib/packRows";

/**
 * The morphing gallery board — justified rows of pictures that scale open as
 * you scroll past them. Used by /grid and by the tabbed boards on a model page.
 *
 *   1. Rows are a fixed number of tiles whose widths come from a weight
 *      pattern (lib/packRows.js) and are normalised to span the width exactly
 *      — so neighbours are deliberately different sizes and no row is left
 *      with a hole in it. `rowSizes` sets how many to a row.
 *   2. Nothing is cropped — a tile's box *is* the picture's aspect ratio
 *      (measured server-side in lib/imageSize.js). A wider box is therefore a
 *      taller one: tops stay flush to the row's line and the bottoms rag out.
 *   3. As a row crosses the bottom of the viewport its tiles open one after
 *      another, scrubbed by scroll position rather than fired once on
 *      intersection — so scrolling back up rewinds the sequence. Each tile is
 *      half open before the next one starts, and the running order is authored
 *      per row rather than left to right: one row opens from the centre,
 *      another from the ends, another backwards.
 *   4. Opening is a window growing out of a corner, not the picture itself
 *      shrinking: the frame scales 0 → 1 while the photo inside is
 *      counter-scaled, so it is always shown at full size and simply uncovered,
 *      settling from a slight zoom as the frame lands. Scaling the photo itself
 *      put a speck of a thumbnail on screen at the start of every tile.
 *   5. The corner is a top one — tiles lean away from the middle of their row
 *      so it opens outward, and anchoring the *top* is what holds the row's
 *      shared top line steady mid-entrance. A row whose tiles share their
 *      bottom line instead (the pairs layout) grows off bottom corners.
 *   6. Scroll sets each tile's *target*; what is drawn eases towards it over a
 *      few frames and then the loop stops. That is what keeps a notched mouse
 *      wheel or a dragged scrollbar from stepping the tiles open in jumps.
 *
 * Props:
 *   items      — [{ id, src, alt, pxW, pxH, label?, meta? }]
 *   onSelect   — optional; when given, tiles become buttons and call it
 *   className  — spacing for the board itself (padding, row gap)
 *   rowSizes   — tiles per row, cycled (see lib/packRows.js)
 *   layout     — a full set of packRows options, e.g. LAYOUTS.pairs; wins
 *                over rowSizes
 *   reveal     — viewport (default), static preview, or after-scroll for a
 *                profile whose first gallery row starts above the fold
 *   parallax   — optional inner-photo drift; leaves the reveal frame intact
 */

// Entrance timing. Two numbers, both in plain terms — turn these to retune.
//
// TILE_SCROLL: how far you scroll, as a fraction of the viewport height, to
// take one tile from nothing to full size. Deliberately generous — the scale
// is a big visual move and cramming it into a short scroll reads as a pop
// rather than an unfurl.
//
// HANDOFF: how far into a tile's opening the next one in the row starts. 0.5
// means each tile is half open before its neighbour moves at all. Keep this at
// 0.4 or above or the row stops reading as a sequence.
const TILE_SCROLL = 0.58;
const HANDOFF = 0.5;

// A tile has to *finish* opening while it is still on screen, and the last
// tile in a row doesn't start until (n-1) × HANDOFF of the way through. A row
// of four would run past the bottom of its own pictures at the full
// TILE_SCROLL, so the row's whole window is capped against how long the row
// stays in view: a viewport plus the row's own height, less a margin so the
// last tile lands with some of itself still showing. Rows of three are well
// under the cap and keep the full duration.
const VISIBILITY_MARGIN = 0.85;

// SETTLE: time constant, in ms, of the ease from where a tile is drawn to where
// scroll says it should be. Roughly a third of that gap closes per 16ms frame.
// Much higher and the board visibly trails the page; much lower and wheel
// notches show through again.
const SETTLE = 90;

// Below this width rows of three or more wrap to two-up and every tile is its
// own row, so the sequencing has nothing to sequence. Rows of two still sit
// side by side there and keep it.
const STACK_BREAKPOINT = 768;

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);

// Decelerates into full size, so a tile lands rather than stopping dead when
// the scroll position says it's done — and the small-window start, the least
// interesting part, goes by quickest.
const easeOut = (t) => 1 - (1 - t) ** 3;

export default function MorphGallery({
  items,
  onSelect,
  className = "",
  rowSizes,
  layout,
  reveal = "viewport",
  parallax = false,
}) {
  const rootRef = useRef(null);

  // Row structure only changes when the set or the row shape does.
  const rows = useMemo(
    () => packRows(items, layout ?? (rowSizes ? { rowSizes } : undefined)),
    [items, rowSizes, layout]
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // `--p` lives on the figure so both the media and the caption inherit it;
    // the measurement is taken off the media box inside.
    const tiles = Array.from(root.querySelectorAll("[data-card]")).map(
      (card) => ({
        card,
        box: card.querySelector("[data-media]"),
        order: Number(card.dataset.order) || 0,
        rowSize: Number(card.dataset.rowSize) || 1,
      })
    );
    if (!tiles.length) return;

    if (reveal === "static") {
      tiles.forEach(({ card }) => card.style.setProperty("--p", "1"));
      return;
    }
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Per tile: where scroll says it should be, where it is drawn, and the
    // last value written, so a settled tile costs no style work at all.
    const target = new Float32Array(tiles.length);
    const shown = new Float32Array(tiles.length);
    const written = new Array(tiles.length).fill("");

    let raf = 0;
    let last = 0;
    let dirty = true;

    const measure = () => {
      const vh = window.innerHeight;
      const narrow = window.innerWidth < STACK_BREAKPOINT;

      // Every rect first, then every write. Interleaving them makes each
      // setProperty invalidate style and the next getBoundingClientRect force
      // a fresh layout — a forced reflow per tile, per frame, which is what a
      // board this size feels like when it stutters.
      const rects = tiles.map(({ box }) => box.getBoundingClientRect());

      for (let i = 0; i < tiles.length; i++) {
        const { order, rowSize } = tiles[i];
        // The untransformed layout box: the scale lives on a child, so this
        // rect stays the tile's true position and size no matter where the
        // animation currently is.
        const rect = rects[i];

        // A stacked tile is alone on its line, so it neither waits nor has to
        // share the row's window.
        const stacked = narrow && rowSize > 2;
        const n = stacked ? 1 : rowSize;
        const spans = 1 + (n - 1) * HANDOFF; // tile durations the row occupies

        // What the row would like, against how long it is actually in view.
        const wanted = vh * TILE_SCROLL * spans;
        const affordable = (vh + rect.height) * VISIBILITY_MARGIN;
        const duration = Math.max(Math.min(wanted, affordable) / spans, 1);

        // Distance the tile's top has travelled since it crossed the fold.
        // Every tile in a row shares this, because they share a top line — the
        // sequence comes entirely from subtracting the tile's own start.
        const travelled = vh - rect.top;
        const start = stacked ? 0 : order * HANDOFF * duration;
        const viewportProgress = clamp01((travelled - start) / duration);
        // A profile's first row is already above the fold. It must wait for
        // actual page scroll rather than arriving partly open on page load.
        const scrollProgress = reveal === "after-scroll"
          ? clamp01((window.scrollY - start) / duration)
          : 1;
        target[i] = motion.matches
          ? (reveal === "after-scroll" && window.scrollY <= 0 ? 0 : 1)
          : Math.min(viewportProgress, scrollProgress);
      }
    };

    const paint = (i) => {
      const value = easeOut(shown[i]).toFixed(4);
      if (value !== written[i]) {
        tiles[i].card.style.setProperty("--p", value);
        if (reveal === "after-scroll") tiles[i].card.inert = Number(value) <= 0.001;
        written[i] = value;
      }
    };

    const frame = (now) => {
      raf = 0;
      // Clamped so a frame after a stall (tab switch, long task) eases rather
      // than jumping the whole way in one go.
      const dt = last ? Math.min(now - last, 48) : 16;
      last = now;

      if (dirty) {
        dirty = false;
        measure();
      }

      const k = 1 - Math.exp(-dt / SETTLE);
      let moving = false;

      for (let i = 0; i < tiles.length; i++) {
        const gap = target[i] - shown[i];
        if (motion.matches || (reveal === "after-scroll" && window.scrollY <= 0) || Math.abs(gap) < 0.001) {
          shown[i] = target[i];
        } else {
          shown[i] += gap * k;
          moving = true;
        }
        paint(i);
      }

      if (moving || dirty) {
        raf = requestAnimationFrame(frame);
      } else {
        last = 0;
      }
    };

    const schedule = () => {
      dirty = true;
      if (!raf) raf = requestAnimationFrame(frame);
    };

    // First paint lands where the page already is — nothing eases in on load
    // or when a board is swapped in.
    measure();
    dirty = false;
    for (let i = 0; i < tiles.length; i++) {
      shown[i] = target[i];
      paint(i);
    }

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Fonts and images settling in can shift the board; re-measure once.
    window.addEventListener("load", schedule);
    motion.addEventListener("change", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(root);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("load", schedule);
      motion.removeEventListener("change", schedule);
      observer.disconnect();
    };
    // Re-bind when the rows change — the tabs on a model page swap the whole
    // board out, and the old nodes are gone by then.
  }, [rows, reveal]);

  useEffect(() => {
    if (!parallax || !rootRef.current) return;
    const root = rootRef.current;
    const media = [...root.querySelectorAll("[data-media]")].map((box) => ({
      box, image: box.querySelector("img"), written: "",
    })).filter(({ image }) => image);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const travelAmounts = [0.22, 0.25, 0.21, 0.24];
    let raf = 0;

    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const rects = media.map(({ box }) => box.getBoundingClientRect());
      media.forEach((entry, index) => {
        const rect = rects[index];
        // Across the whole viewport, the photo drifts downward as its frame
        // travels upward. A 55% overscan safely contains the 21–25% travel.
        const progress = Math.max(-1, Math.min(1,
          (vh - 2 * (rect.top + rect.height / 2)) / (vh + rect.height)));
        const offset = progress * rect.height * travelAmounts[index % travelAmounts.length];
        const transform = motion.matches ? "none"
          : `translate3d(0, ${offset.toFixed(2)}px, 0) scale(1.55)`;
        if (entry.written !== transform) {
          entry.image.style.transform = transform;
          entry.written = transform;
        }
      });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(schedule);
    media.forEach(({ box }) => observer.observe(box));
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    motion.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      motion.removeEventListener("change", schedule);
      media.forEach(({ image }) => {
        image.style.removeProperty("transform");
      });
    };
  }, [rows, parallax]);

  return (
    <div ref={rootRef} className={`morph-board ${className}`}>
      {rows.map((row, r) => {
        const order = entranceOrder(row.items.length, r);

        return (
          <div
            key={r}
            className="morph-row"
            data-align={row.align}
            style={{ "--gaps": row.items.length - 1 }}
          >
            {row.items.map((item, i) => {
              const share = row.shares[i];
              // Rows of two stay side by side on a phone; longer rows wrap to
              // two-up there.
              const phoneVw =
                row.items.length <= 2 ? Math.round(share * 100) : 50;

              const media = (
                <>
                  {/* Layout box — never transformed, so it stays measurable. */}
                  <div data-media className="morph-tile__box">
                    {/* The window that grows out of the corner… */}
                    <div className="morph-tile__media">
                      {/* …and the photo, counter-scaled to stay full size. */}
                      <div className="morph-tile__photo">
                        <Image
                          src={item.src}
                          alt={item.alt}
                          fill
                          draggable={parallax ? false : undefined}
                          sizes={`(max-width: 767px) ${phoneVw}vw, ${Math.max(
                            Math.round(share * 92),
                            10
                          )}vw`}
                          className={`object-cover grayscale transition-[filter,scale] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:grayscale-0${parallax ? "" : " group-hover:scale-[1.03]"}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Caption rides in on the tail of the tile's own progress. */}
                  {(item.label || item.meta) && (
                    <figcaption className="morph-tile__caption mt-3 flex items-baseline justify-between gap-3 text-[11px] tracking-[0.04em]">
                      {/* The credit wraps on a narrow tile; the tag never does,
                          so a two-line credit still ends with its tag on the
                          tile's right edge. */}
                      <span className="min-w-0">{item.label}</span>
                      {item.meta && (
                        <span className="shrink-0 whitespace-nowrap text-[#0c0c0c]/40">
                          {item.meta}
                        </span>
                      )}
                    </figcaption>
                  )}
                </>
              );

              return (
                <figure
                  key={item.id}
                  data-card
                  inert={reveal === "after-scroll" ? true : undefined}
                  data-order={order[i]}
                  data-row-size={row.items.length}
                  className="morph-tile group"
                  style={{
                    // Fraction of the row's picture width this tile takes.
                    "--share": share,
                    // The photo's true proportions — no crop, no designed ratio.
                    "--ar": `${item.pxW} / ${item.pxH}`,
                    // Area-sized rows only: width per unit of row height, for
                    // the CSS height limit.
                    ...(row.caps && { "--cap": row.caps[i].toFixed(4) }),
                    "--origin": originFor(i, row.items.length, row.align),
                    "--p": reveal === "static" ? "1" : "0",
                  }}
                >
                  {onSelect ? (
                    <button
                      type="button"
                      onClick={() => onSelect(item, i)}
                      className="block w-full cursor-pointer text-left"
                    >
                      {media}
                    </button>
                  ) : (
                    media
                  )}
                </figure>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

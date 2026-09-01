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
 *   3. As a row crosses the bottom of the viewport its tiles scale 0 → 1 one
 *      after another, scrubbed by scroll position rather than fired once on
 *      intersection — so scrolling back up rewinds the sequence. Each tile is
 *      half open before the next one starts, and the running order is authored
 *      per row rather than left to right: one row opens from the centre,
 *      another from the ends, another backwards.
 *   4. The scale is anchored at a top corner, not the centre — tiles lean away
 *      from the middle of their row so it opens outward. Anchoring the *top*
 *      is what holds the row's shared top line steady mid-entrance; a
 *      bottom-anchored tile grows upward and walks its top edge off the line.
 *
 * Props:
 *   items      — [{ id, src, alt, pxW, pxH, label?, meta? }]
 *   onSelect   — optional; when given, tiles become buttons and call it
 *   className  — spacing for the board itself (padding, row gap)
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

// Below this width the board wraps to two-up and every tile is its own row, so
// the sequencing has nothing to sequence.
const STACK_BREAKPOINT = 768;

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);

export default function MorphGallery({
  items,
  onSelect,
  className = "",
  rowSizes,
}) {
  const rootRef = useRef(null);

  // Row structure only changes when the set or the row shape does.
  const rows = useMemo(
    () => packRows(items, rowSizes ? { rowSizes } : undefined),
    [items, rowSizes]
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

    // Reduced motion gets the finished board, no scrubbing.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      tiles.forEach(({ card }) => card.style.setProperty("--p", "1"));
      return;
    }

    let raf = 0;

    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const stacked = window.innerWidth < STACK_BREAKPOINT;

      // Every rect first, then every write. Interleaving them makes each
      // setProperty invalidate style and the next getBoundingClientRect force
      // a fresh layout — a forced reflow per tile, per frame, which is what a
      // board this size feels like when it stutters.
      const rects = tiles.map(({ box }) => box.getBoundingClientRect());

      for (let i = 0; i < tiles.length; i++) {
        const { card, order, rowSize } = tiles[i];
        // The untransformed layout box: the scale lives on a child, so this
        // rect stays the tile's true position and size no matter where the
        // animation currently is.
        const rect = rects[i];

        // A stacked tile is alone on its line, so it neither waits nor has to
        // share the row's window.
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
        const p = clamp01((travelled - start) / duration);

        card.style.setProperty("--p", p.toFixed(4));
      }
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Fonts and images settling in can shift the board; re-measure once.
    window.addEventListener("load", schedule);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("load", schedule);
    };
    // Re-bind when the rows change — the tabs on a model page swap the whole
    // board out, and the old nodes are gone by then.
  }, [rows]);

  return (
    <div ref={rootRef} className={`morph-board ${className}`}>
      {rows.map((row, r) => {
        const order = entranceOrder(row.items.length, r);

        return (
          <div
            key={r}
            className="morph-row"
            style={{ "--gaps": row.items.length - 1 }}
          >
            {row.items.map((item, i) => {
              const share = row.shares[i];

              const media = (
                <>
                  {/* Layout box — never transformed, so it stays measurable. */}
                  <div data-media className="morph-tile__box">
                    <div className="morph-tile__media">
                      <Image
                        src={item.src}
                        alt={item.alt}
                        fill
                        sizes={`(max-width: 767px) 50vw, ${Math.max(
                          Math.round(share * 92),
                          10
                        )}vw`}
                        className="object-cover grayscale transition-[filter] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:grayscale-0"
                      />
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
                  data-order={order[i]}
                  data-row-size={row.items.length}
                  className="morph-tile group"
                  style={{
                    // Fraction of the row's picture width this tile takes.
                    "--share": share,
                    // The photo's true proportions — no crop, no designed ratio.
                    "--ar": `${item.pxW} / ${item.pxH}`,
                    "--origin": originFor(i, row.items.length),
                    "--p": "0",
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

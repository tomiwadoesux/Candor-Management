/**
 * Packs pictures into justified rows.
 *
 * The board once laid tiles onto fixed 12-column slots. Because the slots knew
 * nothing about the pictures a span was a guess, and any row that didn't add
 * up to 12 left a hole — which is where the empty space came from.
 *
 * Now a row is a fixed number of tiles whose widths are set by a weight
 * pattern and then normalised to span the full width exactly. Two consequences
 * worth naming:
 *
 *   - Tiles in a row are deliberately *different* widths. Sizing them by the
 *     picture's own aspect ratio made every tile in a row identical whenever
 *     the pictures were, which on a board of 3:4 polaroids is always.
 *   - Height still comes from the picture, never from a crop: the box takes
 *     the image's true ratio, so a wider box is a taller one. Tops stay flush
 *     to the row's line and the bottoms rag out on their own.
 *
 * Packing happens on the server, from the sizes already read off the files, so
 * the row structure is identical on both sides of hydration.
 */

// How many tiles to a row, cycled. A single-entry list makes every row that
// size.
const ROW_SIZES = [4, 3];

// Each row's tile widths before normalising, keyed by how many tiles the row
// holds and cycled by row index.
//
// The fours carry one weight around 0.5 against neighbours around 1.2, so each
// of those rows has a genuinely small card in it — roughly 170px against 400px
// on a 1400px board — and the small one moves around the row from pattern to
// pattern. The threes have no such weight: at three across, a card that small
// reads as a gap rather than as a deliberately small picture, so those rows
// stay within a hand's breadth of even and get their variety from the widths
// alone.
const WIDTH_WEIGHTS = {
  3: [
    [1.15, 0.92, 1.08],
    [0.95, 1.18, 1.02],
    [1.1, 1.0, 1.05],
    [1.02, 1.12, 0.96],
  ],
  4: [
    [1.3, 0.5, 1.15, 1.05],
    [1.12, 1.28, 0.48, 1.12],
    [0.52, 1.18, 1.1, 1.2],
    [1.22, 0.55, 1.28, 0.95],
  ],
};

// Fallback for a row length with no pattern of its own (a short last row).
const evenWeights = (n) => Array.from({ length: n }, () => 1);

// A full row is stretched to span the width. A last row that comes up short
// keeps the share it would have had in a full row and simply ends early —
// stretching it instead would blow two leftover portraits up to over a
// thousand pixels tall on a 1400px board.
const FILL_MIN_TILES = 3;

/**
 * Named board shapes for callers that want something other than the 4/3
 * cycle. Each one is a set of packRows options.
 *
 *   threes — three to a row at even widths: a plain grid. The variety comes
 *            from the pictures' own proportions and the ragged bottoms.
 *   pairs  — two to a row, one big and one small, with the big one swapping
 *            sides every row. The small one sits on the row's top line in one
 *            row and on its bottom line in the next, so the pair never leaves
 *            the same hole under the small picture twice running.
 *
 *            Pairs size by *area* (`sizeBy: "area"`), not width. The pictures
 *            run from 0.4 to 1.24 wide-for-tall, so a width split leaves a tall
 *            "big" one two viewports high, and a landscape in the "small" slot
 *            bigger than the big one. Splitting the area keeps big reading as
 *            big whatever the two shapes are. Each row also returns `caps`, so
 *            the CSS can hold its tallest tile to a viewport-relative height —
 *            what that frees up goes into the gutter, not into a crop.
 *
 * Both fold only a lone leftover picture into the row above (`minTail: 2`);
 * two leftovers stay as a short last row at full-row size.
 */
export const LAYOUTS = {
  threes: {
    rowSizes: [3],
    weights: { 3: [[1, 1, 1]] },
    minTail: 2,
  },
  pairs: {
    rowSizes: [2],
    sizeBy: "area",
    // Area, big against small: the small one gets 38–45% of the big one's,
    // which is about 0.6–0.67 of its height at the same proportions. Any
    // nearer even and the two read as a near-miss at equal, not two sizes.
    weights: {
      2: [
        [1, 0.4],
        [0.42, 1],
        [1, 0.45],
        [0.38, 1],
      ],
    },
    align: { 2: ["start", "end", "end", "start"] },
    minTail: 2,
  },
};

/**
 * @returns [{ items, shares, fill, align, caps }] — `shares[i]` is tile i's
 *          fraction of the width left for pictures once the gaps are taken
 *          out. They sum to 1 on a filled row and to less on a short last row,
 *          which is all the CSS needs to lay the row out. `align` is which
 *          line the row's tiles share: "start" (tops) or "end" (bottoms).
 *          `caps` (area rows only) is each tile's width as a multiple of the
 *          row's tallest tile's height — the CSS multiplies it by a height
 *          limit to get a width that keeps the row under that limit.
 */
export function packRows(
  items,
  {
    rowSizes = ROW_SIZES,
    weights = WIDTH_WEIGHTS,
    align = {},
    minTail = 3,
    sizeBy = "width",
  } = {}
) {
  const rows = [];
  const sizes = rowLengths(items.length, rowSizes, minTail);
  let i = 0;

  for (let r = 0; r < sizes.length; r++) {
    const count = sizes[r];
    const intended = rowSizes[r % rowSizes.length];
    const slice = items.slice(i, i + count);

    // A full row divides the width between its own tiles. A short last row
    // divides it by what a full row *would* have summed to, so its tiles come
    // out the size they would have been and the line just ends early. A board
    // that is only one row long has nothing to be short of, so it fills.
    const fill = r === 0 || count >= Math.min(intended, FILL_MIN_TILES);
    const size = fill ? count : intended;

    // The pattern is chosen by the row's length, so a four keeps its small
    // card and a three never gets one.
    const bank = weights[size];
    const pattern = bank ? bank[r % bank.length] : evenWeights(size);
    const w = slice.map((_, k) => pattern[k % pattern.length]);

    const lines = align[size];
    const row = {
      items: slice,
      fill,
      align: lines ? lines[r % lines.length] : "start",
    };

    if (sizeBy === "area") {
      // A picture of area A and proportions ar (width / height) is
      // √(A·ar) wide and √(A/ar) tall. Every tile is sized off the same
      // scale, so the row's widths sum straight to the row.
      const dims = slice.map((item, k) => {
        const ar = item.pxW / item.pxH;
        return { w: Math.sqrt(w[k] * ar), h: Math.sqrt(w[k] / ar) };
      });
      const sumW = dims.reduce((a, d) => a + d.w, 0);
      const maxH = Math.max(...dims.map((d) => d.h));
      row.shares = dims.map((d) => d.w / sumW);
      row.caps = dims.map((d) => d.w / maxH);
    } else {
      const denom = fill
        ? w.reduce((a, b) => a + b, 0)
        : pattern.slice(0, size).reduce((a, b) => a + b, 0);
      row.shares = w.map((x) => x / denom);
    }

    rows.push(row);

    i += count;
  }

  return rows;
}

/**
 * How many tiles each row gets — the cycle in `rowSizes`, with one guard.
 *
 * A set that does not divide by the cycle can leave one or two pictures on the
 * last line. One picture alone on a row is not a row, so a tail shorter than
 * `minTail` is folded back into the line above it instead. That row is then a
 * length with no pattern of its own and falls back to even widths, which is
 * the right outcome: it is already carrying more than it was designed to.
 */
function rowLengths(total, rowSizes, minTail) {
  const sizes = [];
  for (let n = 0, r = 0; n < total; r++) {
    const size = Math.min(rowSizes[r % rowSizes.length], total - n);
    sizes.push(size);
    n += size;
  }

  if (sizes.length > 1 && sizes[sizes.length - 1] < minTail) {
    sizes[sizes.length - 2] += sizes.pop();
  }
  return sizes;
}

/**
 * The order tiles in a row open in, as `order[i]` for tile i.
 *
 * Authored per row rather than left-to-right so the eye can't predict which
 * one moves next; keyed on the row index so it is stable across renders.
 */
export function entranceOrder(n, rowIndex) {
  const seq = [];

  switch (rowIndex % 4) {
    case 0: // left to right
      for (let i = 0; i < n; i++) seq.push(i);
      break;
    case 1: // right to left
      for (let i = n - 1; i >= 0; i--) seq.push(i);
      break;
    case 2: {
      // out from the centre
      let l = Math.floor((n - 1) / 2);
      let r = l + 1;
      while (seq.length < n) {
        if (l >= 0) seq.push(l--);
        if (r < n && seq.length < n) seq.push(r++);
      }
      break;
    }
    default: {
      // ends first, closing inward
      let l = 0;
      let r = n - 1;
      while (seq.length < n) {
        if (l <= r) seq.push(l++);
        if (l <= r && seq.length < n) seq.push(r--);
      }
    }
  }

  const order = new Array(n);
  seq.forEach((tile, place) => {
    order[tile] = place;
  });
  return order;
}

/**
 * Which corner a tile blooms out of. Tiles lean away from the middle of their
 * row, so a row opens outward instead of pulsing in place, and they grow off
 * whichever line the row shares — the top normally, the bottom on a row whose
 * tiles sit on their bottom line — so that line holds still mid-entrance.
 */
export function originFor(index, n, align = "start") {
  const edge = align === "end" ? "bottom" : "top";
  return `${edge} ${index < n / 2 ? "right" : "left"}`;
}

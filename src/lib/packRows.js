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
 * @returns [{ items, shares, fill }] — `shares[i]` is tile i's fraction of the
 *          width left for pictures once the gaps are taken out. They sum to 1
 *          on a filled row and to less on a short last row, which is all the
 *          CSS needs to lay the row out.
 */
export function packRows(items, { rowSizes = ROW_SIZES } = {}) {
  const rows = [];
  const sizes = rowLengths(items.length, rowSizes);
  let i = 0;

  for (let r = 0; r < sizes.length; r++) {
    const size = sizes[r];
    const slice = items.slice(i, i + size);

    // The pattern is chosen by the row's intended length, so a four keeps its
    // small card and a three never gets one.
    const bank = WIDTH_WEIGHTS[size];
    const pattern = bank ? bank[r % bank.length] : evenWeights(size);
    const weights = slice.map((_, k) => pattern[k % pattern.length]);

    // A full row divides the width between its own tiles. A short last row
    // divides it by what a full row *would* have summed to, so its tiles come
    // out the size they would have been and the line just ends early.
    const fill = slice.length >= Math.min(size, FILL_MIN_TILES);
    const denom = fill
      ? weights.reduce((a, b) => a + b, 0)
      : pattern.slice(0, size).reduce((a, b) => a + b, 0);

    rows.push({
      items: slice,
      shares: weights.map((w) => w / denom),
      fill,
    });

    i += size;
  }

  return rows;
}

/**
 * How many tiles each row gets — straight chunking by `rowSizes`, with the
 * last row taking whatever is left.
 *
 * Nothing clever about the tail: a set that doesn't divide evenly ends on a
 * short row, which is what a justified gallery does. The row keeps its tiles
 * at full-row size rather than stretching them, so the line just stops early.
 */
/**
 * How many tiles each row gets — the cycle in `rowSizes`, with one guard.
 *
 * A set that does not divide by the cycle can leave one or two pictures on the
 * last line. One picture alone on a row is not a row, so a tail that short is
 * folded back into the line above it instead. That row is then a length with
 * no pattern of its own and falls back to even widths, which is the right
 * outcome: it is already carrying more than it was designed to.
 */
function rowLengths(total, rowSizes) {
  const sizes = [];
  for (let n = 0, r = 0; n < total; r++) {
    const size = Math.min(rowSizes[r % rowSizes.length], total - n);
    sizes.push(size);
    n += size;
  }

  if (sizes.length > 1 && sizes[sizes.length - 1] < 3) {
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
 * Which top corner a tile blooms out of. Tiles lean away from the middle of
 * their row, so a row opens outward instead of pulsing in place.
 */
export function originFor(index, n) {
  return index < n / 2 ? "top right" : "top left";
}

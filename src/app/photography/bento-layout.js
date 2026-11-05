const COLUMNS = 12;
const validRatio = (value) => Number.isFinite(value) && value > 0 ? value : 1;

// Partition a complete rectangle, rather than dropping tiles into free cells.
// Every cut lands on the same grid, so there can be no holes or overlaps.
export function createBentoLayout(images, { width = 1000, gap = 14, compact = false, variant = 0, allowRotation = false } = {}) {
  if (!images.length) return [];
  const unit = Math.max(1, (width - gap * (COLUMNS - 1)) / COLUMNS);
  const stride = unit + gap;
  const groupCount = Math.ceil(images.length / (compact ? 3 : 6));
  const minWidth = compact ? 6 : 3;
  const caption = compact ? 24 : 27;
  const result = [];
  let rowOffset = 0;

  let offset = 0;
  for (let groupIndex = 0; groupIndex < groupCount; groupIndex++) {
    const groupSize = Math.floor(images.length / groupCount) + (groupIndex < images.length % groupCount ? 1 : 0);
    const group = images.slice(offset, offset + groupSize);
    const count = group.length;
    const photoIndices = group.flatMap((item, i) => item.type === "info" ? [] : [i]);
    const hero = photoIndices[((variant % photoIndices.length) + photoIndices.length) % photoIndices.length];
    const weights = group.map((item, i) => item.type === "info" ? 0.8 : i === hero ? 2.4 : 1);
    const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
    const ratios = group.map((item) => {
      const ratio = item.rotation % 180 ? 1 / validRatio(item.aspectRatio) : validRatio(item.aspectRatio);
      return Math.max(0.4, Math.min(3, ratio));
    });
    const averageRatio = Math.exp(ratios.reduce((sum, ratio) => sum + Math.log(ratio), 0) / count);
    // Taller source sets need a taller canvas, particularly on a phone where
    // the lead photo occupies the full width. Do not force portraits into banners.
    let idealRows = Math.max(4, Math.min(32, Math.round(count === 1 ? 12 / ratios[0] + 1
      : compact ? (count === 2 ? (averageRatio < 1 ? 6 : 24) / averageRatio + 1
        : 12 / ratios[hero] + Math.max(...ratios.filter((_, i) => i !== hero).map((ratio) => 6 / ratio)) + 2)
      : count * 2.15 * 0.85 / averageRatio)));
    const info = group.find((item) => item.type === "info");
    if (info) {
      const infoRows = Math.ceil((info.minHeight + gap) / stride);
      idealRows = Math.max(idealRows, infoRows + (compact ? Math.ceil(12 / ratios[hero]) + 1 : 0));
    }
    let best = null;

    for (let height = Math.max(3, idealRows - 2); height <= idealRows + 3; height++) {
      const memo = new Map();
      function solve(start, length, columns, rows) {
        if (columns < minWidth || rows < 2 || columns * rows < length * minWidth * 2) return null;
        const key = `${start},${length},${columns},${rows}`;
        if (memo.has(key)) return memo.get(key);
        let solution = null;
        if (length === 1) {
          const item = group[start];
          const tileWidth = columns * stride - gap;
          const tileHeight = rows * stride - gap;
          if (item.type === "info" && (tileWidth < item.minWidth || tileHeight < item.minHeight || columns > 6)) {
            memo.set(key, null);
            return null;
          }
          const ratio = validRatio(item.aspectRatio);
          const tileRatio = tileWidth / Math.max(1, tileHeight - (item.type === "info" ? 0 : caption));
          const angles = item.rotation == null ? (allowRotation ? [0, 90] : [0]) : [item.rotation];
          const targetArea = COLUMNS * height * weights[start] / weightSum;
          for (const rotation of angles) {
            const oriented = rotation % 180 ? 1 / ratio : ratio;
            const cropCost = Math.log(tileRatio / oriented) ** 2 * (item.type === "info" ? 0.15 : 1);
            const areaCost = Math.log(columns * rows / targetArea) ** 2;
            const score = cropCost * 3 + areaCost * 1.2 + (item.rotation == null && rotation ? 0.12 : 0);
            if (!solution || score < solution.score) solution = {
              score, tiles: [{ index: offset + start, column: 1, row: 1, columns, rows, rotation }],
            };
          }
        } else {
          function consider(a, b, x, y) {
            if (!a || !b) return;
            const score = a.score + b.score;
            if (solution && score >= solution.score) return;
            solution = { score, tiles: [...a.tiles, ...b.tiles.map((tile) => ({ ...tile, column: tile.column + x, row: tile.row + y }))] };
          }
          for (let split = 1; split < length; split++) {
            for (let x = minWidth; x <= columns - minWidth; x++) {
              consider(solve(start, split, x, rows), solve(start + split, length - split, columns - x, rows), x, 0);
            }
            for (let y = 2; y <= rows - 2; y++) {
              consider(solve(start, split, columns, y), solve(start + split, length - split, columns, rows - y), 0, y);
            }
          }
        }
        memo.set(key, solution);
        return solution;
      }
      const candidate = solve(0, count, COLUMNS, height);
      if (!candidate) continue;
      // Prefer a comfortable spread height when two compositions crop similarly.
      const score = candidate.score + 0.035 * (height - idealRows) ** 2;
      if (!best || score < best.score) best = { ...candidate, score, height };
    }
    for (const tile of best.tiles) result[tile.index] = { ...tile, row: tile.row + rowOffset };
    rowOffset += best.height;
    offset += groupSize;
  }
  return result;
}

// The information is a real cell in the composition, so photographs can fill
// the space above, below and beside it without leaving a separate text column.
export function createBentoWithInfo(images, options = {}) {
  if (!images.length) return { images: [], info: undefined };
  const { width = 1000, compact = false } = options;
  const items = [...images];
  items.splice(1, 0, {
    type: "info", aspectRatio: 0.9, rotation: 0,
    minWidth: Math.min(compact ? 150 : 220, width * 0.45),
    minHeight: 360,
  });
  const tiles = createBentoLayout(items, options);
  return {
    info: tiles[1],
    images: tiles.filter((_, index) => index !== 1).map((tile, index) => ({ ...tile, index })),
  };
}

export function bentoStyle(tile) {
  return tile ? { gridColumn: `${tile.column} / span ${tile.columns}`, gridRow: `${tile.row} / span ${tile.rows}` } : undefined;
}

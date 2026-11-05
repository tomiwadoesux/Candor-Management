export function photoNumber(value) {
  return String(Math.max(1, Math.floor(value))).padStart(2, "0");
}

// Alternate compact groups with a wide photograph, preserving the collection
// order. Adjust the group before a feature so a portrait is never forced wide.
export function photoRowSizes(photos, maxColumns = 4) {
  const pattern = maxColumns >= 4 ? [3, 4, 1, 4, 3, 1] : maxColumns === 3 ? [3, 2, 1] : [2, 2, 1];
  const groups = maxColumns >= 4 ? [3, 4] : maxColumns === 3 ? [2, 3] : [2];
  const landscape = (index) => photos[index]?.width > photos[index]?.height * 1.2;
  const rows = [];

  for (let offset = 0, phase = 0; offset < photos.length; phase++) {
    let count = pattern[phase % pattern.length];
    if (count === 1 && !landscape(offset)) count = maxColumns;
    if (count > 1 && pattern[(phase + 1) % pattern.length] === 1) {
      count = [count, ...groups.filter((size) => size !== count)]
        .find((size) => landscape(offset + size)) ?? count;
    }
    const remaining = photos.length - offset;
    count = Math.min(count, remaining);
    // Keep a leftover portrait with a neighbour instead of making it a
    // full-width feature. A lone image or an odd phone row is unavoidable.
    if (remaining - count === 1 && !landscape(photos.length - 1)) {
      if (count < maxColumns) count++;
      else if (count > 2) count--;
    }
    rows.push(count);
    offset += count;
  }
  return rows;
}

export function swapArtwork(gallery, index) {
  const selected = gallery.cards[index];
  if (!selected || selected.src === gallery.featured.src) return gallery;
  const cards = [...gallery.cards];
  cards[index] = gallery.featured;
  return { featured: selected, cards, selected: true };
}

export function featuredSize(art, width, height) {
  const ratio = art.width / art.height;
  const fittedWidth = Math.min(width * (width <= 700 ? 0.48 : 0.4), height * 0.5 * ratio);
  return { width: fittedWidth, height: fittedWidth / ratio };
}

// Foreground cards keep their staggered side columns. The distant layer uses
// stable, independent offsets so it feels scattered without reshuffling when
// the visitor scrolls back, selects an artwork, or changes layouts.
export function fieldPosition(index, progress, width, height, perLayer, backgroundCount = perLayer) {
  const mobile = width <= 700;
  const layer = Math.floor(index / perLayer);
  const within = index % perLayer;
  const row = Math.floor(within / 2);
  const column = within % 2;
  const rows = Math.ceil(perLayer / 2);
  const variation = ((within * 37 + 13) % 101) / 100;
  const spacing = height * (mobile ? 0.48 : 0.54);
  const travel = Math.max(0, Math.min(1, progress)) * (rows - 1) * spacing;
  if (layer) {
    const horizontal = (within * 0.61803398875 + 0.17) % 1;
    const vertical = ((within * 53 + 29) % 101) / 100;
    const scale = ((within * 31 + 7) % 101) / 100;
    const size = Math.min(width * (mobile ? 0.28 : 0.23), height * 0.24) * (0.86 + scale * 0.22);
    const inset = size / 2 + Math.max(10, width * 0.015);
    const depthRow = within / Math.max(1, backgroundCount - 1) * (rows - 1);
    return {
      x: Math.max(inset, Math.min(width - inset, width * (0.1 + horizontal * 0.8))),
      // The distant collection enters from above as the foreground rises.
      // Spread the smaller selection across the whole scroll, with only
      // one or two faded photographs passing through the scene at a time.
      y: height * (0.14 + vertical * 0.42) - depthRow * spacing * 0.8 + travel * 0.8,
      size,
      layer,
    };
  }
  const rail = mobile ? [0.12, 0.88] : [0.13, 0.87];
  const sway = (variation - 0.5) * width * (mobile ? 0.025 : 0.05);
  return {
    x: width * rail[column] + sway,
    y: height * (0.2 + column * 0.1) + row * spacing - travel + (variation - 0.5) * height * 0.07,
    size: Math.min(width * (mobile ? 0.20 : 0.18), height * 0.25) * (0.8 + variation * 0.2),
    layer,
  };
}

const linear = (value) => {
  const s = value / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

export function luminance([r, g, b]) {
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

export function inkForLuminance(value, previous) {
  const black = (value + 0.05) / 0.05;
  const white = 1.05 / (value + 0.05);
  // A narrow dead band prevents video grain from flickering between inks.
  if (previous && Math.max(black, white) / Math.min(black, white) < 1.08) return previous;
  return black >= white ? "#000000" : "#ffffff";
}

export function composite(over, under, opacity = 1) {
  const a = (over[3] ?? 1) * opacity;
  return [0, 1, 2].map((i) => over[i] * a + under[i] * (1 - a));
}

// Returns the intrinsic-image point displayed at x/y, including the crop.
export function mediaPoint(x, y, box, width, height, fit = "cover", position = [0.5, 0.5]) {
  let sx = box.width / width;
  let sy = box.height / height;
  if (fit === "cover") sx = sy = Math.max(sx, sy);
  else if (fit === "contain") sx = sy = Math.min(sx, sy);
  else if (fit === "none") sx = sy = 1;
  else if (fit === "scale-down") sx = sy = Math.min(1, sx, sy);
  const px = (x - box.left - (box.width - width * sx) * position[0]) / sx;
  const py = (y - box.top - (box.height - height * sy) * position[1]) / sy;
  return px < 0 || py < 0 || px >= width || py >= height ? null : [px / width, py / height];
}

export function comparePaintOrder(a, b) {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return a.length - b.length;
}

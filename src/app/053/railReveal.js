// The continuous scroll profile controls thumbnail size and desaturation.
// A shared oval mask supplies the visible fade across the entire strip.
export function thumbnailReveal({ top, bottom }, viewportTop, viewportHeight, feather = viewportHeight * 0.55) {
  const viewportBottom = viewportTop + viewportHeight;
  const center = (top + bottom) / 2;
  const distance = Math.max(viewportTop - center, center - viewportBottom, 0);
  if (bottom <= top || feather <= 0 || distance >= feather) {
    return { opacity: "0", mask: "none", gray: "1", curve: 0 };
  }
  const progress = 1 - distance / feather;
  const opacity = progress * progress * (3 - 2 * progress);
  // An ellipse gives the strip a rounded silhouette, including its bright
  // center. Keep this separate from opacity so visible photos stay clear.
  const radius = viewportHeight / 2 + feather;
  const offset = Math.abs(center - viewportTop - viewportHeight / 2) / radius;
  const curve = Math.sqrt(Math.max(0, 1 - offset * offset));
  return {
    opacity: opacity === 1 ? "1" : opacity.toFixed(3),
    mask: "none",
    gray: (1 - opacity).toFixed(3),
    curve,
  };
}

// Fit one shared oval to the continuously revealed band. Weighted moments
// avoid snapping to an active index as photographs enter and leave the view.
export function railOval(centers, widths, profile) {
  const weights = profile.map((amount) => amount ** 4);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (!total) return null;
  const y = centers.reduce((sum, center, index) => sum + center * weights[index], 0) / total;
  const variance = centers.reduce((sum, center, index) => sum + (center - y) ** 2 * weights[index], 0) / total;
  const width = Math.max(...widths.filter((_, index) => profile[index] > 0));
  return {
    y,
    inset: width * 0.4,
    radiusX: width + 8,
    radiusY: Math.max(44, Math.sqrt(variance) * 2.4),
  };
}

// Fill the entire screen without making the photographs bigger. Most spare
// space goes between faded slots, keeping the visible band closely stacked.
export function arrangeRail(weights, profile, baseHeight, height, gap = 2) {
  const count = weights.length;
  const total = weights.reduce((sum, weight) => sum + baseHeight * weight, 0);
  const totalGap = gap * (count - 1);
  const fit = Math.min(1, (height - totalGap) / total);
  const scales = weights.map((weight) => weight * fit);
  const spare = Math.max(0, height - total * fit - totalGap);
  const gaps = profile.slice(0, -1).map((amount, index) => 0.08 + 1 - Math.max(amount, profile[index + 1]) ** 2);
  const gapTotal = gaps.reduce((sum, gap) => sum + gap, 0);
  let cursor = 0;
  const centers = scales.map((scale, index) => {
    const center = cursor + baseHeight * scale / 2;
    cursor += baseHeight * scale;
    if (index < count - 1) cursor += gap + spare * gaps[index] / gapTotal;
    return center;
  });
  return { scales, centers };
}

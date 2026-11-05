// Run only when switching views. Measure the visible part of each photograph,
// so an offscreen card cannot steal a click near the edge of the viewport.
export function nearestViewAnchor(cards, x, y, viewport) {
  let nearest = null;
  for (const { index, rect, opacity = 1 } of cards) {
    if (opacity < 0.1 || rect.width <= 0 || rect.height <= 0) continue;
    const left = Math.max(rect.left, viewport.left);
    const right = Math.min(rect.left + rect.width, viewport.left + viewport.width);
    const top = Math.max(rect.top, viewport.top);
    const bottom = Math.min(rect.top + rect.height, viewport.top + viewport.height);
    if (right <= left || bottom <= top) continue;
    const distance = Math.hypot(Math.max(left - x, 0, x - right), Math.max(top - y, 0, y - bottom));
    // At an ambiguous edge, prefer the brighter/front photograph. Otherwise
    // use distance to the image edges, not its centre or its place in the list.
    if (!nearest || distance < nearest.distance - 1
      || (Math.abs(distance - nearest.distance) <= 1 && opacity > nearest.opacity)) {
      nearest = {
        index, distance, opacity,
        viewportY: Math.max(0.2, Math.min(0.8, ((top + bottom) / 2 - viewport.top) / viewport.height)),
      };
    }
  }
  return nearest && { index: nearest.index, viewportY: nearest.viewportY };
}

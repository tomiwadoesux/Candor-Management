const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const smooth = (value) => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };

// Finish nearer the top, not halfway up the boxes. Refraction has its own
// lifetime so other background content still shimmers after the cards fade.
export function heatTransition(edge, viewportHeight, reduced = false) {
  const finish = viewportHeight * 0.12;
  const progress = clamp((viewportHeight - edge) / Math.max(1, viewportHeight - finish), 0, 1);
  const height = clamp(viewportHeight * 0.36, 180, 300);
  const lift = clamp(viewportHeight * 0.045, 24, 44);
  const strength = smooth(progress * 6) * smooth((edge - lift) / 64);
  return {
    opacity: 1 - smooth(progress),
    progress,
    top: edge - height - lift,
    height,
    lift,
    active: !reduced && progress > 0 && edge > lift && strength > 0.001,
    strength,
  };
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const smooth = (value) => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };

// The cards keep their existing fade. Heat occupies a small strip attached
// to Selena's leading edge, strengthening as it enters and tapering off as
// the strip leaves the top of the viewport.
export function heatTransition(edge, viewportHeight, reduced = false) {
  const finish = viewportHeight * 0.12;
  const fadeFrom = viewportHeight * 0.7;
  const progress = clamp((viewportHeight - edge) / Math.max(1, viewportHeight - finish), 0, 1);
  const fade = clamp((fadeFrom - edge) / Math.max(1, fadeFrom - finish), 0, 1);
  const height = clamp(viewportHeight * 0.12, 72, 112);
  const lift = 0;
  const strength = smooth((viewportHeight - edge) / height) * smooth(edge / height);
  return {
    opacity: 1 - smooth(fade),
    // Finish draining colour halfway up, while the portraits are still clear.
    grayscale: smooth((viewportHeight - edge) / Math.max(1, viewportHeight * 0.5)),
    progress,
    top: edge - height - lift,
    height,
    lift,
    active: !reduced && progress > 0 && edge > 0 && strength > 0.001,
    strength,
  };
}

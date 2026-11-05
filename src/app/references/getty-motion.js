// Normalized landmarks observed in Getty's first chapter. A date is a
// position along a continuous image field, not a trigger for a slide swap.
export const GETTY_YEARS = [
  { year: "1669", at: 0 }, { year: "1700", at: 0.169 },
  { year: "1864", at: 0.33 }, { year: "1936", at: 0.419 },
  { year: "1940", at: 0.585 }, { year: "1944", at: 0.91 },
];
export const SCENE_LENGTH = 19;
export const GETTY_CARD_COUNT = 180;
export const clamp = (n) => Math.max(0, Math.min(1, n));
export const range = (n, a, b) => clamp((n - a) / (b - a));
export const mix = (a, b, p) => a + (b - a) * p;
// The reference uses GSAP power2 curves for these large editorial moves.
export const powerOut = (p) => 1 - (1 - clamp(p)) ** 3;
export const powerInOut = (p) => p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;

export function getGettyFrame(progress) {
  const time = clamp(progress) * SCENE_LENGTH;
  const timeline = range(time, 1.8, 11.8);
  const yearIndex = GETTY_YEARS.reduce((current, item, i) => timeline >= item.at ? i : current, 0);
  const zoomIn = powerInOut(range(time, 11.8, 12.8));
  const zoomOut = powerInOut(range(time, 17.5, 18.5));
  const zoom = zoomIn * (1 - zoomOut);
  return {
    time, timeline, yearIndex, zoom,
    intro: 1 - range(time, 0, 1),
    enter: powerOut(range(time, 1, 2)),
    dim: range(time, 1, 2),
    zoomScroll: range(time, 12.5, 18.5),
    timelineOpacity: range(time, 1.4, 1.8) * (1 - range(time, 11.65, 11.9)),
    ledger: range(time, 12.54, 12.7) * (1 - range(time, 13.9, 14.06)),
    exit: powerInOut(range(time, 17.8, 18.8)),
  };
}

// Project the reference's staggered three-column field into CSS pixels.
// Its 45-degree camera, grid spacing and two depth planes give the images
// their different sizes and speeds. Dates do not reset their positions.
export function getCardPosition(index, progress, width, height) {
  const mobile = width <= 700;
  const rows = mobile ? 30 : 25;
  const perLayer = rows * 3;
  const layer = Math.floor(index / perLayer);
  const within = index % perLayer;
  const row = Math.floor(within / 3);
  const column = within % 3;
  const spacingX = mobile ? 1.7 : 2.8;
  const spacingY = mobile ? 1.5 : 1.3;
  const x = (column - 1.5 + (row % 2) * 0.5 + layer * 0.5) * spacingX;
  const y = -row * spacingY + (column % 2) * spacingY * 0.3 + layer * spacingY * 0.5 + (mobile ? 0.7 : 0);
  const safeX = Math.abs(x) < 0.1 ? 0.1 : x;
  const distance = Math.hypot(safeX, y - 0.93);
  const repel = mobile ? 0.46 : 1;
  const camera = mix(5, 4, powerOut(range(progress * SCENE_LENGTH, 0, 1.5)));
  const pixelsPerUnit = height / (2 * Math.tan(Math.PI / 8) * (camera + layer));
  const travel = range(progress, 0, 0.7) * (rows - 1) * spacingY;
  // Deterministic variation keeps the same composition after replay/resize.
  const variation = ((index * 73 + 19) % 101) / 100;
  return {
    x: (x + safeX / distance * repel) * pixelsPerUnit,
    y: height / 2 - (y + (y - 0.93) / distance * repel + travel) * pixelsPerUnit,
    size: pixelsPerUnit * mix(mobile ? 0.5 : 0.7, mobile ? 0.8 : 1, variation),
    active: layer < 2,
    central: Math.abs(x) < (mobile ? 0.5 : 1),
    layer,
  };
}

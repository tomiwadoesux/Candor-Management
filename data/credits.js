// data/credits.js
//
// Per-image credits for the boards on a model page. The gallery tiles have
// always had a caption slot (label on the left, a dimmed tag on the right);
// this is what fills it.
//
// PLACEHOLDER DATA. No model record carries real credits yet, so a tile's
// credit is derived from the model and the tile's position — deterministic, so
// the server and the client agree and a given photo always keeps its line.
// Swap the two pools below for the real photographer and client lists, or give
// a model an explicit `credits` map (see creditFor) to override the pools.

// Two thirds of the board reads as studio work…
const PHOTOGRAPHERS = [
  "Estévez & Belloso",
  "Tobi Ajayi",
  "Marguerite Oduya",
  "Ines Ferreira",
  "Kelechi Nwosu",
  "Anouk Sarr",
];

// …and every third tile as a booking, so the board doesn't read as one shoot.
const BRANDS = [
  "Maison Orí",
  "Adéọlá Studio",
  "Casa Verano",
  "Atelier Lagos",
  "Ijebu Atelier",
  "Nkem",
];

// A tile is a brand tile when its index is 2, 5, 8… — every third one, offset
// so a board never opens on a campaign line.
const isBrandSlot = (i) => i % 3 === 2;

// Stable per-model offset so two models don't march through the pools in
// lockstep. Sum of char codes is plenty — the ids are short and this only
// needs to spread, not to be uniform.
const seed = (id) =>
  String(id)
    .split("")
    .reduce((n, c) => n + c.charCodeAt(0), 0);

/**
 * The caption for one tile.
 *
 * @param model  the model record — `model.credits` maps an image src to an
 *               explicit { label, meta }, which always wins over the pools.
 * @param src    the image, used to look up an explicit credit
 * @param i      the tile's position on the board
 * @param kind   "photo" forces a photographer line; "brand" and "runway" both
 *               force a client line, tagged Campaign or Runway respectively.
 *               Omit to let the position decide (the mixed covers board).
 */
export function creditFor(model, src, i, kind) {
  const explicit = model.credits?.[src];
  if (explicit) return explicit;

  const brand = kind ? kind !== "photo" : isBrandSlot(i);
  const offset = seed(model.id) + i;

  if (brand) {
    return {
      label: BRANDS[offset % BRANDS.length],
      meta: kind === "runway" ? "Runway" : "Campaign",
    };
  }

  return {
    label: `Photographed by ${PHOTOGRAPHERS[offset % PHOTOGRAPHERS.length]}`,
    meta: null,
  };
}

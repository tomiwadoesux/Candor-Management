import MorphGallery from "@/components/MorphGallery";

// Loose pairs with an occasional single image leave space around the work.
// Reuse the existing reversible, scroll-driven card reveal.
const PROFILE_LAYOUT = {
  rowSizes: [2, 1, 2],
  minTail: 1,
  sizeBy: "area",
  weights: { 2: [[1, 0.65], [0.7, 1], [1, 0.8]] },
  align: { 2: ["start", "end", "start"] },
};

const OPENING_LAYOUT = {
  ...PROFILE_LAYOUT,
  rowSizes: [2],
  weights: { 2: [[1, 0.36], [0.32, 1]] },
};

export default function ProfileGallery({ items, onSelect, preview = false }) {
  return <MorphGallery items={items} onSelect={onSelect} layout={preview ? OPENING_LAYOUT : PROFILE_LAYOUT}
    reveal={preview ? "static" : "after-scroll"}
    parallax
    className={`profile-scattered${preview ? " profile-intro-grid" : ""}`} />;
}

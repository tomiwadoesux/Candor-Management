// Pick a new count independently for each folder, then sample without repeats.
// Keep the selected photographs in their original order for a stable transition
// into the complete folder.
export function choosePreviewIndices(total, random = Math.random) {
  if (!total) return [];
  const minimum = Math.min(2, total);
  const count = minimum + Math.floor(random() * (total - minimum + 1));
  const indices = Array.from({ length: total }, (_, index) => index);
  for (let index = 0; index < count; index++) {
    const pick = index + Math.floor(random() * (total - index));
    [indices[index], indices[pick]] = [indices[pick], indices[index]];
  }
  return indices.slice(0, count).sort((a, b) => a - b);
}

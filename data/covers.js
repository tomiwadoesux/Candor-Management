// Temporary cover studies, requested for previewing every profile. Real cover
// records always replace this fallback; no dummy magazine/client credits.
export function coversFor(model) {
  const actual = (model.covers ?? [])
    .map((cover) => typeof cover === "string" ? { image: cover } : cover)
    .filter((cover) => cover?.image);
  if (actual.length) return actual;

  const sources = [...new Set([
    ...(model.polaroids ?? []),
    ...(model.images ?? []),
    model.coverImage,
    model.face,
  ].filter(Boolean))];

  const seed = Array.from(String(model.id)).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  for (let i = 0; sources.length < 6 && i < 35; i++) {
    const source = `/images/img${(seed + i) % 35 + 1}.jpeg`;
    if (!sources.includes(source)) sources.push(source);
  }

  return sources.slice(0, 6).map((image, index) => ({
    image,
    label: `Cover study ${String(index + 1).padStart(2, "0")}`,
    placeholder: true,
  }));
}

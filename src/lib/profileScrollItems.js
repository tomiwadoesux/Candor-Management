// Preview padding is separate from authored portfolio sections and credits.
export function profileScrollItems(person, authored = [], pool = [], minimum = 6) {
  const items = [];
  const seen = new Set();
  const add = (item) => {
    if (!item.src || seen.has(item.src)) return;
    seen.add(item.src);
    items.push({ ...item, id: `profile-${item.src}` });
  };
  authored.forEach(add);
  const portraits = [person.face, ...(person.images || []), ...(person.polaroids || []), person.coverImage];
  for (const src of portraits) {
    if (items.length >= minimum) break;
    if (typeof src === "string" && src.trim()) add({ src, alt: `${person.name} portrait` });
  }
  const seed = [...String(person.id)].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  for (let i = 0; items.length < minimum && i < pool.length; i++) {
    const src = pool[(seed * 7 + i) % pool.length];
    add({ src, alt: `${person.name} sample portfolio image`, label: "Sample image", meta: "Preview" });
  }
  return items;
}

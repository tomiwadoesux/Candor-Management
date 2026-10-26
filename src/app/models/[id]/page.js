import { readdir } from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import "../../../styles/morph-gallery.css";
import "../../../styles/tab-link.css";
import "../../../styles/model-profile.css";
import ModelProfileView from "./ModelProfileView";
import { models } from "../../../../data/models";
import { imageSize } from "../../../lib/imageSize";
import { creditFor } from "../../../../data/credits";
import { coversFor } from "../../../../data/covers";
import { profileScrollItems } from "../../../lib/profileScrollItems";
import { getProfileSections, isTalentOrCreative } from "../../../lib/profilePortfolio";

export function generateStaticParams() {
  return models.map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const model = models.find((m) => m.id === id);
  return model ? { title: `${model.name} — Candor` } : { title: "Candor" };
}

// The tabbed sections below the hero are morphing galleries, and those size
// every tile to its photo's true proportions — so the sizes have to be read
// before render or the board would shift as images arrive. That is a server
// job, which is why the page is split: this file resolves the model and
// measures the artwork, ModelProfileView holds the interactive markup.
async function gallery(sources, alt, model, kind) {
  return Promise.all(
    sources.map(async (src, i) => {
      const size = await imageSize(src);
      const { label, meta } = creditFor(model, src, i, kind);
      return {
        id: src,
        src,
        alt: `${alt} ${i + 1}`,
        // Caption under the tile: a photographer line, or a client name tagged
        // "Campaign" on every third one. See data/credits.js.
        label,
        meta,
        // 3:4 is the house portrait ratio — a sane fallback if a header ever
        // fails to parse, so a tile can't collapse to zero height.
        pxW: size?.width || 3,
        pxH: size?.height || 4,
      };
    })
  );
}

// PLACEHOLDER PADDING. A model record carries six polaroids, which is too
// few rows to see the board's layout or its entrance do anything. Until real
// campaign imagery exists, the board is topped up from the shared pool in
// /public/images — deterministically, seeded off the model id, so a given
// profile always shows the same set and the server and client agree. Delete
// this and the `pad` call below the moment the records carry real work.
// 14 so the 4-3-4-3 row cycle lands exactly, with no short tail.
const BOARD_SIZE = 14;

async function pool() {
  try {
    const dir = path.join(process.cwd(), "public", "images");
    const files = await readdir(dir);
    return files
      .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
      .sort()
      .map((f) => `/images/${f}`);
  } catch {
    return [];
  }
}

async function pad(sources, id, size = BOARD_SIZE) {
  if (sources.length >= size) return sources;
  const all = await pool();
  if (!all.length) return sources;

  const seed = String(id)
    .split("")
    .reduce((n, c) => n + c.charCodeAt(0), 0);
  const out = [...sources];
  for (let i = 0; out.length < size && i < all.length; i++) {
    const pick = all[(seed * 7 + i * 3) % all.length];
    if (!out.includes(pick)) out.push(pick);
  }
  return out;
}

async function scrollingGallery(model, galleries) {
  const items = profileScrollItems(model, Object.values(galleries).flat(), await pool());
  return Promise.all(items.map(async (item) => {
    if (item.pxW && item.pxH) return item;
    const size = await imageSize(item.src);
    return { ...item, pxW: size?.width || 3, pxH: size?.height || 4 };
  }));
}

export default async function ModelProfilePage({ params }) {
  const { id } = await params;
  const model = models.find((m) => m.id === id);
  if (!model) notFound();

  if (isTalentOrCreative(model)) {
    // Keep authored sections and credits intact. The separate scrolling
    // preview can be padded to six photos without inventing portfolio work.
    const sections = await Promise.all(getProfileSections(model).map(async (section) => {
      if (section.kind !== "gallery") return section;
      const items = await Promise.all(section.items.map(async (item) => {
        const size = await imageSize(item.src);
        return { ...item, pxW: size?.width || item.pxW || 3, pxH: size?.height || item.pxH || 4 };
      }));
      return { ...section, items };
    }));
    const galleries = Object.fromEntries(sections
      .filter((section) => section.kind === "gallery")
      .map((section) => [section.key.toLowerCase(), section.items]));

    const scrollItems = await scrollingGallery(model, galleries);
    return <ModelProfileView key={model.id} model={model} sections={sections} scrollItems={scrollItems} />;
  }

  const covers = coversFor(model);
  const coverItems = await gallery(
    covers.map((cover) => cover.image),
    `${model.name} cover`,
    model,
  );

  // Covers use their own records and explicit study labels. Campaigns keep
  // their existing mixed board; Runway and Videos retain their empty states.
  const galleries = {
    covers: coverItems.map((item, index) => ({
      ...item,
      label: covers[index].label || `Cover ${index + 1}`,
      meta: covers[index].placeholder ? "Study" : "Cover",
      alt: `${model.name} ${covers[index].placeholder ? "cover study" : "cover"} ${index + 1}`,
    })),
    campaigns: await gallery(
      await pad(model.polaroids || [], model.id),
      `${model.name}`,
      model
    ),
    runway: await gallery(
      (model.runway ?? []).map((r) => r.image ?? r).filter(Boolean),
      `${model.name} runway`,
      model,
      "runway"
    ),
    videos: await gallery(
      (model.videos ?? []).map((v) => v.poster).filter(Boolean),
      `${model.name} video still`,
      model,
      "photo"
    ),
  };

  const scrollItems = await scrollingGallery(model, galleries);
  return <ModelProfileView key={model.id} model={model} scrollItems={scrollItems} />;
}

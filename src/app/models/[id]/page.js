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

export default async function ModelProfilePage({ params }) {
  const { id } = await params;
  const model = models.find((m) => m.id === id);
  if (!model) notFound();

  // One board per tab, keyed to match TABS in ModelProfileView. `campaigns` is
  // the only one with anything behind it — the model records carry a
  // `polaroids` array and nothing else — so covers, runway and videos fall
  // through to their own empty state rather than inventing placeholder work.
  //
  // Campaigns takes that array, and takes it without a forced `kind`, so the
  // board keeps its mixed credits: photographer lines with a client line on
  // every third tile.
  const galleries = {
    covers: await gallery(
      (model.covers ?? []).map((c) => c.image ?? c).filter(Boolean),
      `${model.name} cover`,
      model,
      "brand"
    ),
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

  return <ModelProfileView model={model} galleries={galleries} />;
}

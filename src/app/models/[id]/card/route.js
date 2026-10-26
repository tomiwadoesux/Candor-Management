/* eslint-disable @next/next/no-img-element -- ImageResponse renders embedded images directly. */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { models } from "../../../../../data/models";
import { agency } from "../../../../../data/agency";

export const runtime = "nodejs";

async function localPhoto(src) {
  if (typeof src !== "string" || !src.startsWith("/images/")) return null;
  const root = path.join(process.cwd(), "public", "images");
  const file = path.resolve(process.cwd(), "public", src.slice(1));
  if (!file.startsWith(`${root}${path.sep}`)) return null;
  const mime = { ".jpeg": "image/jpeg", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" }[path.extname(file).toLowerCase()];
  if (!mime) return null;
  try {
    return `data:${mime};base64,${(await readFile(file)).toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(_request, { params }) {
  const { id } = await params;
  const model = models.find((person) => person.id === id);
  if (!model) return new Response("Profile not found", { status: 404 });
  const sources = [...new Set([model.face, ...(model.polaroids || []), ...(model.images || []), model.coverImage].filter(Boolean))].slice(0, 4);
  const photos = (await Promise.all(sources.map(localPhoto))).filter(Boolean);
  const name = model.stageName || model.name;
  const fullName = model.fullName || model.name;
  const measurements = [
    ["Height", model.height], ["Chest", model.chest], ["Waist", model.waist],
    ["Hips", model.hips], ["Shoe", model.shoe],
  ].filter(([, value]) => value);
  const filename = `${fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "profile"}-card.png`;

  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: 64, background: "#fafafa", color: "#0c0c0c", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div style={{ display: "flex", flexDirection: "column", width: 810 }}>
          <div style={{ display: "flex", fontSize: name.length > 18 ? 48 : 76, lineHeight: 1.1, textTransform: "uppercase" }}>{name}</div>
          <div style={{ display: "flex", fontSize: 26, marginTop: 12 }}>{fullName}</div>
        </div>
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 2, paddingTop: 9 }}>CANDOR</div>
      </div>
      <div style={{ display: "flex", width: "100%", height: 1032, gap: 24 }}>
        {photos[0] ? <img src={photos[0]} alt="" width={photos.length > 1 ? 688 : 1072} height={1032} style={{ objectFit: "cover", objectPosition: "center 20%" }} /> : <div style={{ display: "flex", width: "100%", height: "100%", background: "#eeece9" }} />}
        {photos.length > 1 && <div style={{ display: "flex", flexDirection: "column", gap: 24, width: 360 }}>
          {photos.slice(1).map((photo, index) => <img key={index} src={photo} alt="" width={360} height={(1032 - (photos.length - 2) * 24) / (photos.length - 1)} style={{ objectFit: "cover", objectPosition: "center 20%" }} />)}
        </div>}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 20, marginTop: 32, paddingTop: 24, borderTop: "1px solid #b6b6b6" }}>
        {measurements.map(([label, value]) => <div key={label} style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 23 }}>
          <span style={{ color: "#666", fontSize: 19 }}>{label}</span>
          <span>{String(value).split("/")[0].trim()}</span>
        </div>)}
      </div>
      <div style={{ display: "flex", marginTop: "auto", justifyContent: "space-between", fontSize: 20, color: "#555" }}>
        <span>{agency.legalName}</span>
        <span>{agency.contact.email}</span>
      </div>
    </div>,
    { width: 1200, height: 1600, headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    } },
  );
}

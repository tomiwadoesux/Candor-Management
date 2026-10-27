// POST /api/skeletons — where the dev recorder writes layout maps.
//
// Development only. In production it answers 404 and touches nothing: the
// maps there are whatever was committed in public/skeletons/, and a deployed
// filesystem is read-only anyway.
//
// Only routes with a real page file are kept (see pageRoutes()), so a 404 is
// never mapped, and a page that is deleted or renamed drops out of the index
// on the next write.
//
// One file per route, one key per breakpoint inside it. A write only happens
// when the incoming bucket differs from what is on disk, so a page that has
// not changed leaves git clean however many times it is viewed. (When the
// layout DOES differ on every view — a page that animates itself — that is
// what the recorder's at-rest check and `keepExisting` are for.) The index of
// routes is rebuilt from the same request, so a new page appears in it the
// first time it is recorded.

import { promises as fs } from "fs";
import path from "path";
import { BUCKETS, INDEX_FILE, MAP_VERSION, routeFile } from "../../../components/pageSkeleton/layoutMap";

const DIR = path.join(process.cwd(), "public", "skeletons");
const BUCKET_NAMES = new Set(BUCKETS.map((b) => b.name));
const MAX_BLOCKS = 2000;

// Every route that has a page file, as a URL pattern: "/", "/models/[id]".
// A measurement is only kept for one of these — a mistyped URL renders the
// 404 page, and that is not a layout anyone navigates to on purpose. Route
// groups and parallel-route slots add no URL segment; private folders and
// intercepting routes are not pages of their own.
async function pageRoutes() {
  const routes = new Set();
  async function scan(dir, segs) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.isFile() && /^page\.(js|jsx|ts|tsx|mdx?)$/.test(e.name)) {
        routes.add(`/${segs.join("/")}`);
      } else if (e.isDirectory()) {
        const name = e.name;
        if (name.startsWith("_") || name.startsWith("(.")) continue;
        const grouping = /^\(.+\)$/.test(name) || name.startsWith("@");
        await scan(path.join(dir, name), grouping ? segs : [...segs, name]);
      }
    }
  }
  for (const root of ["src/app", "app"]) await scan(path.join(process.cwd(), root), []);
  return routes;
}

// Requests are applied one at a time. Two buckets of one route arriving
// together would otherwise both read the old file and the second write
// would drop the first's bucket.
let queue = Promise.resolve();

function valid({ route, bucket, layout }) {
  if (typeof route !== "string" || !route.startsWith("/") || route.length > 200) return false;
  // Route segments only: no traversal, no query, nothing a file name can't hold.
  if (route.includes("..") || /[?#\\:*"<>|\s]/.test(route)) return false;
  if (!BUCKET_NAMES.has(bucket)) return false;
  if (!layout || layout.v !== MAP_VERSION) return false;
  if (!Array.isArray(layout.blocks) || layout.blocks.length > MAX_BLOCKS) return false;
  if (!Array.isArray(layout.colors)) return false;
  return layout.blocks.every(
    (b) => Array.isArray(b) && b.length >= 6 && b.length <= 7 && b.every(Number.isFinite)
  );
}

// One block per line, so a diff of a map shows which blocks moved rather
// than a wall of single numbers.
function serialize(doc) {
  const buckets = BUCKETS.map((b) => b.name)
    .filter((name) => doc.buckets[name])
    .map((name) => {
      const { vw, vh, bg, fg, colors, blocks } = doc.buckets[name];
      return [
        `    ${JSON.stringify(name)}: {`,
        `      "vw": ${vw}, "vh": ${vh}, "bg": ${JSON.stringify(bg)}, "fg": ${JSON.stringify(fg)},`,
        `      "colors": ${JSON.stringify(colors)},`,
        `      "blocks": [`,
        blocks.map((b) => `        ${JSON.stringify(b)}`).join(",\n"),
        `      ]`,
        `    }`,
      ].join("\n");
    });
  return [
    "{",
    `  "v": ${doc.v},`,
    `  "route": ${JSON.stringify(doc.route)},`,
    `  "buckets": {`,
    buckets.join(",\n"),
    "  }",
    "}",
    "",
  ].join("\n");
}

async function readJSON(file) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return null;
  }
}

async function write({ route, bucket, layout, keepExisting }) {
  const pages = await pageRoutes();
  if (!pages.has(route)) return false;

  await fs.mkdir(DIR, { recursive: true });

  const file = routeFile(route);
  const target = path.join(DIR, file);
  const { vw, vh, bg, fg, colors, blocks } = layout;
  const incoming = { vw, vh, bg, fg, colors, blocks };

  const existing = await readJSON(target);
  const doc =
    existing?.v === MAP_VERSION ? existing : { v: MAP_VERSION, route, buckets: {} };

  // keepExisting: the page was still moving when measured. Good enough to
  // seed a breakpoint that has nothing, not to replace one recorded at rest.
  let written = false;
  const replace = !(keepExisting && doc.buckets[bucket]);
  if (replace && JSON.stringify(doc.buckets[bucket]) !== JSON.stringify(incoming)) {
    doc.buckets[bucket] = incoming;
    await fs.writeFile(target, serialize(doc));
    written = true;
  }

  // The index lists this route, and drops any whose page has since been
  // deleted or renamed — along with its map, which nothing would read again.
  const indexPath = path.join(DIR, INDEX_FILE);
  const index = (await readJSON(indexPath)) || { routes: {} };
  const routes = { ...index.routes, [route]: file };
  for (const [r, f] of Object.entries(routes)) {
    if (pages.has(r)) continue;
    delete routes[r];
    await fs.rm(path.join(DIR, path.basename(f)), { force: true });
  }
  const sorted = Object.fromEntries(Object.entries(routes).sort(([a], [b]) => a.localeCompare(b)));
  const text = `${JSON.stringify({ routes: sorted }, null, 2)}\n`;
  if (JSON.stringify(index) !== JSON.stringify({ routes: sorted })) {
    await fs.writeFile(indexPath, text);
  }

  return written;
}

export async function POST(req) {
  if (process.env.NODE_ENV !== "development") {
    return new Response(null, { status: 404 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad json" }, { status: 400 });
  }
  if (!valid(body)) return Response.json({ error: "bad layout" }, { status: 400 });

  const job = queue.then(() => write(body));
  queue = job.catch(() => {});
  try {
    return Response.json({ written: await job });
  } catch (err) {
    return Response.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

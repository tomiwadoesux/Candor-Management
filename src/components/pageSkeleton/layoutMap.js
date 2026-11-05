// THE LAYOUT MAP — the shared vocabulary.
//
// Two sides meet here. In development the recorder measures every page it is
// shown and writes what it found to public/skeletons/; on every click the
// overlay reads that file back and draws it as SVG. Anything both sides have
// to agree on — the block kinds, the breakpoints, how a route becomes a file
// name — lives in this one module so they cannot drift apart.
//
// A map is a plain JSON file, one per route, committed with the code:
//
//   public/skeletons/_routes.json        { routes: { "/models": "models.json", … } }
//   public/skeletons/models.json         { v, route, buckets: { lg: {…}, sm: {…} } }
//   public/skeletons/models__[id].json   every profile shares one map
//
// Each bucket is one breakpoint's first screen, measured in CSS pixels at the
// size it was recorded:
//
//   { vw, vh, bg, fg, colors: ["#0c0c0c", …], blocks: [[kind, x, y, w, h, c, r?], …] }
//
// `c` indexes `colors`, `r` is a corner radius and is left off when 0. Blocks
// are stored in paint order, so the renderer never has to sort them.

export const MAP_VERSION = 1;

// Under public/, so the dev server serves a new map the moment it is written
// and a production build ships whatever was last committed.
export const MAP_DIR = "/skeletons";
export const INDEX_FILE = "_routes.json";

// Block kinds — the first number of every block tuple.
export const SURFACE = 0; // a panel painted in its real colour (a dark band, a card, a pill)
export const MEDIA = 1; // an image, video, canvas or large svg
export const TEXT = 2; // one line of text, or a small icon
export const RULE = 3; // one side of a border, as a thin filled rect
export const OUTLINE = 4; // a full border around a box, drawn as a stroke

// The site's Tailwind breakpoints. A page can be a different layout entirely
// below md or lg, so each is recorded on its own rather than one width being
// stretched to fit them all. Within a bucket the map is scaled to the window.
export const BUCKETS = [
  { name: "sm", max: 767 },
  { name: "md", max: 1023 },
  { name: "lg", max: Infinity },
];

export const REFERENCE_VIEWPORTS = { sm: [390, 844], md: [900, 900], lg: [1440, 900] };

export function bucketFor(width) {
  return BUCKETS.find((b) => width <= b.max).name;
}

// When a breakpoint has not been recorded yet, borrow the nearest one that
// has. Neighbouring layouts are far closer to each other than to nothing.
const FALLBACK = {
  sm: ["sm", "md", "lg"],
  md: ["md", "lg", "sm"],
  lg: ["lg", "md", "sm"],
};

export function pickBucket(map, width, height) {
  if (!map?.buckets) return null;
  for (const name of FALLBACK[bucketFor(width)]) {
    if (!map.buckets[name]) continue;
    const candidates = [map.buckets[name], ...(map.samples?.[name] || [])];
    const distance = (b) => Math.abs(Math.log(width / b.vw)) * 4 + (height ? Math.abs(Math.log(height / b.vh)) * 0.25 : 0);
    return candidates.reduce((best, b) => distance(b) < distance(best) ? b : best);
  }
  return null;
}

// Keep different window measurements instead of letting the last visitor
// overwrite the phone/desktop baseline. This also preserves page-specific
// layout changes inside a Tailwind breakpoint (e.g. Archive at 700px).
export function mergeRecording(map, bucket, incoming, keepExisting = false) {
  const prior = [map.buckets[bucket], ...(map.samples?.[bucket] || [])].filter(b => b && b.geometry === incoming.geometry);
  const same = prior.find(b => b.vw === incoming.vw && b.vh === incoming.vh && b.geometry === incoming.geometry);
  if (keepExisting && same) return false;
  const variants = prior.filter(b => b.vw !== incoming.vw || b.vh !== incoming.vh);
  variants.push(incoming);
  const [vw, vh] = REFERENCE_VIEWPORTS[bucket];
  const distance = b => Math.abs(Math.log(vw / b.vw)) * 4 + Math.abs(Math.log(vh / b.vh)) * 0.25;
  variants.sort((a, b) => distance(a) - distance(b));
  const [base, ...samples] = variants.slice(0, 6);
  const changed = JSON.stringify(map.buckets[bucket]) !== JSON.stringify(base) ||
    JSON.stringify(map.samples?.[bucket] || []) !== JSON.stringify(samples);
  map.buckets[bucket] = base;
  map.samples ||= {};
  if (samples.length) map.samples[bucket] = samples;
  else delete map.samples[bucket];
  return changed;
}

// Flow content follows the viewport's width, not its height. A taller window
// reveals more content; it must not stretch every photograph and line of type.
// Anchors keep fixed chrome at its real edge when the viewport height changes.
export function projectLayout(layout, width, height) {
  if (!layout.geometry) return layout;
  const sx = width / layout.vw;
  const dx = width - layout.vw;
  const dy = height - layout.vh;
  const anchors = new Map(layout.anchors || []);
  const blocks = layout.blocks.map((block, index) => {
    const [kind, x, y, w, h, color, radius = 0] = block;
    const anchor = anchors.get(index);
    if (anchor) {
      const [ax, ay] = anchor;
      const left = ax === 2 ? x + dx / 2 : ax === 3 ? x + dx : ax === 4 ? x * sx : x;
      const top = ay === 2 ? y + dy : ay === 3 ? y + dy / 2 : ay === 4 ? y * height / layout.vh : y;
      return [kind, left, top, ax === 4 ? w * sx : w, ay === 4 ? h * height / layout.vh : h, color, radius];
    }
    return [kind, x * sx, y * sx, w * sx, kind === TEXT ? h : h * sx, color, radius * sx];
  });
  return { ...layout, vw: width, vh: height, blocks };
}

export function normalizePath(pathname) {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

// "/" → "_root.json", "/models/[id]" → "models__[id].json". Readable in a
// diff, and the route itself is stored inside the file and in the index, so
// nothing ever has to parse a name back into a route.
export function routeFile(route) {
  if (route === "/") return "_root.json";
  return `${route.slice(1).split("/").join("__")}.json`;
}

// The recorder only ever sees a concrete URL — /models/ada-okafor — but every
// profile is the same layout and should share one map. useParams() says which
// segments were dynamic, so each one is swapped back for its folder name:
// /models/[id]. Catch-alls come back as arrays and replace a run of segments.
export function routePattern(pathname, params) {
  const segs = normalizePath(pathname).split("/").filter(Boolean);
  const decoded = segs.map((s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  });

  for (const [name, value] of Object.entries(params || {})) {
    if (Array.isArray(value)) {
      if (!value.length) continue;
      const start = decoded.findIndex(
        (s, i) => value.every((v, j) => decoded[i + j] === v)
      );
      if (start < 0) continue;
      segs.splice(start, value.length, `[...${name}]`);
      decoded.splice(start, value.length, `[...${name}]`);
    } else if (value != null) {
      const i = decoded.indexOf(String(value));
      if (i < 0) continue;
      segs[i] = `[${name}]`;
      decoded[i] = `[${name}]`;
    }
  }

  return `/${segs.join("/")}`;
}

// The reverse, for the overlay: a clicked href against the recorded routes.
// An exact route always wins; among patterns, the one with the most fixed
// segments wins, so /models/new beats /models/[id] if both were recorded.
function patternRegex(route) {
  const body = route
    .split("/")
    .filter(Boolean)
    .map((seg) => {
      if (/^\[\[\.\.\..+\]\]$/.test(seg)) return "(?:/.*)?";
      if (/^\[\.\.\..+\]$/.test(seg)) return "/.+";
      if (/^\[.+\]$/.test(seg)) return "/[^/]+";
      return `/${seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`;
    })
    .join("");
  return new RegExp(`^${body || "/"}$`);
}

export function matchRoute(pathname, routes) {
  const path = normalizePath(pathname);
  if (routes.includes(path)) return path;

  let best = null;
  let bestScore = -1;
  for (const route of routes) {
    if (!route.includes("[")) continue;
    if (!patternRegex(route).test(path)) continue;
    const score = route.split("/").filter((s) => s && !s.startsWith("[")).length;
    if (score > bestScore) {
      best = route;
      bestScore = score;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Loading maps in the browser.
//
// Fetched on intent — a pointer over a link, a focus, a touch — so the file
// is almost always in memory before the click lands and the overlay can draw
// the real shape on its very first frame. In development maps change as the
// pages do, so nothing is cached between intents there.
// ---------------------------------------------------------------------------

const DEV = process.env.NODE_ENV === "development";

let indexRequest = null;
const files = new Map(); // file name → Promise<map | null>
const ready = new Map(); // file name → map, once resolved, for synchronous reads
let indexReady = null;

function getJSON(url) {
  return fetch(url, { cache: DEV ? "no-store" : "default" })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
}

export function loadIndex() {
  if (!indexRequest || DEV) {
    indexRequest = getJSON(`${MAP_DIR}/${INDEX_FILE}`).then((index) => {
      indexReady = index?.routes ? index : { routes: {} };
      return indexReady;
    });
  }
  return indexRequest;
}

function fileFor(pathname, index) {
  const aliases = { "/about": "/agency", "/about-new": "/agency" };
  const path = normalizePath(pathname);
  const route = matchRoute(aliases[path] || path, Object.keys(index.routes));
  return route ? index.routes[route] : null;
}

export async function loadMapFor(pathname) {
  const index = await loadIndex();
  const file = fileFor(pathname, index);
  if (!file) return null;

  if (!files.has(file) || DEV) {
    files.set(
      file,
      getJSON(`${MAP_DIR}/${encodeURIComponent(file)}`).then((map) => {
        if (map?.v === MAP_VERSION) ready.set(file, map);
        return ready.get(file) ?? null;
      })
    );
  }
  return files.get(file);
}

// Warm the site's actual links once per arrival. Touch navigation should not
// start with an empty sheet while its first layout request is in flight.
export async function warmMapsFor(pathnames) {
  const index = await loadIndex();
  const needed = new Set(pathnames.map(path => fileFor(path, index)).filter(Boolean));
  await Promise.all([...needed].map(async file => {
    if (ready.has(file)) return;
    const request = getJSON(`${MAP_DIR}/${encodeURIComponent(file)}`).then(map => {
      if (map?.v === MAP_VERSION) ready.set(file, map);
      return ready.get(file) ?? null;
    });
    files.set(file, request);
    await request;
  }));
}

// Whatever is already in memory, without waiting. Lets the click handler
// paint the destination's shape in the same frame as the click.
export function peekMapFor(pathname) {
  if (!indexReady) return null;
  const file = fileFor(pathname, indexReady);
  return file ? ready.get(file) ?? null : null;
}

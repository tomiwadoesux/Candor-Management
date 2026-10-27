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

export function pickBucket(map, width) {
  if (!map?.buckets) return null;
  for (const name of FALLBACK[bucketFor(width)]) {
    if (map.buckets[name]) return map.buckets[name];
  }
  return null;
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
  const route = matchRoute(pathname, Object.keys(index.routes));
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

// Whatever is already in memory, without waiting. Lets the click handler
// paint the destination's shape in the same frame as the click.
export function peekMapFor(pathname) {
  if (!indexReady) return null;
  const file = fileFor(pathname, indexReady);
  return file ? ready.get(file) ?? null : null;
}

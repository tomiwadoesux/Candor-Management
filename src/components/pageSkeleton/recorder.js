// THE RECORDER — keeps public/skeletons/ in step with the pages, in dev only.
//
// Loaded by PageSkeleton behind a NODE_ENV check, so production never
// downloads a byte of it. While `npm run dev` is up, every page you look at
// is measured and its map written to disk, which is what keeps the maps
// current without anyone maintaining them: change a page, and as soon as it
// settles in the browser its skeleton changes with it.
//
// WHEN IT MEASURES — three moments, and only these:
//
//   arrival   a route is shown, by a load or a navigation
//   resize    the window crosses into another breakpoint
//   edit      Next applies a code change: Fast Refresh swaps a component
//             ($RefreshHelpers$.scheduleUpdate), a stylesheet is replaced in
//             <head>, or a server component re-renders (Next moves the
//             __next_hmr_refresh_hash__ cookie)
//
// The DOM changing is NOT one of them. A page that animates itself — a
// cycling portrait, a carousel, a looping intro — rewrites its own DOM every
// few seconds forever, and measuring on that would rewrite the map on disk
// just as often. DOM activity only ever DELAYS a measurement that is already
// due, until the page goes quiet (or ARRIVAL_MAX_MS passes).
//
// AT REST. Each measurement is taken twice, 350ms apart. An edit is only
// written once two agree, retried a few times before giving up and writing
// the latest. An arrival that is still moving is written only if the route
// has no map at this breakpoint yet — an existing map is not churned by a
// page caught mid-animation.
//
// WHEN IT DOESN'T. The map is the first screen as someone ARRIVING sees it.
// So nothing is measured while the page is scrolled, while the overlay is up,
// or once you have clicked or typed into the page since arriving — an open
// menu or a switched tab is not what the next visitor lands on. A reload or a
// fresh navigation records it again.
//
// In the console, __skeleton.capture() returns what would be recorded now.

import { bucketFor } from "./layoutMap";
import { captureLayout, layoutSignature } from "./captureLayout";

const SETTLE_MS = 1200; // quiet time after the last DOM change before measuring
const ARRIVAL_MAX_MS = 4500; // a due measurement is taken by now, quiet or not
const STABLE_GAP_MS = 350; // the gap between the two measurements that must agree
const EDIT_TRIES = 3;
const IMAGE_WAIT_MS = 3000;
const HMR_COOKIE = "__next_hmr_refresh_hash__";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function viewportMediaLoaded() {
  const vh = window.innerHeight;
  const pending = [...document.images].filter((img) => {
    if (img.complete) return false;
    const r = img.getBoundingClientRect();
    return r.bottom > 0 && r.top < vh && r.width > 0;
  });
  if (!pending.length) return Promise.resolve();
  return Promise.race([
    Promise.all(
      pending.map(
        (img) =>
          new Promise((r) => {
            img.addEventListener("load", r, { once: true });
            img.addEventListener("error", r, { once: true });
          })
      )
    ),
    sleep(IMAGE_WAIT_MS),
  ]);
}

function hmrHash() {
  const hit = document.cookie.split("; ").find((c) => c.startsWith(`${HMR_COOKIE}=`));
  return hit ? hit.slice(HMR_COOKIE.length + 1) : "";
}

export function startRecorder({ getRoute, isBusy, isOwnNode }) {
  let timer = 0;
  // What is owed: null, "arrive" or "edit". An owed arrival outranks an edit.
  let due = null;
  let dueSince = 0;
  let tries = 0;
  let pristine = true;
  let running = false;
  let lastBucket = bucketFor(window.innerWidth);
  const sent = new Map(); // "route|bucket" → signature last written

  const arm = (delay) => {
    clearTimeout(timer);
    timer = setTimeout(run, delay);
  };

  const owe = (kind, delay = SETTLE_MS) => {
    if (due !== "arrive") due = kind;
    dueSince = Date.now();
    tries = 0;
    arm(delay);
  };

  const arrive = () => {
    pristine = true;
    owe("arrive");
  };

  const edited = () => {
    if (pristine) owe("edit");
  };

  async function run() {
    if (!due) return;
    if (running || isBusy() || document.hidden) return arm(600);
    if (window.scrollY > 2) return; // picked up again by onScroll at the top
    if (!pristine) return void (due = null);

    const route = getRoute();
    if (!route) return;
    const kind = due;

    running = true;
    try {
      await document.fonts?.ready;
      await viewportMediaLoaded();
      if (isBusy() || window.scrollY > 2 || getRoute() !== route) return;

      const first = captureLayout({ exclude: isOwnNode });
      await sleep(STABLE_GAP_MS);
      if (isBusy() || window.scrollY > 2 || getRoute() !== route) return;
      const second = captureLayout({ exclude: isOwnNode });

      const signature = layoutSignature(second);
      const atRest = layoutSignature(first) === signature;
      if (!atRest && kind === "edit" && ++tries < EDIT_TRIES) return arm(800);

      due = null;
      const bucket = bucketFor(second.vw);
      const key = `${route}|${bucket}`;
      if (sent.get(key) === signature) return;
      sent.set(key, signature);

      const res = await fetch("/api/skeletons", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          route,
          bucket,
          layout: second,
          // An arrival caught mid-animation may seed a missing map but must
          // not overwrite one that was recorded at rest.
          keepExisting: kind === "arrive" && !atRest,
        }),
      });
      const out = await res.json().catch(() => null);
      if (out?.written) {
        console.debug(
          `[skeleton] mapped ${route} @ ${bucket} — ${second.blocks.length} blocks (${kind}${atRest ? "" : ", page still moving"})`
        );
      }
    } catch (err) {
      console.debug("[skeleton] measure failed", err);
    } finally {
      running = false;
    }
  }

  // DOM activity only pushes back a measurement already owed, so the page is
  // measured once it goes quiet — never triggers one by itself. Inline style
  // changes are left out: that is GSAP's channel, and it never stops talking.
  const observer = new MutationObserver((records) => {
    if (!due || running) return;
    if (Date.now() - dueSince > ARRIVAL_MAX_MS) return;
    for (const m of records) {
      const node = m.target.nodeType === 1 ? m.target : m.target.parentElement;
      if (node && !isOwnNode(node)) {
        const left = dueSince + ARRIVAL_MAX_MS - Date.now();
        return arm(Math.min(SETTLE_MS, Math.max(0, left)));
      }
    }
  });
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["class"],
  });

  // Client edits. Every component module Fast Refresh swaps in calls
  // $RefreshHelpers$.scheduleUpdate(), so wrapping it hears each one. Next's
  // __NEXT_HMR_LATENCY_CB debug hook is chained as well: it covers updates
  // that are not components, but Turbopack skips it when its messages arrive
  // out of order, so it cannot be the only ear.
  const helpers = self.$RefreshHelpers$;
  const scheduleUpdate = helpers?.scheduleUpdate;
  const onRefresh = function (...args) {
    const out = scheduleUpdate.apply(this, args);
    edited();
    return out;
  };
  if (typeof scheduleUpdate === "function") helpers.scheduleUpdate = onRefresh;

  const priorHmr = self.__NEXT_HMR_LATENCY_CB;
  const onHmr = (...args) => {
    priorHmr?.(...args);
    edited();
  };
  self.__NEXT_HMR_LATENCY_CB = onHmr;

  // Stylesheet edits. The page's own DOM is too noisy to listen to, but
  // <head> only changes stylesheets when CSS is edited or a route loads its
  // own — and after a route load a measurement is owed anyway.
  const isSheet = (n) =>
    n.nodeType === 1 && (n.tagName === "STYLE" || (n.tagName === "LINK" && n.rel === "stylesheet"));
  const headWatch = new MutationObserver((records) => {
    for (const m of records) {
      if (m.type === "attributes" ? isSheet(m.target) : [...m.addedNodes, ...m.removedNodes].some(isSheet)) {
        return edited();
      }
    }
  });
  headWatch.observe(document.head, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["href"],
  });

  // Server component edits never reach that hook; Next re-fetches the page
  // and moves this cookie instead.
  let hash = hmrHash();
  const cookieWatch = setInterval(() => {
    const next = hmrHash();
    if (next !== hash) {
      hash = next;
      edited();
    }
  }, 700);

  const dirty = (e) => {
    if (e.target?.nodeType === 1 && isOwnNode(e.target)) return;
    pristine = false;
  };
  const onScroll = () => {
    if (window.scrollY > 48) pristine = false;
    else if (window.scrollY <= 2 && due) arm(600);
  };
  const onResize = () => {
    const bucket = bucketFor(window.innerWidth);
    if (bucket === lastBucket) return;
    lastBucket = bucket;
    if (pristine) owe("arrive");
  };

  window.addEventListener("pointerdown", dirty, true);
  window.addEventListener("keydown", dirty, true);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);

  self.__skeleton = { capture: () => captureLayout({ exclude: isOwnNode }) };

  arrive();

  return {
    arrive,
    stop() {
      clearTimeout(timer);
      clearInterval(cookieWatch);
      observer.disconnect();
      headWatch.disconnect();
      if (helpers?.scheduleUpdate === onRefresh) helpers.scheduleUpdate = scheduleUpdate;
      if (self.__NEXT_HMR_LATENCY_CB === onHmr) self.__NEXT_HMR_LATENCY_CB = priorHmr;
      delete self.__skeleton;
      window.removeEventListener("pointerdown", dirty, true);
      window.removeEventListener("keydown", dirty, true);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    },
  };
}

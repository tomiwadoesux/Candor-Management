"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import SkeletonSvg from "./SkeletonSvg";
import {
  loadIndex,
  loadMapFor,
  normalizePath,
  peekMapFor,
  pickBucket,
  routePattern,
} from "./layoutMap";
import "../../styles/page-skeleton.css";

// THE PAGE SKELETON.
//
// Click a link and the destination's own layout — recorded from the real
// page, drawn in SVG — covers the screen on the next frame. The route loads
// underneath it. The skeleton lifts once BOTH of these are true:
//
//   1. MIN_MS has passed since the click. Every navigation gets the same
//      beat, so a page that happens to be cached does not snap in while a
//      cold one hangs; the rhythm is the site's, not the network's.
//   2. The new page is actually there: the route has committed, fonts are
//      in, the images in the first screen have decoded, and the DOM has gone
//      quiet (a streamed page finishing). Capped at READY_MAX_MS, so one slow
//      image never holds the whole site hostage.
//
// Because the map was measured from the page itself, the blocks sit where the
// content lands, and the lift reads as the page filling its own outline.
//
// WHAT TRIGGERS IT.
//
// Any left click on a same-origin <a> that goes to a different pathname —
// next/link or a plain anchor. A plain anchor is taken over and pushed through
// the router, so it becomes a client navigation instead of a full reload.
// Left alone: new tabs, modifier clicks, downloads, hash and query-only
// changes, files, /api, and anything marked data-no-skeleton. Back and forward
// are left alone too — those restore a page already seen, instantly.
//
// For navigation from code, use useSkeletonRouter() in place of useRouter().
//
// Pages that want their entrance to start as the skeleton lifts, rather than
// behind it, can listen for "pageskeleton:reveal" on window, or check
// <html data-page-skeleton> on mount.

const MIN_MS = 1000;
const READY_MAX_MS = 2500; // after the route commits
const NAV_MAX_MS = 8000; // a navigation that never commits gives the page back
const QUIET_MS = 150;
// Kept in step by hand with --ps-exit-ms in page-skeleton.css.
const EXIT_MS = 420;

const OVERLAY_ATTR = "data-page-skeleton-overlay";

let startFromCode = null;

// Starts the skeleton for an href. Returns false when it does not apply (same
// page, external, already running), so callers can tell.
export function startPageSkeleton(href) {
  return startFromCode ? startFromCode(href) : false;
}

export function useSkeletonRouter() {
  const router = useRouter();
  return useMemo(
    () => ({
      ...router,
      push(href, options) {
        startPageSkeleton(href);
        router.push(href, options);
      },
      replace(href, options) {
        startPageSkeleton(href);
        router.replace(href, options);
      },
    }),
    [router]
  );
}

function isPageNav(url) {
  if (url.origin !== window.location.origin) return false;
  const path = normalizePath(url.pathname);
  if (path === normalizePath(window.location.pathname)) return false;
  if (path.startsWith("/api/") || path.startsWith("/_next/")) return false;
  if (/\.[a-z0-9]{2,5}$/i.test(path)) return false;
  return true;
}

function linkFrom(target) {
  const a = target instanceof Element ? target.closest("a[href]") : null;
  if (!a) return null;
  try {
    return { a, url: new URL(a.getAttribute("href"), window.location.href) };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Is the new page there yet?
// ---------------------------------------------------------------------------

const frames = (n) =>
  new Promise((resolve) => {
    const step = () => (n-- <= 0 ? resolve() : requestAnimationFrame(step));
    step();
  });

const within = (promise, ms) =>
  Promise.race([promise, new Promise((r) => setTimeout(r, Math.max(0, ms)))]);

function quiet(ms, max, overlay) {
  return new Promise((resolve) => {
    let timer = setTimeout(done, ms);
    const cap = setTimeout(done, max);
    const observer = new MutationObserver((records) => {
      if (records.every((m) => overlay?.contains(m.target))) return;
      clearTimeout(timer);
      timer = setTimeout(done, ms);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    function done() {
      clearTimeout(timer);
      clearTimeout(cap);
      observer.disconnect();
      resolve();
    }
  });
}

function pendingMedia(overlay) {
  const vh = window.innerHeight;
  const onScreen = (el) => {
    if (overlay?.contains(el)) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < vh;
  };
  const waitFor = (el, ok) =>
    new Promise((r) => {
      el.addEventListener(ok, r, { once: true });
      el.addEventListener("error", r, { once: true });
    });

  const images = [...document.images]
    .filter((img) => !img.complete && onScreen(img))
    .map((img) => waitFor(img, "load"));
  const videos = [...document.querySelectorAll("video")]
    .filter((v) => v.readyState < 2 && v.preload !== "none" && onScreen(v))
    .map((v) => waitFor(v, "loadeddata"));
  return [...images, ...videos];
}

async function waitForPage(overlay) {
  const deadline = performance.now() + READY_MAX_MS;
  const left = () => deadline - performance.now();

  await frames(2);
  if (document.fonts) await within(document.fonts.ready, left());

  while (left() > 0) {
    await quiet(QUIET_MS, left(), overlay);
    const pending = pendingMedia(overlay);
    if (!pending.length) return;
    await within(Promise.all(pending), left());
  }
}

// ---------------------------------------------------------------------------

export default function PageSkeleton() {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();

  // { target, phase: "enter" | "hold" | "exit", map, fallbackBg, reduced }
  const [show, setShow] = useState(null);
  const run = useRef(null);
  const overlayRef = useRef(null);

  const reveal = useCallback(() => {
    const r = run.current;
    if (!r || r.revealing) return;
    r.revealing = true;
    r.timers.forEach(clearTimeout);

    document.documentElement.setAttribute("data-page-skeleton", "exit");
    window.dispatchEvent(
      new CustomEvent("pageskeleton:reveal", { detail: { pathname: r.target } })
    );
    setShow((s) => s && { ...s, phase: "exit" });

    setTimeout(() => {
      if (run.current !== r) return;
      run.current = null;
      document.documentElement.removeAttribute("data-page-skeleton");
      setShow(null);
    }, EXIT_MS);
  }, []);

  const start = useCallback(
    (href) => {
      if (run.current) return false;
      let url;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return false;
      }
      if (!isPageNav(url)) return false;

      const target = normalizePath(url.pathname);
      const r = {
        target,
        from: normalizePath(window.location.pathname),
        startedAt: performance.now(),
        arrived: false,
        revealing: false,
        timers: [],
      };
      run.current = r;
      document.documentElement.setAttribute("data-page-skeleton", "on");

      const map = peekMapFor(target);
      setShow({
        target,
        phase: "enter",
        map,
        // Until the destination's map arrives, hold the current page's ground
        // rather than flashing a colour that belongs to neither page.
        fallbackBg: getComputedStyle(document.body).backgroundColor,
        reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });

      // Mount at opacity 0, paint, THEN flip to the visible phase — set in
      // one commit the overlay would arrive already faded in and pop.
      frames(2).then(() =>
        setShow((s) => (s && s.target === target && s.phase === "enter" ? { ...s, phase: "hold" } : s))
      );

      if (!map) {
        loadMapFor(target).then((m) => {
          if (m) setShow((s) => (s && s.target === target && !s.map ? { ...s, map: m } : s));
        });
      }

      r.timers.push(setTimeout(reveal, NAV_MAX_MS));
      return true;
    },
    [reveal]
  );

  // The route has committed under the cover: wait for it to be ready, then
  // for whatever is left of the minimum, then lift.
  useEffect(() => {
    const r = run.current;
    if (!r || r.arrived || normalizePath(pathname) === r.from) return;
    r.arrived = true;
    waitForPage(overlayRef.current).then(() => {
      if (run.current !== r) return;
      const left = MIN_MS - (performance.now() - r.startedAt);
      r.timers.push(setTimeout(reveal, Math.max(0, left)));
    });
  }, [pathname, reveal]);

  useEffect(() => {
    startFromCode = start;

    const onClick = (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const hit = linkFrom(e.target);
      if (!hit) return;
      const { a, url } = hit;
      if (a.hasAttribute("download") || a.hasAttribute("data-no-skeleton")) return;
      const target = a.getAttribute("target");
      if (target && target !== "_self") return;
      if (!isPageNav(url)) return;

      // This listener is on window, so it runs after React's own handlers.
      // A <Link> has already called preventDefault and started routing by
      // now; a plain anchor has not, and is pushed through the router here.
      if (!e.defaultPrevented) {
        e.preventDefault();
        router.push(url.pathname + url.search + url.hash);
      }
      start(url.href);
    };

    // Fetch the map the moment a link looks likely to be used, so it is in
    // memory before the click. Pointerover bubbles from every child of the
    // link, so the same path is skipped for a second.
    let lastPath = "";
    let lastAt = 0;
    const onIntent = (e) => {
      const hit = linkFrom(e.target);
      if (!hit || !isPageNav(hit.url)) return;
      const now = performance.now();
      if (hit.url.pathname === lastPath && now - lastAt < 1000) return;
      lastPath = hit.url.pathname;
      lastAt = now;
      loadMapFor(hit.url.pathname);
    };

    window.addEventListener("click", onClick);
    window.addEventListener("pointerover", onIntent, { passive: true });
    window.addEventListener("touchstart", onIntent, { passive: true });
    window.addEventListener("focusin", onIntent);

    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
    idle(() => loadIndex());

    return () => {
      if (startFromCode === start) startFromCode = null;
      window.removeEventListener("click", onClick);
      window.removeEventListener("pointerover", onIntent);
      window.removeEventListener("touchstart", onIntent);
      window.removeEventListener("focusin", onIntent);
    };
  }, [router, start]);

  // While the overlay is up the page under it is not the page being shown.
  // Wheel and touch scrolling are swallowed here — stopped before they reach
  // Lenis on window — so the destination does not open already scrolled.
  const active = show !== null;
  useEffect(() => {
    const el = overlayRef.current;
    if (!active || !el) return;
    const block = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    el.addEventListener("wheel", block, { passive: false });
    el.addEventListener("touchmove", block, { passive: false });
    return () => {
      el.removeEventListener("wheel", block);
      el.removeEventListener("touchmove", block);
    };
  }, [active]);

  // --- Development: keep the maps current -------------------------------
  const routeRef = useRef(null);
  routeRef.current = routePattern(pathname, params);
  const recorder = useRef(null);

  useEffect(() => {
    let cancelled = false;
    // Wrapped in the condition rather than behind an early return: a
    // constant-false branch is dropped at build time, import and all, so the
    // recorder never becomes a production chunk. Set
    // NEXT_PUBLIC_SKELETON_RECORD=0 to browse in dev without recording.
    if (
      process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_SKELETON_RECORD !== "0"
    ) {
      import("./recorder").then(({ startRecorder }) => {
        if (cancelled) return;
        recorder.current = startRecorder({
          getRoute: () => routeRef.current,
          isBusy: () =>
            run.current !== null || document.querySelector(".return-reveal") !== null,
          isOwnNode: (el) => !!el.closest?.(`[${OVERLAY_ATTR}]`),
        });
      });
    }
    return () => {
      cancelled = true;
      recorder.current?.stop();
      recorder.current = null;
    };
  }, []);

  // A page is measured as it is ARRIVED at: on a fresh load, and once the
  // overlay has fully lifted after a navigation — never through it.
  useEffect(() => {
    if (!active) recorder.current?.arrive();
  }, [pathname, active]);

  if (!show) return null;

  const layout = show.map ? pickBucket(show.map, window.innerWidth) : null;

  return (
    <div
      ref={overlayRef}
      className="page-skeleton"
      data-phase={show.phase}
      {...{ [OVERLAY_ATTR]: "" }}
      style={{ backgroundColor: layout?.bg ?? show.fallbackBg }}
      aria-hidden="true"
    >
      {layout && <SkeletonSvg layout={layout} scan={!show.reduced} />}
    </div>
  );
}

"use client";

import { useEffect } from "react";
import Carousel from "./Carousel";

/**
 * Holds the page still while the carousel is mounted.
 *
 * Upstream did this with `html, body { overflow: hidden; overscroll-behavior:
 * none }` in a global stylesheet, which is fine when the carousel IS the app but
 * would freeze every other page here. Doing it from an effect scopes it to this
 * route and, crucially, undoes it on unmount — a route-scoped stylesheet is not
 * unloaded on client-side navigation, so the rule would follow you out of the
 * page and leave the rest of the site unscrollable.
 *
 * overscroll-behavior is the one that matters: without it a trackpad throw past
 * the end of the ring rubber-bands the page (or triggers pull-to-refresh)
 * mid-gesture. Nothing here scrolls — the wheel and the swipe ARE the carousel.
 */
export default function Stage() {
  useEffect(() => {
    const root = document.documentElement;
    const prev = {
      rootOverflow: root.style.overflow,
      bodyOverflow: document.body.style.overflow,
      overscroll: root.style.overscrollBehavior,
    };
    root.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    root.style.overscrollBehavior = "none";
    return () => {
      root.style.overflow = prev.rootOverflow;
      document.body.style.overflow = prev.bodyOverflow;
      root.style.overscrollBehavior = prev.overscroll;
    };
  }, []);

  return <Carousel />;
}

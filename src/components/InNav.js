"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import CustomEase from "gsap/CustomEase";
import { useSearchOptional } from "./SearchContext";
import SearchGlyph from "./SearchGlyph";
import { ISLAND_EASE, ISLAND_OPEN, ISLAND_CLOSE, ISLAND_BUTTON, MENU_LABEL, getSearchPanelWidth } from "../lib/islandMotion";
import CastingMenu from "./castingMenu/CastingMenu";
import "./InNav.css";

gsap.registerPlugin(CustomEase);
CustomEase.create("candor-island", ISLAND_EASE.join(","));
const ISLAND_CSS_EASE = `cubic-bezier(${ISLAND_EASE.join(",")})`;

const GLYPH_CLOSED = ["M3 8 L29 8", "M7 14 L25 14", "M11 20 L21 20"];
// The close X is drawn a size down from the menu lines (11 units, not 16) so
// it sits lighter in the dock.
const GLYPH_OPEN = ["M10.5 8.5 L21.5 19.5", "M7 14 L25 14", "M10.5 19.5 L21.5 8.5"];

export default function InNav({ searchOpen = false }) {
  const search = useSearchOptional();
  const setMenuOpen = search?.setMenuOpen;
  const setMenuLabelActive = search?.setMenuLabelActive;
  const [active, setActive] = useState(false);
  const id = useId();
  const pathname = usePathname();
  const triggerRef = useRef(null);
  const dialogRef = useRef(null);
  const panelRef = useRef(null);
  const paperRef = useRef(null);
  const contentRef = useRef(null);
  const seedRef = useRef(null);
  const dockRef = useRef(null);
  const dockIconRef = useRef(null);
  const dockLabelRef = useRef(null);
  const timelineRef = useRef(null);
  const geometryRef = useRef(null);
  const wantsOpen = useRef(false);
  const previousOverflow = useRef(null);
  const previousPath = useRef(pathname);

  const finishClose = useCallback(() => {
    wantsOpen.current = false;
    if (dialogRef.current?.open) dialogRef.current.close();
    if (previousOverflow.current !== null) {
      document.body.style.overflow = previousOverflow.current;
      previousOverflow.current = null;
    }
    setActive(false);
    setMenuOpen?.(false);
    setMenuLabelActive?.(false);
    if (triggerRef.current) {
      triggerRef.current.style.visibility = "";
      triggerRef.current.focus({ preventScroll: true });
    }
  }, [setMenuOpen, setMenuLabelActive]);

  const closeMenu = useCallback((instant = false) => {
    if (!dialogRef.current?.open) return;
    wantsOpen.current = false;
    contentRef.current.inert = true;
    seedRef.current.inert = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (instant || reduced || !timelineRef.current) {
      timelineRef.current?.pause(0, true);
      finishClose();
    } else {
      // Search exits with the same ease-out, not the entrance curve reversed.
      // Start at the current values so an interrupted entrance stays continuous.
      timelineRef.current.kill();
      const { collapsed } = geometryRef.current;
      const panelVisible = getComputedStyle(panelRef.current).visibility === "visible";
      const collapseEnd = panelVisible ? ISLAND_CLOSE.verticalDelay + ISLAND_CLOSE.vertical : 0;
      const returnAt = panelVisible ? ISLAND_BUTTON.exitDelay : 0;
      const timeline = gsap.timeline({ onComplete: finishClose });
      const [topLine, middleLine, bottomLine] = seedRef.current.querySelectorAll("[data-menu-line]");
      if (panelVisible) {
        timeline
          .to(panelRef.current, { left: collapsed.left, width: collapsed.width, duration: ISLAND_CLOSE.horizontal, ease: "candor-island" }, 0)
          .to(panelRef.current, { top: collapsed.top, height: collapsed.height, duration: ISLAND_CLOSE.vertical, ease: "candor-island" }, ISLAND_CLOSE.verticalDelay)
          .to(contentRef.current, { opacity: 0, duration: 0.15, ease: "none" }, 0)
          .to(paperRef.current, { opacity: 0, duration: ISLAND_CLOSE.vertical, ease: "candor-island" }, ISLAND_CLOSE.verticalDelay)
          .set(panelRef.current, { visibility: "hidden" }, collapseEnd);
      }
      timeline
        .to(topLine, { attr: { d: GLYPH_CLOSED[0] }, duration: 0.25, ease: "candor-island" }, 0)
        .to(bottomLine, { attr: { d: GLYPH_CLOSED[2] }, duration: 0.25, ease: "candor-island" }, 0)
        .to(middleLine, { opacity: 1, duration: 0.2, ease: "none" }, 0.08)
        .to(dockRef.current, { left: collapsed.left, width: collapsed.width, duration: ISLAND_CLOSE.horizontal, ease: "candor-island" }, 0)
        .call(() => setMenuLabelActive?.(false), null, returnAt)
        .to(dockIconRef.current, { x: 0, opacity: 1, duration: ISLAND_BUTTON.exit, ease: "candor-island" }, returnAt)
        .to(dockLabelRef.current, { x: 0, duration: ISLAND_BUTTON.exit, ease: "candor-island" }, returnAt);
      timelineRef.current = timeline;
    }
  }, [finishClose, setMenuLabelActive]);

  const buildTimeline = useCallback(({ fromCurrent = false } = {}) => {
    const trigger = triggerRef.current;
    const dialog = dialogRef.current;
    const panel = panelRef.current;
    const rect = trigger.getBoundingClientRect();
    const searchBar = trigger.closest("[data-bottombar]")?.querySelector('[aria-label="Open search"]');
    const barRect = searchBar?.getBoundingClientRect();
    const center = window.innerWidth / 2;
    const bottom = window.innerHeight - rect.bottom;

    dialog.style.setProperty("--nav-bottom", `${bottom}px`);
    dialog.style.setProperty("--nav-bar-height", `${rect.height}px`);
    const width = getSearchPanelWidth(window.innerWidth) * 0.9;
    contentRef.current.style.width = `${width}px`;
    const height = Math.min(contentRef.current.scrollHeight, Math.max(0, rect.top - 20));
    const target = { left: center - width / 2, top: rect.top - height, width, height };
    const collapsed = { left: barRect?.left ?? rect.left, top: rect.top, width: rect.right - (barRect?.left ?? rect.left), height: 0 };
    geometryRef.current = { collapsed };

    timelineRef.current?.kill();
    seedRef.current.inert = false;
    const [topLine, middleLine, bottomLine] = seedRef.current.querySelectorAll("[data-menu-line]");
    if (!fromCurrent) {
      gsap.set(topLine, { attr: { d: GLYPH_CLOSED[0] } });
      gsap.set(bottomLine, { attr: { d: GLYPH_CLOSED[2] } });
      gsap.set(middleLine, { opacity: 1 });
      gsap.set(dockRef.current, { ...collapsed, height: rect.height });
      gsap.set(dockIconRef.current, { x: 0, opacity: 1 });
      gsap.set(dockLabelRef.current, { x: 0 });
      gsap.set(panel, { ...collapsed, visibility: "hidden" });
      gsap.set(paperRef.current, { opacity: 0 });
      gsap.set(contentRef.current, { opacity: 0, scale: 0.9, transformOrigin: "50% 100%" });
    }

    const timeline = gsap.timeline({
      paused: true,
      onComplete: () => {
        if (!wantsOpen.current) return;
        contentRef.current.inert = false;
        contentRef.current.querySelector("[data-nav-first]")?.focus({ preventScroll: true });
      },
    });
    timeline
      .to(topLine, { attr: { d: GLYPH_OPEN[0] }, duration: 0.28, ease: "candor-island" }, 0.08)
      .to(bottomLine, { attr: { d: GLYPH_OPEN[2] }, duration: 0.28, ease: "candor-island" }, 0.08)
      .to(middleLine, { opacity: 0, duration: 0.14, ease: "none" }, 0.08)
      .to(dockRef.current, { left: target.left, width: target.width, duration: ISLAND_OPEN.horizontal, ease: "candor-island" }, 0)
      .to(dockIconRef.current, { x: -40, opacity: 0, duration: ISLAND_BUTTON.enter, ease: "candor-island" }, 0)
      .to(dockLabelRef.current, { x: -28, duration: ISLAND_BUTTON.enter, ease: "candor-island" }, 0)
      // Match Search's real bounds animation: horizontal movement and growth
      // begin together, with vertical growth overlapping after 100ms.
      .set(panel, { visibility: "visible" }, 0)
      .to(panel, { left: target.left, width: target.width, duration: ISLAND_OPEN.horizontal, ease: "candor-island" }, 0)
      .to(panel, { top: target.top, height: target.height, duration: ISLAND_OPEN.vertical, ease: "candor-island" }, ISLAND_OPEN.verticalDelay)
      .to(paperRef.current, { opacity: 1, duration: ISLAND_OPEN.vertical, ease: "candor-island" }, ISLAND_OPEN.verticalDelay)
      .to(contentRef.current, { opacity: 1, duration: 0.3, ease: "power1.out" }, ISLAND_OPEN.verticalDelay + 0.05)
      .to(contentRef.current, { scale: 1, duration: ISLAND_OPEN.vertical, ease: "candor-island" }, ISLAND_OPEN.verticalDelay);
    timelineRef.current = timeline;
    return timeline;
  }, []);

  const openMenu = useCallback((instant = false) => {
    if (searchOpen || search?.isSearchOpen) return;
    wantsOpen.current = true;
    setMenuLabelActive?.(true);
    if (dialogRef.current.open) {
      const timeline = buildTimeline({ fromCurrent: true });
      if (instant || window.matchMedia("(prefers-reduced-motion: reduce)").matches) timeline.progress(1);
      else timeline.play();
      return;
    }
    const dialog = dialogRef.current;
    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    dialog.focus({ preventScroll: true });
    contentRef.current.inert = true;
    contentRef.current.scrollTop = 0;
    const timeline = buildTimeline();
    triggerRef.current.style.visibility = "hidden";
    setActive(true);
    setMenuOpen?.(true);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (instant || reduced) timeline.progress(1);
    else timeline.play();
  }, [buildTimeline, searchOpen, search?.isSearchOpen, setMenuOpen, setMenuLabelActive]);

  useEffect(() => {
    if (searchOpen) closeMenu(true);
  }, [searchOpen, closeMenu]);

  useEffect(() => {
    if (previousPath.current !== pathname) closeMenu(true);
    previousPath.current = pathname;
  }, [pathname, closeMenu]);

  useEffect(() => {
    const resize = () => {
      if (!dialogRef.current?.open) return;
      if (!wantsOpen.current) return closeMenu(true);
      buildTimeline().progress(1);
    };
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    window.addEventListener("resize", resize);
    motion.addEventListener("change", resize);
    return () => {
      window.removeEventListener("resize", resize);
      motion.removeEventListener("change", resize);
      timelineRef.current?.kill();
      if (previousOverflow.current !== null) {
        document.body.style.overflow = previousOverflow.current;
        previousOverflow.current = null;
      }
      setMenuOpen?.(false);
      setMenuLabelActive?.(false);
    };
  }, [buildTimeline, closeMenu, setMenuOpen, setMenuLabelActive]);

  return (
    <div className="island-nav">
      <button ref={triggerRef} type="button" className="island-nav-trigger"
        aria-label="Open navigation" aria-haspopup="dialog" aria-controls={id} aria-expanded={active}
        disabled={searchOpen}
        onClick={(event) => openMenu(event.detail === 0)}
        style={{
          transform: searchOpen ? "translateX(-64px)" : "translateX(0px)",
          transition: searchOpen
            ? `transform ${ISLAND_BUTTON.enter}s ${ISLAND_CSS_EASE}`
            : `transform ${ISLAND_BUTTON.exit}s ${ISLAND_CSS_EASE} ${ISLAND_BUTTON.exitDelay}s`,
        }}>
        <MenuGlyph />
      </button>
      <dialog ref={dialogRef} id={id} className="island-nav-dialog" aria-label="Candor navigation" tabIndex={-1}
        data-lenis-prevent
        onCancel={(event) => { event.preventDefault(); closeMenu(true); }}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const content = contentRef.current;
          if (content.inert) { event.preventDefault(); return; }
          const dialog = dialogRef.current;
          const controls = dialog.querySelectorAll("a[href], button:not([disabled])");
          const first = controls[0];
          const last = controls[controls.length - 1];
          const focused = document.activeElement;
          if (event.shiftKey && (focused === first || !dialog.contains(focused))) {
            event.preventDefault(); last?.focus();
          } else if (!event.shiftKey && (focused === last || !dialog.contains(focused))) {
            event.preventDefault(); first?.focus();
          }
        }}
        onPointerDown={(event) => { if (event.target === event.currentTarget) closeMenu(); }}>
        <div ref={dockRef} className="island-nav-dock">
          <span ref={dockIconRef} className="island-nav-dock-icon" aria-hidden="true"><SearchGlyph /></span>
          {/* Open, the bar's label is the way home — the one page the
              menu's index doesn't list. */}
          <Link ref={dockLabelRef} href="/" className="island-nav-dock-label" data-menu-active={search?.menuLabelActive ?? active}
            onClick={() => closeMenu(true)}>{search?.searchLabel ?? MENU_LABEL}</Link>
          <button ref={seedRef} type="button" className="island-nav-seed" aria-label="Close navigation"
            aria-expanded={active}
            onClick={(event) => wantsOpen.current ? closeMenu(event.detail === 0) : openMenu(event.detail === 0)}><MenuGlyph /></button>
        </div>
        <div ref={panelRef} className="island-nav-panel">
          <div ref={paperRef} className="island-nav-paper" aria-hidden="true" />
          <div ref={contentRef} className="island-nav-content">
            <CastingMenu pathname={pathname} open={active} onNavigate={() => closeMenu(true)} />
          </div>
        </div>
      </dialog>
    </div>
  );
}

function MenuGlyph() {
  return <svg width="32" height="28" viewBox="0 0 32 28" fill="none" aria-hidden="true">
    {GLYPH_CLOSED.map((d, index) => <path key={index} data-menu-line d={d} stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />)}
  </svg>;
}

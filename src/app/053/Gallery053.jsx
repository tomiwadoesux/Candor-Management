"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useProximityRail from "./useProximityRail";
import useSphereView from "./useSphereView";
import ModelPreview from "./ModelPreview";
import { thumbnailReveal } from "./railReveal";
import styles from "./gallery.module.css";

const COUNT = 53;
const THEME_KEY = "candor:053:theme";
// A separate composition for Candor: staggered groups, with each band shifted
// independently. The spacing reserves room for both landscape cards and names.
function arrange(patterns, columns, rowHeight, top, stagger) {
  const positions = [];
  for (let row = 0; positions.length < COUNT; row += 1) {
    const cycle = Math.floor(row / patterns.length);
    const lanes = patterns[row % patterns.length]
      .map((lane) => (lane + cycle * 2) % columns)
      .sort((a, b) => a - b);
    lanes.forEach((lane) => {
      if (positions.length >= COUNT) return;
      const index = positions.length;
      positions.push({
        x: (lane + 0.5) / columns * 100 + Math.sin(index * 2.4) * 0.65,
        y: top + row * rowHeight + (index * 7 % 5) / 4 * stagger,
      });
    });
  }
  return positions;
}
const desktopPositions = arrange([[0, 4], [1, 3, 6], [0, 5], [2, 6], [0, 3, 5], [1, 4], [2, 4, 6]], 7, 20.5, 5, 2);
const mobilePositions = arrange([[0, 2], [1], [0, 2], [2], [0, 1]], 3, 22, 9, 3);
const ratios = [0.8, 0.75, 1.48, 0.8, 0.9, 0.74, 1.4, 0.8, 1, 0.82, 0.8, 1.25];
const colors = [
  "#a6a297", "#7f8a8e", "#9a8a98", "#a2927d", "#78869a", "#af9690",
  "#628188", "#aa9e90", "#9c9386", "#718480", "#916e75", "#a7978b",
  "#929b85", "#bab2a4", "#887a70", "#a6aab0", "#84788a", "#b2a887",
  "#869794", "#a37e71", "#8f979d", "#a697a0", "#9f9e87", "#6e7d7a",
  "#b3a198", "#8b8d9e", "#a5a18d", "#8a726e", "#879180", "#b5a6a1",
  "#7f8c9a", "#a58e7c", "#929382", "#a29baf", "#758987", "#b19d8a",
  "#9d8688", "#8b968f", "#a7a9a0", "#7a7d8b", "#aaa18e", "#9a8076",
  "#829399", "#b0a4ae", "#8c937c", "#a18e86", "#748380", "#b3ac98",
  "#9b919b", "#8997a3", "#a7a18f", "#927b80", "#a9ada1",
];
const studies = Array.from({ length: COUNT }, (_, index) => {
  return {
    number: String(index + 1).padStart(3, "0"),
    color: colors[index],
    ratio: ratios[index % ratios.length],
    desktopX: desktopPositions[index].x,
    desktopY: desktopPositions[index].y,
    mobileX: mobilePositions[index].x,
    mobileY: mobilePositions[index].y,
  };
});

export default function Gallery053({ roster, photos }) {
  const [theme, setTheme] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(null);
  const scrollRef = useRef(null);
  const itemRefs = useRef([]);
  const positionsRef = useRef([]);
  const boundsRef = useRef([]);
  const railRef = useRef(null);
  const railImageRefs = useRef([]);
  const railGestureRef = useRef(null);
  const previewRef = useRef(null);
  const switchingViewRef = useRef(false);
  const { centersRef: railCentersRef, revealRef: railRevealRef } = useProximityRail(railRef, previewRef);
  const reduceRef = useRef(false);
  const previewStudy = studies[previewIndex ?? 0];
  const personAt = (index) => roster[index % roster.length];
  const nameAt = (index) => personAt(index).name;

  const paintRail = useCallback((top, height) => {
    const bounds = boundsRef.current;
    if (!bounds.length) return;
    const feather = (bounds.at(-1).bottom - bounds[0].top) / bounds.length * 7;
    const profile = bounds.map((bounds, index) => {
      const image = railImageRefs.current[index];
      const { gray, curve } = thumbnailReveal(bounds, top, height, feather);
      if (image) {
        // The shared oval provides one continuous fade across photo edges.
        if (image.style.opacity !== "1") image.style.opacity = "1";
        if (image.style.maskImage) image.style.maskImage = "";
        if (image.style.getPropertyValue("--desaturation") !== gray) image.style.setProperty("--desaturation", gray);
      }
      return curve;
    });
    railRevealRef.current(profile);
  }, [railRevealRef]);

  const jumpTo = useCallback((index, smooth = false, viewportY = 0.5) => {
    const target = Math.max(0, Math.min(COUNT - 1, index));
    const scroller = scrollRef.current;
    setActiveIndex(target);
    scroller.scrollTo({
      top: positionsRef.current[target] - scroller.clientHeight * viewportY,
      behavior: smooth && !reduceRef.current ? "smooth" : "instant",
    });
  }, []);

  const { view, viewRef, movingRef, apiRef: sphereRef } = useSphereView({
    scrollRef, itemRefs, previewRef, reduceRef, onReturn: jumpTo, onSelect: setActiveIndex,
    onGridFrame: paintRail,
  });

  useEffect(() => {
    const preference = window.matchMedia("(prefers-color-scheme: dark)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let saved;
    try { saved = localStorage.getItem(THEME_KEY); } catch {}
    const hasSaved = saved === "light" || saved === "dark";
    setTheme(hasSaved ? saved : preference.matches ? "dark" : "light");
    reduceRef.current = motion.matches;
    const onMotion = () => { reduceRef.current = motion.matches; };
    const onPreference = () => {
      let chosen;
      try { chosen = localStorage.getItem(THEME_KEY); } catch {}
      if (chosen !== "light" && chosen !== "dark") setTheme(preference.matches ? "dark" : "light");
    };
    preference.addEventListener("change", onPreference);
    motion.addEventListener("change", onMotion);
    return () => {
      preference.removeEventListener("change", onPreference);
      motion.removeEventListener("change", onMotion);
    };
  }, []);

  useEffect(() => {
    if (!theme) return;
    const tags = [...document.querySelectorAll('meta[name="theme-color"]')];
    const previous = tags.map((tag) => tag.content);
    tags.forEach((tag) => { tag.content = theme === "dark" ? "#0c0c0c" : "#fafafa"; });
    return () => tags.forEach((tag, index) => { tag.content = previous[index]; });
  }, [theme]);

  useEffect(() => {
    const scroller = scrollRef.current;
    let frame = 0;
    const update = () => {
      frame = 0;
      const center = scroller.scrollTop + scroller.clientHeight / 2;
      if (viewRef.current === "sphere" || movingRef.current) return;
      let nearest = 0;
      let distance = Infinity;
      positionsRef.current.forEach((position, index) => {
        const next = Math.abs(position - center);
        if (next < distance) { distance = next; nearest = index; }
      });
      // At either boundary the index must still be able to reach 001 / 053.
      if (scroller.scrollTop < 1) nearest = 0;
      if (scroller.scrollTop >= scroller.scrollHeight - scroller.clientHeight - 1) nearest = COUNT - 1;
      setActiveIndex((current) => {
        // Several frames share a row. Keep the explicitly selected one when
        // their distances tie, so scrubbing and arrow keys don't skip siblings.
        const currentDistance = Math.abs(positionsRef.current[current] - center);
        return currentDistance === distance && scroller.scrollTop > 0
          && scroller.scrollTop < scroller.scrollHeight - scroller.clientHeight - 1
          ? current : nearest;
      });
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    const measure = () => {
      positionsRef.current = itemRefs.current.map((item) => item.offsetTop + item.offsetHeight / 2);
      boundsRef.current = itemRefs.current.map((item) => ({ top: item.offsetTop, bottom: item.offsetTop + item.offsetHeight }));
      paintRail(scroller.scrollTop, scroller.clientHeight);
      update();
    };
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    measure();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      scroller.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [viewRef, movingRef, paintRail]);

  const changeView = (next, event, anchor = null) => {
    const dialog = previewRef.current;
    const index = dialog.open ? previewIndex : anchor?.index ?? activeIndex;
    setActiveIndex(index);
    const sourceRect = dialog.open ? dialog.querySelector("[data-portrait]").getBoundingClientRect() : null;
    if (next === "grid") {
      // A short, overlapping shuffle, refreshed on each return. Separate
      // translate/opacity transitions leave the proximity spring untouched.
      for (const item of railRef.current.children) {
        item.style.setProperty("--return-delay", `${Math.round(Math.random() * 110)}ms`);
        item.style.setProperty("--return-duration", `${220 + Math.round(Math.random() * 80)}ms`);
        item.style.setProperty("--return-offset", `${4 + Math.round(Math.random() * 8)}px`);
      }
    }
    if (dialog.open) {
      switchingViewRef.current = true;
      dialog.dataset.instant = "true";
      dialog.close();
    }
    sphereRef.current.change?.(next, index, { instant: event.detail === 0, sourceRect, viewportY: anchor?.viewportY });
    if (next === "grid" && event.detail === 0) {
      itemRefs.current[index]?.querySelector("button").focus({ preventScroll: true });
    } else {
      scrollRef.current.focus({ preventScroll: true });
    }
  };

  const toggleBackground = (event) => {
    if (event.defaultPrevented || event.target.closest("button, a, h4, dialog, [role='slider']")) return;
    const anchor = event.detail === 0 ? null : sphereRef.current.nearestAt?.(event.clientX, event.clientY);
    changeView(viewRef.current === "sphere" ? "grid" : "sphere", event, anchor);
  };

  const beginScrub = (event) => {
    if (event.button !== 0 || movingRef.current) return;
    const centers = railCentersRef.current;
    if (centers.length < 2) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus({ preventScroll: true });
    const top = sphereRef.current.beginScrub();
    const height = scrollRef.current.clientHeight;
    const limit = scrollRef.current.scrollHeight - height;
    const visible = boundsRef.current.flatMap((bounds, index) => bounds.bottom > top && bounds.top < top + height ? [index] : []);
    const first = visible[0] ?? 0, last = visible.at(-1) ?? first;
    const step = (centers.at(-1) - centers[0]) / (COUNT - 1);
    const inside = event.clientY >= centers[first] - step / 2 && event.clientY <= centers[last] + step / 2;
    const target = inside ? top : Math.max(0, Math.min(limit, (event.clientY - centers[0]) / (centers.at(-1) - centers[0]) * limit));
    // Preserve the grab offset within the revealed section. Freeze the mapping
    // for this gesture so the hover magnification cannot push the target around.
    const travel = Math.max(step, centers.at(-1) - centers[0] - (centers[last] - centers[first]));
    railGestureRef.current = { id: event.pointerId, y: event.clientY, top: target, gain: limit / travel };
    sphereRef.current.scrubTo(target);
  };

  const scrub = (event) => {
    const gesture = railGestureRef.current;
    if (gesture?.id !== event.pointerId) return;
    sphereRef.current.scrubTo(gesture.top + (event.clientY - gesture.y) * gesture.gain);
  };

  const endScrub = (event) => {
    if (railGestureRef.current?.id !== event.pointerId) return;
    railGestureRef.current = null;
    sphereRef.current.endScrub();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const navigateRail = (event) => {
    const destinations = {
      ArrowDown: activeIndex + 1, ArrowRight: activeIndex + 1,
      ArrowUp: activeIndex - 1, ArrowLeft: activeIndex - 1,
      PageDown: activeIndex + 7, PageUp: activeIndex - 7,
      Home: 0, End: COUNT - 1,
    };
    if (event.key in destinations) {
      event.preventDefault();
      jumpTo(destinations[event.key]);
    }
  };

  const chooseTheme = (next) => {
    setTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch {}
  };

  const openPreview = (index, event) => {
    previewRef.current.dataset.instant = String(event.detail === 0 || reduceRef.current);
    setPreviewIndex(index);
    setActiveIndex(index);
    previewRef.current.showModal();
  };

  const stepPreview = (direction) => {
    const next = ((previewIndex ?? 0) + direction + COUNT) % COUNT;
    setPreviewIndex(next);
    if (viewRef.current === "grid") jumpTo(next);
    else setActiveIndex(next);
  };

  return (
    <main
      className={styles.page}
      data-theme={theme || undefined}
      data-view={view}
      onClick={toggleBackground}
    >
      <h1 className={styles.srOnly}>Candor — Models, talents and creatives</h1>
      <p id="gallery-view-help" className={styles.srOnly}>
        Click near a photograph to switch between grid and sphere while keeping that photograph in view. Drag the sphere or use the arrow keys to rotate. The grid scrolls in your last direction and reverses at either end. Space pauses or resumes automatic movement when the gallery is focused. Escape returns to the selected card in the grid.
      </p>
      <span className={styles.srOnly} role="status">{view === "sphere" ? "Sphere view" : "Grid view"}</span>

      <div
        className={styles.scroller} ref={scrollRef} data-lenis-prevent
        tabIndex={0}
        aria-label={view === "sphere" ? "Interactive sphere" : "Gallery grid"}
        aria-describedby="gallery-view-help"
        onPointerDown={(event) => sphereRef.current.pointerDown?.(event)}
        onPointerMove={(event) => sphereRef.current.pointerMove?.(event)}
        onPointerUp={(event) => sphereRef.current.pointerUp?.(event)}
        onPointerCancel={(event) => sphereRef.current.pointerCancel?.(event)}
        onClickCapture={(event) => {
          if (sphereRef.current.consumeDrag?.(event)) { event.preventDefault(); event.stopPropagation(); }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && viewRef.current === "sphere") {
            event.preventDefault();
            changeView("grid", { detail: 0 });
          } else sphereRef.current.keyDown?.(event);
        }}
      >
        <ol className={styles.field} aria-label="53 model, talent and creative images">
          {studies.map((study, index) => (
            <li
              key={study.number}
              ref={(node) => { itemRefs.current[index] = node; }}
              className={styles.tile}
              style={{
                "--desktop-x": `${study.desktopX}%`, "--desktop-y": `${study.desktopY}svh`,
                "--mobile-x": `${study.mobileX}%`, "--mobile-y": `${study.mobileY}svh`,
                "--ratio": study.ratio, "--swatch": study.color,
                "--photo": `url("${photos[index].thumbnail}")`,
              }}
            >
              <button className={styles.study} aria-label={`Preview ${nameAt(index)}, ${study.number}`} onClick={(event) => openPreview(index, event)}>
                <span className={styles.color}>
                  <span data-sharp className={styles.sharpColor} />
                  <span data-soft className={styles.softColor} aria-hidden="true" />
                </span>
              </button>
              <h4 className={styles.name}>
                <button tabIndex={-1} onClick={(event) => openPreview(index, event)}>{nameAt(index)}</button>
              </h4>
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.themes} role="group" aria-label="Color theme">
        <button aria-pressed={theme === "light"} onClick={() => chooseTheme("light")}>LIGHT</button>
        <span aria-hidden="true">/</span>
        <button aria-pressed={theme === "dark"} onClick={() => chooseTheme("dark")}>DARK</button>
      </div>
      <span className={styles.counter} aria-hidden="true">{studies[activeIndex].number} <span>/</span> 053</span>

      <div
        ref={railRef}
        className={styles.rail}
        aria-hidden={view === "sphere"}
        inert={view === "sphere"}
        role="slider"
        tabIndex={0}
        aria-label="Browse models, talents and creatives"
        aria-orientation="vertical"
        aria-valuemin={1}
        aria-valuemax={COUNT}
        aria-valuenow={activeIndex + 1}
        aria-valuetext={`${nameAt(activeIndex)}, ${studies[activeIndex].number} of 053`}
        onKeyDown={navigateRail}
        onPointerDown={beginScrub}
        onPointerMove={scrub}
        onPointerUp={endScrub}
        onPointerCancel={endScrub}
        onLostPointerCapture={endScrub}
      >
        {studies.map((study, index) => (
          <span
            key={study.number}
            className={styles.miniature}
            data-active={index === activeIndex}
            aria-hidden="true"
            style={{
              "--swatch": study.color,
              "--photo": `url("${photos[index].thumbnail}")`,
              "--ratio": study.ratio,
            }}
          >
            <span ref={(node) => { railImageRefs.current[index] = node; }} className={styles.miniatureImage} />
          </span>
        ))}
      </div>

      <ModelPreview
        dialogRef={previewRef}
        person={personAt(previewIndex ?? 0)}
        study={previewStudy}
        photo={previewIndex === null ? null : photos[previewIndex]}
        onStep={stepPreview}
        view={view}
        onViewChange={changeView}
        onBackground={(event) => changeView(viewRef.current === "sphere" ? "grid" : "sphere", event)}
        onClose={() => {
          if (switchingViewRef.current) { switchingViewRef.current = false; return; }
          itemRefs.current[previewIndex ?? 0]?.querySelector("button").focus({ preventScroll: true });
        }}
      />
    </main>
  );
}

"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import StudyViewer from "../references/StudyViewer";
import { useStudyScroll } from "../references/useStudyScroll";
import { getGettyFrame, mix } from "../references/getty-motion";
import { RUNWAY_VH, sceneProgress } from "./scene";
import { featuredSize, fieldPosition, photoNumber, swapArtwork } from "./gallery";
import useArtworkSwap from "./useArtworkSwap";
import Photography2Grid from "./Photography2Grid";

export default function Photography2Page({ cards, painting }) {
  const root = useRef(null);
  const centerImage = useRef(null);
  const cardImages = useRef([]);
  const fieldProgress = useRef(null);
  const scrollPositions = useRef({ field: 0, grid: 0 });
  const restoreScroll = useRef(null);
  const focusFeatured = useRef(false);
  const animateGridEntry = useRef(false);
  const [reduced, setReduced] = useState(false);
  const [gridMode, setGridMode] = useState(false);
  const [selection, setSelection] = useState(null);
  // Use the original collection in both views; floating depth copies and
  // card exchanges must not duplicate or reorder the viewer's photographs.
  const collection = useMemo(() => [...cards, painting], [cards, painting]);
  const backgroundCount = Math.ceil(cards.length / 3);
  const [gallery, setGallery] = useState(() => {
    const distant = cards.filter((_, index) => index % 3 === 0);
    const halfway = Math.floor(distant.length / 2);
    // Offset the distant selection so the same photo does not arrive in
    // both layers together as they travel in opposite directions.
    return {
      featured: painting,
      cards: [...cards, ...distant.slice(halfway), ...distant.slice(0, halfway)],
      selected: false,
    };
  });
  const { prepare, play, cancel } = useArtworkSwap();

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { cancel(); fieldProgress.current = null; setReduced(media.matches); };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [cancel]);

  const draw = useCallback(({ root: node, progress, width, height, reduced: reduce }) => {
    if (reduce || gridMode) return;
    const paintingNode = node.querySelector("[data-featured-painting]");
    if (!paintingNode) return;
    const enter = gallery.selected ? 1 : getGettyFrame(sceneProgress(progress)).enter;
    const size = featuredSize(gallery.featured, width, height);
    const rise = mix(height, -height * 0.04, enter);
    if (paintingNode.style.width !== `${size.width}px` || paintingNode.style.height !== `${size.height}px`) {
      paintingNode.style.width = `${size.width}px`;
      paintingNode.style.height = `${size.height}px`;
    }
    paintingNode.style.transform = `translate(-50%, -50%) translateY(${rise}px)`;
    paintingNode.style.visibility = enter > 0 ? "visible" : "hidden";
    paintingNode.inert = enter < 0.1;
    const caption = node.querySelector("[data-featured-caption]");
    caption.style.width = `${size.width}px`;
    caption.style.transform = `translateX(-50%) translateY(${rise + size.height / 2 + 12}px)`;
    caption.style.opacity = String(enter);

    fieldProgress.current ??= progress;
    fieldProgress.current += (progress - fieldProgress.current) * 0.3;
    node.querySelectorAll("[data-floating-card]").forEach((card, index) => {
      const position = fieldPosition(index, fieldProgress.current, width, height, cards.length, backgroundCount);
      const visible = position.y + position.size / 2 + 28 > 0 && position.y - position.size / 2 < height;
      card.style.visibility = visible ? "visible" : "hidden";
      card.setAttribute("aria-hidden", String(!visible));
      card.inert = !visible;
      if (!visible) return;
      card.style.transform = `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%) scale(${position.size / 200})`;
      const numeralSize = `${12 * 200 / position.size}px`;
      if (card.style.getPropertyValue("--numeral-size") !== numeralSize) card.style.setProperty("--numeral-size", numeralSize);
    });
    return Math.abs(progress - fieldProgress.current) > 0.000005;
  }, [gallery.featured, gallery.selected, cards.length, backgroundCount, gridMode]);

  useStudyScroll(root, draw, `${reduced}:${gridMode}`);

  // Lay out the exchanged artwork before the floating copies start. The
  // animation hands over to the same image at the exact final bounds.
  useLayoutEffect(() => {
    if (!root.current) return;
    if (restoreScroll.current !== null) {
      window.scrollTo({ top: restoreScroll.current, behavior: "instant" });
      restoreScroll.current = null;
      fieldProgress.current = null;
    }
    if (!reduced && !gridMode) {
      const rect = root.current.getBoundingClientRect();
      draw({ root: root.current, progress: Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height - window.innerHeight))), width: window.innerWidth, height: window.innerHeight, reduced: false });
      play();
    }
    if (focusFeatured.current && !gridMode) {
      root.current.querySelector("[data-featured-control]")?.focus({ preventScroll: true });
      focusFeatured.current = false;
    }
  }, [gallery, reduced, gridMode, draw, play]);

  function changeLayout(next, event) {
    if (next) animateGridEntry.current = !reduced && event?.detail !== 0;
    cancel();
    scrollPositions.current[gridMode ? "grid" : "field"] = window.scrollY;
    restoreScroll.current = scrollPositions.current[next ? "grid" : "field"];
    setGridMode(next);
  }

  function selectGridArtwork(art) {
    const index = gallery.cards.findIndex((item) => item.src === art.src);
    const next = swapArtwork(gallery, index);
    setGallery({ ...next, selected: true });
    changeLayout(false);
    // The selected image is the destination when leaving the grid. Keyboard
    // focus follows it without changing the restored scroll position.
    focusFeatured.current = true;
  }

  function selectCard(index, event) {
    const next = swapArtwork(gallery, index);
    if (next === gallery) return;
    window.scrollTo({ top: window.scrollY, behavior: "instant" });
    if (!reduced && event.detail !== 0) {
      const card = cardImages.current[index];
      prepare(centerImage.current, card, index);
    }
    else cancel();
    fieldProgress.current = null;
    setGallery(next);
  }

  const openPainting = () => setSelection({
    title: gallery.featured.title,
    images: collection,
    index: Math.max(0, collection.findIndex((photo) => photo.src === gallery.featured.src)),
    numberDigits: 2,
  });
  const unique = new Set();
  const staticCards = gallery.cards.flatMap((art, index) => {
    if (unique.has(art.src)) return [];
    unique.add(art.src);
    return [{ art, index }];
  });

  return (
    <main ref={root} className={`photography-two${reduced ? " photography-two--reduced" : ""}${gridMode ? " photography-two--grid" : ""}`}
      aria-label="Photography 2" style={{ "--field-runway": `${RUNWAY_VH}svh` }}>
      <div className="photography-two-layout" role="group" aria-label="Image layout">
        <button type="button" onClick={(event) => { if (!gridMode) changeLayout(true, event); }} aria-pressed={gridMode}>Grid</button>
        <button type="button" onClick={() => { if (gridMode) changeLayout(false); }} aria-pressed={!gridMode}>Align</button>
      </div>
      {gridMode ? <Photography2Grid artworks={collection} onSelect={selectGridArtwork} animate={animateGridEntry.current} /> : reduced ? <div className="photography-two-static">
        <figure className="photography-two-static-featured"><button type="button" data-featured-control onClick={openPainting} aria-label={`View ${gallery.featured.title}`}><img src={gallery.featured.src} alt={gallery.featured.title} width={gallery.featured.width} height={gallery.featured.height} /></button><figcaption aria-live="polite">{gallery.featured.title}</figcaption></figure>
        {staticCards.map(({ art, index }) => <figure key={index}>
          <button type="button" onClick={(event) => selectCard(index, event)} aria-label={`Show ${art.title} in center`}><img src={art.src} width={art.width} height={art.height} alt="" loading="lazy" /></button>
          <figcaption className="photography-two-numeral">{photoNumber(index + 1)}</figcaption>
        </figure>)}
      </div> : <div className="photography-two-stage">
        <div className="photography-two-field">
          {gallery.cards.map((art, index) => {
            const scale = 200 / Math.max(art.width, art.height);
            return <div key={index} className="photography-two-card" data-floating-card data-layer={index < cards.length ? 0 : 1} aria-hidden="true">
              <figure className="photography-two-art" style={{ width: `${art.width * scale}px`, height: `${art.height * scale}px` }}>
                <button type="button" onClick={(event) => selectCard(index, event)} aria-label={`Show ${art.title} in center`}>
                  <img ref={(node) => { cardImages.current[index] = node; }} src={art.src} width={art.width} height={art.height} alt="" loading="eager" draggable="false" />
                </button>
                <figcaption>{photoNumber(index + 1)}</figcaption>
              </figure>
            </div>;
          })}
        </div>
        <button type="button" className="photography-two-painting" data-featured-control data-featured-painting onClick={openPainting} aria-label={`View ${gallery.featured.title}`}>
          <img ref={centerImage} src={gallery.featured.src} alt={gallery.featured.title} width={gallery.featured.width} height={gallery.featured.height} />
        </button>
        <p className="photography-two-caption" data-featured-caption aria-live="polite">{gallery.featured.title}</p>
      </div>}
      {selection && <StudyViewer selection={selection} onClose={() => setSelection(null)} />}
    </main>
  );
}

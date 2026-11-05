"use client";

import { useEffect, useRef, useState } from "react";
import referenceData from "./reference-data.json";
import { useStudyScroll, jumpTo } from "./useStudyScroll";
import { GETTY_YEARS, GETTY_CARD_COUNT, SCENE_LENGTH, getGettyFrame, getCardPosition, range, mix, clamp } from "./getty-motion";

const { getty } = referenceData;
const DESCRIPTIONS = [
  "In 1669, Willem Kalf painted this still life in Amsterdam.",
  "Its Chinese porcelain reflects the city’s international trade.",
  "Glass, textiles and precious objects signal the tastes of the time.",
  "Two centuries pass with little surviving evidence of its whereabouts.",
  "A Paris auction records its sale in 1864. The buyer is unknown.",
  "The painting appears in an Amsterdam exhibition in 1936.",
  "A label identifies the lender as art dealer Dr. H. Burg.",
  "Between 1936 and 1944, a couple brought it from Cologne to New York.",
  "Researchers continue to investigate the work’s journey.",
  "Wartime movements can leave gaps in a painting’s history.",
  "Provenance research helps trace those missing connections.",
  "In 1944, the dealership Knoedler & Co. acquired the painting.",
];
const ZOOM_COPY = [
  'The following year, Knoedler & Co. sold it to "Mrs. James W. Fesler," who donated it to the Indianapolis Museum of Art at Newfields the same year.',
  "Her name was Caroline Marmon Fesler. The records preserve another part of the painting’s story.",
  "Following these connections reveals the people behind an artwork’s journey.",
];
const CARDS = Array.from({ length: GETTY_CARD_COUNT }, (_, i) => ({ ...getty.cards[i % getty.cards.length], key: i }));

export default function GettyStudy({ onOpen }) {
  const root = useRef(null);
  const [reduced, setReduced] = useState(false);
  const [scene, setScene] = useState({ year: 0, text: 0, zoomText: 0, dark: false });
  const [chapters, setChapters] = useState(false);
  const [ledgerFull, setLedgerFull] = useState(false);
  const lastYear = useRef(0);
  const fieldProgress = useRef(null);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const close = (event) => {
      if (event.key === "Escape") { setLedgerFull(false); setChapters(false); }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  useStudyScroll(root, ({ root: node, progress, width, height, reduced: reduce }) => {
    const stage = node.querySelector(".getty-stage");
    if (!stage || reduce) return;
    const frame = getGettyFrame(progress);
    const { time, timeline, zoom, zoomScroll } = frame;
    const mobile = width <= 700;
    const painting = node.querySelector("[data-getty-painting]");
    const picture = painting.querySelector("img");
    const aspect = 1009 / 1200;
    const fullWidth = Math.max(width, height * 1.3 * aspect);
    const fullHeight = fullWidth / aspect;
    const smallHeight = height * (mobile ? 0.34 : 0.5);
    const restingScale = smallHeight / fullHeight;
    const size = mix(restingScale, 1, zoom);
    const rise = mix(height, -height * 0.16, frame.enter);
    const pan = mix((fullHeight - height) / 2, -(fullHeight - height) / 2, zoomScroll);
    const y = mix(rise, pan, zoom) - frame.exit * height;
    // Dimensions change only on resize; all scroll work is transform/opacity.
    if (painting.style.width !== `${fullWidth}px`) {
      painting.style.width = `${fullWidth}px`;
      painting.style.height = `${fullHeight}px`;
    }
    painting.style.transform = `translate(-50%, -50%) translateY(${y}px) scale(${size})`;
    picture.style.transform = `scale(${mix(1.2, 1, zoom)})`;
    painting.style.visibility = time > 0.9 && frame.exit < 1 ? "visible" : "hidden";
    const credit = node.querySelector("[data-getty-credit]");
    credit.style.opacity = String(frame.enter * (1 - range(zoom, 0, 0.15)) * (1 - frame.exit));
    credit.inert = zoom > 0.15 || frame.enter < 0.1;
    const intro = node.querySelector("[data-getty-intro]");
    intro.style.opacity = String(frame.intro);
    intro.style.transform = `translateY(${-height * 0.75 * (1 - frame.intro)}px)`;
    intro.inert = frame.intro < 0.05;
    const collage = node.querySelector("[data-getty-collage]");
    collage.style.opacity = String(1 - zoom);
    collage.inert = zoom > 0.1;
    fieldProgress.current ??= progress;
    fieldProgress.current += (progress - fieldProgress.current) * 0.3;
    node.querySelectorAll("[data-getty-card]").forEach((card, i) => {
      const pos = getCardPosition(i, fieldProgress.current, width, height);
      const x = width / 2 + pos.x;
      const visible = pos.active && pos.y > -height * 0.5 && pos.y < height * 1.4;
      card.style.visibility = visible ? "visible" : "hidden";
      if (!visible) return;
      card.style.transform = `translate3d(${x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${pos.size / 200})`;
      card.style.opacity = String(pos.layer ? 0.055 : pos.central ? mix(1, 0.5, frame.dim) : 1);
    });
    const textIndex = Math.min(DESCRIPTIONS.length - 1, Math.floor(timeline * DESCRIPTIONS.length));
    const textProgress = (timeline * DESCRIPTIONS.length) % 1;
    const description = node.querySelector("[data-getty-description]");
    description.style.opacity = String(frame.timelineOpacity * range(textProgress, 0, 0.12) * (1 - range(textProgress, 0.88, 1)));
    description.inert = frame.timelineOpacity < 0.1;
    const rail = node.querySelector("[data-getty-rail]");
    rail.style.opacity = String(frame.timelineOpacity);
    rail.inert = frame.timelineOpacity < 0.1;
    rail.querySelector("input").value = String(Math.round(timeline * 1000));
    node.querySelector("[data-getty-progress]").style.transform = `scaleX(${mix(0.05, 0.95, timeline)})`;
    const marker = node.querySelector("[data-getty-year]");
    marker.style.transform = `translateX(${mix(0.05, 0.95, timeline) * 100}%)`;
    marker.dataset.direction = frame.yearIndex >= lastYear.current ? "forward" : "backward";
    lastYear.current = frame.yearIndex;
    const shade = node.querySelector("[data-getty-shade]");
    shade.style.opacity = String(zoom * 0.3);
    const zoomText = Math.min(ZOOM_COPY.length - 1, Math.floor(range(time, 13.1, 17.8) * ZOOM_COPY.length));
    const copy = node.querySelector("[data-getty-zoom-copy]");
    copy.style.opacity = String(range(time, 12.8, 13.1) * (1 - range(time, 17.8, 18.2)));
    copy.inert = time < 12.8 || time > 18.2;
    const copyProgress = range(time, 13.1 + zoomText * 1.566, 14.666 + zoomText * 1.566);
    copy.style.transform = `translateY(${mix(12, -20, copyProgress)}vh)`;
    const ledger = node.querySelector("[data-getty-ledger]");
    ledger.style.opacity = String(frame.ledger);
    ledger.style.visibility = frame.ledger > 0 ? "visible" : "hidden";
    ledger.inert = frame.ledger < 0.5;
    const spot = node.querySelector("[data-getty-spot]");
    const focus = range(time, 12.7, 13.9);
    spot.style.clipPath = `inset(${mix(35, 45, focus)}% 0 ${mix(35, 45, focus)}% 0)`;
    node.querySelector("[data-getty-outro]").style.opacity = String(frame.exit);
    node.querySelector("[data-getty-outro]").inert = frame.exit < 0.5;
    node.querySelector("[data-getty-section-progress]").style.transform = `scaleY(${clamp(progress)})`;
    setScene((previous) => previous.year === frame.yearIndex && previous.text === textIndex && previous.zoomText === zoomText && previous.dark === (zoom > 0.5) ? previous : { year: frame.yearIndex, text: textIndex, zoomText, dark: zoom > 0.5 });
    return Math.abs(progress - fieldProgress.current) > 0.000005;
  }, reduced);

  function seek(time) {
    const node = root.current;
    if (!node) return;
    const top = node.getBoundingClientRect().top + window.scrollY;
    jumpTo(top + time / SCENE_LENGTH * (node.offsetHeight - window.innerHeight));
    setChapters(false);
    setLedgerFull(false);
  }
  const openPainting = () => onOpen({ title: "Still Life with a Chinese Porcelain Jar", images: [getty.painting], source: "https://www.getty.edu/tracingart/" });

  if (reduced) return <main ref={root} className="getty-reduced"><header>Getty <span>Tracing Art</span></header><h1>A painting through time.</h1>{GETTY_YEARS.map((year, i) => <section key={year.year}><h2>{year.year}</h2><button onClick={openPainting}><img src={getty.painting} alt="Still Life with a Chinese Porcelain Jar, Willem Kalf" /></button><p>{DESCRIPTIONS[[0, 3, 4, 5, 7, 11][i]]}</p></section>)}<section><h2>1945</h2><img src={getty.ledger} alt="Knoedler stock ledger recording the painting’s sale" /><p>{ZOOM_COPY[0]}</p></section><a href="https://www.getty.edu/tracingart/" target="_blank" rel="noreferrer">Original Getty experience ↗</a></main>;

  return (
    <main ref={root} className="getty-runway">
      <div className={`getty-stage ${scene.dark ? "getty-stage--dark" : ""}`}>
        <header className="getty-head"><button onClick={() => seek(0)} aria-label="Restart Tracing Art">Getty</button><button className="getty-menu-toggle" onClick={() => setChapters(!chapters)} aria-expanded={chapters} aria-label="Open chapter navigation">{chapters ? "×" : "☰"}</button></header>
        {chapters && <nav className="getty-menu" aria-label="Timeline chapters"><span>Tracing a painting through time</span>{GETTY_YEARS.map((year) => <button key={year.year} onClick={() => seek(1.8 + year.at * 10 + 0.1)}>{year.year} <span>↗</span></button>)}<button onClick={() => seek(13.6)}>1945 — The ledger <span>↗</span></button></nav>}
        <div className="getty-collage" data-getty-collage aria-hidden="true">{CARDS.map((card) => <div className="getty-card" data-getty-card key={card.key}><img src={card.src} alt="" loading="eager" draggable="false" /></div>)}</div>
        <div className="getty-intro" data-getty-intro><p>Millions of resources. Five centuries of art.</p><h1>Tracing Art</h1><p className="getty-intro__body">Every painting has a story.<br />Follow the people, places and records<br className="getty-desktop" /> behind a work of art.</p><button onClick={() => seek(1.9)}>↓ Scroll down</button></div>
        <button className="getty-painting" data-getty-painting onClick={openPainting} aria-label="View the painting"><span><img src={getty.painting} alt="Still Life with a Chinese Porcelain Jar by Willem Kalf" /></span></button>
        <div className="getty-credit" data-getty-credit><span>Still Life with a Chinese Porcelain Jar, Willem Kalf</span><small>1669 · Indianapolis Museum of Art at Newfields</small></div>
        <div className="getty-shade" data-getty-shade />
        <p className="getty-description" data-getty-description aria-live="off">{DESCRIPTIONS[scene.text]}</p>
        <div className="getty-rail" data-getty-rail><span className="getty-rail__track" /><span className="getty-rail__fill" data-getty-progress /><div className="getty-rail__marker" data-getty-year><span key={scene.year}>{GETTY_YEARS[scene.year].year}</span></div><input type="range" aria-label="Scrub painting timeline" min="0" max="1000" defaultValue="0" onChange={(event) => seek(1.8 + Number(event.target.value) / 100)} /></div>
        <div className="getty-zoom-copy" data-getty-zoom-copy><p>{ZOOM_COPY[scene.zoomText]}</p></div>
        <div className={`getty-ledger ${ledgerFull ? "getty-ledger--full" : ""}`} data-getty-ledger>
          <button className="getty-ledger__surface" onClick={() => setLedgerFull(!ledgerFull)} aria-label={ledgerFull ? "Restore highlighted ledger" : "Expand ledger"} aria-expanded={ledgerFull}>
            <span className="getty-ledger__image getty-ledger__dim"><img src={getty.ledger} alt="Knoedler stock book, with the entry for Kalf’s Still Life highlighted" /></span>
            <span data-getty-spot className="getty-ledger__image getty-ledger__spot" aria-hidden="true"><img src={getty.ledger} alt="" /></span>
            <span className="getty-ledger__control" aria-hidden="true">{ledgerFull ? "−" : "+"}</span>
            <span className="getty-ledger__caption">Knoedler stock book 9, p. 76 · Getty Research Institute</span>
          </button>
        </div>
        <div className="getty-section-progress" aria-hidden="true"><span data-getty-section-progress /></div>
        <div className="getty-outro" data-getty-outro><h2>Every object.<br />A world of connections.</h2><a href="https://www.getty.edu/tracingart/" target="_blank" rel="noreferrer">Continue with Getty ↗</a><button onClick={() => seek(0)}>Replay ↑</button></div>
      </div>
    </main>
  );
}

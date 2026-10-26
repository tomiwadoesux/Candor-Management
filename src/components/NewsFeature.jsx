"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import ChromeLink from "./ChromeLink";
import { models } from "../../data/models";
import "../styles/news-feature.css";

const roster = models.filter((model) => model.division === "models" && !model.placeholder);
const pad = (n) => String(n).padStart(2, "0");
const picturesOf = (model) => (model.images?.length ? model.images : [model.coverImage]);
const SPEC = [
  ["Height", "height"],
  ["Bust", "chest"],
  ["Waist", "waist"],
  ["Hips", "hips"],
];

// The NewsTest composition, shared by its preview and the landing page.
//
// Each step keeps the outgoing model painted underneath while the incoming one
// wipes across it from the side you travelled towards, so the change reads as
// a turn of the page rather than a swap. `turn` counts steps so every change —
// even back to a model already seen — remounts the animated layer.
export default function NewsFeature() {
  const [state, setState] = useState({ index: 0, previous: null, direction: 1, turn: 0 });
  const { index, previous, direction, turn } = state;
  const model = roster[index];
  const outgoing = previous === null ? null : roster[previous];
  const pictures = picturesOf(model);
  const touchX = useRef(null);

  const go = useCallback((target, dir) => {
    setState((s) => {
      const next = (target + roster.length) % roster.length;
      if (next === s.index) return s;
      return { index: next, previous: s.index, direction: dir ?? (next > s.index ? 1 : -1), turn: s.turn + 1 };
    });
  }, []);
  const move = (dir) => go(index + dir, dir);

  // Warm the next and previous models' frames so a step never waits on the network.
  useEffect(() => {
    [index + 1, index - 1].forEach((i) => {
      const m = roster[(i + roster.length) % roster.length];
      picturesOf(m).slice(0, 2).forEach((src) => {
        const img = new window.Image();
        img.src = src;
      });
    });
  }, [index]);

  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") move(1);
    else if (e.key === "ArrowLeft") move(-1);
    else return;
    e.preventDefault();
  };

  const frame = (slot, sizes) => {
    const src = (m) => picturesOf(m)[slot] || picturesOf(m)[0];
    return (
      <>
        {outgoing && (
          <div className="news-feature__layer" key={`out-${turn}`}>
            <Image src={src(outgoing)} alt="" fill sizes={sizes} aria-hidden="true" />
          </div>
        )}
        <div
          className="news-feature__layer news-feature__layer--in"
          key={`in-${turn}`}
          data-animate={turn > 0 || undefined}
          style={{ "--dir": direction, "--delay": `${slot * 90}ms` }}
        >
          <Image src={src(model)} alt={`${model.name} — portfolio image ${slot + 1}`} fill sizes={sizes} priority={turn === 0} />
        </div>
      </>
    );
  };

  return (
    <section
      id="featured-models"
      className="news-feature"
      aria-label="Featured models"
      aria-roledescription="carousel"
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 48) move(dx < 0 ? 1 : -1);
      }}
    >
      <div className="news-feature__copy" aria-live="polite" aria-atomic="true">
        <div className="news-feature__head">
          <span className="news-feature__label">Candor / {model.board.toLowerCase()}</span>
          <span className="news-feature__count" aria-hidden="true">
            <span className="news-feature__count-now" key={turn}>{pad(index + 1)}</span>
            <span className="news-feature__count-of">/ {pad(roster.length)}</span>
          </span>
        </div>

        <div className="news-feature__lede" key={turn} data-animate={turn > 0 || undefined} style={{ "--dir": direction }}>
          <h2 aria-label={model.name}>
            {model.name.split(" ").map((word, i) => (
              <span className="news-feature__word" key={i} aria-hidden="true">
                <span style={{ "--i": i }}>{word}</span>
              </span>
            ))}
          </h2>
          <p>{model.bio.split(/(?<=\.)\s/)[0]}</p>

          <dl className="news-feature__spec">
            {SPEC.map(([label, key]) => (
              <div key={key}>
                <dt>{label}</dt>
                <dd>{(model[key] || "—").split(" / ")[0]}</dd>
              </div>
            ))}
          </dl>

          <ChromeLink href={`/models/${model.id}`} className="news-feature__link">model portfolio</ChromeLink>
        </div>

        <div className="news-feature__nav">
          <div className="news-feature__ticks" role="tablist" aria-label="Choose a model">
            {roster.map((m, i) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`${pad(i + 1)} — ${m.name}`}
                className="news-feature__tick"
                onClick={() => go(i)}
              />
            ))}
          </div>
          <span className="news-feature__up-next">
            Next — {roster[(index + 1) % roster.length].name}
          </span>
        </div>
      </div>

      <figure className="news-feature__frame news-feature__frame--first">
        <div className="news-feature__media">{frame(0, "(min-width: 1024px) 31vw, (min-width: 768px) 46vw, 90vw")}</div>
        <button type="button" className="news-feature__arrow news-feature__arrow--previous" aria-label="Previous model" onClick={() => move(-1)}><Arrow direction="previous" /></button>
        <button type="button" className="news-feature__arrow news-feature__arrow--mobile-next" aria-label="Next model" onClick={() => move(1)}><Arrow /></button>
        <figcaption><span>Fig. {pad(index + 1)}.1</span><span>{model.stageName || model.name.split(" ")[0]}</span></figcaption>
      </figure>
      <figure className="news-feature__frame news-feature__frame--second">
        <div className="news-feature__media">{frame(1, "(min-width: 1024px) 31vw, 46vw")}</div>
        <button type="button" className="news-feature__arrow news-feature__arrow--next" aria-label="Next model" onClick={() => move(1)}><Arrow /></button>
        <figcaption><span>Fig. {pad(index + 1)}.2</span><span>{model.nationality?.toLowerCase()}</span></figcaption>
      </figure>
    </section>
  );
}

function Arrow({ direction }) {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" style={direction === "previous" ? { transform: "rotate(180deg)" } : undefined}><path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="1.5" /></svg>;
}

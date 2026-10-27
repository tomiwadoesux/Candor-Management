"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import ChromeLink from "../ChromeLink";
import PrintFrame from "./PrintFrame";
import { Arrow } from "./BoardSpread";
import useRoster, { SPEC, firstSentence, measure, pad, picturesOf, roster } from "./useRoster";

// C · Cinema. The board goes dark and becomes one picture: a single large
// print, monochrome until the cursor develops it back into colour, with the
// name set across it big enough to cross the image and invert where it does.
// The frame itself is the control — press its left or right half — and the
// next model opens out of that exact point through a seven-bladed iris.
export default function BoardCinema() {
  const { index, model, next, direction, turn, origin, step, handlers } = useRoster();
  const pictures = picturesOf(model);
  const sectionRef = useRef(null);
  const frameRef = useRef(null);
  const [side, setSide] = useState(1);

  // The page's fixed CANDOR wordmark is ink on paper and would vanish on this
  // board, so it is flipped while the board lies under it — the observer's
  // box is just the top strip of the viewport, where the wordmark sits.
  useEffect(() => {
    const root = document.documentElement;
    const watcher = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) root.dataset.boardDark = "";
      else delete root.dataset.boardDark;
    }, { rootMargin: "0px 0px -94% 0px" });
    watcher.observe(sectionRef.current);
    return () => {
      watcher.disconnect();
      delete root.dataset.boardDark;
    };
  }, []);
  const [cursor, setCursor] = useState(null);

  const at = (event) => {
    const rect = frameRef.current.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width, y: 1 - (event.clientY - rect.top) / rect.height, px: event.clientX - rect.left, py: event.clientY - rect.top };
  };
  const press = (event) => {
    const point = at(event);
    step(point.x < 0.5 ? -1 : 1, { x: point.x, y: point.y });
  };
  const hover = (event) => {
    if (event.pointerType !== "mouse") return;
    const point = at(event);
    setSide(point.x < 0.5 ? -1 : 1);
    setCursor({ x: point.px, y: point.py });
  };
  // Buttons and keys open the iris from the side they point to.
  const nudge = (dir) => step(dir, { x: dir > 0 ? 0.92 : 0.08, y: 0.5 });

  return (
    <section ref={sectionRef} id="featured-models" className="mb mb-cinema" aria-label="Featured models" aria-roledescription="carousel" {...handlers}>
      <div className="mbk-head">
        <span className="mb-label">Candor / {model.board.toLowerCase()}</span>
        <span className="mbk-count" aria-hidden="true">
          <span className="mb-count__now" key={turn}>{pad(index + 1)}</span>
          <span className="mbk-count__of">/{pad(roster.length)}</span>
        </span>
      </div>

      <figure
        ref={frameRef}
        className="mbk-frame"
        onClick={press}
        onPointerMove={hover}
        onPointerLeave={() => setCursor(null)}
        data-side={side < 0 ? "previous" : "next"}
      >
        <PrintFrame
          src={pictures[0]}
          alt={`${model.name} — portfolio image 1`}
          mode="iris"
          mono={1}
          paper="#0c0c0c"
          grain={0.045}
          dir={direction}
          origin={origin}
          sizes="(min-width: 1024px) 42vw, 90vw"
          priority
        />
        {cursor && (
          <span className="mbk-cursor mb-label" style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }} aria-hidden="true">
            {side < 0 ? "← Previous" : "Next →"}
          </span>
        )}
        <figcaption className="mb-label"><span>{pad(index + 1)} · {model.stageName || model.name.split(" ")[0]}</span><span>{model.nationality?.toLowerCase()}</span></figcaption>
      </figure>

      <h2 className="mbk-name mb-name" aria-label={model.name} key={`n-${turn}`} data-animate={turn > 0 || undefined}>
        {model.name.split(" ").map((word, i) => (
          <span className="mb-word" key={i} aria-hidden="true"><span style={{ "--i": i }}>{word}</span></span>
        ))}
      </h2>

      <div className="mbk-info mb-lede" key={turn} data-animate={turn > 0 || undefined} aria-live="polite">
        <p className="mbk-bio">{firstSentence(model)}</p>
        <dl className="mbk-spec">
          {SPEC.map(([label, key]) => (
            <div key={key}>
              <dt className="mb-label">{label}</dt>
              <dd>{measure(model, key)}</dd>
            </div>
          ))}
        </dl>
        <ChromeLink href={`/models/${model.id}`} className="mbk-link">model portfolio</ChromeLink>
      </div>

      <div className="mbk-side">
        <div className="mbk-step">
          <button type="button" aria-label="Previous model" onClick={() => nudge(-1)}><Arrow flip /></button>
          <button type="button" aria-label="Next model" onClick={() => nudge(1)}><Arrow /></button>
        </div>
        <button type="button" className="mbk-next" onClick={() => nudge(1)} aria-label={`Next model, ${next.name}`}>
          <span className="mbk-next__thumb" key={next.id}>
            <Image src={next.coverImage} alt="" fill sizes="(min-width: 1024px) 12vw, 30vw" />
          </span>
          <span className="mb-label">Up next</span>
          <span className="mbk-next__name">{next.name}</span>
        </button>
      </div>
    </section>
  );
}

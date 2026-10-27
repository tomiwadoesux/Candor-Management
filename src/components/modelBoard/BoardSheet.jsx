"use client";

import Image from "next/image";
import ChromeLink from "../ChromeLink";
import PrintFrame from "./PrintFrame";
import { Arrow } from "./BoardSpread";
import useRoster, { SPEC, firstSentence, measure, pad, picturesOf, roster } from "./useRoster";

// B · Contact sheet. The whole board is on the page at once, the way a
// booker sees it: sixteen frames along a strip of film, edge-printed and
// sprocketed, with the pick ringed in grease pencil. The chosen frame is
// enlarged above it, and each step pulls the film through a gate cut into
// slits, so the move runs in the direction you went.
export default function BoardSheet() {
  const { index, model, direction, turn, go, step, handlers } = useRoster();
  const pictures = picturesOf(model);

  return (
    <section id="featured-models" className="mb mb-sheet" aria-label="Featured models" aria-roledescription="carousel" {...handlers}>
      <div className="mbc-copy">
        <div className="mbc-head">
          <span className="mb-label">Candor / {model.board.toLowerCase()}</span>
          <span className="mb-label mb-count" aria-hidden="true">
            <span className="mb-count__now" key={turn}>{pad(index + 1)}A</span>
            <span className="mb-count__of">/ {pad(roster.length)}</span>
          </span>
        </div>

        <div className="mbc-lede mb-lede" key={turn} data-animate={turn > 0 || undefined} style={{ "--dir": direction }} aria-live="polite">
          <h2 className="mbc-name mb-name" aria-label={model.name}>
            {model.name.split(" ").map((word, i) => (
              <span className="mb-word" key={i} aria-hidden="true"><span style={{ "--i": i }}>{word}</span></span>
            ))}
          </h2>
          <p className="mbc-bio">{firstSentence(model)}</p>
          <dl className="mbc-spec">
            {SPEC.map(([label, key]) => (
              <div key={key}>
                <dt className="mb-label">{label}</dt>
                <dd>{measure(model, key)}</dd>
              </div>
            ))}
          </dl>
          <ChromeLink href={`/models/${model.id}`} className="mbc-link">model portfolio</ChromeLink>
        </div>
      </div>

      <figure className="mbc-gate">
        <PrintFrame
          src={pictures[0]}
          alt={`${model.name} — portfolio image 1`}
          mode="gate"
          paper="#0c0c0c"
          dir={direction}
          sizes="(min-width: 1024px) 34vw, 90vw"
          priority
        />
        <span className="mbc-crop mbc-crop--tl" aria-hidden="true" />
        <span className="mbc-crop mbc-crop--br" aria-hidden="true" />
        <figcaption className="mb-label">
          <span>Frame {pad(index + 1)}A</span>
          <span className="mbc-gate__step">
            <button type="button" aria-label="Previous model" onClick={() => step(-1)}><Arrow flip /></button>
            <button type="button" aria-label="Next model" onClick={() => step(1)}><Arrow /></button>
          </span>
          <span>{model.stageName || model.name.split(" ")[0]}</span>
        </figcaption>
      </figure>

      <figure className="mbc-aside">
        <PrintFrame
          src={pictures[1] || pictures[0]}
          alt={`${model.name} — portfolio image 2`}
          mode="gate"
          paper="#0c0c0c"
          dir={direction}
          delay={160}
          lens={false}
          sizes="(min-width: 1024px) 16vw, 40vw"
        />
        <figcaption className="mb-label"><span>{pad(index + 1)}B</span><span>{model.nationality?.toLowerCase()}</span></figcaption>
      </figure>

      <nav className="mbc-strip" aria-label="Choose a model" style={{ "--at": index }}>
        <div className="mbc-strip__film">
          <span className="mbc-strip__edge" aria-hidden="true">
            <span className="mbc-strip__brand">Candor 400 · {model.board.toLowerCase()}</span>
            {roster.map((m, i) => <span key={m.id}>▸{pad(i + 1)}</span>)}
          </span>
          <div className="mbc-strip__frames" role="tablist">
            {roster.map((m, i) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`${pad(i + 1)} — ${m.name}`}
                className="mbc-thumb"
                onClick={() => go(i)}
              >
                <Image src={m.coverImage} alt="" fill sizes="64px" />
              </button>
            ))}
            {/* The grease-pencil ring, redrawn on every pick. */}
            <svg className="mbc-mark" viewBox="0 0 100 120" preserveAspectRatio="none" aria-hidden="true" key={turn}>
              <path
                pathLength="1"
                d="M14 9 C38 3 70 4 90 8 C97 30 96 82 93 111 C66 116 30 117 8 113 C3 84 4 36 9 12 C22 8 44 6 60 6"
              />
            </svg>
          </div>
          <span className="mbc-strip__edge mbc-strip__edge--low" aria-hidden="true">
            {roster.map((m, i) => <span key={m.id}>{pad(i + 1)}A</span>)}
          </span>
        </div>
      </nav>
    </section>
  );
}

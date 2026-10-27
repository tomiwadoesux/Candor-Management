"use client";

import Image from "next/image";
import ChromeLink from "../ChromeLink";
import PrintFrame from "./PrintFrame";
import useRoster, { SPEC, firstSentence, measure, pad, picturesOf } from "./useRoster";

// A · Spread. The magazine spread, made to hold its weight: the name at
// poster scale in the condensed face the MODELS heading uses (the stage name;
// the full name sits small above it), a large print
// and a smaller one set to the same baseline, and the next model waiting at
// the foot of the column. Each step develops the next model's prints up out
// of the paper, the second a beat behind the first.
export default function BoardSpread() {
  const { index, model, next, direction, turn, step, handlers } = useRoster();
  const pictures = picturesOf(model);
  const stage = model.stageName || model.name.split(" ")[0];

  return (
    <section id="featured-models" className="mb mb-spread" aria-label="Featured models" aria-roledescription="carousel" {...handlers}>
      <div className="mbs-copy">
        <p className="mbs-fullname mb-label" key={`f-${turn}`}>{model.name}</p>

        <div className="mbs-lede mb-lede" key={turn} data-animate={turn > 0 || undefined} style={{ "--dir": direction }} aria-live="polite">
          <h2 className="mbs-name mb-name" aria-label={stage}>
            {stage.split(" ").map((word, i) => (
              <span className="mb-word" key={i} aria-hidden="true"><span style={{ "--i": i }}>{word}</span></span>
            ))}
          </h2>
          <p className="mbs-bio">{firstSentence(model)}</p>
          <dl className="mbs-spec">
            {SPEC.map(([label, key]) => (
              <div key={key}>
                <dt className="mb-label">{label}</dt>
                <dd>{measure(model, key)}</dd>
              </div>
            ))}
          </dl>
          <ChromeLink href={`/models/${model.id}`} className="mbs-link">model portfolio</ChromeLink>
        </div>

        <div className="mbs-foot">
          <div className="mbs-step mbs-step--phone">
            <button type="button" className="mbs-arrow" aria-label="Previous model" onClick={() => step(-1)}><Arrow flip /></button>
            <button type="button" className="mbs-arrow" aria-label="Next model" onClick={() => step(1)}><Arrow /></button>
          </div>
          <button type="button" className="mbs-next" onClick={() => step(1)} aria-label={`Next model, ${next.name}`}>
            <span className="mbs-next__thumb">
              <Image src={next.coverImage} alt="" fill sizes="56px" />
            </span>
            <span className="mbs-next__text">
              <span className="mb-label">Next</span>
              <span className="mbs-next__name">{next.name}</span>
            </span>
          </button>
        </div>
      </div>

      <figure className="mbs-frame mbs-frame--main">
        <PrintFrame
          src={pictures[0]}
          alt={`${model.name} — portfolio image 1`}
          mode="develop"
          paper="#f3f1ec"
          dir={direction}
          sizes="(min-width: 1024px) 40vw, 90vw"
          priority
        />
        <figcaption className="mb-label"><span>Fig. {pad(index + 1)}.1</span><span>{model.board.toLowerCase()}</span></figcaption>
      </figure>

      <figure className="mbs-frame mbs-frame--aside">
        <PrintFrame
          src={pictures[1] || pictures[0]}
          alt={`${model.name} — portfolio image 2`}
          mode="develop"
          paper="#f3f1ec"
          dir={direction}
          delay={220}
          sizes="(min-width: 1024px) 22vw, 45vw"
        />
        {/* Both arrows are measured from this card: next stands on its top
            edge, outside it, flush left; previous sits on that edge across
            the gutter, flush to the first card's right edge. Positioned from
            here so they line up however the two cards are sized. */}
        <button type="button" className="mbs-flip mbs-flip--previous" aria-label="Previous model" onClick={() => step(-1)}><Arrow flip /></button>
        <button type="button" className="mbs-flip mbs-flip--next" aria-label="Next model" onClick={() => step(1)}><Arrow /></button>
        <figcaption className="mb-label"><span>Fig. {pad(index + 1)}.2</span><span>{model.nationality?.toLowerCase()}</span></figcaption>
      </figure>
    </section>
  );
}

export function Arrow({ flip = false }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" style={flip ? { transform: "rotate(180deg)" } : undefined}>
      <path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

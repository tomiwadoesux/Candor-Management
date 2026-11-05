"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import LogoAnimation from "@/components/LogoAnimation";
import WordPaint, { FACES } from "../../about-new/wordPaint/WordPaint";
import { agency } from "../../../../data/agency";
import { aboutNew } from "../../../../data/aboutNew";

// Frame — the Unseen/Lusion register: one owned GL moment on a near-black
// page, and austerity everywhere else. The agency's name opens the page as
// painted type (WordPaint's Spectrum, the pointer develops the faces inside
// the letters), the statements rise line by line behind masks at an unhurried
// pace, and the page ends the Basement way: the footer is a destination —
// the wordmark at full width, the four words on a slow belt, the addresses
// set large enough to be the closing image.

const FOUNDER = aboutNew.founder;

const BELIEFS = [
  ["Development", "We invest in the knowledge, training and experience talents need to create with substance."],
  ["Individuality", "Talent should never be reduced to a type, trend or template."],
  ["Access", "Opportunity should not depend entirely on who you already know."],
  ["Clarity", "Representation built on transparent communication, expectations and relationships."],
];

// Lines and blocks rise in once, on arrival, slow and certain.
function useArrive(ref) {
  useEffect(() => {
    const root = ref.current;
    const items = [...root.querySelectorAll("[data-arrive]")];
    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => { item.dataset.in = ""; });
      return;
    }
    const arriving = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.dataset.in = "";
        arriving.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px" });
    items.forEach((item) => arriving.observe(item));
    return () => arriving.disconnect();
  }, [ref]);
}

// A statement whose lines wait behind their own masks and rise on arrival,
// one after the other.
function Rise({ as: Tag = "p", className = "", lines, ...rest }) {
  return (
    <Tag className={`fr-rise ${className}`} {...rest}>
      {lines.map((line, index) => (
        <span key={index} className="fr-rise__mask" data-arrive style={{ "--i": index }}>
          <span className="fr-rise__line">{line}</span>
        </span>
      ))}
    </Tag>
  );
}

export default function TakeFrame() {
  const rootRef = useRef(null);
  useArrive(rootRef);

  return (
    <div ref={rootRef} className="fr">
      <header className="fr-chrome">
        <Link href="/" className="fr-mark" aria-label="Candor home">
          <LogoAnimation tight animate={false} />
        </Link>
        <p>The agency — est. {agency.founded}</p>
        <p>{agency.offices.map(({ city }) => city).join(" / ")}</p>
      </header>

      <section className="fr-hero" aria-label="Candor">
        <WordPaint word="Candor" faces={FACES} rest={{ light: 0.5, dark: 0.34 }} className="fr-paint" wordClassName="fr-paint__word" fitClassName="fr-paint__fit" />
        <p className="fr-hero__sub" data-arrive>
          A model &amp; talent agency.<span>People make the picture.</span>
        </p>
      </section>

      <section className="fr-section" aria-labelledby="fr-mission">
        <p className="fr-label" data-arrive id="fr-mission">01 — Mission</p>
        <Rise
          as="h2"
          className="fr-statement"
          lines={[
            "We develop and represent talent,",
            "equipping them to understand their craft",
            "and create from a place of candor.",
          ]}
        />
      </section>

      <section className="fr-section" aria-labelledby="fr-vision">
        <p className="fr-label" data-arrive id="fr-vision">02 — Vision</p>
        <Rise
          as="h2"
          className="fr-statement fr-statement--serif"
          lines={[
            "A generation of talent equipped",
            "to shape global culture through",
            "distinct perspectives.",
          ]}
        />
      </section>

      <section className="fr-section" aria-labelledby="fr-beliefs">
        <p className="fr-label" data-arrive id="fr-beliefs">03 — What we believe</p>
        <ol className="fr-beliefs">
          {BELIEFS.map(([title, text], index) => (
            <li key={title} data-arrive style={{ "--i": index }}>
              <span className="fr-beliefs__num">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="fr-section fr-founder" aria-labelledby="fr-founder">
        <p className="fr-label" data-arrive id="fr-founder">04 — {FOUNDER.label}</p>
        <blockquote data-arrive>
          <p>{FOUNDER.quote}</p>
          <footer>{FOUNDER.name} — {FOUNDER.role}</footer>
        </blockquote>
      </section>

    </div>
  );
}

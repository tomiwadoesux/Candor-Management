"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import LogoAnimation from "@/components/LogoAnimation";
import { agency } from "../../../../data/agency";
import { aboutNew } from "../../../../data/aboutNew";

// Index — the Obys/Locomotive page: print discipline on paper. A ruled index
// with mono numbers frames everything; the one live thing is the manifesto,
// set in Gwyner Condensed at paper-filling size, which skews with the speed
// of the scroll (Locomotive's signature) and settles upright the moment the
// reader does. A ticker of the agency's four words runs between sections.

const FOUNDER = aboutNew.founder;

const STATEMENTS = [
  {
    id: "mission",
    label: "Mission",
    text: "We develop and represent talent, equipping them with the knowledge to understand their craft and create from a place of candor.",
  },
  {
    id: "vision",
    label: "Vision",
    text: "A generation of talent equipped to shape global culture through distinct perspectives.",
  },
];

const BELIEFS = [
  ["Development", "We invest in the knowledge, training and experience talents need to create with substance."],
  ["Individuality", "Talent should never be reduced to a type, trend or template."],
  ["Access", "Opportunity should not depend entirely on who you already know."],
  ["Clarity", "Representation built on transparent communication, expectations and relationships."],
];

const TICKER = ["People", "Opportunity", "Culture", "What’s next"];

// The manifesto lines lean with the scroll: velocity is eased into a skew,
// capped low, and the loop stops itself once the lines stand straight again.
function useVelocitySkew(ref) {
  useEffect(() => {
    const el = ref.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!el || reduce.matches) return;
    let last = window.scrollY;
    let lean = 0;
    let frame = 0;
    const step = () => {
      frame = 0;
      const y = window.scrollY;
      const want = Math.max(-4, Math.min(4, (y - last) * 0.05));
      last = y;
      lean += (want - lean) * 0.12;
      if (Math.abs(lean) < 0.01 && !want) {
        lean = 0;
        el.style.transform = "";
        return;
      }
      el.style.transform = `skewY(${lean.toFixed(3)}deg)`;
      frame = requestAnimationFrame(step);
    };
    const wake = () => { if (!frame) frame = requestAnimationFrame(step); };
    window.addEventListener("scroll", wake, { passive: true });
    return () => {
      window.removeEventListener("scroll", wake);
      cancelAnimationFrame(frame);
    };
  }, [ref]);
}

// Each office's local time, to the minute. Intl does the daylight-saving sums.
function useDeskTimes() {
  const [times, setTimes] = useState(() => agency.offices.map(() => "—"));
  useEffect(() => {
    const read = () => setTimes(agency.offices.map(({ timeZone }) =>
      new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date())
    ));
    read();
    const tick = setInterval(read, 30_000);
    return () => clearInterval(tick);
  }, []);
  return times;
}

// Sections rise in once, on arrival.
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
    }, { rootMargin: "0px 0px -10% 0px" });
    items.forEach((item) => arriving.observe(item));
    return () => arriving.disconnect();
  }, [ref]);
}

function Ticker() {
  const words = [...TICKER, ...TICKER, ...TICKER];
  return (
    <div className="ix-ticker" aria-hidden="true">
      <div className="ix-ticker__belt">
        {[0, 1].map((half) => (
          <span key={half} className="ix-ticker__half">
            {words.map((word, index) => <span key={index}>{word}<em>—</em></span>)}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function TakeIndex() {
  const rootRef = useRef(null);
  const skewRef = useRef(null);
  useVelocitySkew(skewRef);
  useArrive(rootRef);
  const times = useDeskTimes();

  return (
    <div ref={rootRef} className="ix">
      <header className="ix-mast">
        <Link href="/" className="ix-mark" aria-label="Candor home">
          <LogoAnimation tight animate={false} />
        </Link>
        <p>The agency<span>(02)</span></p>
        <p>Model &amp; talent management<br />Est. {agency.founded}</p>
      </header>

      <div className="ix-manifesto" ref={skewRef}>
        <h1 aria-label="We see people before we see potential.">
          <span aria-hidden="true" data-arrive>We see people</span>
          <span aria-hidden="true" data-arrive>before we see</span>
          <span aria-hidden="true" data-arrive>potential<em>.</em></span>
        </h1>
      </div>
      <p className="ix-manifesto__note" data-arrive>
        can·dor <i>/ˈkan·dər/ n.</i> — the quality of being open and honest in what you say.
      </p>

      <Ticker />

      <main>
        {STATEMENTS.map(({ id, label, text }, index) => (
          <section key={id} className="ix-row" data-arrive aria-labelledby={`ix-${id}`}>
            <p className="ix-row__num">0{index + 1}</p>
            <h2 id={`ix-${id}`} className="ix-row__label">{label}</h2>
            <p className="ix-row__text">{text}</p>
          </section>
        ))}

        <section className="ix-row ix-row--beliefs" data-arrive aria-labelledby="ix-beliefs">
          <p className="ix-row__num">03</p>
          <h2 id="ix-beliefs" className="ix-row__label">What we believe</h2>
          <ol className="ix-beliefs">
            {BELIEFS.map(([title, text], index) => (
              <li key={title}>
                <span className="ix-beliefs__num">0{index + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="ix-row ix-row--founder" data-arrive aria-labelledby="ix-founder">
          <p className="ix-row__num">04</p>
          <h2 id="ix-founder" className="ix-row__label">{FOUNDER.label}</h2>
          <div className="ix-founder">
            <figure>
              <Image src={FOUNDER.image} alt={FOUNDER.name} width={820} height={1025} sizes="(max-width: 760px) 90vw, 36vw" />
              <figcaption>{FOUNDER.name} — {FOUNDER.role}</figcaption>
            </figure>
            <blockquote><p>{FOUNDER.quote}</p></blockquote>
          </div>
        </section>

        <section className="ix-row ix-row--offices" data-arrive aria-labelledby="ix-offices">
          <p className="ix-row__num">05</p>
          <h2 id="ix-offices" className="ix-row__label">Offices</h2>
          <ul className="ix-offices">
            {agency.offices.map(({ city, country }, index) => (
              <li key={city}>
                <h3>{city}</h3>
                <p>{country}</p>
                <p className="ix-offices__time">{times[index]} local</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <Ticker />

    </div>
  );
}

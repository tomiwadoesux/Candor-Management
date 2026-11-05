"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import LogoAnimation from "@/components/LogoAnimation";
import { agency, contactMailto, joinMailto } from "../../../../data/agency";
import { aboutNew } from "../../../../data/aboutNew";

// Reel — the OddCommon move: the chapter list IS the navigation, and the
// photography is the canvas. The whole page is one screen; pointing at a
// chapter swaps the full-bleed picture behind it (a slow crossfade and
// settle, Exo Ape's pace), and opening one unfolds its text in place. The
// chrome is pinned to the corners in small print and never moves.

const FOUNDER = aboutNew.founder;

const CHAPTERS = [
  {
    id: "mission",
    title: "Mission",
    image: "/photos/img3.jpeg",
    body: (
      <p>
        We develop and represent talent, equipping them with the knowledge to
        understand their craft and create from a place of candor. We respect
        individuality and broaden access to opportunity.
      </p>
    ),
  },
  {
    id: "vision",
    title: "Vision",
    image: "/photos/img20.jpeg",
    body: (
      <p>
        A generation of talent equipped to shape global culture through
        distinct perspectives — and empowering the next generation through
        their work.
      </p>
    ),
  },
  {
    id: "beliefs",
    title: "What we believe",
    image: "/photos/img9.jpeg",
    body: (
      <dl className="rl-beliefs">
        <div><dt>Development</dt><dd>We invest in the knowledge, training and experience talents need to create with substance.</dd></div>
        <div><dt>Individuality</dt><dd>Talent should never be reduced to a type, trend or template.</dd></div>
        <div><dt>Access</dt><dd>Opportunity should not depend entirely on who you already know.</dd></div>
        <div><dt>Clarity</dt><dd>Representation built on transparent communication, expectations and relationships.</dd></div>
      </dl>
    ),
  },
  {
    id: "founder",
    title: "The founder",
    image: FOUNDER.image,
    body: (
      <>
        <p className="rl-quote">{FOUNDER.quote}</p>
        <p className="rl-sign">{FOUNDER.name} — {FOUNDER.role}</p>
      </>
    ),
  },
  {
    id: "offices",
    title: "Three cities",
    image: "/photos/img14.jpeg",
    body: (
      <>
        <p>
          {agency.offices.map(({ city, country }) => `${city}, ${country}`).join(" · ")}.
          One agency, one point of view, since {agency.founded}.
        </p>
        <p className="rl-sign">
          <a href={contactMailto}>{agency.contact.email}</a>
          <a href={joinMailto}>{agency.join.email}</a>
        </p>
      </>
    ),
  },
];

const DEFAULT_IMAGE = "/photos/img12.jpeg";

export default function TakeReel() {
  const rootRef = useRef(null);
  // The picture showing (a chapter id, or null for the opening portrait) and
  // the chapter unfolded. Pointing chooses the picture; opening holds it.
  const [active, setActive] = useState(null);
  const [open, setOpen] = useState(null);

  // The rows rise in once, staggered, on arrival.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      rootRef.current?.setAttribute("data-in", "");
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const shown = active ?? open;

  return (
    <div ref={rootRef} className="rl">
      <div className="rl-stage" aria-hidden="true">
        <div className={`rl-still${shown ? "" : " rl-still--on"}`}>
          <Image src={DEFAULT_IMAGE} alt="" fill priority sizes="100vw" />
        </div>
        {CHAPTERS.map(({ id, image }) => (
          <div key={id} className={`rl-still${shown === id ? " rl-still--on" : ""}`}>
            <Image src={image} alt="" fill sizes="100vw" />
          </div>
        ))}
        <div className="rl-veil" />
      </div>

      <header className="rl-chrome rl-chrome--top">
        <Link href="/" className="rl-mark" aria-label="Candor home">
          <LogoAnimation tight animate={false} />
        </Link>
        <p>The agency — est. {agency.founded}<br />{agency.offices.map(({ city }) => city).join(" · ")}</p>
      </header>

      <main className="rl-list" onMouseLeave={() => setActive(null)} aria-label="About Candor">
        {CHAPTERS.map(({ id, title, body }, index) => (
          <section key={id} className={`rl-row${open === id ? " rl-row--open" : ""}`} style={{ "--i": index }}>
            <h2>
              <button
                type="button"
                aria-expanded={open === id}
                onMouseEnter={() => setActive(id)}
                onFocus={() => setActive(id)}
                onClick={() => setOpen(open === id ? null : id)}
              >
                <span className="rl-row__num">0{index + 1}</span>
                <span className="rl-row__mask"><span className="rl-row__title">{title}</span></span>
                <span className="rl-row__cue" aria-hidden="true">{open === id ? "—" : "+"}</span>
              </button>
            </h2>
            <div className="rl-panel">
              <div className="rl-panel__inner">{body}</div>
            </div>
          </section>
        ))}
      </main>

    </div>
  );
}

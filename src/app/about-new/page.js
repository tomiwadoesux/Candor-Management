import Image from "next/image";
import Link from "next/link";
import "./about-new.css";
import FitText from "@/components/FitText";
import AboutMotion from "./AboutMotion";
import NewsletterForm from "./NewsletterForm";
import WordPaint from "./wordPaint/WordPaint";
import { Arrow, Chars, ScrubWords, Words, cls, enter, pad } from "./parts";
import {
  ApplyCta,
  Boards,
  Digitals,
  Faq,
  NoFees,
  Offices,
  Process,
  Requirements,
} from "./ScoutingSections";
import { Index, Names, Principles, Stats } from "./PatternSections";
import { aboutNew as c } from "../../../data/aboutNew";

export const metadata = {
  title: "About — Candor",
  description:
    "Candor is a model and talent agency in Lagos, Manchester and Dallas. Nothing to pay, every application read by a person, and an honest answer.",
};

// /about-new — a long, quiet, editorial about page built from nine sections:
// the statement, the promises, a giant count, a tilted wall of pictures, a
// belief paragraph, the founder, the bookers, a black band on approach and a
// drifting strip of faces, closed by a footer that ends on the wordmark.
// Copy lives in data/aboutNew.js.
//
// Layout is a 12-column grid (40px margins, 20px gutters on desktop). Three
// lines matter: the label column at the left edge, the image column from
// column 3, and the reading column from column 7 — every block hangs off one
// of them. Motion is attached by <AboutMotion />; without it the page is
// complete and static.
//
// Each section is self-contained and takes two flags:
//   lead  it opens the page: screen-height, and it animates in on load
//         rather than on scroll.
//   flip  its columns are mirrored (labels to the right edge, reading text to
//         the left, image blocks swapped), or for the full-width sections its
//         parts are reordered. See `.is-flip` in the stylesheet.
// ORDER below arranges them.

// ---- sections ---------------------------------------------------------------

function Statement(o) {
  return (
    <section className={cls("an-statement an-pad", o)}>
      <h1 className="an-xl an-indent" {...enter(o.lead)}>
        <Words text={c.statement} />
      </h1>
    </section>
  );
}

function Promises(o) {
  return (
    <section className={cls("an-promises an-pad an-grid an-s", o)}>
      <p className="an-col-label an-promises-label" {...enter(o.lead)}>
        <span className="an-fade">
          {c.promisesLabel[0]}
          <br />
          {c.promisesLabel[1]}
        </span>
      </p>
      <ol className="an-col-read an-list" {...enter(o.lead)}>
        {c.promises.map((p, i) => (
          <li key={p} className="an-fade" style={{ "--i": i }}>
            <span className="an-num">({pad(i + 1)})</span>
            {p}
          </li>
        ))}
      </ol>
      <p className="an-col-read an-note" {...enter(o.lead)}>
        <span className="an-fade">{c.promisesNote}</span>
      </p>
    </section>
  );
}

// The giant word in the display face, italic, fitted to the full width and
// drawn in WebGL by <WordPaint />, which the pointer stirs; under it a line
// set like the header — the name on the left, the way in on the right.
function BigWord(o) {
  return (
    <WordPaint className={cls("an-big", o)} word={c.bigWord}>
      <div className="an-big-row an-pad" {...enter(o.lead)}>
        <p className="an-logo">
          <span className="an-fade">{c.bigWordCaption}</span>
        </p>
        <Link href={c.cta.href} className="an-big-cta an-s">
          <span className="an-fade" style={{ "--i": 1 }}>
            {c.cta.label} <Arrow />
          </span>
        </Link>
      </div>
    </WordPaint>
  );
}

// Each wall column drifts at its own rate, in vh across the section's pass.
const WALL_SPEEDS = [-28, 18, -36, 24];

// A grid of pictures turned off the square and oversized so its edges never
// show; the columns slide against each other as the section passes.
function Wall(o) {
  return (
    <section className={cls("an-wall", o)} data-an-scrub="through" aria-hidden="true">
      <div className="an-wall-tilt">
        {c.wall.map((col, i) => (
          <div
            key={i}
            className="an-wall-col"
            style={{ "--speed": WALL_SPEEDS[i % WALL_SPEEDS.length] }}
          >
            {/* Each column runs twice, so it outlasts the tilt and the
                drift on any screen shape. */}
            {[...col, ...col].map((src, j) => (
              <div
                key={j}
                className={`an-wall-card ${(i + j) % 2 ? "is-wide" : ""}`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, 30vw"
                  priority={o.lead && j < 2}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function Belief(o) {
  return (
    <section className={cls("an-belief an-pad", o)}>
      <p
        className="an-xl an-indent"
        data-an-scrub="read"
        style={{ "--n": c.belief.split(" ").length }}
      >
        <ScrubWords text={c.belief} />
      </p>
    </section>
  );
}

// The label sits at the foot of its column and is sticky to the bottom of
// the screen, so it arrives with the picture and settles beside its base.
function Founder(o) {
  return (
    <section className={cls("an-founder an-pad an-grid", o)}>
      <div className="an-col-label an-sticky-col">
        <p className="an-s an-sticky">{c.founder.label}</p>
      </div>
      <div className="an-founder-img an-img" {...enter(o.lead)}>
        <Image
          src={c.founder.image}
          alt={c.founder.name}
          fill
          sizes="(max-width: 640px) 100vw, 42vw"
        />
      </div>
      <div className="an-founder-text an-s" {...enter(o.lead)}>
        <p className="an-fade">{c.founder.quote}</p>
        <p className="an-fade an-person" style={{ "--i": 1 }}>
          {c.founder.name}
          <br />
          <span className="an-mute">{c.founder.role}</span>
        </p>
        <p className="an-fade" style={{ "--i": 2 }}>
          <a href={c.founder.link.href} className="an-link">
            {c.founder.link.label} <Arrow />
          </a>
        </p>
      </div>
    </section>
  );
}

function Team(o) {
  return (
    <section className={cls("an-team an-pad an-grid", o)}>
      <div className="an-col-label an-sticky-col">
        <p className="an-s an-sticky">
          +{c.team.people.length} {c.team.noun}
        </p>
      </div>
      <ul className="an-team-list">
        {c.team.people.map((p, i) => (
          <li key={`${p.role}-${i}`}>
            <div className="an-team-img an-img" {...enter(o.lead)}>
              <Image src={p.image} alt={p.name} fill sizes="(max-width: 640px) 50vw, 40vw" />
            </div>
            <p className="an-s an-person">
              {p.name}
              <br />
              <span className="an-mute">{p.role}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

// The black band. It stops halfway down the picture pair, which carries the
// page back out onto the paper — or, flipped, the pictures come first and the
// band rises out of them.
function Approach(o) {
  const titleStarts = c.approach.title.map((_, i) =>
    c.approach.title.slice(0, i).join(" ").split(" ").filter(Boolean).length
  );
  return (
    <section className={cls("an-approach", o)}>
      <div className="an-approach-body an-pad an-grid">
        <h2 className="an-approach-title an-l" {...enter(o.lead)}>
          {c.approach.title.map((line, i) => (
            <span key={line} className="an-line">
              <Words text={line} start={titleStarts[i]} />
            </span>
          ))}
        </h2>
        <div className="an-approach-text an-s" {...enter(o.lead)}>
          {c.approach.blocks.map((b, i) => (
            <div key={b.title} className="an-fade an-block" style={{ "--i": i }}>
              <h3 className="an-block-h">{b.title}</h3>
              <p className="an-block-p">{b.body}</p>
            </div>
          ))}
          <p className="an-fade an-close" style={{ "--i": 2 }}>
            {c.approach.close}
          </p>
        </div>
      </div>
      <div className="an-approach-imgs an-pad">
        {c.approach.images.map((src) => (
          <div key={src} className="an-approach-img an-img" data-an-reveal>
            <Image src={src} alt="" fill sizes="(max-width: 640px) 100vw, 50vw" />
          </div>
        ))}
      </div>
    </section>
  );
}

function Strip(o) {
  return (
    <section className={cls("an-strip", o)}>
      <div className="an-pad">
        <h2 className="an-strip-title an-l" {...enter(o.lead)}>
          {c.strip.title.map((line, i) => (
            <span key={line} className="an-line">
              <Words text={line} start={i * 3} />
            </span>
          ))}
        </h2>
        <hr className="an-rule" />
      </div>
      <div className="an-marquee" aria-hidden="true">
        <div className="an-marquee-track">
          {[...c.strip.items, ...c.strip.items].map((it, i) => (
            <div
              key={i}
              className="an-marquee-item"
              style={{ aspectRatio: `1 / ${it.ratio}` }}
            >
              <Image src={it.src} alt="" fill sizes="(max-width: 640px) 46vw, 23vw" />
            </div>
          ))}
        </div>
      </div>
      <p className="an-email-wrap an-pad" data-an-reveal>
        <a href={`mailto:${c.strip.email}`} className="an-email an-l an-fade">
          {c.strip.email}
        </a>
      </p>
    </section>
  );
}

const SECTIONS = {
  statement: Statement,
  promises: Promises,
  bigWord: BigWord,
  wall: Wall,
  belief: Belief,
  founder: Founder,
  team: Team,
  approach: Approach,
  strip: Strip,
  // from /get-scouted
  requirements: Requirements,
  noFees: NoFees,
  digitals: Digitals,
  process: Process,
  faq: Faq,
  apply: ApplyCta,
  // from the original /about
  boards: Boards,
  offices: Offices,
  // patterns from studio about pages
  index: Index,
  stats: Stats,
  principles: Principles,
  names: Names,
};

// ---- order ------------------------------------------------------------------
// The first entry opens the page. `true` after a name mirrors it.
//
// Two stories — who the agency is, and how to get on a board — interleaved so
// the scouting brief arrives in the order an applicant needs it: the fee rule
// and the requirements before the digitals, the digitals before what happens
// next, the questions just before the way in. It opens inside the black band
// and comes out onto the paper; the jump links ("index") sit straight under
// it. `promises` is also available, unused here: `principles` carries the
// same four promises with their bodies.
const ORDER = [
  ["approach"],
  ["index"],
  ["bigWord"],
  ["boards"],
  ["strip"],
  ["noFees"],
  ["statement", true],
  ["stats"],
  ["requirements"],
  ["digitals"],
  ["founder"],
  ["process"],
  ["wall", true],
  ["principles"],
  ["team", true],
  ["names"],
  ["offices"],
  ["faq"],
  ["belief"],
  ["apply"],
];

const ORDER_NAMES = ORDER.map(([name]) => name);

export default function AboutNewPage() {
  return (
    <div className="an" data-an-root>
      <AboutMotion />

      {/* ---- header ------------------------------------------------------
          Fixed, white, and differenced against whatever is under it, so it
          reads black on the paper and white on the black band without
          swapping colours. */}
      <header className="an-head an-s">
        <Link href="/" className="an-logo" aria-label="Candor home">
          candor
        </Link>
        <nav className="an-nav" aria-label="Main">
          {c.nav.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={l.current ? "page" : undefined}
              className={l.current ? "is-current" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Link href={c.cta.href} className="an-cta">
          {c.cta.label} <Arrow />
        </Link>
      </header>

      <main>
        {ORDER.map(([name, flip], i) => {
          const Section = SECTIONS[name];
          return <Section key={name} lead={i === 0} flip={!!flip} order={ORDER_NAMES} />;
        })}
      </main>

      {/* ---- footer ------------------------------------------------------ */}
      <footer className="an-foot">
        <div className="an-foot-top an-pad an-grid an-s">
          <div className="an-foot-lead">
            <p className="an-foot-tag">{c.footer.tagline}</p>
            <p className="an-foot-mail">
              {c.footer.bookingsLabel}
              <br />
              <a href={`mailto:${c.footer.bookingsEmail}`} className="an-link-plain">
                {c.footer.bookingsEmail}
              </a>
            </p>
            <NewsletterForm label={c.footer.newsletterLabel} />
          </div>

          <ul className="an-foot-links">
            {c.footer.links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="an-link-plain">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="an-foot-socials">
            {c.footer.socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} className="an-link-plain">
                  {s.label} <Arrow />
                </a>
              </li>
            ))}
          </ul>
          <ul className="an-foot-cities">
            {c.footer.cities.map((city) => (
              <li key={city}>{city}</li>
            ))}
          </ul>
          <ul className="an-foot-legal">
            {c.footer.legal.map((l) => (
              <li key={l.label}>
                {l.href ? (
                  <Link href={l.href} className="an-link-plain">
                    {l.label}
                  </Link>
                ) : (
                  l.label
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="an-foot-mark an-pad" data-an-reveal>
          <FitText className="an-foot-fit" opticalLeft>
            <Chars text={c.footer.wordmark} />
          </FitText>
        </div>
      </footer>
    </div>
  );
}

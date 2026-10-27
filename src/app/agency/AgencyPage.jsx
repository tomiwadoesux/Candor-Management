"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import LogoAnimation from "@/components/LogoAnimation";
import { agency, contactMailto, joinMailto } from "../../../data/agency";

const destinations = [
  { short: "Mo", label: "Models", href: "/models" },
  { short: "Ta", label: "Talents", href: "/talents" },
  { short: "Cr", label: "Creatives", href: "/creatives" },
  { short: "Jo", label: "Join Candor", href: "/get-scouted" },
  { short: "Co", label: "Contact", href: "/contact" },
];

const clamp = (value) => Math.max(0, Math.min(1, value));
// Same corner reveal, cubic falloff and 90ms settling as the model gallery.
// The inner image counter-scales so its subject never shrinks to a thumbnail.
const revealEase = (value) => 1 - (1 - value) ** 3;

// The six faces PEOPLE is made of, one per letter, and the portrait the
// pinned card turns into when a letter is hovered. Darker frames on purpose:
// a pale face inside a letter disappears into the paper.
const PEOPLE = [
  { letter: "P", face: "/photos/img12.jpeg" },
  { letter: "E", face: "/photos/img7.jpeg" },
  { letter: "O", face: "/photos/img1.jpeg" },
  { letter: "P", face: "/photos/img25.jpeg" },
  { letter: "L", face: "/photos/img33.jpeg" },
  { letter: "E", face: "/photos/img14.jpeg" },
];

// Mission, vision and values, in the agency's own words. The mission leads.
const CHAPTERS = [
  {
    id: "mission",
    label: "Our part in it",
    statement: "We develop and represent talent, equipping them with the knowledge to understand their craft and create from a place of candor. We respect individuality and broaden access to opportunity.",
  },
  {
    id: "vision",
    label: "The future we see",
    statement: "A generation of talent equipped to shape global culture through distinct perspectives and empower the next generation through their work.",
  },
  { id: "beliefs", label: "What we believe" },
];
const BELIEFS = [
  ["Development", "We invest in the knowledge, training and experience talents need to understand their craft and create with substance."],
  ["Individuality", "We do not believe talent should be reduced to a type, trend or template."],
  ["Access", "Opportunity should not depend entirely on who you already know."],
  ["Clarity", "Representation should be built on transparent communication, expectations and relationships."],
];

function useAgencyScroll(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    const intro = root.querySelector("[data-introduction]");
    const introStage = root.querySelector("[data-intro-stage]");
    const introFrame = root.querySelector("[data-intro-frame]");
    const introPhoto = root.querySelector("[data-intro-photo]");
    const introPortrait = root.querySelector("[data-intro-portrait]");
    const introCopy = root.querySelector("[data-intro-copy]");
    const introNotes = root.querySelector("[data-intro-notes]");
    const introAside = root.querySelector("[data-intro-aside]");
    const closing = root.querySelector("[data-closing]");
    const sceneFrame = root.querySelector("[data-scene-frame]");
    const scenePhoto = root.querySelector("[data-scene-photo]");
    const sceneCaption = root.querySelector("[data-scene-caption]");
    const lines = [...root.querySelectorAll("[data-line]")];
    const letters = [...root.querySelectorAll("[data-letter]")];
    const peopleLine = root.querySelector("[data-people]");
    const potentialLine = root.querySelector("[data-potential]");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animation = 0;
    let lastTime = 0;
    let dirty = true;
    let disposed = false;
    let lastHold = "";
    let lastTravel = "";
    // Every scroll-driven value is a target the page eases toward, so they
    // all settle together on the same 90ms curve.
    const target = { intro: 0, scene: 0, people: 0, potential: 0, lines: lines.map(() => 0) };
    const shown = { intro: 0, scene: 0, people: 0, potential: 0, lines: lines.map(() => 0) };

    function measure() {
      const height = window.innerHeight;

      // The note beside the portrait (desktop, where it is sticky) rises from
      // near the foot of the screen and lands on the portrait's top edge at
      // the moment the portrait finishes developing; the two then rest
      // together before the stage lets go. `land` is the scroll that takes,
      // and the pin is lengthened, if the copy alone is too short, so the
      // rest lasts a quarter of a screen.
      let land = 0;
      if (getComputedStyle(introAside).position === "sticky") {
        const portraitTop = introPortrait.offsetTop;
        const start = height - introAside.firstElementChild.offsetHeight - introAside.lastElementChild.offsetHeight - 40;
        land = Math.max(1, start - portraitTop);
        const hold = `${Math.max(0, Math.round(land + height * 0.25 - introCopy.offsetHeight))}px`;
        const travel = `${Math.round(land)}px`;
        if (hold !== lastHold) intro.style.setProperty("--ca-intro-hold", (lastHold = hold));
        if (travel !== lastTravel) introNotes.style.setProperty("--ca-aside-travel", (lastTravel = travel));
      } else if (lastHold !== "0px") {
        intro.style.setProperty("--ca-intro-hold", (lastHold = "0px"));
      }

      // The pin lasts until the copy clears and the handoff labels enter.
      // Use the actual layout so wrapping and viewport changes keep that timing.
      const introBox = intro.getBoundingClientRect();
      const pinTravel = introBox.height - introStage.offsetHeight;
      target.intro = clamp(-introBox.top / Math.max(1, land || pinTravel));
      target.scene = clamp(-closing.getBoundingClientRect().top / (height * 0.95));

      // Manifesto: each line is set as it comes up the lower half of the
      // screen; PEOPLE develops as it crosses the middle; POTENTIAL fills in
      // as it rises past the bottom third.
      lines.forEach((line, index) => {
        target.lines[index] = clamp((height - line.getBoundingClientRect().top) / (height * 0.5));
      });
      target.people = clamp((height * 0.8 - peopleLine.getBoundingClientRect().top) / (height * 0.45));
      target.potential = clamp((height * 0.95 - potentialLine.getBoundingClientRect().top) / (height * 0.55));
    }

    function paint() {
      if (reduce.matches) {
        introFrame.style.transform = "none";
        introPhoto.style.transform = "none";
        introFrame.style.opacity = "1";
        sceneFrame.style.transform = "none";
        scenePhoto.style.transform = "none";
        sceneCaption.style.opacity = "1";
        lines.forEach((line) => { line.firstElementChild.style.transform = "none"; });
        letters.forEach((letter) => letter.style.setProperty("--ink", "0"));
        potentialLine.style.setProperty("--fill", "1");
        return;
      }
      const introProgress = revealEase(shown.intro);
      const introScale = 0.72 + 0.28 * introProgress;
      introFrame.style.transform = `scale(${introScale})`;
      introPhoto.style.transform = `scale(${(1 + 0.14 * (1 - introProgress)) / introScale})`;
      // The print sits behind the opening copy, then develops as it clears it.
      introFrame.style.opacity = String(0.18 + 0.82 * shown.intro ** 2);

      const sceneProgress = revealEase(shown.scene);
      const sceneScale = 0.28 + 0.72 * sceneProgress;
      sceneFrame.style.transform = `scale(${sceneScale})`;
      scenePhoto.style.transform = `scale(${(1 + 0.14 * (1 - sceneProgress)) / sceneScale})`;
      sceneCaption.style.opacity = String(clamp((shown.scene - 0.35) / 0.4));

      // Each line rises out of its own baseline and slides the last few
      // degrees into its indent, alternating sides, like type being set.
      lines.forEach((line, index) => {
        const rest = 1 - revealEase(shown.lines[index]);
        const side = index % 2 ? 1 : -1;
        line.firstElementChild.style.transform = rest ? `translate3d(${(side * 6 * rest).toFixed(3)}vw, ${(108 * rest).toFixed(2)}%, 0)` : "";
      });
      // The ink drains out of PEOPLE letter by letter, left to right.
      letters.forEach((letter, index) => {
        letter.style.setProperty("--ink", clamp(1 - (shown.people * 1.6 - index * 0.12)).toFixed(3));
      });
      potentialLine.style.setProperty("--fill", revealEase(shown.potential).toFixed(4));
    }

    function frame(time) {
      animation = 0;
      const elapsed = lastTime ? Math.min(time - lastTime, 48) : 16;
      lastTime = time;
      if (dirty) {
        measure();
        dirty = false;
      }
      const settle = reduce.matches ? 1 : 1 - Math.exp(-elapsed / 90);
      let moving = false;
      const ease = (from, to) => {
        const next = from + (to - from) * settle;
        if (Math.abs(to - next) > 0.0001) { moving = true; return next; }
        return to;
      };
      shown.intro = ease(shown.intro, target.intro);
      shown.scene = ease(shown.scene, target.scene);
      shown.people = ease(shown.people, target.people);
      shown.potential = ease(shown.potential, target.potential);
      shown.lines = shown.lines.map((value, index) => ease(value, target.lines[index]));
      paint();
      if (moving) animation = requestAnimationFrame(frame);
      else lastTime = 0;
    }

    function schedule() {
      if (disposed) return;
      dirty = true;
      if (!animation) animation = requestAnimationFrame(frame);
    }

    measure();
    Object.assign(shown, { ...target, lines: [...target.lines] });
    paint();
    const resize = new ResizeObserver(schedule);
    resize.observe(root);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reduce.addEventListener("change", schedule);
    document.fonts.ready.then(schedule);

    return () => {
      disposed = true;
      cancelAnimationFrame(animation);
      resize.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reduce.removeEventListener("change", schedule);
    };
  }, [rootRef]);
}

// Mission, vision, beliefs. The index on the left stays put while the three
// chapters pass on the right; a blue bar marks the one being read (whichever
// crosses the middle of the screen). Each block rises in once, on arrival.
function Beliefs() {
  const rootRef = useRef(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    const chapters = [...root.querySelectorAll("[data-chapter]")];
    const reveals = [...root.querySelectorAll("[data-reveal]")];
    if (!("IntersectionObserver" in window)) {
      reveals.forEach((element) => { element.dataset.in = ""; });
      return;
    }
    const reading = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(chapters.indexOf(entry.target));
      });
    }, { rootMargin: "-50% 0px -50% 0px" });
    const arriving = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.dataset.in = "";
        arriving.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px" });
    chapters.forEach((chapter) => reading.observe(chapter));
    reveals.forEach((element) => arriving.observe(element));
    return () => { reading.disconnect(); arriving.disconnect(); };
  }, []);

  return (
    <section ref={rootRef} id="agency-mission" className="ca-beliefs" aria-labelledby="beliefs-title">
      <div className="ca-beliefs__head">
        <h2 id="beliefs-title">Our mission</h2>
        <span>(03)</span>
      </div>
      <div className="ca-beliefs__grid">
        <nav className="ca-beliefs__rail" aria-label="Our mission">
          <ol style={{ "--active": active }}>
            {CHAPTERS.map(({ id, label }, index) => (
              <li key={id}>
                <a href={`#belief-${id}`} aria-current={active === index ? "true" : undefined}>
                  <span>0{index + 1}</span>{label}
                </a>
              </li>
            ))}
          </ol>
          <div className="ca-beliefs__motto">
            <p>People<br />Opportunity<br />Culture<br />What’s next</p>
            <p>Candor<br />Management</p>
          </div>
        </nav>
        <div className="ca-beliefs__chapters">
          {CHAPTERS.map(({ id, label, statement }, index) => (
            <article key={id} id={`belief-${id}`} className="ca-beliefs__chapter" data-chapter aria-labelledby={`belief-${id}-title`}>
              <h3 id={`belief-${id}-title`} className="ca-beliefs__label" data-reveal><span>0{index + 1}</span>{label}</h3>
              {statement ? (
                <p className="ca-beliefs__statement" data-reveal>{statement}</p>
              ) : (
                <ol className="ca-beliefs__list">
                  {BELIEFS.map(([title, text], item) => (
                    <li key={title} data-reveal style={{ "--delay": `${item * 70}ms` }}>
                      <span className="ca-beliefs__num">0{item + 1}</span>
                      <h4>{title}</h4>
                      <p>{text}</p>
                    </li>
                  ))}
                </ol>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// We see people before we see potential. The pinned card in the corner turns
// into whichever person's letter is under the pointer.
function Manifesto() {
  const [face, setFace] = useState(-1);
  return (
    <section className="ca-approach" aria-labelledby="approach-title">
      <div className="ca-approach__pin" aria-hidden="true">
        <figure className="ca-approach__portrait">
          <div>
            <Image src="/photos/img19.jpeg" alt="" fill sizes="(max-width: 700px) 30vw, 20vw" data-on={face === -1 ? "" : undefined} />
            {PEOPLE.map(({ face: src }, index) => (
              <Image key={index} src={src} alt="" fill sizes="(max-width: 700px) 30vw, 20vw" data-on={face === index ? "" : undefined} />
            ))}
          </div>
          <figcaption>{face === -1 ? "Candor / A different point of view" : `Candor / People, 0${face + 1} of 06`}</figcaption>
        </figure>
      </div>
      <h2 id="approach-title" className="ca-manifesto" aria-label="We see people before we see potential.">
        <span aria-hidden="true" className="ca-manifesto__we" data-line><span>We</span></span>
        <span aria-hidden="true" className="ca-manifesto__see" data-line><span>see</span></span>
        <span aria-hidden="true" className="ca-manifesto__people" data-line data-people onPointerLeave={() => setFace(-1)}>
          <span>
            {PEOPLE.map(({ letter, face: src }, index) => (
              <span key={index} className="ca-people__letter" data-letter data-on={face === index ? "" : undefined}
                style={{ "--face": `url(${src})` }} onPointerEnter={() => setFace(index)}>{letter}</span>
            ))}
          </span>
        </span>
        <span aria-hidden="true" className="ca-manifesto__before" data-line><span>before</span></span>
        <span aria-hidden="true" className="ca-manifesto__we-see" data-line><span>we see</span></span>
        <span aria-hidden="true" className="ca-manifesto__potential" data-line data-potential><span>potential.</span></span>
      </h2>
      <div className="ca-approach__closing">
        <p>A good introduction begins with who you are. An honest portrait. Your own story. Something only you can bring.</p>
        <Link href="/get-scouted">Introduce yourself <span aria-hidden="true">↗</span></Link>
      </div>
    </section>
  );
}

export default function AgencyPage() {
  const rootRef = useRef(null);
  useAgencyScroll(rootRef);

  return (
    <div ref={rootRef} className="candor-agency">
      <a href="#agency-introduction" className="ca-skip">Skip to content</a>
      <header className="ca-header">
        <Link href="/" className="ca-wordmark" aria-label="Candor home">
          <LogoAnimation tight animate={false} />
        </Link>
      </header>

      <main>
        <section id="agency-introduction" data-introduction className="ca-introduction" aria-labelledby="agency-title">
          <div className="ca-introduction__stage" data-intro-stage>
            <figure className="ca-introduction__portrait" data-intro-portrait>
              <div className="ca-reveal-frame" data-intro-frame>
                <div className="ca-reveal-photo" data-intro-photo>
                  <Image src="/photos/img12.jpeg" alt="A close portrait, looking directly into the camera" fill priority sizes="(max-width: 700px) 72vw, 48vw" />
                </div>
              </div>
              <figcaption><span>A face. A story. A point of view.</span></figcaption>
            </figure>
          </div>
          <div className="ca-introduction__flow">
            <div className="ca-introduction__copy" data-intro-copy>
              <h1 id="agency-title">Candor is a model and talent agency based in <span>Lagos, Manchester and Dallas.</span></h1>
              <p>We bring models, talents and creatives into focus. Different faces, different disciplines, a shared point of view.</p>
              <p>Our name is our approach. Candor means being open and honest — with the people we represent, and the people who book them.</p>
              <p>From the first introduction to the next opportunity, it starts with seeing someone as they are.</p>
              <p className="ca-introduction__label"><a href="#belief-vision">Our vision <span aria-hidden="true">↓</span></a><span>01 / Candor</span></p>
            </div>

            <div className="ca-introduction__notes" data-intro-notes>
              <p className="ca-introduction__footnote">An honest introduction.<br />An open possibility.</p>
              <aside className="ca-introduction__aside" data-intro-aside>
                <p>Models. Talents. Creatives.<br />A different point of view.<br />Est. {agency.founded}.</p>
                <div><span>For the next possibility:</span><a href={contactMailto}>{agency.contact.email}</a></div>
              </aside>
            </div>

            <div className="ca-introduction__handoff">
              <div className="ca-approach__heading"><span>Our point of view</span><span>(02)</span></div>
            </div>
          </div>
        </section>

        <Manifesto />

        <Beliefs />

        <div className="ca-closing" data-closing>
          <section className="ca-scene" aria-label="Three cities, one point of view">
            <div className="ca-scene__frame" data-scene-frame>
              <div className="ca-scene__photo" data-scene-photo>
                <Image src="/photos/img14.jpeg" alt="Fashion portrait of a model in a dark sculptural dress" fill sizes="100vw" />
              </div>
            </div>
            <div className="ca-scene__caption" data-scene-caption>
              <LogoAnimation tight animate={false} className="ca-scene__logo" />
              <h2>Made in Lagos, Manchester and Dallas.</h2>
              <p>A different point of view.<br />One Candor. Since {agency.founded}.</p>
            </div>
            <span className="ca-scene__corner">People make the picture.</span>
          </section>
          <div className="ca-scene-travel" aria-hidden="true" />

          <footer id="agency-contact" className="ca-contact" aria-labelledby="contact-title">
            <div className="ca-contact__eyebrow"><span>Good things start with a conversation.</span><span>(04)</span></div>
            <div className="ca-contact__grid">
              <nav aria-label="Explore Candor" className="ca-links">
                {destinations.map(({ short, label, href }) => (
                  <Link href={href} key={short} className="ca-directory-link" aria-label={label}>
                    <span className="ca-directory-link__short" aria-hidden="true">({short})</span>
                    <span className="ca-directory-link__label">{label} <span aria-hidden="true">↗</span></span>
                  </Link>
                ))}
              </nav>
              <div className="ca-contact__details">
                <h2 id="contact-title">Let’s<br /><span>meet.</span></h2>
                <div className="ca-contact__desk"><h3>Bookings & enquiries</h3><a href={contactMailto}>{agency.contact.email}</a><a href={agency.contact.phoneHref}>{agency.contact.phone}</a></div>
                <div className="ca-contact__desk"><h3>For a new beginning</h3><a href={joinMailto}>{agency.join.email}</a><Link href="/get-scouted">Apply to Candor ↗</Link></div>
                <p className="ca-contact__cities">{agency.offices.map(({ city }) => <span key={city}>{city}</span>)}</p>
              </div>
            </div>
            <div className="ca-colophon"><Link href="/" aria-label="Candor home"><LogoAnimation tight animate={false} /></Link><span>© {new Date().getFullYear()} Candor Management</span><Link href="/privacy">Privacy</Link><a href="#agency-introduction">Back to top ↑</a></div>
          </footer>
        </div>
      </main>
    </div>
  );
}

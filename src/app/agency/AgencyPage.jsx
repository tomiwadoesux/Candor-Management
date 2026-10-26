"use client";

import { useEffect, useRef } from "react";
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

function useAgencyScroll(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    const intro = root.querySelector("[data-introduction]");
    const introStage = root.querySelector("[data-intro-stage]");
    const introFrame = root.querySelector("[data-intro-frame]");
    const introPhoto = root.querySelector("[data-intro-photo]");
    const closing = root.querySelector("[data-closing]");
    const sceneFrame = root.querySelector("[data-scene-frame]");
    const scenePhoto = root.querySelector("[data-scene-photo]");
    const sceneCaption = root.querySelector("[data-scene-caption]");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animation = 0;
    let lastTime = 0;
    let dirty = true;
    let disposed = false;
    let targetIntro = 0;
    let targetScene = 0;
    let shownIntro = 0;
    let shownScene = 0;

    function measure() {
      // The pin lasts until the copy clears and the handoff labels enter.
      // Use the actual layout so wrapping and viewport changes keep that timing.
      const introBox = intro.getBoundingClientRect();
      const pinTravel = introBox.height - introStage.offsetHeight;
      const sceneTop = closing.getBoundingClientRect().top;
      const height = window.innerHeight;
      targetIntro = clamp(-introBox.top / Math.max(1, pinTravel));
      targetScene = clamp(-sceneTop / (height * 0.95));
    }

    function paint() {
      if (reduce.matches) {
        introFrame.style.transform = "none";
        introPhoto.style.transform = "none";
        introFrame.style.opacity = "1";
        sceneFrame.style.transform = "none";
        scenePhoto.style.transform = "none";
        sceneCaption.style.opacity = "1";
        return;
      }
      const introProgress = revealEase(shownIntro);
      const introScale = 0.72 + 0.28 * introProgress;
      introFrame.style.transform = `scale(${introScale})`;
      introPhoto.style.transform = `scale(${(1 + 0.14 * (1 - introProgress)) / introScale})`;
      // The print sits behind the opening copy, then develops as it clears it.
      introFrame.style.opacity = String(0.18 + 0.82 * shownIntro ** 2);

      const sceneProgress = revealEase(shownScene);
      const sceneScale = 0.28 + 0.72 * sceneProgress;
      sceneFrame.style.transform = `scale(${sceneScale})`;
      scenePhoto.style.transform = `scale(${(1 + 0.14 * (1 - sceneProgress)) / sceneScale})`;
      sceneCaption.style.opacity = String(clamp((shownScene - 0.35) / 0.4));
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
      shownIntro += (targetIntro - shownIntro) * settle;
      shownScene += (targetScene - shownScene) * settle;
      const moving = Math.abs(targetIntro - shownIntro) > 0.0001 || Math.abs(targetScene - shownScene) > 0.0001;
      if (!moving) {
        shownIntro = targetIntro;
        shownScene = targetScene;
      }
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
    shownIntro = targetIntro;
    shownScene = targetScene;
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
            <figure className="ca-introduction__portrait">
              <div className="ca-reveal-frame" data-intro-frame>
                <div className="ca-reveal-photo" data-intro-photo>
                  <Image src="/photos/img12.jpeg" alt="A close portrait, looking directly into the camera" fill priority sizes="(max-width: 700px) 72vw, 48vw" />
                </div>
              </div>
              <figcaption><span>A face. A story. A point of view.</span><span>01 / Candor</span></figcaption>
            </figure>
          </div>
          <div className="ca-introduction__flow">
            <div className="ca-introduction__copy">
              <h1 id="agency-title">Candor is a model and talent agency based in <span>Lagos, Manchester and Dallas.</span></h1>
              <p>We bring models, talents and creatives into focus. Different faces, different disciplines, a shared point of view.</p>
              <p>Our name is our approach. Candor means being open and honest — with the people we represent, and the people who book them.</p>
              <p>From the first introduction to the next opportunity, it starts with seeing someone as they are.</p>
            </div>

            <div className="ca-introduction__notes">
              <p className="ca-introduction__footnote">An honest introduction.<br />An open possibility.</p>
              <aside className="ca-introduction__aside">
                <p>Models. Talents. Creatives.<br />A different point of view.<br />Est. {agency.founded}.</p>
                <div><span>For the next possibility:</span><a href={contactMailto}>{agency.contact.email}</a></div>
              </aside>
            </div>

            <div className="ca-introduction__handoff">
              <div className="ca-approach__heading"><span>Our point of view</span><span>(02)</span></div>
            </div>
          </div>
        </section>

        <section className="ca-approach" aria-labelledby="approach-title">
          <div className="ca-approach__pin" aria-hidden="true">
            <figure className="ca-approach__portrait">
              <div><Image src="/photos/img19.jpeg" alt="" fill sizes="(max-width: 700px) 30vw, 20vw" /></div>
              <figcaption>Candor / A different point of view</figcaption>
            </figure>
          </div>
          <h2 id="approach-title" className="ca-manifesto" aria-label="We see people before we see potential.">
            <span aria-hidden="true" className="ca-manifesto__we">We</span>
            <span aria-hidden="true" className="ca-manifesto__see">see</span>
            <span aria-hidden="true" className="ca-manifesto__people">people</span>
            <span aria-hidden="true" className="ca-manifesto__before">before</span>
            <span aria-hidden="true" className="ca-manifesto__we-see">we see</span>
            <span aria-hidden="true" className="ca-manifesto__potential">potential.</span>
          </h2>
          <div className="ca-approach__closing">
            <p>A good introduction begins with who you are. An honest portrait. Your own story. Something only you can bring.</p>
            <Link href="/get-scouted">Introduce yourself <span aria-hidden="true">↗</span></Link>
          </div>
        </section>

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
            <div className="ca-contact__eyebrow"><span>Good things start with a conversation.</span><span>(03)</span></div>
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

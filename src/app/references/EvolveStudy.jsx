"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Image from "next/image";
import "./evolve-study.css";

const SERVICES = [
  {
    title: "Brand Direction", lines: ["Brand", "Direction"], tag: "a",
    image: "brand-direction.webp",
    items: ["Design UX/UI", "Brand Strategy", "Market Positioning", "E-commerce Identity", "Visual Language", "Tone & Messaging", "Digital Storytelling", "Competitive Analysis"],
  },
  {
    title: "Advanced Tech", lines: ["Advanced", "Tech"], tag: "b",
    image: "advanced-tech.webp",
    items: ["E-commerce Development", "Custom Shopify Builds", "Theme Customization", "App Integration", "Performance Optimization", "Headless Commerce", "UX/UI Implementation", "System Integration"],
  },
  {
    title: "Performance Marketing", lines: ["Performance", "Marketing"], tag: "c",
    image: "performance-marketing.webp",
    items: ["Marketing Strategy", "Meta Ads", "Google Ads", "Automated Email Flows", "Audience Segmentation", "Campaign Optimization", "Conversion Rate OPT.", "Remarketing Strategies"],
  },
  {
    title: "Merchant of Record", lines: ["Merchant of Record"], tag: "d",
    image: "merchant-of-record.webp",
    items: ["Global Tax & VAT Handling", "Cross-Border Compliance", "Fraud Prevention", "Store Management", "Local Payment Methods", "Currency & Pricing Management", "Financial Reconciliation", "Customer Service"],
  },
];

const hasHover = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const paragraphWords = (text = "") => text.trim().split(/\s+/).filter(Boolean);
const scrambleWord = (word, seed) => Array.from(word, (letter, index) => {
  if (!/[a-z]/i.test(letter)) return letter;
  const scrambled = String.fromCharCode(97 + (letter.toLowerCase().charCodeAt(0) + index * 7 + seed * 11) % 26);
  return letter === letter.toUpperCase() ? scrambled.toUpperCase() : scrambled;
}).join("");

export default function EvolveStudy({ embedded = false, beliefs = [], previews = [] }) {
  const [active, setActive] = useState(embedded ? 1 : null);
  const [keyboard, setKeyboard] = useState(false);
  const visionPortrait = useRef(null);
  useEffect(() => {
    const portrait = visionPortrait.current;
    if (!portrait) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      portrait.dataset.visible = "true";
      observer.disconnect();
    }, { threshold: 0.25 });
    observer.observe(portrait.parentElement);
    return () => observer.disconnect();
  }, []);
  const Root = embedded ? "section" : "main";
  const Heading = embedded ? "h2" : "h1";
  const Label = embedded ? "h3" : "h2";
  const statement = <Heading id="evolve-statement" className="evolve-statement">We are an eCommerce agency. Not just execution, not isolated services. We provide brand direction, advanced tech, performance marketing and system integration as one connected approach. An end-to-end ecosystem designed to scale, perform and integrate seamlessly with existing platforms.</Heading>;

  function leaveCard(event) {
    // The agency spread keeps the last selected photograph between cards.
    if (embedded) return;
    if (event.pointerType === "touch" || !hasHover()) return;
    // A keyboard-focused card retains its preview when the pointer moves away.
    const focused = event.currentTarget.parentElement.querySelector("button:focus-visible");
    setActive(focused ? Number(focused.dataset.serviceIndex) : null);
  }

  function cardInteractions(index) {
    return {
      onPointerEnter: (event) => {
        if (event.pointerType !== "touch" && hasHover()) {
          setKeyboard(false);
          setActive(index);
        }
      },
      onPointerLeave: leaveCard,
      onFocus: (event) => {
        if (event.currentTarget.matches(":focus-visible")) {
          setKeyboard(true);
          setActive(index);
        }
      },
      onBlur: (event) => {
        if (!embedded && !event.relatedTarget?.closest(".evolve-card")) setActive(null);
      },
      onClick: (event) => {
        if (embedded || !hasHover() || event.detail === 0) {
          setKeyboard(event.detail === 0);
          setActive((current) => embedded ? index : current === index ? null : index);
        }
      },
    };
  }

  return (
    <Root
      id={embedded ? "agency-services" : undefined}
      className={`evolve-study${embedded ? " evolve-study--embedded" : ""}`}
      aria-labelledby={embedded ? "evolve-beliefs-label" : undefined}
      data-active={active !== null}
      data-keyboard={keyboard}
      onKeyDown={(event) => {
        setKeyboard(true);
        if (event.key === "Escape") setActive(embedded ? 1 : null);
      }}
      onPointerDown={(event) => {
        setKeyboard(false);
        if (!embedded && !event.target.closest(".evolve-card")) setActive(null);
      }}
    >
      <div className="evolve-backdrops" aria-hidden="true">
        {SERVICES.map((service, index) => (
          <img
            key={service.tag}
            className="evolve-backdrop"
            data-visible={active === index}
            src={`/reference-study/evolve/${service.image}`}
            alt=""
            loading={embedded ? "lazy" : "eager"}
            decoding="async"
          />
        ))}
      </div>
      {!embedded && <div className="evolve-grid" aria-hidden="true" />}

      {!embedded && <header className="evolve-head">
        <a className="evolve-mark" href="https://madeinevolve.com/" target="_blank" rel="noreferrer" aria-label="Made in Evolve original website">
          <svg viewBox="0 0 134 30" fill="currentColor" aria-hidden="true">
            <path d="M0 0h8v8H0zM18 0h8v8h-8zM0 22h8v8H0zM54 11h8v8h-8zM72 0h8v8h-8zM108 0h8v8h-8zM126 11h8v8h-8z" />
          </svg>
        </a>
        <p className="evolve-head__intro">Ecommerce and brand systems.<br />Driven by visions. Built with design<br />and technology.</p>
        <p className="evolve-head__contact"><a href="mailto:hello@madeinevolve.com">hello@madeinevolve.com</a><br />Modena, EST 2008©</p>
        <a className="evolve-head__source" href="https://madeinevolve.com/" target="_blank" rel="noreferrer">Evolve ↗</a>
      </header>}

      <section className="evolve-services" aria-labelledby={embedded ? "evolve-beliefs-label" : "evolve-statement"}>
        {!embedded && statement}

        <div className="evolve-services__labels">
          <Label id={embedded ? "evolve-beliefs-label" : undefined}>{embedded ? "WHAT WE BELIEVE" : "Our Services"}</Label>
          {!embedded && <span>Est. 2008©</span>}
        </div>
        <div className="evolve-services__body">
          {embedded ? beliefs.map(([title, text], index) => {
            const words = paragraphWords(text);
            const previewLength = paragraphWords((previews[index] || "").replace(/(?:…|\.{3})$/, "")).length;
            return (
            <button key={title} type="button" className="evolve-card evolve-card--belief" data-service-index={index} data-active={active === index} aria-pressed={active === index} aria-labelledby={`evolve-belief-${index}`} aria-describedby={`evolve-belief-copy-${index}`} {...cardInteractions(index)}>
              <span className="evolve-card__placeholder" aria-hidden="true" data-ink-fixed>
                <span className="evolve-card__placeholder-pulse">
                  {words.map((word, wordIndex) => <Fragment key={wordIndex}><span className="evolve-card__placeholder-word" data-preview={wordIndex < previewLength} style={{ "--word-delay": `${Math.max(0, wordIndex - previewLength) * 20}ms` }}>{word}</span>{wordIndex < words.length - 1 ? " " : null}</Fragment>)}
                </span>
              </span>
              <span id={`evolve-belief-copy-${index}`} className="evolve-card__accessible-copy">{text}</span>
              <span className="evolve-card__belief-copy" aria-hidden="true">
                {words.map((word, wordIndex) => (
                  <Fragment key={wordIndex}>
                    <span className="evolve-card__word" data-preview={wordIndex < previewLength} data-scramble-a={scrambleWord(word, wordIndex + 1)} data-scramble-b={scrambleWord(word, wordIndex + 5)} style={{ "--word-delay": `${Math.max(0, wordIndex - previewLength) * 20}ms` }}>
                      <span className="evolve-card__word-text">{word}</span>
                    </span>{wordIndex < words.length - 1 ? " " : null}
                  </Fragment>
                ))}
              </span>
              <span id={`evolve-belief-${index}`} className="evolve-card__title">{title}</span>
            </button>
          );
          }) : SERVICES.map((service, index) => (
            <button
              key={service.tag}
              type="button"
              className="evolve-card"
              data-service-index={index}
              data-active={active === index}
              aria-label={service.title}
              aria-expanded={active === index}
              aria-controls={`evolve-details-${service.tag}`}
              {...cardInteractions(index)}
            >
              <span className="evolve-card__top">
                <span className="evolve-card__title">{service.lines.map((line) => <span key={line}>{line}</span>)}</span>
                <span className="evolve-card__tag" aria-hidden="true">({service.tag}.)</span>
              </span>
              <span id={`evolve-details-${service.tag}`} className="evolve-card__details" aria-hidden={active !== index}>
                {service.items.map((item) => <span key={item}>{item}</span>)}
              </span>
            </button>
          ))}
          {embedded ? (
            <div id="belief-vision" className="evolve-vision" aria-labelledby="evolve-vision-label">
              <div className="evolve-vision__inner">
              <figure ref={visionPortrait} className="evolve-vision__portrait">
                <Image src="/photos/img12.jpeg" alt="A close portrait of a Candor model" fill sizes="(max-width: 700px) 280px, 360px" quality={75} loading="lazy" />
              </figure>
              <p className="evolve-vision__copy">A generation of talent equipped to shape global culture through distinct perspectives and empower the next generation through their work.</p>
              <p className="evolve-vision__label" id="evolve-vision-label">VISION</p>
              </div>
            </div>
          ) : <div className="evolve-description">
            <p>Every eCommerce is already in motion. Processes, people, numbers, decisions. Our job isn’t to sit on top of it. It’s to <strong>step inside.</strong></p>
            <p>We work alongside teams, read the business, identify where energy is being lost and where it needs to be amplified. We don’t operate in silos: <strong>design, technology and marketing move together,</strong> because that’s how growth becomes sustainable.</p>
            <p>With in-house teams collaborating in real time, we reduce friction, align decisions and turn complexity into structure. We don’t add noise. <strong>We bring direction.</strong></p>
          </div>}
        </div>
      </section>
    </Root>
  );
}

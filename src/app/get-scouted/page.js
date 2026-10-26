import Image from "next/image";
import Link from "next/link";
import Header from "../../components/header";
import LogoAnimation from "../../components/LogoAnimation";
import ChromeLink from "../../components/ChromeLink";
import { scouting } from "../../../data/scouting";
import { agency, joinMailto } from "../../../data/agency";
import ApplyForm from "./ApplyForm";
import DigitalGuide from "./DigitalGuide";
import "./scouting.css";

export const metadata = {
  title: "Get Scouted — Candor",
  description: "Apply to be represented by Candor. No fee, no experience needed — six pictures and an honest application.",
};

export default function GetScouted() {
  return (
    <div className="scouting">
      <Header />
      <div className="scout-masthead">
        <Link href="/" aria-label="Candor home"><LogoAnimation animate={false} tight className="w-[124px]" /></Link>
        <nav aria-label="Agency"><ChromeLink href="/about">the agency</ChromeLink><ChromeLink href="/models">our models</ChromeLink></nav>
      </div>
      <main>
        <header className="scout-hero">
          <div className="scout-hero__copy">
            <p className="scout-label">New faces. New possibilities.</p>
            <h1>Get<br />scouted.</h1>
            <p className="scout-hero__intro">{scouting.intro}</p>
            <a className="scout-action" href="#apply">Your story starts here <span aria-hidden="true">↗</span></a>
            <span className="scout-hero__note">No experience needed. No application fee.</span>
          </div>
          <figure className="scout-hero__portrait">
            <div className="scout-hero__image"><Image src="/photos/img19.jpeg" alt="Black and white fashion portrait in profile" fill priority sizes="(min-width: 768px) 43vw, 90vw" /></div>
            <figcaption><span>Candor / A different point of view</span><span>Est. {agency.founded}</span></figcaption>
          </figure>
        </header>

        <nav className="scout-index" aria-label="On this page">
          <a href="#before-you-apply"><span>01</span> Before you apply <span aria-hidden="true">↘</span></a>
          <a href="#your-digitals"><span>02</span> Your digitals <span aria-hidden="true">↘</span></a>
          <a href="#apply"><span>03</span> Introduce yourself <span aria-hidden="true">↘</span></a>
        </nav>

        <section id="before-you-apply" className="scout-section">
          <SectionTitle number="01" title={<>A little<br />about you.</>} label="Before you apply" />
          <div className="scout-section__body">
            <dl className="scout-requirements">
              {scouting.requirements.map(({ label, detail }) => <div key={label}><dt className="scout-label">{label}</dt><dd>{detail}</dd></div>)}
            </dl>
            <p className="scout-small">{scouting.eligibility.note}</p>
            <details className="scout-disclosure">
              <summary>{scouting.noFees.heading}<span aria-hidden="true">+</span></summary>
              <div><p>{scouting.noFees.body}</p><a href={joinMailto}>{agency.join.email}</a></div>
            </details>
          </div>
        </section>

        <section id="your-digitals" className="scout-section scout-section--digitals">
          <SectionTitle number="02" title={<>Simply<br />yourself.</>} label="Your digitals" />
          <div className="scout-section__body"><p className="scout-body">{scouting.digitals.intro}</p><p className="scout-small">Use the framing guides below. You don&rsquo;t need a professional shoot.</p></div>
          <ol className="scout-digitals">
            {scouting.digitals.shots.map(({ shot, guidance }, index) => <li key={shot}>
              <div className="scout-digital__frame"><span className="scout-digital__number">{String(index + 1).padStart(2, "0")}</span><DigitalGuide pose={index} /></div>
              <h3>{shot}</h3><p>{guidance}</p>
            </li>)}
          </ol>
          <details className="scout-disclosure scout-avoid"><summary>What to leave out<span aria-hidden="true">+</span></summary><ul>{scouting.notLookingFor.map((item) => <li key={item}>{item}</li>)}</ul></details>
        </section>

        <section id="apply" className="scout-section scout-section--apply">
          <div className="scout-apply-aside">
            <SectionTitle number="03" title={<>Let&rsquo;s<br />meet you.</>} label="Your application" />
            <p className="scout-body">A few details to get to know you.<br />An honest introduction is enough.</p>
            <div className="scout-questions"><span className="scout-label">A question before you start?</span><ChromeLink href={joinMailto}>{agency.join.email}</ChromeLink></div>
          </div>
          <div className="scout-section__body"><ApplyForm minAge={scouting.eligibility.minAge} /></div>
        </section>

        <section className="scout-next">
          <div className="scout-next__heading"><span className="scout-label">After your application</span><h2>What comes next.</h2></div>
          <ol>{scouting.process.map(({ step, detail }, index) => <li key={step}><span className="scout-label">{String(index + 1).padStart(2, "0")}</span><h3>{step}</h3><p>{detail}</p></li>)}</ol>
        </section>
        {scouting.openCalls.length > 0 && <section className="scout-section"><h2>Open calls</h2><ul>{scouting.openCalls.map((call) => <li key={`${call.city}-${call.date}`}>{call.city} — {call.date}, {call.venue}</li>)}</ul></section>}
      </main>
      <footer className="scout-footer"><Link href="/" aria-label="Candor home"><LogoAnimation animate={false} tight className="w-[124px]" /></Link><p>Lagos. Manchester. Dallas.</p><ChromeLink href="/privacy">privacy</ChromeLink></footer>
    </div>
  );
}

function SectionTitle({ number, title, label }) {
  return <div className="scout-section-title"><p className="scout-label"><span>{number}</span>{label}</p><h2>{title}</h2></div>;
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LogoAnimation from "@/components/LogoAnimation";
import { agency, contactMailto, divisions, joinMailto } from "../../../data/agency";

// The agency page's last section, (04), in three takes behind a switcher
// (top right) so they can be compared in place. Each take is self-contained:
// keep the chosen one, delete the other two and OPTIONS. Styles live in
// contact-sheet.css, one block per take.
//
//   Index  — "Let's meet." across the whole width, then the destinations as
//            full-width rows that fill with paper on hover, then the desks.
//   Letter — a letter: the headline beside a paragraph that is the contact
//            details, the destinations as one line of large links, and the
//            wordmark sunk into the foot of the page.
//   Desk   — the three offices as clocks: each city's local time, live, and
//            whether someone is at the desk to pick up.

const OPTIONS = ["Index", "Letter", "Desk"];

const DESTINATIONS = [
  ...divisions.map(({ label, href, sublabels }) => ({ label, href, note: sublabels.join(", ") })),
  { label: "Join Candor", href: "/get-scouted", note: "Ask to be represented" },
  { label: "Contact", href: "/contact", note: "Bookings, press and everything else" },
];

const DAY = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// An office's local time and whether its desk is open, from its IANA zone
// and its hours (data/agency.js).
function deskTime(office, now) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: office.timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now).map(({ type, value }) => [type, value]));
  const time = `${parts.hour}:${parts.minute}`;
  const { days, open, close } = office.hours;
  const isOpen = days.includes(DAY[parts.weekday]) && time >= open && time < close;
  return { time, status: isOpen ? `Open · until ${close}` : `Closed · opens ${open}`, isOpen };
}

function Eyebrow() {
  return <div className="cs-eyebrow"><span>Good things start with a conversation.</span><span>(04)</span></div>;
}

function Desks() {
  return (
    <>
      <div className="cs-desk-col">
        <h3>Bookings & enquiries</h3>
        <a href={contactMailto}>{agency.contact.email}</a>
        <a href={agency.contact.phoneHref}>{agency.contact.phone}</a>
      </div>
      <div className="cs-desk-col">
        <h3>For a new beginning</h3>
        <a href={joinMailto}>{agency.join.email}</a>
        <Link href="/get-scouted">Apply to Candor ↗</Link>
      </div>
    </>
  );
}

function Colophon() {
  return (
    <div className="ca-colophon">
      <Link href="/" aria-label="Candor home"><LogoAnimation tight animate={false} /></Link>
      <span>© {new Date().getFullYear()} Candor Management</span>
      <Link href="/privacy">Privacy</Link>
      <a href="#agency-introduction">Back to top ↑</a>
    </div>
  );
}

function Index() {
  return (
    <div className="cs-index">
      <Eyebrow />
      <h2 id="contact-title" className="cs-index__title">Let’s <em>meet.</em></h2>
      <nav aria-label="Explore Candor" className="cs-index__list">
        {DESTINATIONS.map(({ label, href, note }, index) => (
          <Link key={href} href={href} className="cs-row">
            <span className="cs-row__num">0{index + 1}</span>
            <span className="cs-row__label">{label}</span>
            <span className="cs-row__note">{note}</span>
            <span className="cs-row__arrow" aria-hidden="true">↗</span>
          </Link>
        ))}
      </nav>
      <div className="cs-index__desks">
        <Desks />
        <div className="cs-desk-col">
          <h3>Offices</h3>
          {agency.offices.map(({ city, country }) => <span key={city}>{city}, {country}</span>)}
        </div>
        <div className="cs-desk-col">
          <h3>Follow</h3>
          {agency.socials.map(({ label, href }) => <a key={label} href={href}>{label}</a>)}
        </div>
      </div>
    </div>
  );
}

function Letter() {
  return (
    <div className="cs-letter">
      <Eyebrow />
      <div className="cs-letter__grid">
        <h2 id="contact-title" className="cs-letter__title">Let’s<br /><em>meet.</em></h2>
        <div className="cs-letter__body">
          <p>
            For bookings and enquiries, write to <a href={contactMailto}>{agency.contact.email}</a> or
            call <a href={agency.contact.phoneHref}>{agency.contact.phone}</a>. To be represented,
            write to <a href={joinMailto}>{agency.join.email}</a>, or <Link href="/get-scouted">apply to Candor</Link>.
          </p>
          <p className="cs-letter__sign">Candor Management — {agency.offices.map(({ city }) => city).join(", ")}. Since {agency.founded}.</p>
        </div>
      </div>
      <nav aria-label="Explore Candor" className="cs-letter__nav">
        {DESTINATIONS.map(({ label, href }) => <Link key={href} href={href}>{label}</Link>)}
      </nav>
      <div className="cs-letter__mark" aria-hidden="true"><LogoAnimation tight animate={false} /></div>
    </div>
  );
}

function Desk() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const tick = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(tick);
  }, []);

  return (
    <div className="cs-desk">
      <Eyebrow />
      <div className="cs-desk__head">
        <h2 id="contact-title" className="cs-desk__title">Let’s <em>meet.</em></h2>
        <nav aria-label="Explore Candor" className="cs-desk__nav">
          {DESTINATIONS.map(({ label, href }) => <Link key={href} href={href}>{label} <span aria-hidden="true">↗</span></Link>)}
        </nav>
      </div>
      <ul className="cs-desk__cities">
        {agency.offices.map((office) => {
          const desk = now && deskTime(office, now);
          return (
            <li key={office.city} data-open={desk?.isOpen || undefined}>
              <span className="cs-desk__city">{office.city}</span>
              <span className="cs-desk__country">{office.country}</span>
              <span className="cs-desk__time">{desk ? desk.time : "--:--"}</span>
              <span className="cs-desk__status">{desk ? desk.status : " "}</span>
            </li>
          );
        })}
      </ul>
      <div className="cs-desk__lines"><Desks /></div>
    </div>
  );
}

const TAKES = { Index, Letter, Desk };

export default function ContactSheet() {
  const [take, setTake] = useState(OPTIONS[0]);
  const Take = TAKES[take];

  return (
    <footer id="agency-contact" className={`cs cs--${take.toLowerCase()}`} aria-labelledby="contact-title">
      <div className="cs-switch" role="group" aria-label="Contact section design">
        {OPTIONS.map((name) => (
          <button key={name} type="button" aria-pressed={take === name} onClick={() => setTake(name)}>{name}</button>
        ))}
      </div>
      <Take />
      <Colophon />
    </footer>
  );
}

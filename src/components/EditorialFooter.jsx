import Link from "next/link";
import LogoAnimation from "./LogoAnimation";
import { agency, contactMailto, divisions, joinMailto } from "../../data/agency";
import s from "./EditorialFooter.module.css";

function FooterLink({ href, children, className = "", ...props }) {
  return (
    <Link href={href} className={`${s.link} ${className}`} {...props}>
      <span className={s.linkText}>{children}</span>
      <svg className={s.arrow} viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M2 10 10 2M3 2h7v7" stroke="currentColor" strokeWidth="1.1" />
      </svg>
    </Link>
  );
}

// Social destinations are optional until the agency data contains real URLs.
// Never send a footer link to the placeholder "#".
const socialLinks = agency.socials.filter(({ href }) => /^https?:\/\//.test(href));
const secondaryLinks = [
  ...(socialLinks.length
    ? socialLinks
    : [{ label: "Agency", href: "/agency" }, { label: "Contact", href: "/contact" }]),
  { label: "Privacy", href: "/privacy" },
];

export default function EditorialFooter() {
  return (
    <footer id="credits" className={s.footer} data-editorial-footer data-ink-fixed="" aria-label="Candor Management">
      <div className={s.grid}>
        <div className={s.identity}>
          <Link href="/agency" className={s.brand}>{agency.legalName}</Link>
          <p className={s.statement}>
            <span className={s.desktop}>Representing models,<br />talents and creatives.</span>
            <span className={s.compact}>Models,<br />talents and<br />creatives.</span>
          </p>
          <p className={s.founded}>Since {agency.founded}</p>
        </div>

        <section className={`${s.block} ${s.bookings} ${s.right}`} aria-labelledby="footer-bookings">
          <h2 id="footer-bookings" className={s.label}>
            <span className={s.desktop}>Bookings &amp; enquiries</span>
            <span className={s.compact}>Bookings</span>
          </h2>
          <p className={`${s.description} ${s.desktop}`}>For bookings, casting and collaborations.</p>
          <FooterLink href={contactMailto} className={s.email}>
            <span className={s.desktop}>{agency.contact.email}</span>
            <span className={s.compact}>Email the agency</span>
          </FooterLink>
          <FooterLink href={agency.contact.phoneHref} className={`${s.phone} ${s.desktop}`}>
            {agency.contact.phone}
          </FooterLink>
        </section>

        <nav className={`${s.block} ${s.roster}`} aria-label="Explore the roster">
          <h2 className={s.label}>Explore the roster</h2>
          <ul>
            {divisions.map(({ label, href }) => (
              <li key={href}><FooterLink href={href}>{label}</FooterLink></li>
            ))}
          </ul>
        </nav>

        <section className={`${s.block} ${s.representation} ${s.right}`} aria-labelledby="footer-representation">
          <h2 id="footer-representation" className={s.label}>Representation</h2>
          <p className={`${s.description} ${s.desktop}`}>For models and talent seeking representation.</p>
          <FooterLink href={joinMailto} className={s.email}>
            <span className={s.desktop}>{agency.join.email}</span>
            <span className={s.compact}>Get represented</span>
          </FooterLink>
          <FooterLink href="/get-scouted" className={s.scouted}>Get scouted</FooterLink>
        </section>

        {/* Reserved for the future collage. Intentionally empty and decorative. */}
        <div className={s.artwork} data-footer-artwork aria-hidden="true" />

        <ul className={s.locations} aria-label="Candor locations">
          {agency.offices.map(({ city }) => <li key={city}>{city}</li>)}
        </ul>
        <nav className={`${s.secondary} ${s.right}`} aria-label="Agency links">
          <ul>
            {secondaryLinks.map(({ label, href }) => (
              <li key={href}><FooterLink href={href}>{label}</FooterLink></li>
            ))}
          </ul>
        </nav>
      </div>

      <Link href="/" className={s.wordmark} aria-label="Candor home">
        <LogoAnimation animate={false} tight />
      </Link>
    </footer>
  );
}

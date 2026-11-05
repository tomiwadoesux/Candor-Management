"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoAnimation from "./LogoAnimation";
import ChromeLink from "./ChromeLink";
import { agency, joinMailto } from "../../data/agency";
import s from "./SiteFooter.module.css";

const [mailbox, domain] = agency.join.email.split("@");

export default function SiteFooter() {
  const pathname = usePathname();
  const section = pathname?.split("/")[1] || "home";

  if (section === "prototypes" || section === "references") return null;

  return (
    <footer className={s.footer} data-site-footer data-section={section} data-ink-fixed="" aria-label="Candor Management">
      <div className={s.identity}>
        <Link href="/" className={s.wordmark} aria-label="Candor home">
          <LogoAnimation animate={false} tight />
        </Link>
        <div className={s.contact}>
          <ChromeLink href={joinMailto} className={s.link} aria-label={agency.join.email}>
            <span>{mailbox}@<wbr />{domain}</span>
          </ChromeLink>
          <ChromeLink href="/get-scouted" className={s.link}>submit polaroids</ChromeLink>
        </div>
      </div>

      <div className={s.legal}>
        <nav className={s.policies} aria-label="Legal">
          {/* No Terms destination has been supplied; do not create a dead link. */}
          <span className={s.pending} role="link" aria-disabled="true">terms &amp; conditions</span>
          <ChromeLink href="/privacy" className={s.link}>privacy policy</ChromeLink>
        </nav>
        <p className={s.copyright}>
          <span>© {new Date().getFullYear()} {agency.legalName}</span>
          <span>All rights reserved.</span>
        </p>
      </div>
    </footer>
  );
}

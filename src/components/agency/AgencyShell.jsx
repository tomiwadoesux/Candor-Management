import Link from "next/link";
import Header from "@/components/header";
import LogoAnimation from "@/components/LogoAnimation";
import ChromeLink from "@/components/ChromeLink";
import { LocalClock } from "./Clock";
import { agency, divisions, joinMailto, contactMailto, legal } from "../../../data/agency";

// The frame shared by /about, /contact and /privacy: the wordmark and the
// three agency links across the top, the page, then a footer that carries the
// offices, the two inboxes and the company's registered details.
//
// `overlay` lays the top row over the page instead of above it, for a page
// that opens on a full-bleed image (About).

export const AGENCY_PAGES = [
  { key: "about", label: "About", href: "/about" },
  { key: "contact", label: "Contact", href: "/contact" },
  { key: "privacy", label: "Privacy", href: "/privacy" },
];

export default function AgencyShell({ current, overlay = false, children }) {
  return (
    <div className="agency relative">
      <Header />

      <div
        className={`${
          overlay ? "absolute inset-x-0 top-0" : "relative"
        } z-20 flex h-14 items-center justify-between px-4`}
      >
        <Link
          href="/"
          aria-label="CANDOR home"
          className="block w-fit text-[var(--ag-ink)]"
        >
          <LogoAnimation animate={false} tight className="w-[110px]" />
        </Link>

        <nav aria-label="Agency" className="flex items-center gap-5 text-[15px]">
          {AGENCY_PAGES.map((p) => (
            <span
              key={p.key}
              className={p.key === current ? "" : "opacity-50"}
            >
              <ChromeLink
                href={p.href}
                aria-current={p.key === current ? "page" : undefined}
              >
                {p.label}
              </ChromeLink>
            </span>
          ))}
        </nav>
      </div>

      <main>{children}</main>

      <AgencyFooter />
    </div>
  );
}

function AgencyFooter() {
  const year = new Date().getFullYear();

  // Only the registered details that actually exist are printed — see the
  // note on `legal` in data/agency.js.
  const registered = [
    legal.companyNumber && `Company no. ${legal.companyNumber}`,
    legal.placeOfRegistration && `Registered in ${legal.placeOfRegistration}`,
    legal.registeredOffice && `Registered office: ${legal.registeredOffice}`,
  ].filter(Boolean);

  return (
    <footer className="mx-4 mt-32 border-t border-[var(--ag-rule)] pt-6 text-[13px] md:mt-48">
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-12">
        {/* Offices, each with its own local time — the quickest answer to
            "is anyone there right now?" */}
        <div className="col-span-2 md:col-span-4">
          <h2 className="ag-label">Offices</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {agency.offices.map((o) => (
              <li
                key={o.city}
                className="grid grid-cols-[1fr_auto] items-baseline gap-4 border-b border-[var(--ag-rule)] pb-2"
              >
                <span>
                  <span className="text-[var(--ag-ink)]">{o.city}</span>
                  <span className="text-[var(--ag-faint)]">, {o.country}</span>
                </span>
                <LocalClock
                  timeZone={o.timeZone}
                  city={o.city}
                  className="text-[var(--ag-mute)]"
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-2 md:col-span-3 md:col-start-6">
          <h2 className="ag-label">Write to us</h2>
          <div className="mt-4 flex flex-col gap-3 text-[var(--ag-mute)]">
            <div>
              <p className="text-[12px] text-[var(--ag-faint)]">Bookings</p>
              <a className="ag-link break-all" href={contactMailto}>
                {agency.contact.email}
              </a>
            </div>
            <div>
              <p className="text-[12px] text-[var(--ag-faint)]">Representation</p>
              <a className="ag-link break-all" href={joinMailto}>
                {agency.join.email}
              </a>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <h2 className="ag-label">Boards</h2>
          <ul className="mt-4 flex flex-col gap-1.5">
            {divisions.map((d) => (
              <li key={d.slug}>
                <ChromeLink href={d.href}>{d.label}</ChromeLink>
              </li>
            ))}
            <li>
              <ChromeLink href="/get-scouted">Get scouted</ChromeLink>
            </li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <h2 className="ag-label">Agency</h2>
          <ul className="mt-4 flex flex-col gap-1.5">
            {AGENCY_PAGES.map((p) => (
              <li key={p.key}>
                <ChromeLink href={p.href}>{p.label}</ChromeLink>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-14 flex flex-col gap-1 text-[12px] text-[var(--ag-faint)] md:flex-row md:flex-wrap md:gap-x-6">
        <span>
          © {year} {legal.registeredName}
        </span>
        {registered.map((line) => (
          <span key={line}>{line}</span>
        ))}
        <span className="md:ml-auto">Est. {agency.founded}</span>
      </div>
    </footer>
  );
}

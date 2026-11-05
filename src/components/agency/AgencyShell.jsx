import Link from "next/link";
import Header from "@/components/header";
import LogoAnimation from "@/components/LogoAnimation";
import ChromeLink from "@/components/ChromeLink";

// The frame shared by the contact and privacy pages: the wordmark, agency
// navigation and page content. The root layout supplies the site footer.
//
// `overlay` lays the top row over the page instead of above it, for a page
// that opens on a full-bleed image (About).

export const AGENCY_PAGES = [
  { key: "about", label: "About", href: "/agency" },
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
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import "../../styles/agency.css";
import AgencyShell from "@/components/agency/AgencyShell";
import RiseText from "@/components/agency/RiseText";
import DarkroomPrint from "@/components/agency/DarkroomPrint";
import { LocalClock, OfficeStatus, ZoneLabel } from "@/components/agency/Clock";
import { coordsLabel } from "@/components/agency/officeTime";
import ChromeLink from "@/components/ChromeLink";
import { about } from "../../../data/about";
import { agency, divisions } from "../../../data/agency";
import { models } from "../../../data/models";

export const metadata = {
  title: "About — Candor",
  description:
    "Candor is a model and talent agency in Lagos, Manchester and Dallas. No fees, every application read by a person, and an honest answer.",
};

// /about — what the agency is, in the order a visitor asks it: what does the
// name mean, what do you stand for, who do you represent, where are you, and
// what do I do next. The copy lives in data/about.js; the boards, the cities
// and the counts come from the same data the rest of the site reads, so this
// page cannot drift from the boards it describes.

// How many people each board carries, counted from the roster rather than
// typed, so the numbers move when the roster does.
const counts = models.reduce((acc, m) => {
  acc[m.division] = (acc[m.division] || 0) + 1;
  return acc;
}, {});

export default function AboutPage() {
  return (
    <AgencyShell current="about" overlay>
      {/* ---- the name ------------------------------------------------------
          The darkroom print fills the screen; the word sits on the scrim the
          shader darkens along the bottom edge. */}
      <section className="relative h-[100svh] min-h-[640px] overflow-hidden">
        <DarkroomPrint prints={about.prints} />

        {/* pb clears the fixed search island (20px off the bottom, ~46px
            tall), which is centred and would otherwise sit across the end of
            the word on a laptop-width screen. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-4 pb-[92px]">
          <div className="grid grid-cols-12 items-end gap-x-4 gap-y-6">
            <RiseText
              className="ag-display ag-xl col-span-12 -ml-[0.05em] lg:col-span-8"
              lines={[about.word]}
            />
            <div className="col-span-12 sm:col-span-8 md:col-span-6 lg:col-span-4 lg:pb-[1.4vw]">
              <p className="ag-display ag-s">
                can·dor{" "}
                <span style={{ color: "var(--ag-mute)" }}>{about.pronunciation}</span>
              </p>
              <p className="ag-body pt-2">{about.sense}</p>
              <p className="ag-body pt-4" style={{ color: "var(--ag-ink)" }}>
                {about.line}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---- what the name commits us to ----------------------------------- */}
      <section className="px-4 pt-28 md:pt-44">
        <div className="grid grid-cols-12 gap-x-4 gap-y-6">
          <p className="ag-label col-span-12 md:col-span-3">What the name means</p>
          <p className="ag-display ag-m ag-in col-span-12 md:col-span-9 md:max-w-[24ch]">
            {about.statement}
          </p>
        </div>

        {/* Four promises, set as a 2 × 2 sheet between hairlines. Not
            numbered: they are not steps, and none ranks above another. */}
        <ul className="mt-20 grid grid-cols-1 gap-x-4 md:mt-28 md:grid-cols-12">
          {about.principles.map((p, i) => (
            <li
              key={p.title}
              className={`ag-in border-t border-[var(--ag-rule)] pb-10 pt-5 md:col-span-6 md:pb-14 ${
                i % 2 ? "md:col-start-7" : "md:col-start-1"
              }`}
            >
              <h2 className="ag-display ag-s">{p.title}</h2>
              <p className="ag-body pt-3">{p.body}</p>
              {p.link && (
                <ChromeLink href={p.link.href} className="mt-4 text-[15px]">
                  {p.link.label}
                </ChromeLink>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* ---- the boards ----------------------------------------------------
          Each row is a link to its board. On hover the label steps aside and
          a portrait opens beside it, taller than the row so it breaks the
          hairlines above and below — positioned, so it never sets the row's
          height while it is closed. */}
      <section className="px-4 pt-20 md:pt-32">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="ag-label">The boards</h2>
          <p className="ag-label ag-num">
            {models.length} represented across {divisions.length} boards
          </p>
        </div>

        <ul className="mt-6 border-b border-[var(--ag-rule)]">
          {divisions.map((d) => (
            <li key={d.slug} className="border-t border-[var(--ag-rule)]">
              <Link
                href={d.href}
                className="ag-div group relative grid grid-cols-12 items-end gap-x-4 gap-y-3 py-6 md:py-8"
              >
                <span className="ag-display ag-l col-span-12 md:col-span-6">
                  <span className="ag-div-label">{d.label}</span>
                </span>

                {/* The hover portrait. Desktop only — on touch there is no
                    hover, and the row is a plain link. */}
                <span className="ag-div-img pointer-events-none absolute left-[41%] top-1/2 z-10 hidden aspect-[3/4] h-[150%] -translate-y-1/2 overflow-hidden md:block">
                  <Image
                    src={about.divisionImages[d.slug]}
                    alt=""
                    fill
                    sizes="16vw"
                    className="object-cover"
                  />
                </span>

                <span
                  className="col-span-8 text-[13px] leading-[1.5] md:col-span-4 md:col-start-8"
                  style={{ color: "var(--ag-mute)" }}
                >
                  {d.sublabels.join(" · ")}
                </span>
                <span className="ag-num col-span-4 text-right text-[13px] md:col-span-1 md:col-start-12">
                  {counts[d.division] || 0}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ---- the cities ---------------------------------------------------- */}
      <section className="px-4 pt-28 md:pt-40">
        <h2 className="ag-label">Where we are</h2>
        <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-14 md:grid-cols-3">
          {agency.offices.map((o) => (
            <div key={o.city} className="ag-in border-t border-[var(--ag-rule)] pt-5">
              <h3 className="ag-display ag-m">{o.city}</h3>
              <p className="pt-2 text-[13px]" style={{ color: "var(--ag-mute)" }}>
                {o.country}
              </p>

              <LocalClock
                timeZone={o.timeZone}
                city={o.city}
                className="mt-10 block text-[44px] font-light leading-none tracking-[-0.02em] md:text-[56px]"
              />
              <OfficeStatus office={o} className="mt-3 text-[13px]" />

              <p className="ag-num pt-8 text-[12px]" style={{ color: "var(--ag-faint)" }}>
                {coordsLabel(o.coords)} <span aria-hidden="true">·</span>{" "}
                <ZoneLabel timeZone={o.timeZone} />
              </p>
              <ChromeLink
                href={`/contact#${o.city.toLowerCase()}`}
                className="mt-4 text-[15px]"
              >
                {`The ${o.city} desk`}
              </ChromeLink>
            </div>
          ))}
        </div>
      </section>

      {/* ---- what next ------------------------------------------------------
          The page ends on the two reasons anyone is here. */}
      <section className="px-4 pt-28 md:pt-44">
        <div className="grid grid-cols-1 gap-x-4 gap-y-16 md:grid-cols-2">
          {[about.close.clients, about.close.talent].map((c) => (
            <div key={c.label} className="ag-in border-t border-[var(--ag-rule)] pt-5">
              <p className="ag-label">{c.label}</p>
              <h2 className="ag-display ag-l pt-6">{c.title}</h2>
              <p className="ag-body pt-5">{c.body}</p>
              <ChromeLink href={c.link.href} className="mt-6 text-[17px]">
                {c.link.label}
              </ChromeLink>
            </div>
          ))}
        </div>
      </section>
    </AgencyShell>
  );
}

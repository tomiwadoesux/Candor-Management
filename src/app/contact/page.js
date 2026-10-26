import "../../styles/agency.css";
import AgencyShell from "@/components/agency/AgencyShell";
import RiseText from "@/components/agency/RiseText";
import DayStrip from "@/components/agency/DayStrip";
import CopyEmail from "@/components/agency/CopyEmail";
import { LocalClock, OfficeStatus, ZoneLabel } from "@/components/agency/Clock";
import { coordsLabel } from "@/components/agency/officeTime";
import ChromeLink from "@/components/ChromeLink";
import { contact } from "../../../data/contact";
import { agency, mailtoWith } from "../../../data/agency";

export const metadata = {
  title: "Contact — Candor",
  description:
    "Bookings, representation and press for Candor, a model and talent agency in Lagos, Manchester and Dallas.",
};

// /contact — routed by reason, not by department. A visitor knows why they
// are writing, not which inbox handles it, so the page asks the first and
// answers the second: three reasons, each with the address and a subject
// line already filled in. Below that, the three desks on the visitor's own
// clock, and the scam notice.

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// "Mon–Fri" for a run of days, otherwise a list.
function daysLabel(days = []) {
  if (!days.length) return "Closed";
  const sorted = [...days].sort((a, b) => a - b);
  const run = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1);
  return run && sorted.length > 2
    ? `${DAY_NAMES[sorted[0]]}–${DAY_NAMES[sorted[sorted.length - 1]]}`
    : sorted.map((d) => DAY_NAMES[d]).join(", ");
}

export default function ContactPage() {
  return (
    <AgencyShell current="contact">
      {/* ---- the word ------------------------------------------------------ */}
      <section className="px-4 pt-10 md:pt-16">
        <div className="grid grid-cols-12 items-end gap-x-4 gap-y-6">
          <RiseText
            className="ag-display ag-xl col-span-12 -ml-[0.05em] lg:col-span-8"
            lines={["Contact"]}
          />
          <p
            className="ag-body col-span-12 sm:col-span-9 lg:col-span-4 lg:pb-[1.4vw]"
            style={{ color: "var(--ag-ink)" }}
          >
            {contact.intro}
          </p>
        </div>
      </section>

      {/* ---- why you're writing --------------------------------------------- */}
      <section className="px-4 pt-20 md:pt-28" aria-labelledby="routes">
        <h2 id="routes" className="ag-label">
          Write to us about
        </h2>
        <div className="grid grid-cols-1 gap-x-4 gap-y-12 pt-6 md:grid-cols-3">
          {contact.routes.map((r) => {
            const inbox = agency[r.inbox];
            return (
              <article
                key={r.key}
                id={r.key}
                className="ag-in flex flex-col border-t border-[var(--ag-rule)] pt-5"
              >
                <h3 className="ag-display ag-m">{r.title}</h3>
                <p className="ag-body pt-4">{r.body}</p>
                <div className="flex flex-col gap-2 pt-6 text-[15px]">
                  <CopyEmail email={inbox.email} href={mailtoWith(inbox.email, r.subject)} />
                  {r.phone && (
                    <a className="ag-link ag-num w-fit" href={inbox.phoneHref}>
                      {inbox.phone}
                    </a>
                  )}
                </div>
                {r.link && (
                  <ChromeLink href={r.link.href} className="mt-6 text-[17px]">
                    {r.link.label}
                  </ChromeLink>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* ---- the desks, on your clock --------------------------------------- */}
      <section className="px-4 pt-24 md:pt-36" aria-labelledby="desks">
        <div className="grid grid-cols-12 items-end gap-x-4 gap-y-4">
          <h2 id="desks" className="ag-display ag-l col-span-12 lg:col-span-7">
            Who&rsquo;s in
          </h2>
          <p className="ag-body col-span-12 lg:col-span-5 lg:pb-[0.6vw]">
            Three offices, three time zones. The strip shows when each desk is
            open, in your time, and when all three overlap.
          </p>
        </div>
        <div className="ag-in pt-10">
          <DayStrip offices={agency.offices} />
        </div>
      </section>

      {/* ---- the offices ------------------------------------------------------
          Anchored by city (/contact#lagos), which /about links to. */}
      <section className="px-4 pt-24 md:pt-36" aria-label="Offices">
        <div className="grid grid-cols-1 gap-x-4 gap-y-14 md:grid-cols-3">
          {agency.offices.map((o) => (
            <div
              key={o.city}
              id={o.city.toLowerCase()}
              className="ag-in scroll-mt-8 border-t border-[var(--ag-rule)] pt-5"
            >
              {/* ag-m, not ag-l: "Manchester" at the larger size outgrows a
                  third of a laptop screen and runs into "Dallas". */}
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

              <dl className="grid grid-cols-[88px_1fr] gap-y-1.5 pt-8 text-[13px]">
                {/* Printed only once data/agency.js has a street address —
                    see the note there on why one is required. */}
                {o.address && (
                  <>
                    <dt style={{ color: "var(--ag-faint)" }}>Address</dt>
                    <dd className="whitespace-pre-line">{o.address}</dd>
                  </>
                )}
                <dt style={{ color: "var(--ag-faint)" }}>Hours</dt>
                <dd className="ag-num">
                  {daysLabel(o.hours?.days)}, {o.hours?.open}–{o.hours?.close}
                </dd>
                <dt style={{ color: "var(--ag-faint)" }}>Time zone</dt>
                <dd>
                  <ZoneLabel timeZone={o.timeZone} />
                </dd>
                <dt style={{ color: "var(--ag-faint)" }}>Position</dt>
                <dd className="ag-num">{coordsLabel(o.coords)}</dd>
              </dl>

              {/* No per-office inbox exists, so this goes to the client
                  address with the city in the subject line, which is all the
                  routing a booker needs. */}
              <ChromeLink
                href={mailtoWith(agency.contact.email, `${o.city} booking`)}
                className="mt-6 text-[15px]"
              >
                {`Write to the ${o.city} desk`}
              </ChromeLink>
            </div>
          ))}
        </div>
      </section>

      {/* ---- the scam notice --------------------------------------------------
          Set apart by a full frame, the only boxed thing on the page, because
          it is the only thing here that is a warning. */}
      <section className="px-4 pt-24 md:pt-36">
        <div className="ag-in grid grid-cols-12 gap-x-4 gap-y-6 border border-[var(--ag-rule)] p-5 md:p-8">
          <h2 className="ag-display ag-m col-span-12 lg:col-span-6">
            {contact.warning.heading}
          </h2>
          <div className="col-span-12 lg:col-span-6">
            <p className="ag-body" style={{ color: "var(--ag-ink)" }}>
              {contact.warning.body}
            </p>
            <ul className="ag-body flex flex-col gap-1.5 pt-4">
              {contact.warning.rules.map((rule) => (
                <li key={rule} className="grid grid-cols-[20px_1fr]">
                  <span aria-hidden="true" style={{ color: "var(--ag-faint)" }}>
                    —
                  </span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
            <p className="ag-body pt-4">{contact.warning.check}</p>
            <CopyEmail
              email={agency.contact.email}
              href={mailtoWith(agency.contact.email, "Is this message from Candor?")}
              className="mt-5 text-[15px]"
            />
          </div>
        </div>
      </section>
    </AgencyShell>
  );
}

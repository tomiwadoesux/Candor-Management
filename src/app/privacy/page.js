import "../../styles/agency.css";
import AgencyShell from "@/components/agency/AgencyShell";
import RiseText from "@/components/agency/RiseText";
import Contents from "@/components/agency/Contents";
import Rich from "@/components/agency/Rich";
import IntroMemorySwitch from "@/components/agency/IntroMemorySwitch";
import { privacy } from "../../../data/privacy";
import { agency, legal, privacyEmail } from "../../../data/agency";

export const metadata = {
  title: "Privacy — Candor",
  description:
    "How Candor handles the personal data of applicants, the talent it represents, clients and website visitors.",
};

// /privacy — the policy is data (data/privacy.js); this page lays it out.
// The order follows the ICO's "layered" advice: the short version and an
// at-a-glance table first, for the person who wants an answer, then the full
// text, numbered — here the numbers are real, because a policy is cited by
// section — with its contents following you down the margin.

const vars = {
  privacyEmail: `[${privacyEmail}](mailto:${privacyEmail})`,
  joinEmail: `[${agency.join.email}](mailto:${agency.join.email})`,
  contactPhone: `[${agency.contact.phone}](${agency.contact.phoneHref})`,
  applicantMonths: String(privacy.applicantMonths),
};

const updated = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date(`${privacy.updated}T12:00:00Z`));

// The registered details, only those that exist (see `legal` in
// data/agency.js — the empty ones are launch blockers, not omissions).
const registered = [
  ["Registered name", legal.registeredName],
  ["Company number", legal.companyNumber],
  ["Registered in", legal.placeOfRegistration],
  ["Registered office", legal.registeredOffice],
  ["VAT number", legal.vatNumber],
  ["ICO registration", legal.icoRegistration],
  ["NDPC registration", legal.ndpcRegistration],
  [
    "Data Protection Officer",
    legal.dpo && [legal.dpo.name, legal.dpo.email].filter(Boolean).join(", "),
  ],
].filter(([, v]) => v);

const COLUMNS = [
  ["what", "What we hold"],
  ["why", "Why"],
  ["basis", "Legal basis"],
  ["keep", "How long"],
];

function Block({ block }) {
  if (block.p) {
    return (
      <p className="ag-body">
        <Rich text={block.p} vars={vars} />
      </p>
    );
  }
  if (block.list) {
    return (
      <ul className="ag-body flex flex-col gap-2">
        {block.list.map((item, i) => (
          <li key={i} className="grid grid-cols-[20px_1fr]">
            <span aria-hidden="true" style={{ color: "var(--ag-faint)" }}>
              —
            </span>
            <span>
              <Rich text={item} vars={vars} />
            </span>
          </li>
        ))}
      </ul>
    );
  }
  if (block.widget === "introMemory") {
    return <IntroMemorySwitch />;
  }
  if (block.note) {
    return (
      <p
        className="ag-body border-l pl-4"
        style={{ borderColor: "var(--ag-accent-ink)", color: "var(--ag-ink)" }}
      >
        <Rich text={block.note} vars={vars} />
      </p>
    );
  }
  return null;
}

export default function PrivacyPage() {
  return (
    <AgencyShell current="privacy">
      {/* ---- the word, the date, the short version -------------------------- */}
      <section className="px-4 pt-10 md:pt-16">
        <div className="grid grid-cols-12 items-end gap-x-4 gap-y-8">
          <RiseText
            className="ag-display ag-xl col-span-12 -ml-[0.05em] lg:col-span-7"
            lines={["Privacy"]}
          />
          <div className="col-span-12 md:col-span-8 lg:col-span-5 lg:pb-[1.4vw]">
            <p className="ag-label">
              Last updated <time dateTime={privacy.updated}>{updated}</time>
            </p>
            <h2 className="ag-display ag-s pt-5">The short version</h2>
            <ul className="ag-body flex flex-col gap-2 pt-3" style={{ color: "var(--ag-ink)" }}>
              {privacy.summary.map((line, i) => (
                <li key={i} className="grid grid-cols-[20px_1fr]">
                  <span aria-hidden="true" style={{ color: "var(--ag-faint)" }}>
                    —
                  </span>
                  <span>
                    <Rich text={line} vars={vars} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---- at a glance ------------------------------------------------------
          A real table from md up; stacked per person below that, where four
          columns of prose would be a column a word wide. */}
      <section className="px-4 pt-24 md:pt-32" aria-labelledby="glance">
        <h2 id="glance" className="ag-label">
          At a glance
        </h2>

        <div className="hidden pt-6 md:block">
          <table className="w-full border-collapse text-left text-[14px] leading-[1.5]">
            <thead>
              <tr className="border-b border-[var(--ag-rule)]">
                <th scope="col" className="ag-label w-[16%] pb-3 pr-4 align-bottom font-normal">
                  Who
                </th>
                {COLUMNS.map(([key, label]) => (
                  <th key={key} scope="col" className="ag-label pb-3 pr-4 align-bottom font-normal">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {privacy.glance.map((row) => (
                <tr key={row.who} className="border-b border-[var(--ag-rule)] align-top">
                  <th scope="row" className="py-5 pr-4 font-normal">
                    <span className="ag-display ag-s">{row.who}</span>
                  </th>
                  {COLUMNS.map(([key]) => (
                    <td key={key} className="py-5 pr-4" style={{ color: "var(--ag-mute)" }}>
                      <Rich text={row[key]} vars={vars} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col pt-6 md:hidden">
          {privacy.glance.map((row) => (
            <div key={row.who} className="border-t border-[var(--ag-rule)] py-6">
              <h3 className="ag-display ag-s">{row.who}</h3>
              <dl className="grid grid-cols-1 gap-y-3 pt-4 text-[14px] leading-[1.5]">
                {COLUMNS.map(([key, label]) => (
                  <div key={key}>
                    <dt className="ag-label">{label}</dt>
                    <dd className="pt-1" style={{ color: "var(--ag-mute)" }}>
                      <Rich text={row[key]} vars={vars} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </section>

      {/* ---- the policy ------------------------------------------------------ */}
      <section className="px-4 pt-24 md:pt-36">
        <div className="grid grid-cols-12 gap-x-4 gap-y-10">
          <div className="col-span-12 lg:col-span-3">
            <Contents sections={privacy.sections.map(({ id, title }) => ({ id, title }))} />
          </div>

          <div className="col-span-12 lg:col-span-8 lg:col-start-5">
            {privacy.sections.map((s, i) => (
              <article key={s.id} className="border-t border-[var(--ag-rule)] pb-14 pt-5 first:border-t-0 first:pt-0">
                <h2 id={s.id} className="ag-display ag-m scroll-mt-8">
                  <span className="ag-num pr-[0.4em] text-[0.42em] align-top" style={{ color: "var(--ag-faint)", fontFamily: "var(--font-body)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {s.title}
                </h2>
                <div className="flex flex-col gap-4 pt-6">
                  {s.blocks.map((b, j) => (
                    <Block key={j} block={b} />
                  ))}
                  {s.id === "who-we-are" && registered.length > 0 && (
                    <dl className="grid grid-cols-[150px_1fr] gap-y-1.5 pt-2 text-[13px]">
                      {registered.map(([k, v]) => (
                        <div key={k} className="contents">
                          <dt style={{ color: "var(--ag-faint)" }}>{k}</dt>
                          <dd>{v}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </AgencyShell>
  );
}

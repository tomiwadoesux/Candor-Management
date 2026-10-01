import Header from "../../components/header";
import { scouting } from "../../../data/scouting";
import { agency, joinMailto } from "../../../data/agency";
import ApplyForm from "./ApplyForm";

export const metadata = {
  title: "Get Scouted — Candor",
  description:
    "Apply to be represented by Candor. No fee, no experience needed — six pictures and an honest application.",
};

// The supply side of the agency. /models and /talents sell the roster to
// bookers; this is the only page that speaks to the people who want to be on
// it, and until now the site promised it five times ("Become a Talent",
// "Submit Polaroids") and delivered it nowhere.
//
// A server component holding the copy, with the form split into its own client
// island — the page is mostly static text and shouldn't ship as one big
// client bundle just because it ends in a form.

const SECTION = "border-t border-black/10 pt-10 md:pt-14";
const EYEBROW = "text-[12px] font-bold uppercase tracking-[0.02em]";

export default function GetScouted() {
  return (
    <div className="min-h-screen w-full bg-white text-[#0c0c0c]">
      <Header />

      <main className="mx-auto w-full max-w-5xl px-3 pb-32 pt-16 md:px-5 md:pt-24">
        {/* Opening claim */}
        <header className="pb-12 md:pb-20">
          <h1
            className="text-[13vw] leading-[0.95] md:text-[76px]"
            style={{ fontFamily: "var(--font-sub)", lineHeight: 0.95 }}
          >
            Get scouted
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-[1.5] text-[#0c0c0c]/70">
            {scouting.intro}
          </p>
        </header>

        {/* The anti-scam notice, high on the page where it protects people
            rather than buried in a footer nobody reads. */}
        <section className={SECTION}>
          <div className="border border-black/15 p-5 md:p-7">
            <h2 className={EYEBROW} style={{ fontFamily: "var(--font-sub)" }}>
              {scouting.noFees.heading}
            </h2>
            <p className="mt-3 max-w-2xl text-[14px] leading-[1.55] text-[#0c0c0c]/75">
              {scouting.noFees.body}
            </p>
            <a
              href={joinMailto}
              className="mt-4 inline-block text-[14px] underline underline-offset-4 hover:opacity-60"
            >
              {agency.join.email}
            </a>
          </div>
        </section>

        {/* Who we're looking for */}
        <section className={`${SECTION} mt-12 md:mt-16`}>
          <h2 className={EYEBROW}>Requirements</h2>
          <dl className="mt-6 grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2">
            {scouting.requirements.map(({ label, detail }) => (
              <div key={label} className="flex items-baseline gap-4">
                <dt className="w-[72px] shrink-0 text-[12px] uppercase tracking-[0.02em] text-[#0c0c0c]/45">
                  {label}
                </dt>
                <dd className="text-[14px] leading-[1.5]">{detail}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 max-w-xl text-[13px] leading-[1.5] text-[#0c0c0c]/55">
            {scouting.eligibility.note}
          </p>
        </section>

        {/* What not to send — the block that keeps the inbox usable */}
        <section className={`${SECTION} mt-12 md:mt-16`}>
          <h2 className={EYEBROW}>What not to send</h2>
          <ul className="mt-6 flex flex-col gap-2">
            {scouting.notLookingFor.map((item) => (
              <li
                key={item}
                className="flex items-baseline gap-3 text-[14px] leading-[1.5]"
              >
                <span aria-hidden className="text-[#0c0c0c]/30">
                  —
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* The digitals brief */}
        <section className={`${SECTION} mt-12 md:mt-16`}>
          <h2 className={EYEBROW}>{scouting.digitals.heading}</h2>
          <p className="mt-4 max-w-xl text-[14px] leading-[1.55] text-[#0c0c0c]/70">
            {scouting.digitals.intro}
          </p>

          <ol className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-5">
            {scouting.digitals.shots.map(({ shot, guidance }, i) => (
              <li key={shot}>
                {/* Reference frames are stand-ins from the board until real
                    example digitals are shot — so they're drawn as numbered
                    placeholders rather than presented as "do this". */}
                <div className="flex aspect-[3/4] items-center justify-center bg-[#ececec] text-[11px] uppercase tracking-[0.08em] text-[#0c0c0c]/35">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-3 text-[13px] font-bold uppercase tracking-[0.02em]">
                  {shot}
                </h3>
                <p className="mt-1 text-[13px] leading-[1.45] text-[#0c0c0c]/60">
                  {guidance}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* The form */}
        <section className={`${SECTION} mt-12 md:mt-16`}>
          <h2 className={EYEBROW}>Apply</h2>
          <ApplyForm minAge={scouting.eligibility.minAge} />
        </section>

        {/* What happens next */}
        <section className={`${SECTION} mt-12 md:mt-16`}>
          <h2 className={EYEBROW}>What happens next</h2>
          <ol className="mt-6 flex flex-col gap-6">
            {scouting.process.map(({ step, detail }, i) => (
              <li key={step} className="flex items-baseline gap-4">
                <span className="w-6 shrink-0 text-[12px] text-[#0c0c0c]/35">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-[14px] font-bold">{step}</h3>
                  <p className="mt-1 max-w-xl text-[14px] leading-[1.5] text-[#0c0c0c]/65">
                    {detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Open calls — hidden entirely when there are none, rather than
            printed as an empty heading. */}
        {scouting.openCalls.length > 0 && (
          <section className={`${SECTION} mt-12 md:mt-16`}>
            <h2 className={EYEBROW}>Open calls</h2>
            <ul className="mt-6 flex flex-col gap-3">
              {scouting.openCalls.map((call) => (
                <li key={`${call.city}-${call.date}`} className="text-[14px]">
                  <span className="font-bold">{call.city}</span> — {call.date},{" "}
                  {call.venue}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import DigitalGuide from "../get-scouted/DigitalGuide";
import { LocalClock, OfficeStatus, ZoneLabel } from "@/components/agency/Clock";
import { coordsLabel } from "@/components/agency/officeTime";
import { Arrow, Words, cls, enter, pad } from "./parts";
import { aboutNew as c } from "../../../data/aboutNew";

// The sections /about-new borrows from /get-scouted (requirements, the fee
// rule, the digitals brief, what happens next, the questions, the way in)
// and from the original /about (the boards, the cities). Same contract as the
// sections in page.js: `lead` opens the page, `flip` mirrors it.

// "5'8" – 6'0" (173 – 183 cm)" → big "5'8" – 6'0"", small "173 – 183 cm";
// "Anywhere. We represent…" → big "Anywhere", small "We represent…". The
// first half is the answer at a glance, the second the fine print.
function splitDetail(detail) {
  const bracket = /^(.*?)\s*\((.*)\)$/.exec(detail);
  if (bracket) return { big: bracket[1], small: bracket[2] };
  const [first, ...rest] = detail.split(". ");
  return { big: first.replace(/\.$/, ""), small: rest.join(". ") };
}

// ---- requirements -----------------------------------------------------------

export function Requirements(o) {
  const r = c.scouting.requirements;
  return (
    <section id={c.anchors.requirements.id} className={cls("an-req an-pad", o)}>
      <div className="an-req-head an-grid an-s" {...enter(o.lead)}>
        <p className="an-col-label">
          <span className="an-fade">{r.label}</span>
        </p>
        <p className="an-col-read an-mute">
          <span className="an-fade">{r.note}</span>
        </p>
      </div>
      <dl className="an-req-list" {...enter(o.lead)}>
        {r.items.map((it, i) => {
          const { big, small } = splitDetail(it.detail);
          return (
            <div key={it.label} className="an-req-item an-fade" style={{ "--i": i }}>
              <dt className="an-s an-mute">{it.label}</dt>
              <dd className="an-l">{big}</dd>
              {small && <dd className="an-s an-req-small">{small}</dd>}
            </div>
          );
        })}
      </dl>
    </section>
  );
}

// ---- the fee rule -----------------------------------------------------------
// The one sentence the page cannot afford to have skimmed, set at the size of
// the opening statement.

export function NoFees(o) {
  const f = c.scouting.noFees;
  return (
    <section className={cls("an-fees an-pad an-grid", o)}>
      <p className="an-fees-label an-s" {...enter(o.lead)}>
        <span className="an-fade">{f.label}</span>
      </p>
      <h2 className="an-fees-title an-xl" {...enter(o.lead)}>
        <Words text={f.title} />
      </h2>
      <div className="an-fees-body an-s" {...enter(o.lead)}>
        <p className="an-fade">{f.body}</p>
        <p className="an-fade" style={{ "--i": 1 }}>
          <a className="an-link" href={`mailto:${f.email}`}>
            {f.email}
          </a>
        </p>
      </div>
    </section>
  );
}

// ---- the digitals brief -----------------------------------------------------
// Pinned: the stage holds the screen while the six frames slide through it,
// the scroll distance set by AboutMotion from the track's real width. Without
// script, or on a phone, the track is a plain horizontal scroller.

export function Digitals(o) {
  const d = c.scouting.digitals;
  return (
    <section id={c.anchors.digitals.id} className={cls("an-dig", o)} data-an-pin>
      <div className="an-dig-stage">
        <div className="an-dig-head an-pad an-grid" {...enter(o.lead)}>
          <p className="an-dig-label an-s">
            <span className="an-fade">{d.label}</span>
          </p>
          <h2 className="an-dig-title an-l">
            <Words text={d.title} />
          </h2>
          <p className="an-dig-intro an-s">
            <span className="an-fade">{d.intro}</span>
          </p>
        </div>
        <ol className="an-dig-track" data-an-track>
          {d.shots.map((s, i) => (
            <li key={s.shot} className="an-dig-card">
              <div className="an-dig-frame">
                <span className="an-dig-n an-s">{pad(i + 1)}</span>
                <DigitalGuide pose={i} />
              </div>
              <h3 className="an-dig-shot an-s">{s.shot}</h3>
              <p className="an-s an-mute">{s.guidance}</p>
            </li>
          ))}
          <li className="an-dig-card an-dig-avoid">
            <p className="an-s an-mute">{d.leaveOutLabel}</p>
            <ul className="an-m">
              {d.leaveOut.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </li>
        </ol>
      </div>
    </section>
  );
}

// ---- what comes next --------------------------------------------------------
// The heading and a giant step counter hold still on one side while the steps
// pass on the other; AboutMotion marks the step in the middle of the screen
// and the counter rolls to its number.

export function Process(o) {
  const p = c.scouting.process;
  return (
    <section
      id={c.anchors.process.id}
      className={cls("an-steps an-pad an-grid", o)}
      data-an-steps={p.steps.length}
    >
      <div className="an-steps-aside">
        <div className="an-steps-sticky" {...enter(o.lead)}>
          <p className="an-s">
            <span className="an-fade">{p.label}</span>
          </p>
          <h2 className="an-steps-title an-l">
            <Words text={p.title} />
          </h2>
          <div className="an-steps-counter" aria-hidden="true">
            <span className="an-steps-roll">
              {p.steps.map((_, i) => (
                <span key={i}>{pad(i + 1)}</span>
              ))}
            </span>
          </div>
        </div>
      </div>
      <ol className="an-steps-list">
        {p.steps.map((s, i) => (
          <li key={s.step} className="an-step" data-an-step={i}>
            <span className="an-s an-mute">({pad(i + 1)})</span>
            <h3 className="an-l">{s.step}</h3>
            <p className="an-s">{s.detail}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ---- questions --------------------------------------------------------------
// Native <details>, sharing a name so one opens at a time; the height eases
// where the browser can animate to `auto`, and snaps where it cannot.

export function Faq(o) {
  const f = c.scouting.faq;
  return (
    <section id={c.anchors.faq.id} className={cls("an-faq an-pad an-grid", o)}>
      <div className="an-faq-aside an-s" {...enter(o.lead)}>
        <p className="an-fade">
          {f.label} <span className="an-mute">({pad(f.items.length)})</span>
        </p>
      </div>
      <div className="an-faq-list" {...enter(o.lead)}>
        {f.items.map((it, i) => (
          <details key={it.q} className="an-faq-item an-fade" name="an-faq" style={{ "--i": i }}>
            <summary className="an-m">
              <span>{it.q}</span>
              <span className="an-faq-icon" aria-hidden="true" />
            </summary>
            <div className="an-faq-a an-s">
              {it.list ? (
                <ul>
                  {it.list.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              ) : (
                <p>{it.a}</p>
              )}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

// ---- the way in -------------------------------------------------------------
// One full-bleed link. The whole panel is the target.

export function ApplyCta(o) {
  const a = c.scouting.cta;
  return (
    <section id={c.anchors.apply.id} className={cls("an-apply", o)}>
      <Link href={a.href} className="an-apply-link an-pad" {...enter(o.lead)}>
        <span className="an-apply-top an-s">
          <span className="an-fade">{a.label}</span>
          <span className="an-fade an-apply-note">{a.note}</span>
        </span>
        <span className="an-apply-title an-xl">
          {a.title.map((line, i) => (
            <span key={line} className="an-line">
              <Words text={line} start={i * 3} />
            </span>
          ))}
        </span>
        <span className="an-apply-go an-m">
          <span className="an-fade">
            {a.link} <Arrow />
          </span>
        </span>
      </Link>
    </section>
  );
}

// ---- the boards (from the original /about) ----------------------------------
// Each row is a link to its board. On hover the label steps aside and a
// portrait wipes open beside it, taller than the row so it breaks the
// hairlines — positioned, so it never sets the row's height.

export function Boards(o) {
  const b = c.boards;
  const total = b.rows.reduce((n, r) => n + r.count, 0);
  return (
    <section id={c.anchors.boards.id} className={cls("an-boards an-pad", o)}>
      <div className="an-boards-head an-s" {...enter(o.lead)}>
        <p className="an-fade">{b.label}</p>
        <p className="an-fade an-mute" style={{ "--i": 1 }}>
          {total} represented across {b.rows.length} boards
        </p>
      </div>
      <ul className="an-boards-list">
        {b.rows.map((d) => (
          <li key={d.slug}>
            <Link href={d.href} className="an-board an-grid" {...enter(o.lead)}>
              <span className="an-board-label an-xl">
                <Words text={d.label} />
              </span>
              <span className="an-board-img" aria-hidden="true">
                <Image src={d.image} alt="" fill sizes="18vw" />
              </span>
              <span className="an-board-subs an-s an-mute">
                {d.sublabels.join(" · ")}
              </span>
              <span className="an-board-count an-s">{pad(d.count)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---- the cities (from the original /about) ----------------------------------
// Live local time and open/closed for each desk, worked out in the browser.

export function Offices(o) {
  const of = c.offices;
  return (
    <section id={c.anchors.offices.id} className={cls("an-offices an-pad", o)}>
      <p className="an-offices-label an-s" {...enter(o.lead)}>
        <span className="an-fade">{of.label}</span>
      </p>
      <div className="an-offices-grid">
        {of.items.map((x, i) => (
          <div key={x.city} className="an-office" {...enter(o.lead)}>
            <h3 className="an-l">
              <Words text={x.city} />
            </h3>
            <p className="an-s an-mute">
              <span className="an-fade">{x.country}</span>
            </p>
            <LocalClock timeZone={x.timeZone} city={x.city} className="an-office-clock" />
            <OfficeStatus office={x} className="an-s an-office-status" />
            <p className="an-s an-mute an-office-meta">
              {coordsLabel(x.coords)} <span aria-hidden="true">·</span>{" "}
              <ZoneLabel timeZone={x.timeZone} />
            </p>
            <Link href={`/contact#${x.city.toLowerCase()}`} className="an-link an-s">
              The {x.city} desk <Arrow />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

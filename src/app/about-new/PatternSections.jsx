import Link from "next/link";
import NamesList from "./NamesList";
import { Arrow, cls, enter, pad } from "./parts";
import { aboutNew as c } from "../../../data/aboutNew";

// Section patterns picked up from studio about pages — a numbers band, jump
// links under the opening, principles that expand in place, and a roster of
// names that open their portraits on hover. Layout and motion only: every word
// and picture is Candor's own, from data/aboutNew.js. Same contract as the
// other sections: `lead` opens the page, `flip` mirrors it.

// ---- jump links -------------------------------------------------------------
// The page serves two readers now — people booking and people applying — so
// under the opening it lists where everything is, in this layout's order.

export function Index(o) {
  const links = (o.order || [])
    .map((name) => c.anchors[name])
    .filter(Boolean);
  if (!links.length) return null;
  return (
    <nav className={cls("an-index an-pad an-grid an-s", o)} aria-label="On this page">
      <p className="an-index-label" {...enter(o.lead)}>
        <span className="an-fade">On this page</span>
      </p>
      <ol className="an-index-list" {...enter(o.lead)}>
        {links.map((l, i) => (
          <li key={l.id} className="an-fade" style={{ "--i": i }}>
            <a href={`#${l.id}`} className="an-index-link">
              <span className="an-mute">({pad(i + 1)})</span> {l.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ---- the numbers ------------------------------------------------------------
// Each counts up from zero the first time it comes into view (AboutMotion,
// [data-an-count]); the server renders the final number, so without script it
// is simply there. Screen readers get the number and its label once.

export function Stats(o) {
  const s = c.stats;
  return (
    <section className={cls("an-stats an-pad", o)}>
      <p className="an-stats-label an-s" {...enter(o.lead)}>
        <span className="an-fade">{s.label}</span>
      </p>
      <dl className="an-stats-list" {...enter(o.lead)}>
        {s.items.map((it, i) => (
          <div key={it.label} className="an-stat an-fade" style={{ "--i": i }}>
            <dt className="sr-only">{it.label}</dt>
            <dd className="an-stat-n" aria-hidden="true" data-an-count={it.value} data-an-pad="2">
              {pad(it.value)}
            </dd>
            <dd className="sr-only">{it.value}</dd>
            <dd className="an-stat-l an-s" aria-hidden="true">
              {it.label}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// ---- principles that expand -------------------------------------------------
// Four columns between hairlines: a small number, a title and a plus. Opening
// one eases its body down (where the browser can animate to `auto`); the
// others keep their place.

export function Principles(o) {
  const p = c.principles;
  return (
    <section className={cls("an-principles an-pad", o)}>
      <div className="an-principles-head an-grid an-s" {...enter(o.lead)}>
        <p className="an-col-label">
          <span className="an-fade">{p.label}</span>
        </p>
        <p className="an-col-read an-mute">
          <span className="an-fade">({pad(p.items.length)})</span>
        </p>
      </div>
      <div className="an-principles-list" {...enter(o.lead)}>
        {p.items.map((it, i) => (
          <details key={it.title} className="an-principle an-fade" style={{ "--i": i }}>
            <summary>
              <span className="an-principle-top an-s">
                <span className="an-mute">({pad(i + 1)})</span>
                <span className="an-faq-icon" aria-hidden="true" />
              </span>
              <span className="an-principle-title an-l">{it.title}</span>
            </summary>
            <div className="an-principle-body an-s">
              <p>{it.body}</p>
              {it.link && (
                <p>
                  <Link href={it.link.href} className="an-link">
                    {it.link.label} <Arrow />
                  </Link>
                </p>
              )}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

// ---- the names --------------------------------------------------------------
// Every name on the roster set as one paragraph. Hovering (or tabbing to) a
// name dims the rest and opens that person's portrait in the middle of the
// section, behind the type (see NamesList). Each name links to its profile;
// on touch there is no hover, and the names are simply links.

export function Names(o) {
  const n = c.names;
  return (
    <section id={c.anchors.names.id} className={cls("an-names an-pad", o)}>
      <div className="an-names-head an-s" {...enter(o.lead)}>
        <p className="an-fade">
          {n.label} <span className="an-mute">({pad(n.people.length)})</span>
        </p>
        <p className="an-fade an-mute an-names-hint">{n.hint}</p>
      </div>
      <NamesList people={n.people} {...enter(o.lead)} />
    </section>
  );
}

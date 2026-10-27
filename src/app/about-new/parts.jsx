import { Fragment } from "react";

// Small pieces every /about-new section shares.

export const pad = (n) => String(n).padStart(2, "0");

// One clipping box per word, so each can rise from under its own baseline.
// `--i` is the word's place in the run, which the stylesheet staggers on.
export function Words({ text, start = 0 }) {
  return text.split(" ").map((w, i) => (
    <Fragment key={i}>
      <span className="an-w">
        <span className="an-wi" style={{ "--i": start + i }}>
          {w}
        </span>
      </span>{" "}
    </Fragment>
  ));
}

// The same, a letter at a time, for the display words. The letters are
// hidden from screen readers, which get the word whole instead.
export function Chars({ text }) {
  return (
    <>
      <span className="sr-only">{text}</span>
      {[...text].map((ch, i) => (
        <span key={i} className="an-c" aria-hidden="true">
          <span className="an-ci" style={{ "--i": i }}>
            {ch}
          </span>
        </span>
      ))}
    </>
  );
}

// Words whose opacity follows the scroll: the paragraph's `--p` lights them
// in order. See .an-sw in the stylesheet.
export function ScrubWords({ text }) {
  return text.split(" ").map((w, i) => (
    <Fragment key={i}>
      <span className="an-sw" style={{ "--i": i }}>
        {w}
      </span>{" "}
    </Fragment>
  ));
}

export function Arrow() {
  return (
    <span aria-hidden="true" className="an-arrow">
      ↗
    </span>
  );
}

// The opening section animates as the page loads; every other one as it
// scrolls into view. Same start states, two triggers.
export const enter = (lead) =>
  lead ? { "data-an-load": "" } : { "data-an-reveal": "" };

export const cls = (base, { lead, flip }) =>
  `${base}${lead ? " is-lead" : ""}${flip ? " is-flip" : ""}`;

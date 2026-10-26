import { Fragment } from "react";

// A headline that rises into place a word at a time. Server-rendered spans
// and a CSS animation (.ag-rise in styles/agency.css) — nothing to hydrate, so
// the title is on screen on first paint even before any script has run.
//
// `lines` breaks the headline where the design wants it rather than where the
// browser would: each entry is one line, and the word count carries across
// lines so the stagger reads as one sentence. `delay` (ms) offsets the whole
// run, to let one headline follow another.
export default function RiseText({
  as: Tag = "h1",
  lines,
  children,
  delay = 0,
  className = "",
  ...rest
}) {
  const source = lines ?? [String(children)];
  let i = 0;

  return (
    <Tag
      className={`ag-rise ${className}`}
      style={{ "--d": `${delay}ms` }}
      // The words are split for the animation only; assistive tech gets the
      // sentence whole.
      aria-label={source.join(" ")}
      {...rest}
    >
      {source.map((line, l) => (
        <Fragment key={l}>
          {l > 0 && <br />}
          {line.split(" ").map((word, w) => (
            <Fragment key={w}>
              {w > 0 && " "}
              <span className="w" aria-hidden="true">
                <span style={{ "--i": i++ }}>{word}</span>
              </span>
            </Fragment>
          ))}
        </Fragment>
      ))}
    </Tag>
  );
}

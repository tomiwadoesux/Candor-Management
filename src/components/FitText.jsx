"use client";

import { useCallback, useEffect, useRef } from "react";

// Sets text on a single line at whatever font size makes it exactly span its
// container. Measures once at a large size and scales linearly, which is
// accurate enough for one line and costs a single reflow per change.
//
// `capToHeight` also clamps the size to the box's height and centres the line
// in it, so a fixed-height slot holds short and long strings at a stable height
// instead of the block growing and shrinking with the name.
// Sets each word's first letter larger than the rest. `bump` is any CSS length:
// a px value stays a fixed step up from the fitted line (what the /models rail
// uses), an em value scales with it — better at display sizes, where a fixed
// 10px would barely register. FitText solves for either.
export function initialCaps(name, bump = "10px") {
  return String(name ?? "")
    .split(/(\s+)/)
    .map((part, i) =>
      /\S/.test(part) ? (
        <span key={i}>
          <span style={{ fontSize: `calc(1em + ${bump})` }}>{part[0]}</span>
          {part.slice(1)}
        </span>
      ) : (
        part
      )
    );
}

export default function FitText({
  children,
  className = "",
  capToHeight = false,
  align = "left",
  alignY = "center",
  opticalLeft = false,
}) {
  const boxRef = useRef(null);
  const textRef = useRef(null);

  const fit = useCallback(() => {
    const box = boxRef.current;
    const el = textRef.current;
    if (!box || !el) return;
    const avail = box.clientWidth;
    if (!avail) return;
    const BASE = 200; // measure big so rounding barely matters
    el.style.fontSize = `${BASE}px`;
    // The span is inline-block, so its rect is the text's own (fractional)
    // width — scrollWidth rounds to whole px and would overshoot the box.
    const natural = el.getBoundingClientRect().width;
    if (!natural) return;
    let size = (BASE * avail) / natural;
    // Uppercase cap height is well under 1em, so the box height is a safe
    // ceiling for the font size.
    if (capToHeight && box.clientHeight) {
      size = Math.min(size, box.clientHeight);
    }
    el.style.fontSize = `${size}px`;

    // A nested span can carry a fixed pixel offset — an initial set to
    // `calc(1em + 5px)` — so width is affine in the size (a·size + b), not
    // proportional, and the single linear guess above overshoots by b. The
    // two samples we now have solve it exactly.
    const measured = el.getBoundingClientRect().width;
    const clamped = capToHeight && box.clientHeight === size;
    if (!clamped && measured && Math.abs(measured - avail) > 0.25) {
      const slope = (natural - measured) / (BASE - size);
      const offset = natural - slope * BASE;
      let exact = (avail - offset) / slope;
      if (capToHeight && box.clientHeight) {
        exact = Math.min(exact, box.clientHeight);
      }
      if (slope > 0 && Number.isFinite(exact) && exact > 0) {
        size = exact;
        el.style.fontSize = `${size}px`;
      }
    }

    // Clamping the size to the box height assumes the line box is the font
    // size, which `initialCaps` breaks: it sets the first letter to
    // calc(1em + bump), so that glyph's line box is taller than the box and
    // the wrapper's overflow-hidden takes the tops off the capitals. Measure
    // what actually rendered and scale back until it fits. Only ever shrinks,
    // so a caller with no raised initial is untouched.
    if (capToHeight && box.clientHeight) {
      const rendered = el.getBoundingClientRect().height;
      if (rendered > box.clientHeight + 0.5) {
        size *= box.clientHeight / rendered;
        el.style.fontSize = `${size}px`;
      }
    }

    // At display sizes the first glyph's left side bearing is a visible indent
    // — 10–13px at 120–144px — so the text reads as inset from the column edge
    // while everything under it sits flush. Pull the line left by exactly that
    // bearing so the ink, not the box, lines up with the page's padding.
    if (opticalLeft) {
      el.style.marginLeft = "0px";
      const cs = window.getComputedStyle(el);
      const ctx =
        fit.ctx || (fit.ctx = document.createElement("canvas").getContext("2d"));
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const bearing = ctx.measureText(el.textContent).actualBoundingBoxLeft;
      // A positive `actualBoundingBoxLeft` means ink starts left of the origin;
      // only a negative one (ink starts right of it) is the indent we correct.
      if (Number.isFinite(bearing) && bearing < 0) {
        el.style.marginLeft = `${bearing}px`;
      }
    }
  }, [capToHeight, opticalLeft]);

  useEffect(() => {
    fit();
    const box = boxRef.current;
    const ro = box ? new ResizeObserver(fit) : null;
    if (ro && box) ro.observe(box);
    // the display font lands after first paint; re-fit once it does
    document.fonts?.ready.then(fit).catch(() => {});
    return () => ro?.disconnect();
  }, [children, fit]);

  // The span shrinks to its text, so alignment is handled by the box: flex
  // justification when it is centring vertically, text-align otherwise.
  const justify =
    align === "right"
      ? "justify-end"
      : align === "center"
      ? "justify-center"
      : "";
  const alignBox = capToHeight
    ? `flex h-full ${
        alignY === "top" ? "items-start" : "items-center"
      } ${justify}`
    : align === "right"
    ? "text-right"
    : align === "center"
    ? "text-center"
    : "";

  return (
    <div ref={boxRef} className={`w-full overflow-hidden ${alignBox}`}>
      <span
        ref={textRef}
        className={`inline-block whitespace-nowrap ${className}`}
      >
        {children}
      </span>
    </div>
  );
}

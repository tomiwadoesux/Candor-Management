"use client";

import { useId } from "react";
import { SURFACE, MEDIA, TEXT, RULE, OUTLINE } from "./layoutMap";

// One recorded first screen, drawn as a single SVG.
//
// The viewBox IS the recorded viewport and preserveAspectRatio is "none", so
// the browser stretches the map onto whatever window it is shown in: every
// block lands at the same fraction of the screen it held when recorded, and
// nothing is left uncovered at the edges when the window is a different
// shape. Outlines keep a 1px stroke regardless (non-scaling-stroke).
//
// How each kind reads:
//
//   surfaces  their real colour, opaque. A black band is black.
//   media     the ink for its backdrop at MEDIA_ALPHA — a quiet slab.
//   text      the text's own colour at TEXT_ALPHA. A grey caption comes out
//             lighter than a black heading, so hierarchy survives.
//   rules     their real colour; they were already translucent on the page.
//
// The scan: one soft band passes across the ink — media and text only — on a
// loop, through a mask built from the same blocks in the same order. Surfaces
// are painted into that mask in black, so a fixed header panel covers the
// band where it covers the page.

const MEDIA_ALPHA = 0.075;
const TEXT_ALPHA = 0.12;

// Blocks arrive top to bottom across this window, so the page's shape builds
// the way it is read instead of appearing all at once.
const STAGGER_MS = 260;

export default function SkeletonSvg({ layout, scan = true }) {
  const id = useId().replace(/:/g, "");
  const { vw, vh, fg, colors, blocks } = layout;

  const shapes = [];
  const mask = [];

  blocks.forEach((b, i) => {
    const [kind, x, y, w, h, c, r = 0] = b;
    const color = colors[c];
    const geo = { x, y, width: w, height: h, rx: r || undefined };
    const delay = { animationDelay: `${Math.round((y / vh) * STAGGER_MS)}ms` };

    if (kind === SURFACE) {
      shapes.push(<rect key={i} {...geo} fill={color} />);
      mask.push(<rect key={i} {...geo} fill="black" />);
    } else if (kind === MEDIA || kind === TEXT) {
      shapes.push(
        <rect
          key={i}
          {...geo}
          fill={color}
          fillOpacity={kind === MEDIA ? MEDIA_ALPHA : TEXT_ALPHA}
          className="ps-ink"
          style={delay}
        />
      );
      mask.push(<rect key={i} {...geo} fill="white" />);
    } else if (kind === RULE) {
      shapes.push(<rect key={i} {...geo} fill={color} className="ps-ink" style={delay} />);
    } else if (kind === OUTLINE) {
      shapes.push(
        <rect
          key={i}
          x={x + 0.5}
          y={y + 0.5}
          width={Math.max(0, w - 1)}
          height={Math.max(0, h - 1)}
          rx={r || undefined}
          fill="none"
          stroke={color}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          className="ps-ink"
          style={delay}
        />
      );
    }
  });

  return (
    <svg
      className="ps-svg"
      viewBox={`0 0 ${vw} ${vh}`}
      preserveAspectRatio="none"
      width="100%"
      height="100%"
      aria-hidden="true"
      focusable="false"
    >
      {scan && (
        <defs>
          <linearGradient id={`${id}-band`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0.35" stopColor={fg} stopOpacity="0" />
            <stop offset="0.5" stopColor={fg} stopOpacity="0.07" />
            <stop offset="0.65" stopColor={fg} stopOpacity="0" />
          </linearGradient>
          <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width={vw} height={vh}>
            <rect width={vw} height={vh} fill="black" />
            {mask}
          </mask>
        </defs>
      )}
      {shapes}
      {scan && (
        <g mask={`url(#${id}-mask)`}>
          <rect className="ps-scan" width={vw} height={vh} fill={`url(#${id}-band)`} />
        </g>
      )}
    </svg>
  );
}

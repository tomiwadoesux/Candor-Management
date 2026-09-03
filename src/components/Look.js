"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

const TITLE = "SELENA FORREST";
const PROJECT = "MODEL PORTFOLIO";
// Connector words are lowercase; only the credited names keep their capitals.
const CREDITS =
  "photographed by Drew Vickers || hair by Shiori Takahashi || makeup by Laura Dominique";

// The look itself: a two-frame diptych, one image per panel of the split. The
// panels keep their red/black fills underneath, so the section reads correctly
// for the moment before the frames decode.
const FRAMES = [
  { src: "/images/img7.jpeg", tint: "bg-red-500" },
  { src: "/images/img14.jpeg", tint: "bg-black" },
];

// The credits block is sticky, so it descends through the section as it scrolls
// and would otherwise land on top of the centred arrows. Instead the pair opens
// out of its way — left button left, right button right — reaching a gap wide
// enough to clear the widest line above, so however long the credits get they
// pass cleanly BETWEEN the arrows instead of over them.
const SPREAD_LEAD = 200; // px of approach over which the pair opens
const SPREAD_CLEAR = 24; // fully open while the text is still this far above
const SPREAD_GAP = 10; // breathing room between each arrow and the text edge
const SPREAD_EDGE = 16; // an arrow never opens closer than this to the screen edge

// The credits are sticky, so at the very end of the section they un-pin and ride
// up with it — straight up through the docked CANDOR wordmark, which sits only a
// few pixels above where they rest. Nothing can be done about that collision
// once it starts, so the block is faded out over the last stretch of its PINNED
// travel instead: it is already gone by the moment it is released.
const FADE_RUNWAY = 160; // px of pinned travel left when the fade begins

export default function Look() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const textEl = root.querySelector("[data-look-text]");
    const groups = Array.from(root.querySelectorAll("[data-look-controls]"));
    if (!textEl || !groups.length) return;

    // Half the widest LINE (not the wrapper — the lines are whitespace-nowrap
    // and deliberately overflow it), so each arrow only has to travel outward
    // by that much for the two inner edges to frame the text exactly.
    const wrapEl = root.querySelector("[data-look-textwrap]");

    let halfSpread = 0;
    // The sticky block's containing block is the wrapper's CONTENT box, so its
    // release line sits one bottom-padding above the wrapper's own bottom edge.
    // The padding is a breakpoint constant — read it on measure, not per frame.
    let padBottom = 0;
    const measure = () => {
      let widest = 0;
      root.querySelectorAll("[data-look-line]").forEach((line) => {
        widest = Math.max(widest, line.getBoundingClientRect().width);
      });
      if (!widest) widest = textEl.getBoundingClientRect().width;
      let spread = widest / 2 + SPREAD_GAP;
      // A credits line wider than the viewport would otherwise push the arrows
      // clean off the screen — cap the travel so they stay reachable. offsetWidth
      // is the group's own layout width, so it ignores the transforms we write.
      groups.forEach((g) => {
        if (!g.offsetWidth) return; // the hidden pair for the other breakpoint
        const room = window.innerWidth / 2 - g.offsetWidth / 2 - SPREAD_EDGE;
        spread = Math.min(spread, Math.max(0, room));
      });
      halfSpread = spread;
      padBottom = wrapEl
        ? parseFloat(getComputedStyle(wrapEl).paddingBottom) || 0
        : 0;
    };
    measure();
    // The credits use a webfont that lands after first paint — a line measured
    // in the fallback face gives the wrong spread, so measure again once the
    // real fonts are in.
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(measure).catch(() => {});
    }
    window.addEventListener("resize", measure);

    const apply = (d) => {
      const left = `translate3d(${(-d).toFixed(2)}px, 0, 0)`;
      const right = `translate3d(${d.toFixed(2)}px, 0, 0)`;
      groups.forEach((g) => {
        const prev = g.querySelector("[data-look-prev]");
        const next = g.querySelector("[data-look-next]");
        if (prev) prev.style.transform = left;
        if (next) next.style.transform = right;
      });
    };

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      // No scroll-driven motion, but the arrows still must not be sat on:
      // park them permanently open. The loop below still runs — the CANDOR fade
      // is a legibility guard, not decoration, so it is not opted out of.
      apply(halfSpread);
    }

    let raf = 0;
    let running = false;
    let last = -1;
    let lastFade = -1;

    const frame = () => {
      const t = textEl.getBoundingClientRect();
      // Only the vertical edges are read, and the transform we write is
      // horizontal — so these rects never need un-transforming.
      let gap = Infinity;
      groups.forEach((g) => {
        const r = g.getBoundingClientRect();
        if (r.width || r.height) gap = Math.min(gap, r.top - t.bottom);
      });

      // How much pinned travel the block has left: the distance from its bottom
      // to the bottom of its containing block. It runs down to 0 exactly at the
      // point the sticky releases and stays there while the block rides up out
      // of the section, so fading it out across the last stretch means the text
      // is already invisible before it can reach the wordmark above.
      if (wrapEl) {
        const w = wrapEl.getBoundingClientRect();
        const runway = w.bottom - padBottom - t.bottom;
        const f = Math.min(1, Math.max(0, runway / FADE_RUNWAY));
        const o = f * f * (3 - 2 * f); // smoothstep
        if (Math.abs(o - lastFade) > 0.004) {
          lastFade = o;
          textEl.style.opacity = o === 1 ? "" : o.toFixed(3);
        }
      }

      if (!prefersReduced && gap !== Infinity) {
        const p = Math.min(
          1,
          Math.max(0, (SPREAD_LEAD - gap) / (SPREAD_LEAD - SPREAD_CLEAR))
        );
        const eased = p * p * (3 - 2 * p); // smoothstep
        const d = eased * halfSpread;
        // Skip the style write unless it actually moved — a settled section
        // then costs nothing.
        if (Math.abs(d - last) > 0.05) {
          last = d;
          apply(d);
        }
      }
      raf = requestAnimationFrame(frame);
    };

    // Only drive the loop while the section is anywhere near the viewport.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          raf = requestAnimationFrame(frame);
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { rootMargin: "25% 0px" }
    );
    io.observe(root);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      apply(0);
      textEl.style.opacity = "";
    };
  }, []);

  return (
    <section className="h-screen" data-look ref={rootRef}>
      <div className="relative h-full flex flex-col md:flex-row min-h-0">
        {FRAMES.map((frame) => (
          <div
            key={frame.src}
            className={`${frame.tint} relative w-full h-full overflow-hidden`}
          >
            <Image
              src={frame.src}
              alt={`${TITLE} — ${PROJECT}`}
              fill
              // Each frame is a half-screen panel on desktop and a half-height
              // full-width one on mobile, so the browser never has to fetch a
              // source wider than half the viewport above md.
              sizes="(min-width: 768px) 50vw, 100vw"
              quality={85}
              className="object-cover"
            />
          </div>
        ))}

        {/* Centered controls — sit at the seam, vertically centered on the section */}
        <div
          data-look-controls
          className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 items-center"
        >
          <Arrow dir="prev" className="w-10 h-10" iconClassName="w-6 h-6" />
          <Arrow dir="next" className="w-10 h-10" iconClassName="w-6 h-6" />
        </div>

        {/* Mobile controls */}
        <div
          data-look-controls
          className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-row gap-3"
        >
          <Arrow dir="prev" className="w-9 h-9" iconClassName="w-5 h-5" />
          <Arrow dir="next" className="w-9 h-9" iconClassName="w-5 h-5" />
        </div>
        {/* Editorial credits sit over the panels, aligned to their top-left.
            Equal padding on the wrapper keeps the top/bottom gaps identical to
            the left one. */}
        <div
          data-look-textwrap
          className="absolute inset-0 z-10 pointer-events-none mix-blend-exclusion text-white p-4 md:p-10 flex items-start justify-center"
        >
          <div
            data-look-text
            className="sticky top-16 md:top-24 flex w-full max-w-[18rem] flex-col items-center gap-3 text-center md:max-w-[22rem] md:gap-4"
          >
            {/* w-fit group + w-0/min-w-full siblings: only the title sets the
                group's width, so the rule always matches the name exactly. */}
            <div className="flex w-fit flex-col items-center gap-1.5 md:gap-2">
              <h1
                data-look-line
                className="uppercase text-2xl md:text-3xl tracking-wide whitespace-nowrap"
              >
                {TITLE}
              </h1>
              <h4 className="w-0 min-w-full uppercase text-xs tracking-[0.08em] md:text-sm">
                {PROJECT}
              </h4>
            </div>
            <p
              data-look-line
              className="whitespace-nowrap text-xs leading-[1.45] md:text-sm"
            >
              {CREDITS}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// The two arrows are identical apart from the glyph and which way they open,
// so the spread effect finds them by data-look-prev / data-look-next.
function Arrow({ dir, className, iconClassName }) {
  const prev = dir === "prev";
  return (
    <button
      aria-label={prev ? "Previous" : "Next"}
      {...(prev ? { "data-look-prev": "" } : { "data-look-next": "" })}
      style={{ willChange: "transform" }}
      className={`${className} bg-black flex items-center justify-center hover:bg-gray-800 transition-colors`}
    >
      <svg
        className={`${iconClassName} text-white`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d={prev ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
        />
      </svg>
    </button>
  );
}

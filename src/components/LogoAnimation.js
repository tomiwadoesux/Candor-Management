"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

// The CANDOR wordmark as an SVG. The ® rides out and morphs into a dot as you
// scroll toward the pinned editorial credits — a demarcation between CANDOR and
// the text below — then reverses back into the ® on the way up. Scroll-scrubbed,
// NOT a loop, so the ® is simply present at rest. Fills use currentColor so the
// mark inherits the parent's text colour (white) and inverts under the
// mix-blend-exclusion overlay like the old text wordmark. Carries the
// `logo-text` class so the homepage intro effect can measure it.
// `animate={false}` renders the mark on its own — no GSAP, no ScrollTrigger —
// for pages that just want the wordmark sitting in a corner.
// `tight` crops the viewBox to the mark's own ink (measured: x 1.758, y 21,
// 202.574 x 38.708 of the 206 x 80 box), so the SVG element is exactly as tall
// as the letters instead of carrying ~21 units of empty space above and 20
// below. The default box is kept for the animated homepage logo, whose motion
// paths run outside the glyphs.
const INK_VIEWBOX = "1.758 21 202.574 38.708";

export default function LogoAnimation({
  className = "",
  style,
  animate = true,
  tight = false,
}) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (!animate) return;
    let ctx;
    let cancelled = false;

    // MorphSVGPlugin touches `document` at module load, so it can't be imported
    // at the top level (it would break SSR). Load it (and ScrollTrigger) lazily,
    // client-side only, then wire up the scrubbed timeline.
    (async () => {
      const [{ MorphSVGPlugin }, { ScrollTrigger }] = await Promise.all([
        import("gsap/MorphSVGPlugin"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(MotionPathPlugin, MorphSVGPlugin, ScrollTrigger);

      // Scope selectors to this SVG so the #R / #to1 / #dot lookups can't collide
      // with anything else on the page.
      ctx = gsap.context((self) => {
        const glyph = self.selector("#Vector_2")[0];
        const mark = self.selector("#R")[0];
        const dot = self.selector("#dot")[0];
        const outEl = self.selector("#to1")[0];
        const backEl = self.selector("#to2")[0];
        if (!glyph || !mark || !dot || !outEl || !backEl) return;
        const originalD = glyph.getAttribute("d");

        // Both trip paths are re-expressed RELATIVE to the ®'s resting point and
        // fed in as plain path data, instead of using motionPath's `align`
        // option. `align` measures the ® and the path against the live screen
        // matrix at the moment the tween first renders — and on this page the
        // wordmark's wrapper is re-transformed every frame by the scroll intro,
        // so that measurement is a race. Lose it (first paint, a font landing, a
        // reload part-way down the page) and the ® morphs into the dot without
        // ever travelling, or sets off from the wrong place. These numbers are
        // pure SVG user units resolved once, so the trip is identical every load.
        const { stringToRawPath, transformRawPath, rawPathToString } =
          MotionPathPlugin;
        const outRaw = stringToRawPath(outEl.getAttribute("d"));
        const backRaw = stringToRawPath(backEl.getAttribute("d"));
        // #to1 starts on the ® at rest, so shifting BOTH paths by its first
        // point puts x/y at 0,0 with the ® home — and leaves #to2 starting
        // exactly where #to1 ended, so the return leg picks up seamlessly.
        const homeX = outRaw[0][0];
        const homeY = outRaw[0][1];
        transformRawPath(outRaw, 1, 0, 0, 1, -homeX, -homeY);
        transformRawPath(backRaw, 1, 0, 0, 1, -homeX, -homeY);
        const outPath = rawPathToString(outRaw);
        const backPath = rawPathToString(backRaw);

        // Scrubbed there-and-back cycle across the whole red/black section: a
        // quick ® -> dot as the credits pin (first fifth), a long hold as the
        // demarcation while the section fills the screen (the empty middle), then
        // dot -> ® as the section scrolls away (last fifth). ease:"none" keeps it
        // glued 1:1 to scroll.
        const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
        tl.to(mark, { duration: 0.2, motionPath: { path: outPath } }, 0);
        tl.to(glyph, { duration: 0.2, morphSVG: dot }, 0);
        tl.to(mark, { duration: 0.2, motionPath: { path: backPath } }, 0.8);
        tl.to(glyph, { duration: 0.2, morphSVG: originalD }, 0.8);

        // Span the section: the ® stays upright until it is well into view (so it
        // doesn't collapse too early), holds as the dot while the section fills
        // the screen, then reforms into the ® by the time the section has scrolled
        // off the top.
        const trigger = document.querySelector("[data-look]") || rootRef.current;
        ScrollTrigger.create({
          trigger,
          start: "top 35%",
          end: "bottom top",
          scrub: 0.5,
          animation: tl,
        });

        // The trigger's start/end are measured once, at creation — which happens
        // as soon as these plugin chunks land, before the webfonts and images
        // above have settled the page height. Reloading part-way down then
        // scrubs against a stale range. Re-measure once the page has actually
        // finished loading.
        const refresh = () => {
          if (!cancelled) ScrollTrigger.refresh();
        };
        if (document.fonts) document.fonts.ready.then(refresh).catch(() => {});
        if (document.readyState === "complete") refresh();
        else window.addEventListener("load", refresh, { once: true });
      }, rootRef);
    })();

    return () => {
      cancelled = true;
      if (ctx) ctx.revert();
    };
  }, [animate]);

  return (
    <svg
      ref={rootRef}
      className={`logo-text ${className}`}
      width={tight ? "202.574" : "206"}
      height={tight ? "38.708" : "80"}
      viewBox={tight ? INK_VIEWBOX : "0 0 206 80"}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ height: "auto", overflow: "visible", ...style }}
    >
      <path
        id="Vector"
        d="M29.1504 50.8945C28.1087 53.7754 26.5137 55.9564 24.3652 57.4375C22.2005 58.9512 19.7591 59.708 17.041 59.708C12.5814 59.708 8.91927 58.0316 6.05469 54.6787C3.1901 51.3258 1.75781 46.5977 1.75781 40.4941C1.75781 38.6875 1.88802 36.9704 2.14844 35.3428C2.40885 33.7152 2.81576 32.2015 3.36914 30.8018C3.9388 29.402 4.65495 28.1243 5.51758 26.9688C6.39648 25.8132 7.43815 24.7959 8.64258 23.917C11.0677 22.1755 14.0055 21.3047 17.4561 21.3047C19.4743 21.3047 21.2321 21.5814 22.7295 22.1348C24.2269 22.6882 25.3906 23.4287 26.2207 24.3564C27.0508 25.2842 27.6611 26.2282 28.0518 27.1885C28.4587 28.1325 28.6621 29.0684 28.6621 29.9961C28.6621 30.6146 28.5807 31.1842 28.418 31.7051C28.2552 32.2096 28.0273 32.6491 27.7344 33.0234C27.4414 33.3978 27.0915 33.6908 26.6846 33.9023C26.2939 34.0977 25.8626 34.1953 25.3906 34.1953C24.5117 34.1953 23.8525 33.943 23.4131 33.4385C22.9736 32.9176 22.7539 32.3073 22.7539 31.6074C23.8607 30.5658 24.4059 29.3613 24.3896 27.9941C24.3896 26.4967 23.82 25.2109 22.6807 24.1367C21.5251 23.0788 19.8649 22.5498 17.7002 22.5498C14.0869 22.5498 11.3851 24.21 9.59473 27.5303C7.80436 30.8669 6.90918 35.1882 6.90918 40.4941C6.90918 46.3535 7.92643 50.7399 9.96094 53.6533C11.9954 56.583 14.6891 58.0479 18.042 58.0479C20.3369 58.0479 22.3633 57.3643 24.1211 55.9971C25.8952 54.6136 27.2054 52.7337 28.0518 50.3574L29.1504 50.8945ZM40.5742 23.2578V21.9883H47.9717L58.4209 57.7549H61.3262V59H50.2666V57.7549H53.2207L50.4131 48.1113H38.5723L36.7656 56.8516L39.7197 57.8525V59H30.7598V57.8525L33.5674 56.7539L39.0605 39.5908L43.8213 23.2578H40.5742ZM40.3301 39.8594L38.8164 46.8418H50.0713L44.1631 26.6514L40.3301 39.8594ZM68.6729 40.0059L69.3564 56.7051L72.2617 57.8525V59H64.4248V57.8525L66.7197 56.7051L67.4277 40.0059V23.2578H64.4248V21.9883H70.8213L89.7666 52.2617V41.0068L89.0586 24.3564L86.1777 23.1602V21.9883H94.0146V23.1602L91.6709 24.3564L91.0117 41.0068V59H88.3262L68.6729 27.7988V40.0059ZM109.931 21.9883C112.974 21.9883 115.635 22.5173 117.914 23.5752C120.193 24.6169 121.991 26.0573 123.31 27.8965C124.628 29.7357 125.596 31.762 126.215 33.9756C126.85 36.1729 127.167 38.5654 127.167 41.1533C127.167 43.432 126.882 45.5804 126.312 47.5986C125.743 49.6169 124.823 51.5049 123.554 53.2627C122.284 55.0368 120.526 56.4365 118.28 57.4619C116.05 58.4873 113.43 59 110.419 59H97.5283V57.7549H100.36V24.1611L97.5283 23.1602V21.9883H109.931ZM109.76 23.2578H105.316V57.7549H110.272C112.453 57.7549 114.333 57.2747 115.912 56.3145C117.491 55.3542 118.703 54.0358 119.55 52.3594C120.396 50.6992 121.015 48.9577 121.405 47.1348C121.812 45.2956 122.016 43.3018 122.016 41.1533C122.016 38.7445 121.804 36.5228 121.381 34.4883C120.958 32.4375 120.282 30.5413 119.354 28.7998C118.427 27.0583 117.149 25.6992 115.521 24.7227C113.894 23.7461 111.973 23.2578 109.76 23.2578ZM136.687 54.2148C134.001 50.569 132.658 45.9954 132.658 40.4941C132.658 34.9766 134.001 30.403 136.687 26.7734C139.356 23.1276 143.026 21.3047 147.697 21.3047C152.368 21.3047 156.047 23.1276 158.732 26.7734C161.418 30.403 162.761 34.9766 162.761 40.4941C162.761 45.9954 161.418 50.569 158.732 54.2148C156.047 57.877 152.368 59.708 147.697 59.708C143.026 59.708 139.356 57.877 136.687 54.2148ZM140.324 27.5791C138.648 30.9157 137.81 35.2207 137.81 40.4941C137.81 45.7676 138.648 50.0726 140.324 53.4092C142.017 56.762 144.475 58.4385 147.697 58.4385C150.936 58.4385 153.402 56.762 155.095 53.4092C156.771 50.0726 157.609 45.7676 157.609 40.4941C157.609 35.237 156.771 30.932 155.095 27.5791C153.402 24.2262 150.936 22.5498 147.697 22.5498C144.475 22.5498 142.017 24.2262 140.324 27.5791ZM177.896 59H167.251V57.7549H170.083V24.1611L167.251 23.1602V21.9883H179.849C183.592 21.9883 186.449 22.973 188.418 24.9424C190.404 26.9281 191.396 29.3451 191.396 32.1934C191.396 35.0091 190.485 37.4017 188.662 39.3711C186.823 41.3568 184.186 42.4473 180.752 42.6426L190.493 56.998L193.545 57.8525V59H181.899V57.8525L184.683 56.998L179.141 42.6426H175.039V57.7549H177.896V59ZM179.287 23.2578H175.039V41.3975H179.043C181.484 41.3975 183.299 40.5186 184.487 38.7607C185.659 37.0192 186.245 34.8301 186.245 32.1934C186.245 29.6217 185.667 27.4896 184.512 25.7969C183.356 24.1042 181.615 23.2578 179.287 23.2578Z"
        fill="currentColor"
      />
      <g id="R">
        <path
          id="Vector_2"
          d="M200.166 29.3322C199.402 29.3322 198.705 29.1435 198.076 28.7661C197.447 28.3887 196.944 27.8854 196.566 27.2564C196.189 26.6274 196 25.9306 196 25.1661C196 24.4016 196.189 23.7048 196.566 23.0758C196.944 22.4467 197.447 21.9435 198.076 21.5661C198.705 21.1887 199.402 21 200.166 21C200.931 21 201.627 21.1887 202.257 21.5661C202.886 21.9435 203.389 22.4467 203.766 23.0758C204.144 23.7048 204.332 24.4016 204.332 25.1661C204.332 25.9306 204.144 26.6274 203.766 27.2564C203.389 27.8854 202.886 28.3887 202.257 28.7661C201.627 29.1435 200.931 29.3322 200.166 29.3322ZM200.166 28.9403C200.853 28.9403 201.477 28.7709 202.039 28.4322C202.6 28.0838 203.05 27.6242 203.389 27.0532C203.727 26.4822 203.897 25.8532 203.897 25.1661C203.897 24.4693 203.727 23.8403 203.389 23.279C203.05 22.708 202.6 22.2532 202.039 21.9145C201.477 21.5661 200.853 21.3919 200.166 21.3919C199.479 21.3919 198.85 21.5661 198.279 21.9145C197.718 22.2532 197.268 22.708 196.929 23.279C196.6 23.8403 196.436 24.4693 196.436 25.1661C196.436 25.8532 196.6 26.4822 196.929 27.0532C197.268 27.6242 197.718 28.0838 198.279 28.4322C198.85 28.7709 199.479 28.9403 200.166 28.9403ZM198.018 27.329V27.0387C198.308 27.0193 198.487 26.9806 198.555 26.9225C198.632 26.8548 198.671 26.7145 198.671 26.5016V23.5983C198.671 23.3758 198.632 23.2354 198.555 23.1774C198.487 23.1096 198.308 23.0661 198.018 23.0467V22.7709C198.105 22.7709 198.187 22.7709 198.265 22.7709C198.352 22.7709 198.458 22.7709 198.584 22.7709C198.71 22.7709 198.874 22.7709 199.077 22.7709C199.358 22.7709 199.615 22.7709 199.847 22.7709C200.089 22.7709 200.263 22.7709 200.369 22.7709C200.902 22.7709 201.308 22.8677 201.589 23.0612C201.879 23.2548 202.024 23.5354 202.024 23.9032C202.024 24.2903 201.865 24.6048 201.545 24.8467C201.236 25.079 200.786 25.1951 200.195 25.1951H199.15V24.9048H200.166C200.476 24.9048 200.708 24.8274 200.863 24.6725C201.018 24.508 201.095 24.2661 201.095 23.9467C201.095 23.6371 201.013 23.4096 200.848 23.2645C200.694 23.1193 200.447 23.0467 200.108 23.0467H199.557V26.5016C199.557 26.7145 199.595 26.8548 199.673 26.9225C199.75 26.9806 199.963 27.0193 200.311 27.0387V27.329C200.098 27.3193 199.91 27.3145 199.745 27.3145C199.581 27.3145 199.373 27.3145 199.121 27.3145C198.869 27.3145 198.661 27.3145 198.497 27.3145C198.342 27.3145 198.182 27.3193 198.018 27.329ZM201.894 27.4306C201.661 27.4306 201.477 27.3725 201.342 27.2564C201.216 27.1403 201.124 26.9612 201.066 26.7193L200.877 25.95C200.81 25.6693 200.723 25.4758 200.616 25.3693C200.519 25.2629 200.35 25.2048 200.108 25.1951L200.079 25.05L200.34 25.0935C200.834 25.1225 201.187 25.2096 201.4 25.3548C201.613 25.5 201.768 25.7612 201.865 26.1387L201.995 26.6903C202.024 26.8064 202.058 26.8887 202.097 26.9371C202.145 26.9854 202.198 27.0096 202.257 27.0096C202.334 27.0096 202.411 26.9612 202.489 26.8645L202.663 27.0677C202.498 27.3096 202.242 27.4306 201.894 27.4306Z"
          fill="currentColor"
        />
      </g>
      {/* Morph target: a filled dot at the ®'s centre, the same radius as the ®
          itself. fill="none" keeps it invisible — GSAP only reads its geometry. */}
      <circle id="dot" cx="200.166" cy="25.166" r="4.166" fill="none" />
      <path
        id="to1"
        d="M200 22.0004C204 34 205 68.8 179 72C153 75.2 113.5 76 97 79"
        stroke="none"
      />
      <path
        id="to2"
        d="M97 79C83.1667 62 68 30.4004 118 22.0004C168 13.6004 193.5 18.5004 200 22.0004"
        stroke="none"
      />
    </svg>
  );
}

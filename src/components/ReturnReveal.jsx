"use client";

import { useEffect, useRef, useState } from "react";
import "../styles/return-reveal.css";

// THE RETURN REVEAL.
//
// Leave the tab, come back, and the page resolves rather than simply being
// there: a sheet of the site's own background lifts off while the content
// under it is still soft, and the softness clears a beat LATER. The white
// leads, the blur trails. The gap between the two is the whole effect — if
// they finished together it would read as one crossfade, which is the thing
// this is not.
//
// WHY A FIXED OVERLAY AND NOT A BLURRED WRAPPER.
//
// The obvious build is filter: blur() on a div around the page. It cannot be
// done here. A filtered element becomes the containing block for every
// position:fixed descendant, and this page has several that matter — the
// CANDOR wordmark at z-40, the Header's search island, the model cursor.
// Wrapping them in a filter would tear them out of the viewport and drop
// them into the wrapper's box for the length of the animation, which is the
// same failure page.js already documents around its own transforms.
//
// So the blur lives on backdrop-filter on an overlay that sits ABOVE
// everything and paints nothing of its own except the background sheet. It
// blurs what shows through it. Nothing in the tree below is touched, so no
// containing block moves and the fixed furniture stays exactly where it was.
//
// WHY visibilitychange AND NOT focus/blur.
//
// window blur fires when focus moves to devtools, to the URL bar, to an
// iframe — none of which hide the page, and all of which would replay this
// in front of someone still looking at it. visibilitychange fires on the
// state that actually matters: the page stopped being rendered.

// How long the page must have been hidden before returning earns a reveal.
// Below this it was an accident — an alt-tab and straight back, a
// notification, a dragged window. Replaying for those makes the site feel
// like it is interrupting rather than receiving.
const MIN_AWAY_MS = 2500;

export default function ReturnReveal() {
  // "idle" paints nothing at all: on first load there is no overlay in the
  // tree to catch a stray pointer event or to composite every frame.
  const [phase, setPhase] = useState("idle");
  const hiddenAt = useRef(0);
  const timer = useRef(null);

  useEffect(() => {
    // The reveal is for coming BACK to a page already read. Someone who is
    // mid-intro has not read it yet, and the intro's own timeline should not
    // be interrupted by a sheet dropping over it.
    const introRunning = () => {
      try {
        return sessionStorage.getItem("candor:intro-seen") !== "1";
      } catch {
        return false;
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt.current = Date.now();
        return;
      }

      const away = Date.now() - hiddenAt.current;
      if (!hiddenAt.current || away < MIN_AWAY_MS || introRunning()) return;

      clearTimeout(timer.current);

      // Mount the overlay opaque and unblurred FIRST, then hand the browser a
      // frame to paint it before flipping to the animating state. Setting
      // both in one go would let React batch them into a single commit, the
      // element would arrive already mid-transition, and the sheet would pop
      // instead of lifting.
      setPhase("cover");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setPhase("clear"));
      });

      // Unmount once the SLOWER of the two layers is done. The blur is the
      // trailing one, so this tracks the blur, not the sheet. Kept in step by
      // hand with --rr-blur-ms + --rr-blur-delay in return-reveal.css.
      timer.current = setTimeout(() => setPhase("idle"), 1250);
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clearTimeout(timer.current);
    };
  }, []);

  if (phase === "idle") return null;

  return <div className="return-reveal" data-phase={phase} aria-hidden="true" />;
}

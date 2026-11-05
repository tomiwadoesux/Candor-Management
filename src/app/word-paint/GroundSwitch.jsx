"use client";

import { useEffect, useRef, useState } from "react";
import { GROUND_EVENT } from "../about-new/wordPaint/WordPaint";

// Turns the study page between a dark ground and a light one, so Spectrum can
// be seen both ways; the words re-read the ground when it changes.
export default function GroundSwitch() {
  const ref = useRef(null);
  const [light, setLight] = useState(false);

  useEffect(() => {
    const page = ref.current?.closest(".wl");
    if (!page) return;
    page.dataset.ground = light ? "light" : "dark";
    window.dispatchEvent(new Event(GROUND_EVENT));
  }, [light]);

  return (
    <button ref={ref} type="button" className="wl-switch" aria-pressed={light} onClick={() => setLight((l) => !l)}>
      <span className={light ? "" : "is-on"}>Dark</span>
      <span className={light ? "is-on" : ""}>Light</span>
    </button>
  );
}

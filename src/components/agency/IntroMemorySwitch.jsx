"use client";

import { useEffect, useState } from "react";
import { INTRO_SEEN_KEY, introMemoryAllowed, setIntroMemory } from "@/lib/introMemory";

// The visitor's way to object to the intro flag — see lib/introMemory.js for
// why it has to exist. On by default, as the ICO suggests for the appearance
// exception; switching it off stops the flag being written and clears any
// that already was.
export default function IntroMemorySwitch() {
  // null until mounted: the setting lives in the browser, so the server can't
  // know it, and guessing would render the switch in the wrong position.
  const [on, setOn] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setOn(introMemoryAllowed());
  }, []);

  const toggle = () => {
    const next = !on;
    if (setIntroMemory(next, INTRO_SEEN_KEY)) {
      setOn(next);
      setFailed(false);
    } else {
      setFailed(true);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-[var(--ag-rule)] py-4">
      <button
        type="button"
        role="switch"
        aria-checked={on ?? true}
        aria-labelledby="intro-memory-label"
        disabled={on === null}
        onClick={toggle}
        className="relative h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors duration-300 disabled:cursor-default"
        style={{
          borderColor: "var(--ag-rule)",
          background: on === false ? "transparent" : "var(--ag-accent)",
        }}
      >
        <span
          aria-hidden="true"
          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-[left] duration-300"
          style={{
            left: on === false ? "3px" : "calc(100% - 19px)",
            background: "var(--ag-ink)",
          }}
        />
      </button>
      <div className="min-w-0 flex-1 text-[14px] leading-[1.5]">
        <p id="intro-memory-label" style={{ color: "var(--ag-ink)" }}>
          Remember that I&rsquo;ve seen the intro
        </p>
        <p style={{ color: "var(--ag-mute)" }} aria-live="polite">
          {failed
            ? "Your browser isn't letting this site store settings, so nothing is being remembered."
            : on === false
              ? "Off. The intro will play every time you open the home page."
              : "On. The intro plays once per tab."}
        </p>
      </div>
    </div>
  );
}

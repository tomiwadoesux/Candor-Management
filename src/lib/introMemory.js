// The visitor's say over the one thing this site keeps in their browser.
//
// After the home page's intro plays, CandorLine (app/hero3/CandorLine.jsx)
// writes `candor:intro-seen` to sessionStorage, so the intro doesn't replay
// every time the visitor comes back to the home page in the same tab.
//
// UK law allows that without asking first only under the "appearance and
// functionality" exception (PECR Schedule A1 para 6, in force 5 February
// 2026), and only if the visitor is told about it AND given a simple, free
// way to object. /privacy tells them, and its switch (components/agency/
// IntroMemorySwitch.jsx) is the way to object; this module holds the answer.
//
// The objection is kept in localStorage, the one thing that outlives the tab:
// an objection forgotten the moment the tab closes would not be honoured at
// all. Remembering a person's own privacy choice is what makes it possible to
// respect it.

const OPT_OUT_KEY = "candor:intro-memory";

// The flag itself. Defined here rather than in CandorLine so that /privacy's
// switch can clear it without importing the intro component (and its
// stylesheet) into the privacy page. CandorLine re-exports it as SEEN_KEY.
export const INTRO_SEEN_KEY = "candor:intro-seen";

// May the intro flag be written? Yes unless the visitor has said no. If
// storage can't be read at all, nothing can be written to it either, so the
// answer doesn't matter — say yes and let the write fail quietly.
export function introMemoryAllowed() {
  try {
    return localStorage.getItem(OPT_OUT_KEY) !== "off";
  } catch {
    return true;
  }
}

// Record the visitor's choice. Turning it off also clears a flag that was
// already written, so the objection takes effect now, not next session.
export function setIntroMemory(allowed, seenKey) {
  try {
    if (allowed) {
      localStorage.removeItem(OPT_OUT_KEY);
    } else {
      localStorage.setItem(OPT_OUT_KEY, "off");
      if (seenKey) sessionStorage.removeItem(seenKey);
    }
    return true;
  } catch {
    return false;
  }
}

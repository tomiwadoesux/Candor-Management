import LogoAnimation from "../../components/LogoAnimation";
import Look from "../../components/Look";
import CandorLine from "./CandorLine";

// The landing sequence, being built here before it replaces the hero on /.
//
// The shape is the one page.js already proves: the intro rides position:sticky
// at the top of the viewport and STAYS pinned, and the next section lives in
// the same containing block with a higher paint order and an opaque
// background, so it scrolls UP from the bottom and reveals over the still-
// pinned intro. The browser pins it natively — no per-frame transform — so it
// cannot drift or jitter.
//
// Choose is deliberately absent: the two cards in the intro are the board now,
// so the MODELS / TALENTS section it used to provide has nowhere left to sit.
//
// CandorLine is the client island. The wordmark is authored here and
// handed down as an element; CandorLine controls when it appears.

export default function Hero3() {
  return (
    <main className="relative bg-white text-[#0c0c0c]">
      {/* The intro, pinned to the top of the viewport. h-screen with its own
          padding, so the chrome sits on the same edges it did before. */}
      <div className="sticky top-0 h-screen w-full overflow-hidden px-3 py-5 md:px-5">
        <CandorLine
          logo={
            // The ANIMATED mark — the ® rides out and morphs into a dot as you
            // scroll, then reverses on the way back up. It was animate={false}
            // while this page had nothing to scroll; now that it does, the
            // scrubbed timeline has a range to work against.
            // `tight` crops the viewBox to the letters' own ink, so the mark
            // sits on the top padding line instead of carrying ~21 units of
            // empty space above it. The paths fill with currentColor, hence
            // the explicit text colour.
            // Narrower below md: 200px is over half the width of a 360px
            // phone, which made the mark read as the subject of the screen
            // rather than as its heading.
            <span className="block text-[#0c0c0c]">
              <LogoAnimation tight className="w-[124px] md:w-[200px]" />
            </span>
          }
        />
      </div>

      {/* Travel before the next section begins sliding up. Real content rather
          than padding: a sticky element can only move within its containing
          block's content box, so the intro needs this much room below it to
          stay pinned through the sequence.
          Transparent and pointer-events-none, so the pinned intro shows
          through and stays interactive underneath. */}
      <div className="h-[60vh]" aria-hidden="true" />

      {/* Selena Forrest, rising from the bottom over the pinned intro. Opaque
          and a layer up, which is what makes it cover rather than push. */}
      <div className="relative z-10 bg-white">
        <Look />
      </div>
    </main>
  );
}

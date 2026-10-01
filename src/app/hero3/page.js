import LogoAnimation from "../../components/LogoAnimation";
import Look from "../../components/Look";
import { agency, contactMailto } from "../../../data/agency";
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
// CandorLine is the one client island. The wordmark and the corner chrome are
// authored here and still server-rendered — handed down as elements — but
// CandorLine is what mounts them, because when they appear depends on where
// the intro has got to.

const Rule = () => <span className="my-1.5 block h-px w-6 bg-black/25" />;
const TOPIC = "text-[10px] font-bold uppercase tracking-[0.02em]";

// The chrome's links, as PLAIN anchors. Deliberately not ChromeLink: that
// component carries a hover arrow that slides its label aside to uncover it,
// which fights the [ ] marker sitting at the head of each label here. It is
// shared by the sphere board, Choose and the models rail, so the arrow is
// removed by not using it rather than by changing it for every one of them.
function ChromeItem({ href = "#", children }) {
  return (
    <a
      href={href}
      className="pointer-events-auto block whitespace-nowrap transition-opacity duration-300 hover:opacity-60"
    >
      {children}
    </a>
  );
}

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
          chrome={
            <>
              {/* JOIN and INFO, stacked in the bottom-left corner and
                  separated by the chrome's own rule. From lg up only: below
                  that the corner cannot hold this and the copyright at once,
                  so the small-screen version further down replaces it. */}
              <div className="pointer-events-none absolute bottom-5 left-3 hidden text-[12px] font-light leading-[1.45] md:left-5 lg:block">
                <div className="flex flex-col items-start">
                  <span className={TOPIC}>JOIN</span>
                  <div className="mt-1.5 flex flex-col items-start">
                    <ChromeItem href="/get-scouted">
                      [&nbsp;] Become a Talent
                    </ChromeItem>
                    <ChromeItem href="/get-scouted">
                      [&nbsp;] Submit Polaroids
                    </ChromeItem>
                  </div>

                  <Rule />

                  <span className={TOPIC}>INFO</span>
                  <div className="mt-1.5 flex flex-col items-start">
                    <ChromeItem href={contactMailto}>
                      [&nbsp;] {agency.contact.email}
                    </ChromeItem>
                  </div>
                </div>
              </div>

              {/* Small screens: the same details, run VERTICALLY up the left
                  and right edges.
                  Rotated rather than set horizontally because of what each
                  costs in width. A horizontal rail wide enough for "Become a
                  Talent" takes ~64px a side, which on a 360px phone leaves
                  the two cards 110px each — unusably narrow. Rotated, a rail
                  is only as wide as the type is tall, ~22px, and the cards
                  keep ~152px. The text reads bottom-to-top on the left and
                  top-to-bottom on the right, so each runs away from the
                  nearest corner rather than both leaning the same way. */}
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1 lg:hidden">
                <div
                  className="flex items-center gap-4 whitespace-nowrap text-[10px] font-light tracking-[0.04em]"
                  style={{ writingMode: "vertical-rl", rotate: "180deg" }}
                >
                  <ChromeItem href="/get-scouted">
                    [&nbsp;] Become a Talent
                  </ChromeItem>
                  <ChromeItem href="/get-scouted">
                    [&nbsp;] Submit Polaroids
                  </ChromeItem>
                </div>
              </div>

              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1 lg:hidden">
                <div
                  className="flex items-center gap-4 whitespace-nowrap text-[10px] font-light tracking-[0.04em]"
                  style={{ writingMode: "vertical-rl" }}
                >
                  <ChromeItem href={contactMailto}>
                    [&nbsp;] {agency.contact.email}
                  </ChromeItem>
                </div>
              </div>
            </>
          }
          // Passed separately from `chrome` because it behaves differently: the
          // rest of the furniture arrives at the end of the intro, but the
          // copyright is present from the first frame — it is the page's
          // footing, not something the intro delivers.
          copyright={
            /* Bottom-right from lg up, where it sits opposite the JOIN/INFO
               block. Below that the chrome runs up the left and right edges,
               so the foot of the screen is free and the copyright sits there
               centred. It cannot go to the top on small screens: the wordmark
               is centred at top-5 and they would overlap. */
            <>
              <div className="pointer-events-none absolute bottom-5 right-3 hidden text-[10px] text-black/45 md:right-5 lg:block">
                <span>
                  © {new Date().getFullYear()} Candor Management Agency
                </span>
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[9px] text-black/40 lg:hidden">
                <span>
                  © {new Date().getFullYear()} Candor Management Agency
                </span>
              </div>
            </>
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

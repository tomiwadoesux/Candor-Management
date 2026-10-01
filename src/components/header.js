"use client"; // if using Next.js 13+

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import BlackLogo from "./black-logo";

import { SearchProvider, useSearch } from "./SearchContext";

// The sidebar's three divisions and their disciplines. Same targets as the
// bottom index (components/InNav.js NAV_GROUPS) — deliberately restated rather
// than shared, since the two menus print different subsets: this one leads
// with the board headings, that one with the filters.
const MENU_GROUPS = [
  {
    title: "MODELS",
    href: "/models",
    items: [
      { label: "New Faces", href: "/models?board=newfaces" },
      { label: "Mainboard", href: "/models?board=mainboard" },
      { label: "All Models", href: "/models" },
    ],
  },
  {
    title: "TALENTS",
    href: "/talents",
    items: [
      { label: "Actor", href: "/talents?focus=Actor" },
      { label: "Dancer", href: "/talents?focus=Dancer" },
      { label: "Make Up Artist", href: "/talents?focus=Make+Up+Artist" },
      { label: "Hair Stylist", href: "/talents?focus=Hair+Stylist" },
    ],
  },
  {
    title: "CREATIVES",
    href: "/creatives",
    items: [
      { label: "Fashion Stylist", href: "/creatives?focus=Fashion+Stylist" },
      { label: "Artist", href: "/creatives?focus=Artist" },
      { label: "Photographer", href: "/creatives?focus=Photographer" },
      {
        label: "Creative Director",
        href: "/creatives?focus=Creative+Director",
      },
    ],
  },
];

// Search (framer-motion) and InNav (gsap + MorphSVG plugins) are the heaviest
// libraries in the shared bundle, yet they only power the bottom search/menu
// island — not needed for first paint. Defer them so framer-motion and the gsap
// plugins drop out of every page's First Load JS and load after hydration.
const Search = dynamic(() => import("./Search"), { ssr: false });
const InNav = dynamic(() => import("./InNav"), { ssr: false });

// `delayMs` holds the bottom search island back for that long after mount,
// then fades it in. It defaults to 0, so every page that renders <Header />
// with no props behaves exactly as it always has — only the landing page
// passes a value, to keep the island out of its opening animation.
export default function Header({ delayMs = 0, skipWhenSeen }) {
  const [isOpen, setIsOpen] = useState(false);

  // Starts hidden only when there is a delay to wait out. With delayMs = 0
  // this is true from the first render, so the island paints immediately and
  // no page that does not opt in ever sees a transition.
  //
  // It must also start hidden on the SERVER render whenever a delay is set,
  // which is why this is derived from the prop alone — reading sessionStorage
  // here would not match the server's output and would hydrate as a mismatch.
  // The repeat-visit case is handled in the effect instead.
  const [barShown, setBarShown] = useState(delayMs <= 0);

  useEffect(() => {
    if (delayMs <= 0) return;

    // `skipWhenSeen` names a sessionStorage key that some other component sets
    // once it has played. If it is already set, whatever this delay was
    // waiting for is not going to happen this visit, so the island shows at
    // once rather than after a wait for nothing.
    //
    // This read has to happen BEFORE that component's own effect writes the
    // key, or a first visit would look like a repeat one. It does, because
    // Header is rendered above it on the page and React runs effects in mount
    // order — but that is a load-bearing detail of the page's JSX order, so
    // whoever moves <Header /> below the intro needs to know it.
    if (skipWhenSeen) {
      let seen = false;
      try {
        seen = sessionStorage.getItem(skipWhenSeen) === "1";
      } catch {
        // Private mode, or storage disabled. Fall through and serve the delay:
        // showing the island late is a far smaller fault than showing it over
        // an animation that is still running.
      }
      if (seen) {
        setBarShown(true);
        return;
      }
    }

    const t = setTimeout(() => setBarShown(true), delayMs);
    return () => clearTimeout(t);
  }, [delayMs, skipWhenSeen]);

  return (
    <SearchProvider>
      {/* Centered bottom Search + Nav bar */}
      <div className="fixed bottom-5 inset-x-0 flex justify-center z-50 pointer-events-none">
        <div
          data-bottombar
          className="flex flex-row items-center pointer-events-auto"
          style={{
            opacity: barShown ? 1 : 0,
            // Rises as it fades, the same gesture the intro's cards make when
            // they land — the island is arriving WITH them, so it should not
            // simply switch on while everything around it settles into place.
            transform: barShown ? "none" : "translateY(10px)",
            // 380ms and this curve are the cards' own --card-in-ms and
            // --ease-out from styles/candor-intro.css. Matched deliberately:
            // at 500ms the island was still fading up after the wordmark and
            // the cards had finished, which read as a fourth thing arriving
            // rather than as part of the same moment.
            transition: barShown
              ? "opacity 380ms cubic-bezier(0.22, 1, 0.36, 1), transform 380ms cubic-bezier(0.22, 1, 0.36, 1)"
              : "none",
            // Not just invisible — unclickable too while it is waiting, so a
            // stray click during the intro cannot land on a control that is
            // not on screen yet.
            pointerEvents: barShown ? undefined : "none",
          }}
        >
          <BottomBar />
        </div>
      </div>

      <NavMenuSidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </SearchProvider>
  );
}

// Consumes the shared search state so the menu icon can react to the morph.
function BottomBar() {
  const { isSearchOpen } = useSearch();
  return (
    <>
      <Search />
      <InNav searchOpen={isSearchOpen} />
    </>
  );
}

function NavMenuSidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Slide in from the right */}
      <div
        className={`fixed top-0 right-0 h-full w-[80vw] md:w-[60vw] lg:w-[40vw] bg-black shadow-lg z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div>
          <h1
            className="text-right text-white relative right-7 top-6 gap-2 cursor-pointer"
            onClick={onClose}
          >
            Close
          </h1>
        </div>

        {/* The three divisions and their disciplines. These were bare <h4>s —
            they looked like a menu and none of them went anywhere. Each now
            deep-links into its board, the same targets InNav uses. */}
        <div className="flex flex-col text-white gap-10 pt-14">
          {MENU_GROUPS.map((group, i) => (
            <div
              key={group.title}
              className={`flex flex-col gap-4 px-6 text-lg ${
                i === MENU_GROUPS.length - 1 ? "mb-6" : ""
              }`}
            >
              <div className="flex-col flex gap-3">
                <h1 className="text-3xl gap-2 md:text-4xl">
                  <Link href={group.href} onClick={onClose}>
                    {group.title}
                  </Link>
                </h1>
                <div className="flex-col flex gap-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={onClose}
                      className="text-sm tracking-[0.2em] transition-opacity hover:opacity-60"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 text-white flex flex-col gap-2 lg:right-0 fixed bottom-3">
          <div className="bg-white w-60 h-60"></div>
          <h4 className="text-xs">© Candor 2025. All Rights Reserved</h4>
        </div>
      </div>
    </>
  );
}

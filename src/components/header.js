"use client"; // if using Next.js 13+

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { SearchProvider, useSearch } from "./SearchContext";

// The bottom island loads after hydration; its search and navigation share state.
const Search = dynamic(() => import("./Search"), { ssr: false });
const InNav = dynamic(() => import("./InNav"), { ssr: false });

// `delayMs` holds the bottom search island back for that long after mount,
// then fades it in. It defaults to 0, so every page that renders <Header />
// with no props behaves exactly as it always has — only the landing page
// passes a value, to keep the island out of its opening animation.
export default function Header({ delayMs = 0, skipWhenSeen }) {
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

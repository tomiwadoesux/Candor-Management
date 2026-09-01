"use client"; // if using Next.js 13+

import { useState } from "react";
import dynamic from "next/dynamic";
import BlackLogo from "./black-logo";

import { SearchProvider, useSearch } from "./SearchContext";

// Search (framer-motion) and InNav (gsap + MorphSVG plugins) are the heaviest
// libraries in the shared bundle, yet they only power the bottom search/menu
// island — not needed for first paint. Defer them so framer-motion and the gsap
// plugins drop out of every page's First Load JS and load after hydration.
const Search = dynamic(() => import("./Search"), { ssr: false });
const InNav = dynamic(() => import("./InNav"), { ssr: false });

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SearchProvider>
      {/* Centered bottom Search + Nav bar */}
      <div className="fixed bottom-5 inset-x-0 flex justify-center z-50 pointer-events-none">
        <div
          data-bottombar
          className="flex flex-row items-center pointer-events-auto"
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

        <div className="flex flex-col text-white gap-10 pt-14">
          <div className="flex flex-col gap-4 px-6 text-lg">
            <div className="flex-col flex gap-3">
              <h1 className="text-3xl gap-2 md:text-4xl">MODELS</h1>
              <div className="flex-col flex gap-1">
                <h4 className="text-sm tracking-[0.2em]">New Faces</h4>
                <h4 className="text-sm tracking-[0.2em]">Development</h4>
                <h4 className="text-sm tracking-[0.2em]">Established</h4>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 px-6 text-lg">
            <div className="flex-col flex gap-3">
              <h1 className="text-3xl gap-2 md:text-4xl">TALENTS</h1>
              <div className="flex-col flex gap-1">
                <h4 className="text-sm tracking-[0.2em]">Actor</h4>
                <h4 className="text-sm tracking-[0.2em]">Dancer</h4>
                <h4 className="text-sm tracking-[0.2em]">Make Up Artist</h4>
                <h4 className="text-sm tracking-[0.2em]">Hair Stylist</h4>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 px-6 mb-6 text-lg">
            <div className="flex-col flex gap-3">
              <h1 className="text-3xl gap-2 md:text-4xl">CREATIVES</h1>
              <div className="flex-col flex gap-1">
                <h4 className="text-sm tracking-[0.2em]">Fashion Stylist</h4>
                <h4 className="text-sm tracking-[0.2em]">Artist</h4>
                <h4 className="text-sm tracking-[0.2em]">Photographer</h4>
                <h4 className="text-sm tracking-[0.2em]">Creative Director</h4>
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 text-white flex flex-col gap-2 lg:right-0 fixed bottom-3">
          <div className="bg-white w-60 h-60"></div>
          <h4 className="text-xs">© Candor 2025. All Rights Reserved</h4>
        </div>
      </div>
    </>
  );
}

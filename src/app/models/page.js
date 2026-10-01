"use client";

import Image from "next/image";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "../../components/header";
import HeaderTest from "../../components/headerTest";
import ModelList from "../../components/ModelList";
import ModelRail from "../../components/ModelRail";

import { SearchProvider } from "../../components/SearchContext";

const imgUntitledDesign11 =
  "http://localhost:3845/assets/b52f5647a1bbe192fb8e7abd9c3e9b715513a604.png";
const imgGroup1 =
  "http://localhost:3845/assets/aac9b8f9cec60761adf3f3710f968ef3c8cebf60.svg";
const imgAkarIconsArrowUp41 =
  "http://localhost:3845/assets/0463a5b67e457806649f07067fc1395f504d57d2.svg";
const imgEllipse23 =
  "http://localhost:3845/assets/0e670450cf1b40a867576040cc1482d1f77e4b18.svg";

// useSearchParams needs a Suspense boundary to prerender, so the page proper
// is one component down.
export default function ModelsPage() {
  return (
    <Suspense>
      <Models />
    </Suspense>
  );
}

function Models() {
  // The nav deep-links into this page (/models?board=newfaces, ?gender=female
  // — see components/InNav.js NAV_GROUPS), so the filters open on whatever the
  // link asked for. After that they're ordinary state: clicking a filter does
  // not rewrite the URL, it just filters.
  const params = useSearchParams();
  const [selectedGender, setSelectedGender] = useState(
    () => params.get("gender") ?? "all"
  );
  const [selectedBoard, setSelectedBoard] = useState(
    () => params.get("board") ?? "all"
  );
  const [hoveredModel, setHoveredModel] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Both filters are applied inside ModelList (it owns the roster and now also
  // the division split), so the page only holds the selection. It used to
  // compute a filteredModels list here that nothing rendered, while the board
  // buttons highlighted without filtering anything at all.

  return (
    <SearchProvider>
      <div className="bg-white min-h-screen w-full">
        <Header />
        <main className="w-full px-3 md:px-5 lg:flex lg:items-start lg:gap-5">
          {/* Left rail: 25% of the screen on desktop — the hovered model's
              name / height / shoe and four polaroids. Sticky so it stays put
              while the grid scrolls. */}
          <aside
            data-slot="models-rail"
            // mt-5 matches the filter column's pt-5 so both columns start on
            // the same line. Without it the rail's only top inset came from
            // `sticky top-5`, which needs slack in the container to apply —
            // so filtering down to a short grid (main exactly the rail's own
            // height) left it with none and the rail jumped up 20px.
            className="hidden lg:block lg:w-[25%] lg:shrink-0 lg:sticky lg:top-5 lg:mt-5 lg:h-[calc(100vh-2.5rem)] lg:pr-5 lg:border-r lg:border-black/10"
          >
            <ModelRail />
          </aside>

          <div className="min-w-0 flex-1">
          {/* Filters pin to the top of the viewport; the grid scrolls up behind
              them (opaque background + z-index so nothing shows through). */}
          <section data-slot="models-filters" className="sticky top-0 z-20 bg-white pt-5">
            <div className="relative flex justify-between items-start pb-5 gap-2 md:gap-5  flex-row">
              {/* page title, dead centre between the two filter stacks */}
              <h1
                className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 text-[52px] font-medium text-black"
                // inline: globals.css styles h1 un-layered (display face,
                // line-height 1), which beats Tailwind's utilities. leading-none
                // makes the line box hug the glyphs, so the cap sits on the
                // same top edge as the filter labels either side.
                style={{ fontFamily: "var(--font-sub)", lineHeight: 1 }}
              >
                Models
              </h1>
              <div className="flex  text-xl flex-col md:gap-1 lg:gap-1 items-start">
                <button
                  onClick={() => setSelectedGender("female")}
                  className="self-start flex flex-row-reverse gap-1 items-center cursor-pointer"
                >
                  <h4
                    className={` text-[13px] transition-colors ${
                      selectedGender === "female"
                        ? "bg-[#00749E] text-white px-1"
                        : "text-black"
                    }`}
                  >
                    WOMEN
                  </h4>
              
                </button>
                <button
                  onClick={() => setSelectedGender("male")}
                  className="self-start flex flex-row-reverse gap-1 items-center cursor-pointer"
                >
                  <h4
                    className={` text-[13px] transition-colors ${
                      selectedGender === "male"
                        ? "bg-[#00749E] text-white px-1"
                        : "text-black"
                    }`}
                  >
                    MEN
                  </h4>
                 
                </button>
                <button
                  onClick={() => setSelectedGender("all")}
                  className="self-start flex flex-row-reverse gap-1 items-center cursor-pointer"
                >
                  <h4
                    className={` text-[13px] transition-colors ${
                      selectedGender === "all"
                        ? "bg-[#00749E] text-white px-1"
                        : "text-black"
                    }`}
                  >
                    ALL
                  </h4>
                
                </button>
              </div>

              <div className="flex text-xl flex-col items-end md:gap-1 lg:gap-1">
                <button
                  onClick={() => setSelectedBoard("mainboard")}
                  className="self-end flex flex-row-reverse gap-1 items-center cursor-pointer"
                >
                  <h4
                    className={` text-[13px] transition-colors ${
                      selectedBoard === "mainboard"
                        ? "bg-[#00749E] text-white px-1"
                        : "text-black"
                    }`}
                  >
                    MAIN BOARD
                  </h4>
                 
                </button>
                <button
                  onClick={() => setSelectedBoard("newfaces")}
                  className="self-end flex flex-row-reverse gap-1 items-center cursor-pointer"
                >
                  <h4
                    className={` text-[13px] transition-colors ${
                      selectedBoard === "newfaces"
                        ? "bg-[#00749E] text-white px-1"
                        : "text-black"
                    }`}
                  >
                    NEW FACES
                  </h4>
                 
                </button>
                <button
                  onClick={() => setSelectedBoard("all")}
                  className="self-end flex flex-row-reverse gap-1 items-center cursor-pointer"
                >
                  <h4
                    className={` text-[13px] transition-colors ${
                      selectedBoard === "all"
                        ? "bg-[#00749E] text-white px-1"
                        : "text-black"
                    }`}
                  >
                    ALL
                  </h4>
                  
                </button>
              </div>
            </div>
          </section>

          <ModelList
            gender={selectedGender}
            board={selectedBoard}
            division="models"
            className="lg:px-0"
          />
          </div>
        </main>
      </div>
    </SearchProvider>
  );
}

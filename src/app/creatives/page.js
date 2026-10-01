"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "../../components/header";
import ModelList from "../../components/ModelList";
import ModelRail from "../../components/ModelRail";
import { SearchProvider } from "../../components/SearchContext";
import { models } from "../../../data/models";
import { divisions } from "../../../data/agency";

// /creatives is the same board as /talents against the third division — the
// one the nav has always named (header.js:97-102) and never had a route for.
// Kept as its own file rather than a [division] dynamic route: the two pages
// are a handful of lines each, and a shared route would have to carry a
// per-division config map anyway. Split them if a third variation appears.

const DIVISION = "creatives";

const { label: TITLE, sublabels: DISCIPLINES } = divisions.find(
  (d) => d.slug === DIVISION
);

// The nav lists four disciplines; only offer the ones somebody is filed under,
// so a filter can't lead to a guaranteed empty grid.
const AVAILABLE = DISCIPLINES.filter((discipline) =>
  models.some((m) => m.division === DIVISION && m.talent === discipline)
);

// useSearchParams needs a Suspense boundary to prerender.
export default function CreativesPage() {
  return (
    <Suspense>
      <Creatives />
    </Suspense>
  );
}

function Creatives() {
  // Opens on the discipline the nav linked to, when someone is on it.
  const params = useSearchParams();
  const [selectedFocus, setSelectedFocus] = useState(() => {
    const asked = params.get("focus");
    return asked && AVAILABLE.includes(asked) ? asked : "all";
  });

  return (
    <SearchProvider>
      <div className="bg-white min-h-screen w-full">
        <Header />
        <main className="w-full px-3 md:px-5 lg:flex lg:items-start lg:gap-5">
          <aside
            data-slot="models-rail"
            className="hidden lg:block lg:w-[25%] lg:shrink-0 lg:sticky lg:top-5 lg:mt-5 lg:h-[calc(100vh-2.5rem)] lg:pr-5 lg:border-r lg:border-black/10"
          >
            <ModelRail emptyLabel="Creative information appears here" />
          </aside>

          <div className="min-w-0 flex-1">
            <section
              data-slot="models-filters"
              className="sticky top-0 z-20 bg-white pt-5"
            >
              <div className="relative flex justify-between items-start pb-5 gap-2 md:gap-5 flex-row">
                <h1
                  className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 text-[52px] font-medium text-black"
                  style={{ fontFamily: "var(--font-sub)", lineHeight: 1 }}
                >
                  {TITLE}
                </h1>

                <div className="flex text-xl flex-col md:gap-1 lg:gap-1 items-start">
                  {AVAILABLE.map((discipline) => (
                    <button
                      key={discipline}
                      onClick={() => setSelectedFocus(discipline)}
                      className="self-start flex flex-row-reverse gap-1 items-center cursor-pointer"
                    >
                      <h4
                        className={`text-[13px] transition-colors ${
                          selectedFocus === discipline
                            ? "bg-[#00749E] text-white px-1"
                            : "text-black"
                        }`}
                      >
                        {discipline.toUpperCase()}
                      </h4>
                    </button>
                  ))}
                  <button
                    onClick={() => setSelectedFocus("all")}
                    className="self-start flex flex-row-reverse gap-1 items-center cursor-pointer"
                  >
                    <h4
                      className={`text-[13px] transition-colors ${
                        selectedFocus === "all"
                          ? "bg-[#00749E] text-white px-1"
                          : "text-black"
                      }`}
                    >
                      ALL
                    </h4>
                  </button>
                </div>

                <div aria-hidden className="w-[1px]" />
              </div>
            </section>

            <ModelList
              division={DIVISION}
              focus={selectedFocus}
              className="lg:px-0"
            />
          </div>
        </main>
      </div>
    </SearchProvider>
  );
}

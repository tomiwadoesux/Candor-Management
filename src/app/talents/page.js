"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "../../components/header";
import ModelList from "../../components/ModelList";
import ModelRail from "../../components/ModelRail";
import { SearchProvider } from "../../components/SearchContext";
import { models } from "../../../data/models";
import { divisions } from "../../../data/agency";

// /talents is /models with the roster filtered to the talents division and the
// filter axis swapped: gender means nothing for an actor or a make-up artist,
// so the left column filters by DISCIPLINE instead (the same four the nav
// already names — see data/agency.js divisions).
//
// Everything else is deliberately the same shell: the sticky filter bar, the
// 25% rail and the five-column grid are the components /models mounts, so the
// two boards read as one site. Profiles link to /models/[id], which renders
// every record regardless of division — there is no separate talent profile
// route and there shouldn't be one.

const DIVISION = "talents";

const { label: TITLE, sublabels: DISCIPLINES } = divisions.find(
  (d) => d.slug === DIVISION
);

// Only offer a discipline that someone is actually on. The nav lists four; if
// the board has nobody filed under "Hair Stylist" yet, showing the filter just
// offers a guaranteed empty grid.
const AVAILABLE = DISCIPLINES.filter((discipline) =>
  models.some((m) => m.division === DIVISION && m.talent === discipline)
);

// useSearchParams needs a Suspense boundary to prerender.
export default function TalentsPage() {
  return (
    <Suspense>
      <Talents />
    </Suspense>
  );
}

function Talents() {
  // The nav deep-links a discipline (/talents?focus=Dancer), so open on it —
  // but only if somebody is actually filed under it, or the page would land
  // on a filter with an empty grid behind it.
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
          {/* Left rail — the hovered person's name, two pictures and their
              discipline/focus/base. Same component as /models; it branches on
              the division for which stats it prints. */}
          <aside
            data-slot="models-rail"
            className="hidden lg:block lg:w-[25%] lg:shrink-0 lg:sticky lg:top-5 lg:mt-5 lg:h-[calc(100vh-2.5rem)] lg:pr-5 lg:border-r lg:border-black/10"
          >
            <ModelRail emptyLabel="Talent information appears here" />
          </aside>

          <div className="min-w-0 flex-1">
            <section
              data-slot="models-filters"
              className="sticky top-0 z-20 bg-white pt-5"
            >
              <div className="relative flex justify-between items-start pb-5 gap-2 md:gap-5 flex-row">
                <h1
                  className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 text-[52px] font-medium text-black"
                  // inline, matching /models: globals.css styles h1 un-layered
                  // (display face, line-height 1), which beats Tailwind's
                  // utilities.
                  style={{ fontFamily: "var(--font-sub)", lineHeight: 1 }}
                >
                  {TITLE}
                </h1>

                {/* Disciplines down the left, where /models puts gender. */}
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

                {/* The right column on /models holds the board filter. Talents
                    aren't split across boards, so it stays empty rather than
                    offering a control that does nothing — the spacer keeps the
                    title centred between the two columns. */}
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

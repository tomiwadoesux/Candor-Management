// Instant placeholder for /models. Next.js swaps this in the moment a link to
// the route is clicked, before any of the page's data or images resolve, so a
// navigation lands on the page's shape rather than on a blank screen.
//
// It mirrors the real layout box for box — the same rail width, the same grid
// columns, the same aspect ratios — so when the page itself arrives the tiles
// appear where these blocks already are and nothing jumps.
//
// Deliberately static: no pulse, no shimmer, no fade. A placeholder that
// animates reads as "something is happening here"; this one is only meant to
// hold the shape for the moment before the real thing lands.

// Enough tiles to fill a first screen at the widest layout (5 columns × 3
// rows). Narrower viewports show fewer columns, so the same count runs deeper
// than one screen there — the extras simply sit below the fold, which costs
// nothing and keeps the count from needing to know the breakpoint.
const TILE_COUNT = 15;

// Mirrors a real tile: the aspect-[4/5] photo, plus the three-line caption
// (name / talent / height) that ModelList renders under it below lg. Without
// the caption the mobile placeholder would be a full text block shorter than
// the content replacing it, so every tile would jump on arrival.
function Tile() {
  return (
    <div>
      <div className="aspect-[4/5] bg-[#ececec]" />
      <div className="mt-2 flex flex-col gap-1 lg:hidden">
        <div className="h-3 w-3/4 bg-[#ececec]" />
        <div className="h-3 w-1/2 bg-[#ececec]" />
        <div className="h-3 w-1/3 bg-[#ececec]" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="bg-white min-h-screen w-full">
      <main className="w-full px-3 md:px-5 lg:flex lg:items-start lg:gap-5">
        {/* Left rail — same width, inset and border as the real <aside>. */}
        <aside className="hidden lg:block lg:w-[25%] lg:shrink-0 lg:sticky lg:top-5 lg:mt-5 lg:h-[calc(100vh-2.5rem)] lg:pr-5 lg:border-r lg:border-black/10">
          <div className="relative flex h-full items-start">
            {/* The rail's block sits one filter-bar down so the name lines up
                with the first row of tiles. The real page measures that bar;
                here it is a static stand-in of the same height (pt-5 + three
                13px rows + pb-5), since there is no bar to measure yet. */}
            <div className="relative w-full pt-[6.5rem]">
              {/* name */}
              <div className="mb-3 h-9 w-full bg-[#ececec] md:mb-4" />

              {/* the two polaroids */}
              <div className="flex flex-row gap-3 md:gap-4">
                <div className="aspect-[2/3] flex-1 bg-[#ececec]" />
                <div className="aspect-[2/3] flex-1 bg-[#ececec]" />
              </div>

              {/* caption + stats line under the pair */}
              <div className="absolute inset-x-0 top-full mt-3 flex items-start justify-between gap-3 md:mt-4">
                <div className="h-3 w-28 bg-[#ececec]" />
                <div className="flex flex-col items-end gap-1.5">
                  <div className="h-3 w-20 bg-[#ececec]" />
                  <div className="h-3 w-20 bg-[#ececec]" />
                  <div className="h-3 w-20 bg-[#ececec]" />
                </div>
              </div>
            </div>

            {/* wordmark + contact stack, bottom-left */}
            <div className="absolute bottom-0 left-0 flex flex-col items-start gap-2">
              <div className="h-6 w-[130px] bg-[#ececec]" />
              <div className="h-3 w-40 bg-[#ececec]" />
              <div className="h-3 w-24 bg-[#ececec]" />
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* filter bar: two stacks of three labels with the title between */}
          <section className="sticky top-0 z-20 bg-white pt-5">
            <div className="flex flex-row items-start justify-between gap-2 pb-5 md:gap-5">
              <div className="flex flex-col items-start gap-1">
                <div className="h-3 w-16 bg-[#ececec]" />
                <div className="h-3 w-10 bg-[#ececec]" />
                <div className="h-3 w-8 bg-[#ececec]" />
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="h-3 w-24 bg-[#ececec]" />
                <div className="h-3 w-20 bg-[#ececec]" />
                <div className="h-3 w-8 bg-[#ececec]" />
              </div>
            </div>
          </section>

          <section className="relative">
            <div className="grid grid-cols-2 gap-3 px-3 pt-3 md:grid-cols-3 md:gap-4 md:px-5 md:pt-0 lg:grid-cols-5 lg:px-0">
              {Array.from({ length: TILE_COUNT }, (_, i) => (
                <Tile key={i} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// Instant placeholder for /creatives. Identical in shape to the /talents
// skeleton — the two routes mount the same components with a different
// division — so see app/talents/loading.js for why the filter bar here is a
// single left-hand column and why the block count is deliberately short.

// The creatives board is short; one row is honest about its size.
const TILE_COUNT = 5;

// Matches ModelList's tiles: aspect-[4/5] in a 5-column grid.
function Tile() {
  return <div className="aspect-[4/5] bg-[#ececec]" />;
}

export default function Loading() {
  return (
    <div className="bg-white min-h-screen w-full">
      <main className="w-full px-3 md:px-5 lg:flex lg:items-start lg:gap-5">
        <aside className="hidden lg:block lg:w-[25%] lg:shrink-0 lg:sticky lg:top-5 lg:mt-5 lg:h-[calc(100vh-2.5rem)] lg:pr-5 lg:border-r lg:border-black/10">
          <div className="relative flex h-full items-start">
            <div className="relative w-full pt-[6.5rem]">
              {/* name */}
              <div className="mb-3 h-9 w-full bg-[#ececec] md:mb-4" />

              {/* the two pictures */}
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
          <section className="sticky top-0 z-20 bg-white pt-5">
            <div className="flex flex-row items-start justify-between gap-2 pb-5 md:gap-5">
              <div className="flex flex-col items-start gap-1">
                <div className="h-3 w-24 bg-[#ececec]" />
                <div className="h-3 w-12 bg-[#ececec]" />
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

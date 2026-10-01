// Instant placeholder for /talents — the same idea as app/models/loading.js:
// Next.js swaps this in the moment a link to the route is clicked, so a
// navigation lands on the page's shape rather than on a blank screen.
//
// It differs from the /models skeleton in one place, and only one: the filter
// bar here is a single column of disciplines on the left (gender means nothing
// for an actor or a stylist), so the right-hand stack of board labels is not
// drawn. Everything else — rail width, grid columns, aspect ratios — matches,
// because the two pages mount the same components.
//
// Deliberately static: no pulse, no shimmer. A placeholder that animates reads
// as "something is happening here"; this one only holds the shape.

// The talents board is short, so a full three rows of blocks would promise
// more than arrives and then collapse. One row is honest about the size.
const TILE_COUNT = 5;

// Matches ModelList's tiles: aspect-[4/5] in a 5-column grid.
function Tile() {
  return <div className="aspect-[4/5] bg-[#ececec]" />;
}

export default function Loading() {
  return (
    <div className="bg-white min-h-screen w-full">
      <main className="w-full px-3 md:px-5 lg:flex lg:items-start lg:gap-5">
        {/* Left rail — same width, inset and border as the real <aside>. */}
        <aside className="hidden lg:block lg:w-[25%] lg:shrink-0 lg:sticky lg:top-5 lg:mt-5 lg:h-[calc(100vh-2.5rem)] lg:pr-5 lg:border-r lg:border-black/10">
          <div className="relative flex h-full items-start">
            {/* The rail's block sits one filter-bar down so the name lines up
                with the first row of tiles. Static stand-in of the same
                height, since there is no bar to measure yet. */}
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
          {/* filter bar: one stack of disciplines on the left. The right-hand
              column is a 1px spacer on the real page, so nothing is drawn for
              it here either. */}
          <section className="sticky top-0 z-20 bg-white pt-5">
            <div className="flex flex-row items-start justify-between gap-2 pb-5 md:gap-5">
              <div className="flex flex-col items-start gap-1">
                <div className="h-3 w-14 bg-[#ececec]" />
                <div className="h-3 w-16 bg-[#ececec]" />
                <div className="h-3 w-28 bg-[#ececec]" />
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

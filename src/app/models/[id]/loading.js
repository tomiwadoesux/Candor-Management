// Instant placeholder for a model profile. Shown the moment a tile on /models
// is clicked, so the click lands on the profile's shape straight away instead
// of holding the old page while the record and its imagery resolve.
//
// Mirrors ModelProfileView: the 56px sticky wordmark/tabs row, then the split
// where the name column takes two thirds and the hero image the last third.
//
// Static by design — no pulse or shimmer. See the note in ../loading.js.

export default function Loading() {
  return (
    <section className="min-h-screen bg-[#fafafa] text-[#0c0c0c]">
      {/* wordmark + board tabs row */}
      <div className="sticky top-0 z-30 flex h-14 items-center bg-[#fafafa] py-4">
        <div className="shrink-0 px-4 lg:w-2/3">
          <div className="h-5 w-[110px] bg-[#ececec]" />
        </div>
        <div className="flex-1 pr-4 lg:w-1/3 lg:flex-none">
          <div className="flex flex-row justify-between">
            <div className="h-3 w-16 bg-[#ececec]" />
            <div className="h-3 w-20 bg-[#ececec]" />
            <div className="h-3 w-16 bg-[#ececec]" />
            <div className="h-3 w-14 bg-[#ececec]" />
          </div>
        </div>
      </div>

      <div className="flex min-h-auto flex-row md:min-h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-3.5rem)] lg:min-h-0">
        {/* rule down the gutter, same position as the real one */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-2/3 -ml-2 hidden w-px bg-black/15 lg:block"
        />

        {/* info column: name slot, then bio and facts */}
        <div className="relative flex w-full shrink-0 flex-col pb-4 lg:w-2/3">
          <div className="px-4">
            {/* The name's slot keeps the real page's fixed heights at each
                breakpoint, so the headline lands exactly here. The bar inside
                is a share of that height rather than an em value — em would
                resolve against the inherited font-size, not the slot, and
                render a sliver at every width. */}
            <div className="flex h-20 items-center md:h-28 lg:h-36">
              <div className="h-12 w-full bg-[#ececec] md:h-16 lg:h-24" />
            </div>
          </div>

          <div className="flex flex-col">
            {/* bio measure */}
            <div className="hidden w-full max-w-[64ch] self-center px-4 pt-2 lg:block">
              <div className="h-3 w-full bg-[#ececec]" />
              <div className="mt-2 h-3 w-4/5 bg-[#ececec]" />
            </div>

            {/* comp-card facts, two columns */}
            <div className="mx-auto hidden w-fit grid-cols-[auto_auto] gap-x-4 gap-y-2 px-4 pt-6 lg:grid">
              {Array.from({ length: 2 }, (_, col) => (
                <div key={col} className="flex flex-col gap-2">
                  {Array.from({ length: 4 }, (_, row) => (
                    <div key={row} className="h-3 w-32 bg-[#ececec]" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* hero image column */}
        <div className="hidden w-1/3 shrink-0 px-4 lg:block">
          <div className="h-full w-full bg-[#ececec]" />
        </div>
      </div>
    </section>
  );
}

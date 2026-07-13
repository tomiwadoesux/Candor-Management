const TITLE = "SELENA FORREST";
const PROJECT = "Bottega Veneta IL MIO";
const CREDITS =
  "Photographed By Drew Vickers, Hair By Shiori Takahashi, Makeup By Laura Dominique";

export default function Look() {
  return (
    <section className="h-screen">
      <div className="relative h-full flex flex-col md:flex-row min-h-0">
        <div className="bg-red-500 w-full h-full relative" />
        <div className="bg-black w-full h-full relative" />

        {/* Centered controls — sit at the seam, vertically centered on the section */}
        <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 items-center">
          <button
            aria-label="Previous"
            className="w-10 h-10 bg-black flex items-center justify-center hover:bg-gray-800 transition"
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            aria-label="Next"
            className="w-10 h-10 bg-black flex items-center justify-center hover:bg-gray-800 transition"
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Mobile controls */}
        <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-row gap-3">
          <button className="w-9 h-9 bg-black flex items-center justify-center hover:bg-gray-800 transition">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button className="w-9 h-9 bg-black flex items-center justify-center hover:bg-gray-800 transition">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
        {/* Editorial credits sit over the panels, aligned to their top-left.
            Equal padding on the wrapper keeps the top/bottom gaps identical to
            the left one. */}
        <div className="absolute inset-0 z-10 pointer-events-none mix-blend-exclusion text-white p-4 md:p-10">
          <div className="sticky top-4 md:top-10 flex w-full max-w-[18rem] flex-col items-start gap-3 text-left md:max-w-[22rem] md:gap-4">
            {/* w-fit group + w-0/min-w-full siblings: only the title sets the
                group's width, so the rule always matches the name exactly. */}
            <div className="flex w-fit flex-col items-start gap-1.5 md:gap-2">
              <h1 className="uppercase text-2xl md:text-3xl tracking-wide whitespace-nowrap">
                {TITLE}
              </h1>
              <h4 className="w-0 min-w-full uppercase text-xs tracking-[0.08em] md:text-sm">
                {PROJECT}
              </h4>
              <div
                className="mt-1.5 h-px w-full bg-white/70 md:mt-2"
                aria-hidden="true"
              />
            </div>
            <p className="max-w-[17rem] text-[11px] leading-[1.45] md:max-w-[20rem] md:text-xs">
              {CREDITS}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

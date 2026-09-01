import News from "./News";

export default function Body() {
  return (
    <section className="pt-14 md:pt-28">
      {/* Sticky wrapper: the browser pins the heading beside CANDOR natively
          while this section fills the viewport, then releases it at the
          section's end. Because the vertical pin is native (no per-frame
          transform chasing the scroll), the steady pinned state can't jitter.
          The scale + horizontal slide beside CANDOR are layered onto the h1
          from app/page.js, which also sets this wrapper's sticky `top`.
          pointer-events-none so the invisible pinned box doesn't eat clicks.

          It has to stay a DIRECT child of the section: a sticky element can only
          travel inside its own containing block, so wrapping it in a padded div
          would collapse its range to the height of the heading and kill the
          dock. The horizontal padding lives on the wrapper itself instead, which
          also lets the board below run full-bleed. */}
      <div
        data-dock-sticky
        className="motion-safe:sticky flex items-start justify-center px-4 pb-6 pointer-events-none mix-blend-exclusion text-white md:px-10"
        style={{ top: 0 }}
      >
        {/* The mix-blend lives on this (non-transformed) wrapper, NOT on the h1:
            the h1 carries a transform + will-change for the dock animation, which
            isolates it into its own layer and stops the blend compositing against
            the page (it would render as flat white → invisible on white). Blending
            on the wrapper with the transform on the child is the same structure
            CANDOR uses, so "models" stays visible on any background. */}
        <h1
          data-dock-title
          className="text-center font-normal lowercase tracking-[0.03em] text-white text-6xl md:text-8xl lg:text-9xl whitespace-nowrap select-none"
          style={{
            willChange: "transform",
            transformOrigin: "top center",
            fontFamily: "'Gwyner Condensed', Bitter, serif",
          }}
        >
          models
        </h1>
      </div>

      {/* The models section carries the campaigns board: the pinned "models"
          heading docks beside CANDOR and the campaign work runs under it. */}
      <News />
    </section>
  );
}

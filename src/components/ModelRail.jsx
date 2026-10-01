"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ChromeLink from "./ChromeLink";
import LogoAnimation from "./LogoAnimation";
import { useHoveredModel } from "./HoveredModelContext";
import FitText, { initialCaps } from "./FitText";
import { agency, joinMailto } from "../../data/agency";

// Left rail on /models: the hovered model's name sits directly above the two
// portrait polaroids, with a caption and the stats right-aligned under it
// beneath the pair, and the contact address at the panel's bottom-left. Every
// vertical gap in the block matches the gutter between the two images. It holds the last model you hovered
// rather than emptying out between tiles, so the panel never flashes blank;
// before the first hover it shows a loading-style skeleton.

// The data stores both systems ("180 cm / 5'11\"", "38 EU / 7 US"); the rail
// shows only the metric half.
const metric = (v) => (v ? String(v).split("/")[0].trim() : "");

// A model is the subject of the photograph; everyone else made it. So the
// stats block splits the same way Sphere2's WorkDetails does: measurements for
// a model, and discipline / focus / base / start year for a talent or creative
// — who has no comp card and no measurements on record.
const isModel = (m) => !m?.division || m.division === "models";

const rowsFor = (m) =>
  (isModel(m)
    ? [
        ["height", metric(m.height)],
        ["chest", metric(m.chest)],
        ["shoe", metric(m.shoe)],
      ]
    : [
        ["focus", m.focus],
        ["based", m.based],
        ["since", m.since],
      ]
  ).filter(([, value]) => value);

// The caption under the pair names what the two pictures are. A model's are
// polaroids off a comp card; a creative's are simply work.
const captionFor = (m) =>
  isModel(m) ? "Model 8×4 polaroid" : `${m.talent || "Talent"} — selected work`;

export default function ModelRail({
  fallbackModel = null,
  className = "",
  // What the panel says before the first hover. /talents and /creatives pass
  // their own wording so it doesn't read "Model information" on either.
  emptyLabel = "Model information appears here",
}) {
  const { hoveredModel } = useHoveredModel() || {};
  const [shown, setShown] = useState(fallbackModel);

  // The grid column opens with a sticky filter bar, so its first row of tiles
  // starts well below the rail's own top. This inset drops the block by that
  // difference, putting the name's cap line on the tiles' top edge.
  //
  // It measures the live gap between the two elements rather than reusing the
  // filter bar's height: the rail and the bar don't share a top edge (the rail
  // carries mt-5 and sticks at top-5, the bar sticks at top-0), so the bar's
  // height alone overshoots by that offset.
  const [gridOffset, setGridOffset] = useState(0);
  const railRef = useRef(null);

  useEffect(() => {
    const bar = document.querySelector('[data-slot="models-filters"]');
    // The <aside>, not this component's own root: it's the flex sibling of the
    // grid column, so it shares an offset parent with the filter bar and the
    // two offsetTop values are directly comparable.
    const rail = railRef.current?.closest('[data-slot="models-rail"]');
    if (!bar || !rail) return;

    const measure = () => {
      // Both columns are children of the same flex row, so offsetTop gives
      // each one's static position in that row — independent of scroll and of
      // either column's sticky offset. The grid's tiles begin one filter bar
      // below the bar's own top, so that height minus the head start the rail
      // already has (its mt-5) is exactly how far this block must drop.
      const gap = bar.offsetHeight - (rail.offsetTop - bar.offsetTop);
      setGridOffset(Math.max(0, gap));
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(bar);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (hoveredModel) setShown(hoveredModel);
  }, [hoveredModel]);

  const model = shown || fallbackModel;
  const polaroids = (model?.polaroids || []).slice(0, 2);

  return (
    <div
      ref={railRef}
      className={`relative flex h-full items-start ${className}`}
    >
      {/* CANDOR wordmark at the rail's bottom-left, with the contact
          addresses stacked beneath it. Absolute so none of it pushes the
          polaroids off centre. */}
      <div className="absolute bottom-0 left-0 z-10 flex flex-col items-start">
        <Link href="/" aria-label="CANDOR home" className="block text-black">
          <LogoAnimation animate={false} className="w-[130px]" />
        </Link>

        {/* wrapper carries any positioning: ChromeLink sets `relative` itself
            (the arrow is absolute inside it), and two position utilities on
            one element resolve by stylesheet order, not class order */}
        <div className="mt-3 flex flex-col items-start text-xs italic text-[#1d1d1d]">
          <ChromeLink left href={joinMailto}>
            {agency.join.email}
          </ChromeLink>
          <ChromeLink left href="/get-scouted">
            Submit Polaroids
          </ChromeLink>
        </div>
      </div>

      {/* The whole block — name, images, caption and stats — is inset from the
          top of the rail by the filter bar's height, so the name's cap line
          meets the top edge of the grid's first row of tiles. The stats still
          hang below the images (out of flow) so their presence never shifts
          the pair. */}
      <div className="relative w-full" style={{ paddingTop: gridOffset }}>
        {/* below the pair: caption flush with the left image's left edge,
            measurements flush right — both starting on the same top line, and
            every line box hugging the glyphs (leading-none + a matching gap)
            so the block's height is exactly the text it contains */}
        <div className="absolute inset-x-0 top-full mt-3 md:mt-4">
          {model ? (
            <div className="flex items-start justify-between gap-3 text-xs leading-none text-[#1d1d1d]/60">
              <span className="italic">{captionFor(model)}</span>
              <dl className="flex flex-col gap-1.5 text-right">
                {rowsFor(model).map(([label, value]) => (
                  <div key={label} className="flex justify-end gap-1">
                    <dt>{label}:</dt>
                    <dd className="text-[#1d1d1d]">{value || "—"}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <p className="text-center text-xs uppercase tracking-[0.08em] text-[#1d1d1d]/40">
              {emptyLabel}
            </p>
          )}
        </div>

        {/* name directly above the pair, fitted to their combined width. In
            flow (not hung above it) so the block starts at the name's cap
            line, letting the rail align with the grid's top edge. */}
        <div className="mb-3 md:mb-4">
          {model ? (
            <h2>
              <FitText className="font-normal uppercase leading-none text-[#1d1d1d]">
                {initialCaps(model.name)}
              </FitText>
            </h2>
          ) : (
            // skeleton bar standing in for the name
            <div className="h-9 w-full bg-[#ececec]" aria-hidden="true" />
          )}
        </div>

        <div className="flex flex-row gap-3 md:gap-4">
          {Array.from({ length: 2 }, (_, i) => {
            const src = polaroids[i];
            return (
              <div
                key={i}
                className="relative aspect-[2/3] flex-1 overflow-hidden bg-[#ececec]"
              >
                {src && (
                  <Image
                    key={src}
                    src={src}
                    alt={model?.name ? `${model.name} polaroid ${i + 1}` : ""}
                    fill
                    sizes="(min-width: 1024px) 13vw, 45vw"
                    className="object-cover"
                  />
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import ChromeLink from "./ChromeLink";
import { useHoveredModel } from "./HoveredModelContext";
import FitText, { initialCaps } from "./FitText";

// Left rail on /models: the hovered model's name sits directly above the two
// portrait polaroids, with a caption and the stats right-aligned under it
// beneath the pair, and the contact address at the panel's bottom-left. Every
// vertical gap in the block matches the gutter between the two images. It holds the last model you hovered
// rather than emptying out between tiles, so the panel never flashes blank;
// before the first hover it shows a loading-style skeleton.

// The data stores both systems ("180 cm / 5'11\"", "38 EU / 7 US"); the rail
// shows only the metric half.
const metric = (v) => (v ? String(v).split("/")[0].trim() : "");

export default function ModelRail({ fallbackModel = null, className = "" }) {
  const { hoveredModel } = useHoveredModel() || {};
  const [shown, setShown] = useState(fallbackModel);

  useEffect(() => {
    if (hoveredModel) setShown(hoveredModel);
  }, [hoveredModel]);

  const model = shown || fallbackModel;
  const polaroids = (model?.polaroids || []).slice(0, 2);

  return (
    <div className={`relative flex h-full items-center ${className}`}>
      {/* contact address, bottom-left of the rail */}
      {/* wrapper carries the positioning: ChromeLink sets `relative` itself
          (the arrow is absolute inside it), and two position utilities on one
          element resolve by stylesheet order, not class order */}
      <div className="absolute bottom-0 left-0 text-xs italic text-[#1d1d1d]">
        <ChromeLink left href="mailto:join@candormanagement.com">
          join@candormanagement.com
        </ChromeLink>
      </div>

      {/* The whole block — name, images, caption and stats — sits dead centre
          in the rail; the name and stats hang off the images (out of flow) so
          their presence never shifts the pair. */}
      <div className="relative w-full">
        {/* below the pair: caption flush with the left image's left edge,
            measurements flush right — both starting on the same top line, and
            every line box hugging the glyphs (leading-none + a matching gap)
            so the block's height is exactly the text it contains */}
        <div className="absolute inset-x-0 top-full mt-3 md:mt-4">
          {model ? (
            <div className="flex items-start justify-between gap-3 text-xs leading-none text-[#1d1d1d]/60">
              <span className="italic">Model 8×4 polaroid</span>
              <dl className="flex flex-col gap-1.5 text-right">
                {[
                  ["height", model.height],
                  ["chest", model.chest],
                  ["shoe", model.shoe],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-end gap-1">
                    <dt>{label}:</dt>
                    <dd className="text-[#1d1d1d]">{metric(value) || "—"}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <p className="text-center text-xs uppercase tracking-[0.08em] text-[#1d1d1d]/40">
              Model information appears here
            </p>
          )}
        </div>

        {/* name directly above the pair, fitted to their combined width */}
        <div className="absolute inset-x-0 bottom-full mb-3 md:mb-4">
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

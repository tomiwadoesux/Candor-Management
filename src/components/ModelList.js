// components/ModelList.js
"use client";

import { useState } from "react";
import Link from "next/link";
import { useHoveredModel } from "../components/HoveredModelContext";
import { models } from "../../data/models";
import dynamic from "next/dynamic";

const HoverImage = dynamic(() => import("../components/HoverImage"), {
  ssr: false,
});

// The data stores both systems ("180 cm / 5'11\""); show only the metric half.
const metric = (v) => (v ? String(v).split("/")[0].trim() : "");

// Tiles rest in full greyscale and come up to colour on hover — quick, but
// eased so it reads as a lift rather than a snap.
function ModelTile({ model, hovered }) {
  const src = model.coverImage || model.images[0];

  return (
    <div className="relative aspect-[4/5] overflow-hidden bg-black">
      <HoverImage
        src={src}
        alt={model.name}
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          filter: hovered ? "grayscale(0)" : "grayscale(1)",
          transition: "filter 420ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
    </div>
  );
}

// `gender` lets the page's WOMEN / MEN / ALL filter drive the list; `board`
// its MAIN BOARD / NEW FACES column; `division` picks which roster the grid is
// showing at all ("models" | "talents" | "creatives" — see data/models.js).
// `focus` narrows a division to one discipline (Actor, Dancer, …).
// `className` lets a parent that already provides page padding switch the
// grid's own off.
//
// division defaults to "models" rather than to everyone: this grid is mounted
// on /models, and before the field existed it showed the whole roster — so the
// photographer, the stylist and the actor all sat in a grid headed MODELS.
// Passing null opts back into showing every division.
export default function ModelList({
  gender,
  board,
  division = "models",
  focus,
  className = "",
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const { setHoveredModel } = useHoveredModel();
  const [localGender] = useState("all");
  const selectedGender = gender ?? localGender;

  // The board buttons pass a slug; the records store a display string.
  const BOARD_SLUGS = {
    mainboard: "MAIN BOARD",
    newfaces: "RISING STARS",
  };

  const filteredModels = models.filter((m) => {
    if (division && m.division !== division) return false;
    if (selectedGender !== "all" && m.gender !== selectedGender) return false;
    if (board && board !== "all" && m.board !== BOARD_SLUGS[board]) return false;
    // A discipline filter matches the job title the tile prints.
    if (focus && focus !== "all" && m.talent !== focus) return false;
    return true;
  });

  // Filters can now combine down to nothing (a discipline with no one on it,
  // or WOMEN crossed with a board that holds none). Say so — an empty grid
  // reads as a page that failed to load.
  if (filteredModels.length === 0) {
    return (
      <section className="relative">
        <p className="px-3 py-16 text-center text-xs uppercase tracking-[0.08em] text-[#1d1d1d]/40 md:px-5">
          No one on this board yet
        </p>
      </section>
    );
  }

  return (
    <section className="relative  ">
      <div
        data-slot="models-grid"
        className={`grid grid-cols-2 pt-3 md:pt-0 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 px-3 md:px-5 ${className}`}
        onMouseLeave={() => {
          setHoveredIndex(null);
          setHoveredModel(null);
        }}
      >
        {filteredModels.map((model, idx) => (
          <Link
            key={model.id}
            href={`/models/${model.id}`}
            onMouseEnter={() => {
              setHoveredModel(model);
              setHoveredIndex(idx);
            }}
            onMouseLeave={() => {
              setHoveredModel(null);
              setHoveredIndex(null);
            }}
          >
            <ModelTile model={model} hovered={hoveredIndex === idx} />
            <div className=" lg:hidden">
              <div className="flex flex-col mt-2">
                <h4 className=" text-[12px] lg:text-xs uppercase font-bold text-[#1d1d1d]">
                  {model.name}
                </h4>
                <p className="text-xs p-0 text-[#1d1d1d]/60 ">
                  {model.talent || "MODEL"}
                </p>
                <p className="text-xs p-0 text-[#1d1d1d]">
                  {metric(model.height)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

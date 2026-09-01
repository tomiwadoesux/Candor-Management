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

const genders = ["all", "male", "female"];

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

// `gender` lets the page's WOMEN / MEN / ALL filter drive the list; `className`
// lets a parent that already provides page padding switch the grid's own off.
export default function ModelList({ gender, className = "" }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const { setHoveredModel } = useHoveredModel();
  const [localGender] = useState("all");
  const selectedGender = gender ?? localGender;

  const filteredModels =
    selectedGender === "all"
      ? models
      : models.filter((m) => m.gender === selectedGender);

  return (
    <section className="relative  ">
      <div
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

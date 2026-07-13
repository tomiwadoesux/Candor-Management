// components/ModelList.js
"use client";

import { useState } from "react";
import Link from "next/link";
import { useHoveredModel } from "../components/HoveredModelContext";
import { models } from "../../data/models";
import ModelImageCursor from "../components/ModelImageCursor";
import dynamic from "next/dynamic";

const HoverImage = dynamic(() => import("../components/HoverImage"), {
  ssr: false,
});

const genders = ["all", "male", "female"];

export default function ModelList() {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const { setHoveredModel } = useHoveredModel();
  const [selectedGender, setSelectedGender] = useState("all");

  const filteredModels =
    selectedGender === "all"
      ? models
      : models.filter((m) => m.gender === selectedGender);

  // Format cursor text
  const formatCursorText = (model) => {
    const name = model.name?.toUpperCase() || "";
    const talent = model.talent?.toUpperCase() || "";
    const height = model.height?.toUpperCase() || "";
    return [name, talent, height].filter(Boolean).join(" ");
  };

  return (
    <section className="relative  ">
      <div
        className="grid grid-cols-2 pt-3 md:pt-5 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 px-3 md:px-5 cursor-none"
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
            className="cursor-none"
          >
            <div
              className={`bg-black relative aspect-[4/5] transition-all duration-300 ${
                hoveredIndex === idx ? "border-black" : "outline-none "
              }`}
              style={{
                overflow: "hidden",
              }}
            >
              <HoverImage
                src={model.coverImage || model.images[0]}
                alt={model.name}
                cursorText={formatCursorText(model)}
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Black overlay */}
              {hoveredIndex === idx && (
                <div
                  className="absolute inset-0 bg-black"
                  style={{
                    opacity: 0.4,
                    pointerEvents: "none",
                    transition: "opacity 0.5s",
                  }}
                />
              )}

              {hoveredIndex === idx && (
                <ModelImageCursor hoveredModel={model} show={true} />
              )}
            </div>
            <div className=" lg:hidden">
              <div className="flex flex-col mt-2">
                <h4 className=" text-[12px] lg:text-xs uppercase font-bold text-[#1d1d1d]">
                  {model.name}
                </h4>
                <p className="text-xs p-0 text-[#1d1d1d]/60 ">
                  {model.talent || "MODEL"}
                </p>
                <p className="text-xs p-0 text-[#1d1d1d]">{model.height}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { useHoveredModel } from "./HoveredModelContext";
import { models } from "../../data/models";
import Image from "next/image";

export default function NewFaces() {
  const { setHoveredModel } = useHoveredModel();
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextPair = () => {
    setCurrentIndex((prev) => (prev + 1) % (models.length - 1));
  };

  const prevPair = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + (models.length - 1)) % (models.length - 1)
    );
  };

  const leftModel = models[currentIndex];
  const rightModel = models[currentIndex + 1];

  return (
    <section className="pt-9 px-24 relative">
      <div className="flex justify-center pb-4 gap-1 flex-row">
        <h1 className="text-center text-xs md:text-sm relative top-3">02</h1>
        <h1 className="text-center pb-5 text-5xl md:text-7xl">Talents</h1>
      </div>

      {/* Two-card display */}
      <div className="flex gap-24 items-center justify-between relative">
        {/* Left Card - Details on top */}
        <div
          className="flex-1"
          onMouseEnter={() => setHoveredModel(leftModel)}
          onMouseLeave={() => setHoveredModel(null)}
        >
          <div className="mb-4">
            <h1 className="text-lg uppercase font-bold text-[#010101]">
              {leftModel.name}
            </h1>
            <p className="text-sm text-[#010101]/60 mt-1">
              {leftModel.talent || "MODEL"}
            </p>
            <p className="text-sm text-[#010101] mt-1">{leftModel.height}</p>
          </div>
          <div className="relative overflow-hidden">
            <Image
              src={leftModel.coverImage || leftModel.images[0]}
              alt={leftModel.name}
              width={400}
              height={500}
              className="w-full h-auto object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>

        {/* Right Card - Details on bottom */}
        <div
          className="flex-1"
          onMouseEnter={() => setHoveredModel(rightModel)}
          onMouseLeave={() => setHoveredModel(null)}
        >
          <div className="relative overflow-hidden mb-4">
            <Image
              src={rightModel.coverImage || rightModel.images[0]}
              alt={rightModel.name}
              width={400}
              height={500}
              className="w-full h-auto object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className="">
            <h1 className="text-lg text-right uppercase font-bold text-[#010101]">
              {rightModel.name}
            </h1>
            <p className="text-sm text-right  text-[#010101]/60 mt-1">
              {rightModel.talent || "MODEL"}
            </p>
            <p className="text-sm text-right  text-[#010101] mt-1">{rightModel.height}</p>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="flex gap-3 justify-center mt-8">
        <button
          onClick={prevPair}
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
          onClick={nextPair}
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
    </section>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useHoveredModel } from "../../components/HoveredModelContext";
import { models } from "../../../data/models";
import Image from "next/image";

export default function ATestPage() {
  const { setHoveredModel } = useHoveredModel();
  const [selectedGender, setSelectedGender] = useState("all");

  const filteredModels =
    selectedGender === "all"
      ? models
      : models.filter((m) => m.gender === selectedGender);

  return (
    <section className="relative">
      <h1 className="text-2xl font-bold mb-4">NEWS</h1>
      
      {/* Scrollable container */}
      <div className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
        <div 
          className="flex lg:px-1 md:px-7 px-5 lg:gap-1 md:gap-7 gap-5 pb-4"
          onMouseLeave={() => setHoveredModel(null)}
        >
          {filteredModels.map((model) => (
            <Link
              key={model.id}
              href={`/models/${model.id}`}
              onMouseEnter={() => setHoveredModel(model)}
              onMouseLeave={() => setHoveredModel(null)}
              className="flex-shrink-0 group"
            >
              <div className="relative">
                {/* Image container with fixed height and auto width */}
                <div className="relative h-[400px] md:h-[450px] lg:h-[500px]">
                  {/* Using Next/Image with unoptimized for dynamic sizing */}
                  <Image
                    src={model.coverImage || model.images[0]}
                    alt={model.name}
                    width={0}
                    height={0}
                    sizes="100vw"
                    className="h-full w-auto object-cover"
                    style={{
                      width: 'auto',
                      height: '100%',
                    }}
                    unoptimized
                  />
                  
                  {/* Alternative if you have image dimensions in your data:
                  <Image
                    src={model.coverImage || model.images[0]}
                    alt={model.name}
                    width={model.imageWidth || 400}
                    height={model.imageHeight || 500}
                    className="h-full w-auto object-cover"
                    style={{
                      maxHeight: '500px',
                      width: 'auto',
                      height: '100%'
                    }}
                  />
                  */}
                </div>
                
                {/* Model info */}
                <div className="mt-3">
                  <h4 className="text-xs uppercase font-bold text-[#1d1d1d]">
                    {model.name}
                  </h4>
                  <p className="text-xs text-[#1d1d1d]/60 mt-0.5">
                    {model.talent || "MODEL"}
                  </p>
                  <p className="text-xs text-[#1d1d1d]">
                    {model.height}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
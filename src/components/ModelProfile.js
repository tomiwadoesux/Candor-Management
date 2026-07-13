"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function ModelProfile({ model }) {
  const [activeTab, setActiveTab] = useState("INFO");
  const [currentPolaroidIndex, setCurrentPolaroidIndex] = useState(0);

  const tabs = ["INFO", "SHOWS", "CAMPAIGNS", "PHOTOS", "POLAROIDS"];

  const nextPolaroid = () => {
    if (model.polaroids) {
      setCurrentPolaroidIndex((prev) => (prev + 1) % model.polaroids.length);
    }
  };

  const prevPolaroid = () => {
    if (model.polaroids) {
      setCurrentPolaroidIndex(
        (prev) => (prev - 1 + model.polaroids.length) % model.polaroids.length
      );
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-white">
      {/* Header */}
      <div className="fixed top-[35px] left-1/2 -translate-x-1/2 flex justify-between items-center w-full px-[72px] z-50">
        <Link href="/" className="text-white mix-blend-exclusion">
          {/* Logo placeholder - replace with your logo */}
          <div className="text-sm font-bold mix-blend-exclusion">CANDOR</div>
        </Link>
        <button className="w-[37px] h-[18px] mix-blend-exclusion">
          {/* Menu icon */}
          <svg viewBox="0 0 37 18" fill="none">
            <rect width="37" height="2" fill="white" />
            <rect y="8" width="37" height="2" fill="white" />
            <rect y="16" width="37" height="2" fill="white" />
          </svg>
        </button>
      </div>

      {/* Left Section - Name and Cover Image */}
      <div className="fixed left-[72px] top-[62px] w-[486px]">
        <div className="flex flex-col gap-[12px]">
          {/* Name */}
          <h1
            className="text-[80px] leading-none text-white font-normal mix-blend-exclusion"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            {model.name?.toUpperCase() || "SMITH JOHN"}
          </h1>

          {/* Cover Image */}
          <div className="relative w-full aspect-[1920/2880]">
            <Image
              src={model.coverImage || "/images/placeholder.jpg"}
              alt={model.name}
              fill
              className="object-cover"
            />
          </div>

          {/* Board Label */}
          <p className="text-[14px] text-white text-right tracking-[0.14px] mix-blend-exclusion">
            {model.board || "MAIN BOARD"}
          </p>
        </div>
      </div>

      {/* Center Section - Measurements */}
      <div className="absolute left-[668px] top-[85px] w-[251px]">
        <div className="flex flex-col gap-[19px]">
          <p className="text-[17px] text-white mix-blend-exclusion">
            <span className="font-bold">HEIGHT</span>: {model.height || "178 cm / 5'10"}
          </p>
          <p className="text-[17px] text-white mix-blend-exclusion">
            <span className="font-bold">CHEST</span>: {model.chest || "84 cm / 33"}
          </p>
          <p className="text-[17px] text-white mix-blend-exclusion">
            <span className="font-bold">WAIST</span>: {model.waist || "61 cm / 24"}
          </p>
          <p className="text-[17px] text-white mix-blend-exclusion">
            <span className="font-bold">HIPS</span>: {model.hips || '89 cm / 35"'}
          </p>
          <p className="text-[17px] text-white mix-blend-exclusion">
            <span className="font-bold">SHOE</span>: {model.shoe || "39 EU / 8 US"}
          </p>
          <p className="text-[17px] text-white mix-blend-exclusion">
            <span className="font-bold">HAIR COLOUR</span>:{" "}
            {model.hairColor || "DARK BROWN"}
          </p>
          <p className="text-[17px] text-white mix-blend-exclusion">
            <span className="font-bold">EYE COLOUR</span>: {model.eyeColor || "GREEN"}
          </p>
          <p className="text-[17px] text-white mix-blend-exclusion">
            <span className="font-bold">NAT</span>: {model.nationality || "NIGERIAN"}
          </p>
        </div>
      </div>

      {/* Right Section - Tabs */}
      <div className="fixed right-[70px] top-[139px] w-[106px]">
        <div className="flex flex-col gap-[13px] items-end">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex items-center gap-[4px] w-full justify-end"
            >
              <p
                className={`text-[14px] text-right tracking-[0.14px] mix-blend-exclusion ${
                  activeTab === tab ? "text-black" : "text-black/46"
                }`}
              >
                {tab}
              </p>
              {activeTab === tab && (
                <div className="w-[5px] h-[5.787px] rounded-full bg-white mix-blend-exclusion" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Polaroids Section */}
      {activeTab === "INFO" && model.polaroids && (
        <div className="absolute left-[663px] top-[340px] w-[781px] h-[489px]">
          <div className="flex gap-[19px] items-center h-full">
            {/* Show 2 polaroids at a time */}
            <div className="relative w-[381px] h-[489px]">
              <Image
                src={model.polaroids[currentPolaroidIndex] || "/images/placeholder.jpg"}
                alt={`Polaroid ${currentPolaroidIndex + 1}`}
                fill
                className="object-cover"
              />
            </div>
            <div className="relative w-[381px] h-[489px]">
              <Image
                src={
                  model.polaroids[(currentPolaroidIndex + 1) % model.polaroids.length] ||
                  "/images/placeholder.jpg"
                }
                alt={`Polaroid ${currentPolaroidIndex + 2}`}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Navigation Dots */}
          <div className="absolute left-0 bottom-[-62px] flex gap-[11px]">
            {model.polaroids.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPolaroidIndex(index)}
                className={`w-[21px] h-[21px] ${
                  index === currentPolaroidIndex ? "bg-black" : "bg-[#d9d9d9]"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

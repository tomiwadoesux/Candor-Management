"use client";

import Link from "next/link";
import Image from "next/image";
import { models } from "../../../data/models";
import { useState } from "react";
import Header from "../../components/header";
import HeaderTest from "../../components/headerTest";
import ModelList from "../../components/ModelList";

import { SearchProvider } from "../../components/SearchContext";

const imgUntitledDesign11 =
  "http://localhost:3845/assets/b52f5647a1bbe192fb8e7abd9c3e9b715513a604.png";
const imgGroup1 =
  "http://localhost:3845/assets/aac9b8f9cec60761adf3f3710f968ef3c8cebf60.svg";
const imgAkarIconsArrowUp41 =
  "http://localhost:3845/assets/0463a5b67e457806649f07067fc1395f504d57d2.svg";
const imgEllipse23 =
  "http://localhost:3845/assets/0e670450cf1b40a867576040cc1482d1f77e4b18.svg";

export default function Models() {
  const [selectedGender, setSelectedGender] = useState("all");
  const [selectedBoard, setSelectedBoard] = useState("all");
  const [hoveredModel, setHoveredModel] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Filter models based on selected gender
  const filteredModels =
    selectedGender === "all"
      ? models
      : models.filter((model) => model.gender === selectedGender);

  return (
    <SearchProvider>
      <div className="bg-white min-h-screen w-full">
        <Header />
        <main className="w-full px-3 md:px-5">
          <section className="pt-6 lg:pt-12">
            <div className="flex justify-between items-center pb-6 gap-2 md:gap-5  flex-row">
              <div className="flex  text-xl flex-col md:gap-1 lg:gap-1 items-start">
                <button
                  onClick={() => setSelectedGender("female")}
                  className="self-start flex flex-row-reverse gap-1 items-center cursor-pointer"
                >
                  <h4
                    className={` text-sm transition-colors ${
                      selectedGender === "female"
                        ? "bg-[#00749E] text-white px-1"
                        : "text-black"
                    }`}
                  >
                    WOMEN
                  </h4>
              
                </button>
                <button
                  onClick={() => setSelectedGender("male")}
                  className="self-start flex flex-row-reverse gap-1 items-center cursor-pointer"
                >
                  <h4
                    className={` text-sm transition-colors ${
                      selectedGender === "male"
                        ? "bg-[#00749E] text-white px-1"
                        : "text-black"
                    }`}
                  >
                    MEN
                  </h4>
                 
                </button>
                <button
                  onClick={() => setSelectedGender("all")}
                  className="self-start flex flex-row-reverse gap-1 items-center cursor-pointer"
                >
                  <h4
                    className={` text-sm transition-colors ${
                      selectedGender === "all"
                        ? "bg-[#00749E] text-white px-1"
                        : "text-black"
                    }`}
                  >
                    ALL
                  </h4>
                
                </button>
              </div>

              <h1 className="text-center text-black text-5xl md:text-7xl">models</h1>

              <div className="flex text-xl flex-col items-end md:gap-1 lg:gap-1">
                <button
                  onClick={() => setSelectedBoard("mainboard")}
                  className="self-end flex flex-row-reverse gap-1 items-center cursor-pointer"
                >
                  <h4
                    className={` text-sm transition-colors ${
                      selectedBoard === "mainboard"
                        ? "bg-[#00749E] text-white px-1"
                        : "text-black"
                    }`}
                  >
                    MAIN BOARD
                  </h4>
                 
                </button>
                <button
                  onClick={() => setSelectedBoard("newfaces")}
                  className="self-end flex flex-row-reverse gap-1 items-center cursor-pointer"
                >
                  <h4
                    className={` text-sm transition-colors ${
                      selectedBoard === "newfaces"
                        ? "bg-[#00749E] text-white px-1"
                        : "text-black"
                    }`}
                  >
                    NEW FACES
                  </h4>
                 
                </button>
                <button
                  onClick={() => setSelectedBoard("all")}
                  className="self-end flex flex-row-reverse gap-1 items-center cursor-pointer"
                >
                  <h4
                    className={` text-sm transition-colors ${
                      selectedBoard === "all"
                        ? "bg-[#00749E] text-white px-1"
                        : "text-black"
                    }`}
                  >
                    ALL
                  </h4>
                  
                </button>
              </div>
            </div>
          </section>
        </main>
        <ModelList />
      </div>
    </SearchProvider>
  );
}

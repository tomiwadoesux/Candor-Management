"use client";

import Image from "next/image";
import Header from "@/components/header";
import { useParams } from "next/navigation";
import { useState } from "react";
import { models } from "../../../../data/models";

export default function ModelProfile() {
  const params = useParams();
  const { id } = params;

  const [activeCategory, setActiveCategory] = useState("PORTFOLIO"); // Initialize with "POLAROIDS" as active

  const categories = ["PORTFOLIO", "POLAROIDS", "VIDEOS", "CAMPAIGNS"];

  const campaignsData = [
    { client: "GUCCI", season: "S/S 24", type: "Campaign", color: "bg-stone-200" },
    { client: "VOGUE ITALIA", season: "OCT 2023", type: "Editorial", color: "bg-zinc-300" },
    { client: "PRADA", season: "F/W 23", type: "Lookbook", color: "bg-stone-300" },
    { client: "SAINT LAURENT", season: "RESORT 24", type: "Digital", color: "bg-neutral-200" },
  ];

  const videosData = [
    { title: "Runway Show F/W 24", client: "GUCCI", type: "Fashion Film", color: "bg-red-100" },
    { title: "Behind The Scenes", client: "CHANEL", type: "Documentary", color: "bg-orange-100" },
    { title: "Commercial Spot", client: "DIOR", type: "Advertisement", color: "bg-yellow-100" },
    { title: "Editorial Shoot", client: "VOGUE", type: "Short Film", color: "bg-green-100" },
  ];

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
  };

  const model = models.find((m) => m.id === id);

  if (!model) {
    return <div>Model Not Found</div>;
  }

  const [firstName, lastName] = model.name.split(" ");

  return (
    <section className="]">
      <Header />

      <div className="h-auto md:h-[100vh] flex flex-row ">
        <div className="  w-full flex-3 ">
          <div className="px-5 md:px-9">
            <div className="flex flex-row pt-3 justify-between">
              {categories.map((category) => (
                <div
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                >
                  <div className="relative flex flex-row gap-1 cursor-pointer px-1 py-1 overflow-hidden">
                    <div
                      className={`absolute inset-0 bg-black transition-transform duration-200 ease-out origin-left ${
                        activeCategory === category
                          ? "scale-x-100"
                          : "scale-x-0"
                      }`}
                    />
                    <h4
                      className={`relative z-10 text-xs font-bold transition-colors duration-200 ${
                        activeCategory === category ? "text-white" : ""
                      }`}
                    >
                      [ {category} ]
                    </h4>
                  </div>
                </div>
              ))}
            </div>
            <div className=" pt-2">
              <svg
                className="w-full"
                height="2"
                viewBox="0 0 100 2"
                preserveAspectRatio="none"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <line
                  x1="0"
                  y1="1"
                  x2="100"
                  y2="1"
                  stroke="black"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </div>
          </div>
          <div className="px-5 md:px-9 pt-14 md:pt-20">
            <h1 className="text-4xl md:text-7xl tracking-wider  flex flex-col gap-4">
              <span>{firstName.toUpperCase()}</span>
              <span>{lastName.toUpperCase()}</span>
            </h1>
          </div>
          <div className="flex flex-row pt-12 md:pt-36 lg:pt-9 px-5 md:px-9  ">
            <div className="flex flex-1 flex-col sm:gap-5  lg:flex-row justify-between">
              <div className=" pt-0 lg:pt-24flex flex-col gap-1">
                <h4 className="text-sm">
                  <span className="font-bold uppercase">Height: </span>{" "}
                  {model.height}
                </h4>
                <h4 className="text-sm">
                  <span className="font-bold uppercase">Chest: </span>{" "}
                  {model.chest}
                </h4>
                <h4 className="text-sm">
                  <span className="font-bold uppercase">Waist: </span>{" "}
                  {model.waist}
                </h4>
                <h4 className="text-sm">
                  <span className="font-bold uppercase">Hips: </span>{" "}
                  {model.hips}
                </h4>
                <h4 className="text-sm">
                  <span className="font-bold uppercase">Shoe: </span>{" "}
                  {model.shoe}
                </h4>
                <h4 className="text-sm">
                  <span className="font-bold uppercase">Hair Colour: </span>{" "}
                  {model.hairColor}
                </h4>
                <h4 className="text-sm">
                  <span className="font-bold uppercase">Eye Colour: </span>{" "}
                  {model.eyeColor}
                </h4>
                <h4 className="text-sm">
                  <span className="font-bold uppercase">Nat: </span>{" "}
                  {model.nationality}
                </h4>
              </div>{" "}
              <div className="hidden md:block">
                <div className=" pt-20 w-fit flex flex-col gap-1">
                  <svg
                    className="w-full"
                    height="2"
                    viewBox="0 0 100 2"
                    preserveAspectRatio="none"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <line
                      x1="0"
                      y1="1"
                      x2="100"
                      y2="1"
                      stroke="black"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                  </svg>

                  <div className=" flex  flex-row gap-2">
                    <h4 className="text-xs uppercase  font-bold">
                      [ download model card ]
                    </h4>
                    <svg
                      width="14"
                      className="self-center"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g clip-path="url(#clip0_1484_262)">
                        <path
                          d="M1.16797 7.18945V11.6063C1.16797 11.9409 1.30452 12.2619 1.54757 12.4986C1.79063 12.7352 2.12028 12.8682 2.46402 12.8682H11.5364C11.8801 12.8682 12.2098 12.7352 12.4528 12.4986C12.6959 12.2619 12.8324 11.9409 12.8324 11.6063V7.18945"
                          stroke="black"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                        <path
                          d="M4.34375 7.19043L7.00065 9.71432L9.65755 7.19043"
                          stroke="black"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                        <path
                          d="M7 1.13232V8.3885"
                          stroke="black"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_1484_262">
                          <rect width="14" height="14" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>
              <div className=" md:hidden pt-6 relative w-full aspect-[2/3]">
                <Image
                  src={model.face}
                  alt={`${model.name}'s face`}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/20"></div>
              </div>
              <div className=" md:hidden text-xs pt-2 opacity-75 uppercase  ">
                <h4>©2025 Candor models</h4>
              </div>
            </div>
            <div className=" hidden md:block flex-1  lg:hidden">
              <div className="relative w-full aspect-[2/3]">
                <Image
                  src={model.face}
                  alt={`${model.name}'s face`}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/20"></div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 text-xs hidden md:block opacity-75 uppercase px-9 pb-3">
            <h4>©2025 Candor models</h4>
          </div>
        </div>
        <div className=" hidden lg:flex bg-black flex-2 relative">
          <Image
            src={model.face}
            alt={`${model.name}'s face`}
            fill
            className="object-cover"
          />
        </div>
      </div>

      {activeCategory === "POLAROIDS" && (
        <section className="">
          <div className="pt-16 text-center">
            <h1 className="uppercase text-3xl tracking-widest">POLAROIDS</h1>
            <h4 className="pt-2 tracking-widest">Photographed by Estévez & Belloso</h4>
          </div>
          <div className="grid md:grid-cols-2 pt-5 gap-6 lg:gap-8 grid-cols-1 px-8 md:px-16 lg:px-44">
            <div className="bg-black aspect-8/10 w-full"></div>
            <div className="bg-black aspect-8/10 w-full"></div>
            <div className="bg-black aspect-8/10 w-full"></div>
            <div className="bg-black aspect-8/10 w-full"></div>
            <div className="bg-black aspect-8/10 w-full"></div>
            <div className="bg-black aspect-8/10 w-full"></div>
          </div>
        </section>
      )}

      {activeCategory === "PORTFOLIO" && (
        <section className="">
          <div className="pt-16 text-center">
            <h1 className="uppercase text-3xl tracking-widest">PORTFOLIO</h1>
            <h4 className="pt-2 tracking-widest">Placeholder content for Portfolio</h4>
          </div>
          <div className="grid pt-9 lg:pt-16 lg:grid-cols-3 gap-6 md:gap-6 lg:gap-8 md:grid-cols-2 px-8 md:px-16 lg:px-11">
            <div className="bg-black aspect-8/10 w-full"></div>
            <div className="bg-black aspect-8/10 w-full"></div>
            <div className="bg-black aspect-8/10 w-full"></div>
            <div className="bg-black aspect-8/10 w-full"></div>
            <div className="bg-black aspect-8/10 w-full"></div>
            <div className="bg-black aspect-8/10 w-full"></div>
          </div>
        </section>
      )}

      {activeCategory === "VIDEOS" && (
        <section className="pb-20 animate-in fade-in duration-500">
          <div className="pt-16 text-center mb-12">
            <h1 className="uppercase text-3xl tracking-widest font-light">Video Content</h1>
            <h4 className="pt-2 text-xs uppercase tracking-widest opacity-60">Exclusive Reels & Showcases</h4>
          </div>
          <div className="grid md:grid-cols-2 gap-x-4 gap-y-16 px-5 md:px-9 lg:px-16">
            {videosData.map((video, index) => (
              <div key={index} className="group cursor-pointer flex flex-col gap-3">
                <div className={`relative w-full aspect-video overflow-hidden ${video.color}`}>
                  {/* Placeholder for Video Thumbnail */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                    {/* Play button icon placeholder */}
                    <svg className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
                <div className="flex justify-between items-end border-b border-black/10 pb-2 group-hover:border-black/50 transition-colors duration-300">
                  <div className="flex flex-col">
                    <h3 className="text-xl font-bold uppercase tracking-wide leading-none">
                      {video.title}
                    </h3>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest pt-1">
                      {video.client} - {video.type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeCategory === "CAMPAIGNS" && (
        <section className="pb-20 animate-in fade-in duration-500">
          <div className="pt-16 text-center mb-12">
            <h1 className="uppercase text-3xl tracking-widest font-light">Selected Campaigns</h1>
            <h4 className="pt-2 text-xs uppercase tracking-widest opacity-60">Featured Works</h4>
          </div>
          <div className="grid md:grid-cols-2 gap-x-4 gap-y-16 px-5 md:px-9 lg:px-16">
            {campaignsData.map((campaign, index) => (
              <div key={index} className="group cursor-pointer flex flex-col gap-3">
                <div className={`relative w-full aspect-[4/5] overflow-hidden ${campaign.color}`}>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>
                <div className="flex justify-between items-end border-b border-black/10 pb-2 group-hover:border-black/50 transition-colors duration-300">
                  <div className="flex flex-col">
                    <h3 className="text-xl font-bold uppercase tracking-wide leading-none">
                      {campaign.client}
                    </h3>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest pt-1">
                      {campaign.type}
                    </span>
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wider">
                    {campaign.season}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

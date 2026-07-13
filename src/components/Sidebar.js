"use client"; // if using Next.js 13+

import { useState, useEffect } from "react";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    // Clean up when component unmounts
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <section className="">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-3 text-white fixed top-4 right-4 z-50 rounded-md"
      >
        <svg
          width="36"
          height="21"
          viewBox="0 0 36 21"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 1.5L35 1.5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M1 10H23"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle
            cx="1"
            cy="1"
            r="1"
            transform="matrix(-1 0 0 1 36 9)"
            fill="white"
          />
          <circle
            cx="1"
            cy="1"
            r="1"
            transform="matrix(-1 0 0 1 30 9)"
            fill="white"
          />
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Slide in from the right */}
      <div
        className={`fixed top-0 right-0 h-full w-[80vw] md:w-[60vw] lg:w-[40vw] bg-black shadow-lg z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div>
          <h1
            className="text-right relative right-7 top-6 gap-2 "
            onClick={() => setIsOpen(false)}
          >
            Close
          </h1>
        </div>

        <div className="flex flex-col` gap-10 pt-14">
          <div className=" flex flex-col gap-4 px-6 text-lg">
            <div className="flex-col flex gap-3">
              <h1 className="text-3xl gap-2 md:text-4xl">MODELS</h1>
              <div className="flex-col flex gap-1">
                <h4 className=" text-sm tracking-[0.2em]">New Faces</h4>
                <h4 className=" text-sm tracking-[0.2em]">Development</h4>
                <h4 className=" text-sm tracking-[0.2em]">Established</h4>
              </div>
            </div>
          </div>
          <div className=" flex flex-col gap-4 px-6 text-lg">
            <div className="flex-col flex gap-3">
              <h1 className="text-3xl gap-2 md:text-4xl">TALENTS</h1>
              <div className="flex-col flex gap-1">
                <h4 className=" text-sm tracking-[0.2em]">Actor</h4>
                <h4 className=" text-sm tracking-[0.2em]">Dancer</h4>
                <h4 className=" text-sm tracking-[0.2em]">Make Up Artist</h4>
                <h4 className=" text-sm tracking-[0.2em]">Hair Stylist</h4>
              </div>
            </div>
          </div>
          <div className=" flex flex-col gap-4 px-6 mb-6 text-lg">
            <div className="flex-col flex gap-3">
              <h1 className="text-3xl gap-2 md:text-4xl">CREATIVES</h1>
              <div className="flex-col flex gap-1">
                <h4 className=" text-sm tracking-[0.2em]">Fashion Stylist</h4>
                <h4 className=" text-sm tracking-[0.2em]">Artist</h4>
                <h4 className=" text-sm tracking-[0.2em]">Photographer</h4>
                <h4 className=" text-sm tracking-[0.2em]">Creative Director</h4>
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 flex flex-col gap-2 lg:right-0 fixed bottom-3">
          <div className="bg-white w-60 h-60"></div>
          <h4 className=" text-xs">© Candor 2025. All Rights Reserved</h4>
        </div>
      </div>
    </section>
  );
}

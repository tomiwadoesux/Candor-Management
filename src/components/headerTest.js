"use client"; // if using Next.js 13+

import { models } from "../../data/models";
import { useState, useEffect } from "react";
import { useSearch } from "./SearchContext";
import BlackLogo from "./black-logo";
import HoverText from "./HoverText";

export default function HeaderTest() {
  const { isSearchOpen, closeSearch } = useSearch();
  const [search, setSearch] = useState("");
  const [filteredModels, setFilteredModels] = useState(models);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const searchString = search.toLowerCase();
    setFilteredModels(
      models.filter((m) => {
        if (!search) return true;
        return m.name
          .toLowerCase()
          .split(" ")
          .some((word) => word.startsWith(searchString));
      })
    );
  }, [search]);

  useEffect(() => {
    if (isOpen || isSearchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, isSearchOpen]);

  const handleOpenSearch = () => {
    setIsOpen(true);
  };

  const handleCloseSearch = () => {
    setIsOpen(false);
    setSearch("");
  };

  return (
    <>
      {/* Header Section */}
      <section className="px-[2rem] relative top-6 md:px-[3rem]">
        <div className="flex flex-row justify-between items-center">
          <div className="flex-1">
            <BlackLogo />
          </div>
          {/* <h1 className="flex-1 hidden sm:block  md:text-xs text-center">Our Art . Our Craft . Our Candor</h1> */}
          <div className="flex-1 text-right">
            {/* Toggle Button */}
            <button
              onClick={handleOpenSearch}
              className="p-3 text-white z-50 rounded-md"
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
                  stroke="black"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M1 10H23"
                  stroke="black"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle
                  cx="1"
                  cy="1"
                  r="1"
                  transform="matrix(-1 0 0 1 36 9)"
                  fill="black"
                />
                <circle
                  cx="1"
                  cy="1"
                  r="1"
                  transform="matrix(-1 0 0 1 30 9)"
                  fill="black"
                />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Search Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={handleCloseSearch}
        />
      )}


      <div
        className={`fixed top-0 right-0 md:right-28 h-full w-[100vw] md:w-[70vw] lg:w-[40vw] px-7 bg-white shadow-lg z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex sticky top-0 z-30 bg-white flex-row pt-9 pb-5 justify-between">
          <div className=" relative">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 pl-1 flex items-center pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-black"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              id="search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="name of model.."
              className="w-full bg-transparent  pl-7 text-sm text-black placeholder-gray-500 pb-1 pr-12 border-0 border-b border-black focus:outline-none focus:border-black focus:ring-0"
            ></input>
          </div>

          <div className=" text-sm">
            <h1
              className=" text-black   gap-2 cursor-pointer"
              onClick={handleCloseSearch}
            >
              Close
            </h1>
          </div>
        </div>

        <div className="gap-x-9 pb-12 pt-9 gap-y-7 md:gap-y-9 grid grid-cols md:grid-cols-1">
          {filteredModels.length === 0 ? (
            <div className="col-span-full text-center text-gray-500">
              No models found.
            </div>
          ) : (
            filteredModels.map((model, idx) => (
              <div
                key={idx}
                className="flex py-2 gap-2 flex-row cursor-pointer"
                style={{ minHeight: "80px" }}
              >
                <div className="h-full flex flex-row gap-0 w-full text-black">
                  <div className="aspect-square w-auto bg-black relative overflow-hidden">
                    <HoverText className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                  <div className="flex text-xs pl-2 h-full flex-col gap-1 lg:gap-3">
                    <h5 className="text-xs"> 001</h5>
                    <div className="grid gri gap-y-3 gap-x-2">
                      <h6>
                        <span className="">{model.name}</span>
                      </h6>
                      <h6>
                        <span className="font-bold"> Nat:</span>
                        {model.height}
                      </h6>
                      <h6>
                        <span className="font-bold"> Height:</span>
                        {model.height}
                      </h6>
                      <h6>
                        <span className="font-bold"> Height:</span>
                        {model.height}
                      </h6>
                      <h6>
                        <span className="font-bold"> Chest:</span>
                        {model.chest}
                      </h6>
                      <h6>
                        <span className="font-bold"> Leg:</span>
                        {model.height}
                      </h6>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </>
  );
}

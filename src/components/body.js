import ModelList from "./ModelList";
import { models } from "../../data/models";
import Image from "next/image";
import LineSvg from "./LineSvg";

export default function Body() {
  return (
    <section className="px-4 pt-14 md:pt-28 lg:pt-24md:px-10">
      <div className="flex justify-center pb-6">
        <h1
          data-dock-title
          className="text-center font-bold uppercase tracking-[0.12em] mix-blend-exclusion text-white text-6xl md:text-8xl lg:text-9xl whitespace-nowrap select-none"
          style={{
            willChange: "transform",
            fontFamily: "'Gwyner Condensed', Bitter, serif",
          }}
        >
          models
        </h1>
      </div>
      <div className="">
        <div className="bg-white min-h-auto">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 lg:items-stretch">
            <div className="flex-1">
              <div className="relative pt-[100%]">
                <div className="absolute inset-0 w-full aspect-square bg-black rounded-lg" />
                <div className="absolute bottom-4 left-4 p-2 bg-purple-600 rounded-full border-2 border-white">
                  <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex gap-2 mb-8">
                <div className="w-full aspect-[4/5] bg-red-600"></div>
                <div className="w-full aspect-[4/5] bg-red-600"></div>
                <div className="w-full aspect-[4/5] bg-red-600"></div>
              </div>

              <div className="mb-8">
                <h1 className="text-3xl font-serif tracking-widest mb-4">
                  MOSIMABALE
                </h1>
                <div className="text-sm flex flex-col gap-1 pt-1 w-fit space-y-1">
                  <p>
                    <span className="font-semibold">Height:</span>{" "}
                    <span>183cm / 5&apos;9</span>
                  </p>
                  <p>
                    <span className="font-semibold">Waist:</span> 11 US
                  </p>
                  <p>
                    <span className="font-semibold">Leg:</span> 11 US
                  </p>
                  <p>
                    <span className="font-semibold">Chest:</span> 11 US
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-0 md:mb-8">
                <a
                  href="#"
                  className="text-sm font-bold underline mb-4 sm:mb-0"
                >
                  MODEL&apos;S PORTFOLIO
                </a>
                <div className="flex gap-2">
                  <button className="w-8 h-8 bg-black flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button className="w-8 h-8 bg-black flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="hidden md:block mt-auto">
                <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-10 gap-2 p-0">
                  {models.map((model) => (
                    <div
                      key={model.id}
                      className="aspect-square overflow-hidden bg-gray-300 relative"
                    >
                      <Image
                        src={model.polaroids[0]}
                        alt={model.alt}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

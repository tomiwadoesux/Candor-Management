import Header from "@/components/header";
export default function NewsTest() {
  return (
    <section className="">
      <Header />
      <div className="pt-32 hidden md:block px-11 ">
        <div className="flex flex-col md:flex-row gap-5">
          <div className="hidden lg:flex flex-1 items-center justify-center">
            <div className="flex flex-col">
              <h1 className="text-5xl text-left lg:text-5xl uppercase tracking-wider  ">
                OWOLABI
                <br /> MOSIMABALE
              </h1>
              <h4>
                Amet minim mollit non deserunt ullamco est sit aliqua dolor do
                hdfjuh iudwygyer iyutvd uyvtwd fi uyv udguvef uyvutsv
                fdyuevfyefvy
              </h4>
            </div>
          </div>
          <div className=" flex-1">
            <div className="bg-black/40 flex items-center justify-end aspect-4/5">
              <button className="w-10 h-10 bg-black flex items-center justify-center hover:bg-gray-800 transition">
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
            </div>
          </div>
          <div className=" pt-11 flex-1">
            <div className="bg-black/40 flex items-center justify-start aspect-4/5">
              <button className="w-10 h-10 relative -top-11 bg-black flex items-center justify-center hover:bg-gray-800 transition">
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
          </div>
        </div>
        <div className="hidden md:flex lg:hidden flex-col pt-5 ">
          <h1 className="text-5xl text-left luppercase tracking-wider  ">
            OWOLABI
            <br /> MOSIMABALE
          </h1>
          <h4 className="w-[65%] pt-2 text-base">
            Amet minim mollit non deserunt ullamco est sit aliqua dolor do
            hdfjuh iudwygyer iyutvd uyvtwd fi uyv udguvef uyvutsv fdyuevfyefvy
          </h4>
        </div>
      </div>
      <div className=" pt-16 px-7 md:hidden">
        <div className="flex flex-col">
          <div>
            <div className="bg-black/40 flex items-end justify-end aspect-4/5">
              <div className="flex flex-row gap-6">
                <button className="w-8 h-8 bg-black flex items-center justify-center hover:bg-gray-800 transition">
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
                <button className="w-8 h-8 bg-black flex items-center justify-center hover:bg-gray-800 transition">
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
            </div>
            <div className=" flex-col pt-5 ">
              <h1 className="text-3xl text-left uppercase tracking-widest   ">
                OWOLABI
                <br /> MOSIMABALE
              </h1>
              <h4 className="w-[90%] pt-3 text-base">
                Amet minim mollit non deserunt ullamco est sit aliqua dolor do
                hdfjuh iudwygyer iyutvd uyvtwd fi uyv udguvef uyvutsv
                fdyuevfyefvy
              </h4>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

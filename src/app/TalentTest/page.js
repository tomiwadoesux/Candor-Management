import Header from "@/components/header";

export default function TalentTest() {
  return (
    <section className="">
      <Header />
      <div className=" flex flex-col">
        <div className=" self-center">
          <div className="flex self-center flex-row pt-3 gap-44">
            <div>
              <div className="flex flex-row gap-1">
                <svg
                  className="hidden md:block self-center"
                  width="6"
                  height="6"
                  viewBox="0 0 6 6"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="3" cy="3" r="3" fill="black" />
                </svg>
                <h4 className="text-xs font-bold">[ PORTFOLIO ]</h4>
              </div>
            </div>
            <div>
              <div className="flex flex-row gap-1">
                <svg
                  className="hidden md:block self-center"
                  width="6"
                  height="6"
                  viewBox="0 0 6 6"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="3" cy="3" r="3" fill="black" />
                </svg>
                <h4 className="text-xs font-bold">[ CAMPAINGS ]</h4>
              </div>
            </div>
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
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </div>
        </div>
        <div className="self-center pt-14 md:pt-20 lg:pt-6">
          <h1 className="text-5xl text-center lg:text-8xl uppercase tracking-wider  ">
            OWOLABI MOSIMABALE 
          </h1>
        </div>
        <div className="self-center pt-10 lg:pt-5">
          <h4 className="text-sm uppercase tracking-wider  ">
            <span className="font-bold">Talent:</span> PHOTOGRAPHER
          </h4>
        </div>
        <div className="pt-2 self-center">
          <div className="  aspect-square  bg-black w-90 md:w-110 "></div>
        </div>
        <div className="self-center px-9 md:px-16 lg:px-36 pt-11 lg:pt-4">
          <h4 className="text-sm uppercase text-center tracking-wider  ">
            Confident, professional, and reliable, I bring positive energy to
            every project and pride myself on being both a team player and a
            leader. Always open to trying new things, I thrive in dynamic
            environments and approach each opportunity with enthusiasm. With
            experience across e-commerce, runway, swimwear, commercial, fitness,
            and health & wellness, I deliver versatility in fro
          </h4>
        </div>
      </div>
      <div className="absolute bottom-0 flex-row justify-between flex text-xs opacity-75 w-full uppercase px-9 pb-3">
        <div>
          <h4>©2025</h4>
        </div>
        <div>
          <h4> Candor TALents</h4>
        </div>{" "}
      </div>
    </section>
  );
}

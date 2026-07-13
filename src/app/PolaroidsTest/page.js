import Header from "@/components/header";
export default function PolaroidsTest() {
  return (
    <section className="">
      <Header />
      <div className="px-5 md:px-9">
        <div className="flex flex-row pt-3 justify-between">
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
              <h4 className="text-xs font-bold">[ POLAROIDS ]</h4>
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
              <h4 className="text-xs font-bold">[ VIDEOS ]</h4>
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
      <div className="pt-16 text-center">
        <h1 className="uppercase text-3xl">Owolabi Mosimablale</h1>
        <h4 className="pt-2">Photographed by Estévez & Belloso</h4>
      </div>
      <div className="grid lg:grid-cols-2 pt-5 gap-6 lg:gap-8 grid-cols-1 px-8 md:px-16 lg:px-44">
        <div className="bg-black aspect-8/10 w-full"></div>
        <div className="bg-black aspect-8/10 w-full"></div>
        <div className="bg-black aspect-8/10 w-full"></div>
        <div className="bg-black aspect-8/10 w-full"></div>
        <div className="bg-black aspect-8/10 w-full"></div>
        <div className="bg-black aspect-8/10 w-full"></div>
      </div>
      <div className=" flex justify-center pt-4 flex-row gap-2">
        <h4 className="text-sm uppercase  font-bold">
          [ download model polaroids ]
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
    </section>
  );
}

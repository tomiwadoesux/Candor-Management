import Header from "@/components/header";
export default function GalleryTest() {
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

      <div className="grid pt-9 lg:pt-16 lg:grid-cols-3 gap-6 md:gap-6 lg:gap-8 md:grid-cols-2 px-8 md:px-16 lg:px-11">
        <div className="bg-black aspect-8/10 w-full"></div>
        <div className="bg-black aspect-8/10 w-full"></div>
        <div className="bg-black aspect-8/10 w-full"></div>
        <div className="bg-black aspect-8/10 w-full"></div>
        <div className="bg-black aspect-8/10 w-full"></div>
        <div className="bg-black aspect-8/10 w-full"></div>
      </div>
 
    </section>
  );
}

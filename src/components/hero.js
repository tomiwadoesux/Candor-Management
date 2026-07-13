import Image from "next/image";
export default function Hero() {
  return (
    <section className="h-[10m0vh]">
      <div className=" flex flex-col gap-3">
        <div className="flex pt-8 flex-col ">
          <div className="">
            {/* <div className="flex relative top-4 md:top-6 lg:top-0 flex-col ">
              <div className=" flex gap-9 md:gap-9 lg:gap-6 align-center justify-center flex-row">
                <div className="md:hidden lg:block ">
                  <div className="flex  rotate-[-12deg] flex-col">
                    <div className="bg-black   h-11 md:h-16 lg:h-17 w-11 md:w-16 lg:w-17"></div>
                    <div className="justify-center self-center text-xs pt-1">
                      <h5> Talents</h5>
                    </div>
                  </div>
                </div>

                <div className="hidden md:block">
                  <div className="flex rotate-[5deg]  flex-col">
                    <div className="bg-black   h-11 md:h-16 lg:h-17 w-11 md:w-16 lg:w-17"></div>
                    <div className="justify-center lg:hidden self-center text-xs pt-1">
                      <h5> Talents</h5>
                    </div>
                  </div>
                </div>

                <div className="hidden md:block">
                  <div className="flex   flex-col">
                    <div className="bg-black   h-11 md:h-16 lg:h-17 w-11 md:w-16 lg:w-17"></div>
                    <div className="justify-center self-center text-xs pt-1">
                      <h5> Models</h5>
                    </div>
                  </div>
                </div>

                <div className=" md:hidden">
                  <div className="flex   flex-col">
                    <div className="bg-black   h-11 md:h-16 lg:h-17 w-11 md:w-16 lg:w-17"></div>
                    <div className="justify-center self-center text-xs pt-1">
                      <h5> Models</h5>
                    </div>
                  </div>
                </div>

                <div className="hidden md:block">
                  <div className="flex rotate-[-5deg]  flex-col">
                    <div className="bg-black   h-11 md:h-16 lg:h-17 w-11 md:w-16 lg:w-17"></div>
                    <div className="justify-center lg:hidden  self-center text-xs pt-1">
                      <h5> Creatives</h5>
                    </div>
                  </div>
                </div>

                <div className="md:hidden lg:block ">
                  <div className="flex rotate-[12deg]  flex-col">
                    <div className="bg-black   h-11 md:h-16 lg:h-17 w-11 md:w-16 lg:w-17"></div>
                    <div className="justify-center self-center text-xs pt-1">
                      <h5> Creatives</h5>
                    </div>
                  </div>
                </div>
              </div>
            
            </div> */}

            <div className="">
              <div class="flex flex-col justify-center px-[2rem] items-center relative align-items ">
                <div className="flex self-center flex-row gap-7 lg:gap-10">
                  <div class="w-44 h-62  lg:w-55 lg:h-72  self-end bg-gray-300 ">
                    <img
                      src="/images/01.png"
                      alt=""
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <div class="  w-60 h-90 lg:w-61 lg:h-86  self-end bg-gray-300  scale-100 overflow-hidden">
                    <img
                      src="/images/01.png"
                      alt=""
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <div class="w-44 h-62  lg:w-55 lg:h-72   self-end bg-gray-300  overflow-hidden">
                    <img
                      src="/images/01.png"
                      alt=""
                      class=" w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex self-center pt-9 flex-row gap-7 lg:gap-9">
                  <div class="w-44 h-62 hidden lg:block lg:w-55 lg:h-72   self-top bg-gray-300  overflow-hidden">
                    <img
                      src="/images/01.png"
                      alt=""
                      class=" w-full h-full object-cover"
                    />
                  </div>
                  <div class=" w-60 h-90 lg:w-64 lg:h-89  self-center bg-gray-300  scale-100 overflow-hidden">
                    <img
                      src="/images/01.png"
                      alt=""
                      class="w-full h-full object-cover"
                    />
                  </div>

                  <div class="w-44 h-62  lg:w-55 lg:h-72   self-top bg-gray-300  overflow-hidden">
                    <img
                      src="/images/01.png"
                      alt=""
                      class=" w-full h-full object-cover"
                    />
                  </div>
                  <div class=" w-60 h-90 lg:w-64 lg:h-89 self-center bg-gray-300  scale-100 overflow-hidden">
                    <img
                      src="/images/01.png"
                      alt=""
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <div class="w-44 h-62 hidden lg:block lg:w-55 lg:h-72 relative -top-36   self-top bg-gray-300  overflow-hidden">
                    <img
                      src="/images/01.png"
                      alt=""
                      class=" w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>
        
        </div>
      </div>

      {/* <div className="absolute bottom-1 w-full px-[2rem] flex flex-row justify-between ">
        <h1 className="text-[10px] md:text-sm">(Talents)</h1>
        <h1 className="text-[10px] md:text-sm"> (Models)</h1>
        <h1 className="text-[10px] md:text-sm">(Creatives)</h1>
      </div> */}
    </section>
  );
}

{
  /* <Image src="/images/01.png" height={600} width={600} alt="model" /> */
}

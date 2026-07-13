"use client";

import Image from "next/image";

export default function JoinUs() {
  const images = [
    { id: 1, src: "https://picsum.photos/seed/join1/230/295", width: 230, height: 295, className: "col-start-1 row-start-1" },
    { id: 2, src: "https://picsum.photos/seed/join2/230/295", width: 230, height: 295, className: "col-start-1 row-start-2" },
    { id: 3, src: "https://picsum.photos/seed/join3/230/252", width: 230, height: 252, className: "col-start-2 row-start-1" },
    { id: 4, src: "https://picsum.photos/seed/join4/230/252", width: 230, height: 252, className: "col-start-2 row-start-2" },
    { id: 5, src: "https://picsum.photos/seed/join5/394/430", width: 394, height: 430, className: "col-start-3 row-start-1 row-span-2" },
    { id: 6, src: "https://picsum.photos/seed/join6/230/253", width: 230, height: 253, className: "col-start-4 row-start-1" },
    { id: 7, src: "https://picsum.photos/seed/join7/230/253", width: 230, height: 253, className: "col-start-4 row-start-2" },
    { id: 8, src: "https://picsum.photos/seed/join8/230/297", width: 230, height: 297, className: "col-start-5 row-start-1" },
    { id: 9, src: "https://picsum.photos/seed/join9/230/297", width: 230, height: 297, className: "col-start-5 row-start-2" },
  ];

  return (
    <section className="bg-white py-10 overflow-hidden">
      <div className="relative flex justify-center items-start min-h-[700px]">
        <div className="grid grid-cols-5 gap-x-[22px] gap-y-[23px] auto-rows-auto place-items-center">
          {images.map((image) => (
            <div
              key={image.id}
              className={`relative overflow-hidden ${image.className}`}
              style={{
                width: `${image.width}px`,
                height: `${image.height}px`,
              }}
            >
              <Image
                src={image.src}
                alt={`Join us image ${image.id}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 230px"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

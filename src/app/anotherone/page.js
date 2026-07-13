"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Scale } from "lucide-react";

gsap.registerPlugin(Draggable);

// Desktop layout
const layoutDataDesktop = [
  { x: 100, y: 200, w: 390, h: 250 },
  { x: 570, y: 250, w: 250, h: 360 },
  { x: 900, y: 200, w: 350, h: 490 },
  { x: 1300, y: 250,  w: 250, h: 360},
  { x: 1600, y: 200, w: 390, h: 250},
  { x: 120, y: 500, w: 350, h: 490 },
  { x: 520, y: 650, w: 350, h: 490 },
  { x: 930, y: 740, w: 390, h: 250 },
  { x: 1370, y: 650, w: 350, h: 490 },
  { x: 20, y: 1050, w: 490, h: 350 },
  { x: 570, y: 1200, w: 250, h: 360 },
  { x: 900, y: 1040, w: 350, h: 490 },
  { x: 1300, y: 1200,  w: 490, h: 350  },
];

const layoutDataMd = [
  { x: 50, y: 40, w: 190, h: 125 },
  { x: 275, y: 25, w: 210, h: 160 },
  { x: 525, y: 75, w: 175, h: 120 },
  { x: 75, y: 210, w: 140, h: 190 },
  { x: 260, y: 225, w: 180, h: 140 },
  { x: 490, y: 240, w: 200, h: 150 },
  { x: 100, y: 450, w: 160, h: 110 },
  { x: 300, y: 425, w: 145, h: 170 },
  { x: 500, y: 440, w: 175, h: 130 },
];

export default function AnotherOnePage() {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [layoutData, setLayoutData] = useState(layoutDataDesktop);
  const gridRef = useRef(null);
  const containerRef = useRef(null);
  const router = useRouter();
  const nextIdRef = useRef(0);

  // Detect screen size and set appropriate layout
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setLayoutData(layoutDataMd); // Mobile/tablet
      } else {
        setLayoutData(layoutDataDesktop); // Desktop
      }
    };

    handleResize(); // Set initial layout
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const config = {
    gridSize: 5000,
    dragBounds: 1500,
    parallaxIntensity: 0.15,
    inertia: true,
    edgeResistance: 0.8,
  };

  useEffect(() => {
    // Use local images from public/images folder
    const localImages = [
      "/images/22.webp",
      "/images/06.webp",
      "/images/64.webp",
      "/images/17.webp",
      "/images/23.webp",
      "/images/51.webp",
      "/images/01.png",
      "/images/22.webp",
      "/images/06.webp",
    ];

    const initialImages = layoutData.map((_, index) => {
      return {
        id: `img-${nextIdRef.current++}`,
        src: localImages[index % localImages.length],
        alt: `Model ${index + 1}`,
        modelName: `Model ${index + 1}`,
        modelId: index + 1,
      };
    });

    setImages(initialImages);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading && gridRef.current && images.length > 0) {
      const grid = gridRef.current;
      const container = containerRef.current;
      if (!grid || !container) return;

      // Mouse hover interactions
      let targetHoverX = 0;
      let targetHoverY = 0;
      let currentHoverX = 0;
      let currentHoverY = 0;

      const updatePosition = () => {
        // Smooth hover transitions
        currentHoverX += (targetHoverX - currentHoverX) * 0.1;
        currentHoverY += (targetHoverY - currentHoverY) * 0.1;

        gsap.set(grid, {
          x: currentHoverX,
          y: currentHoverY,
        });
        requestAnimationFrame(updatePosition);
      };
      updatePosition();

      // Move grid on mouse hover
      const handleMouseMove = (e) => {
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate hover offset based on mouse position
        targetHoverX = (mouseX / rect.width - 0.5) * -550;
        targetHoverY = (mouseY / rect.height - 0.4) * -500;
      };

      const handleMouseLeave = () => {
        targetHoverX = 0;
        targetHoverY = 0;
      };

      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseleave", handleMouseLeave);
      };
    }
  }, [isLoading, images]);

  const resetView = () => {
    if (gridRef.current) {
      gsap.to(gridRef.current, {
        x: 0,
        y: 0,
        duration: 1,
        ease: "power2.inOut",
      });
    }
  };

  console.log(
    "Component render - isLoading:",
    isLoading,
    "images count:",
    images.length
  );

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center ">
        <div className="text-white text-2xl font-light">Loading images...</div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-white">

      {/* Background */}
      <div className="absolute inset-0 " />

      {/* Main Grid Container */}
      <div
        ref={containerRef}
        className="w-full h-full relative"
        style={{ touchAction: "none" }}
      >
        <div
          ref={gridRef}
          className="absolute"
          style={{
            width: "2000px",
            height: "1500px",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            border: "2px solid rgba(255,255,255,0.3)",
          }}
        >
          {images.map((image, index) => {
            const layout = layoutData[index % layoutData.length];
            console.log(`Rendering image ${index}:`, image.src, "at", layout);
            return (
              <div
                key={image.id}
                onClick={() => router.push(`/portfolio/${image.modelId}`)}
                className="absolute rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                style={{
                  left: `${layout.x}px`,
                  top: `${layout.y}px`,
                  width: `${layout.w}px`,
                  height: `${layout.h}px`,
                  backgroundColor: "#1f2937",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={layout.w}
                  height={layout.h}
                  className="w-full h-full object-cover"
                  draggable={false}
                  priority={index < 3}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-end p-4">
                  <p className="text-white font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {image.modelName}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

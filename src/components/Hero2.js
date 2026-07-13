"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Scale } from "lucide-react";

gsap.registerPlugin(Draggable);

// Desktop layout — local model images (remote picsum was flaky, cards randomly
// stayed black). Staggered scatter, no aligned rows. The grid is centered and
// repeats every 2000px, so the screen shows layout-x ~1280-2000 on the left
// half and ~0-720 (as the duplicate) on the right half — cards live in those
// ranges so most of them are actually on screen. The wordmark channel
// (x 1650-2000 and 0-350, y 620-880) stays empty so CANDOR always reads.
const layoutDataDesktop = [
  // left half of the screen
  { x: 1290, y: 230, w: 320, h: 460, img: "/images/img3.jpeg" }, // portrait
  { x: 1660, y: 220, w: 340, h: 250, img: "/images/img12.jpeg" }, // landscape
  { x: 1290, y: 740, w: 350, h: 260, img: "/images/img7.jpeg" }, // landscape, hugs the wordmark
  { x: 1700, y: 880, w: 300, h: 400, img: "/images/img19.jpeg" }, // portrait
  { x: 1290, y: 1050, w: 360, h: 240, img: "/images/img25.jpeg" }, // landscape
  // right half of the screen (shown via the duplicate set)
  { x: 40, y: 240, w: 380, h: 260, img: "/images/img5.jpeg" }, // landscape
  { x: 470, y: 180, w: 300, h: 440, img: "/images/img14.jpeg" }, // portrait
  { x: 350, y: 680, w: 370, h: 270, img: "/images/img21.jpeg" }, // landscape, hugs the wordmark
  { x: 60, y: 1000, w: 320, h: 420, img: "/images/img9.jpeg" }, // portrait
  { x: 440, y: 1010, w: 360, h: 250, img: "/images/img28.jpeg" }, // landscape
  // far stretch — slides in with the hover pan / ultrawide screens
  { x: 830, y: 220, w: 340, h: 480, img: "/images/img16.jpeg" }, // portrait
  { x: 850, y: 760, w: 400, h: 280, img: "/images/img31.jpeg" }, // landscape
  { x: 830, y: 1100, w: 360, h: 240, img: "/images/img11.jpeg" }, // landscape
];

export default function Hero2() {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [layoutData, setLayoutData] = useState(layoutDataDesktop);
  const gridRef = useRef(null);
  const containerRef = useRef(null);
  const zoomRef = useRef(null);
  const router = useRouter();
  const nextIdRef = useRef(0);

  const config = {
    gridSize: 5000,
    dragBounds: 1500,
    parallaxIntensity: 0.15,
    inertia: true,
    edgeResistance: 0.8,
  };

  useEffect(() => {
    const initialImages = layoutData.map((layout, index) => {
      return {
        id: `img-${nextIdRef.current++}`,
        src: layout.img || `https://picsum.photos/seed/${index}/400/400`,
        alt: `Image ${index + 1}`,
        modelName: `Image ${index + 1}`,
        modelId: index + 1,
      };
    });

    setImages(initialImages);
    setIsLoading(false);
  }, [layoutData]);

  useEffect(() => {
    if (!isLoading && gridRef.current && images.length > 0) {
      const grid = gridRef.current;
      const container = containerRef.current;
      if (!grid || !container) return;

      // Check if device is mobile/tablet
      const isMobile = window.innerWidth < 1024;

      // Mouse hover interactions
      let targetHoverX = 0;
      let targetHoverY = 0;
      let currentHoverX = 0;
      let currentHoverY = 0;
      let autoScrollX = 0;

      const updatePosition = () => {
        // Auto-scroll slowly to the right ONLY on mobile/tablet devices
        if (isMobile) {
          autoScrollX -= 0.3; // Slow continuous scroll

          // Reset position when scrolled one full pattern width
          if (autoScrollX <= -5000) {
            autoScrollX = 0;
          }
        }

        // Smooth hover transitions
        currentHoverX += (targetHoverX - currentHoverX) * 0.1;
        currentHoverY += (targetHoverY - currentHoverY) * 0.1;

        gsap.set(grid, {
          x: currentHoverX + (isMobile ? autoScrollX : 0),
          y: currentHoverY,
        });
        requestAnimationFrame(updatePosition);
      };
      updatePosition();

      // Magnetic pull on individual cards
      const cards = grid.querySelectorAll("[data-image-card]");
      const cardState = new Map();
      const MAGNET_RADIUS = 280;
      const MAGNET_STRENGTH = 0.22;

      cards.forEach((card) => {
        cardState.set(card, { tx: 0, ty: 0, cx: 0, cy: 0 });
      });

      const animateMagnets = () => {
        cards.forEach((card) => {
          const s = cardState.get(card);
          s.cx += (s.tx - s.cx) * 0.12;
          s.cy += (s.ty - s.cy) * 0.12;
          card.style.transform = `translate3d(${s.cx}px, ${s.cy}px, 0)`;
        });
        requestAnimationFrame(animateMagnets);
      };
      animateMagnets();

      // Hover pan: moving the cursor drifts the whole field the same way, so
      // hovering toward an edge reveals more of the rectangles. Kept small —
      // the cards hug the wordmark now, so a bigger pan would slide them
      // over the letters.
      const handleMouseMove = (e) => {
        const nx = (e.clientX / window.innerWidth) * 2 - 1; // -1 .. 1
        const ny = (e.clientY / window.innerHeight) * 2 - 1;
        targetHoverX = nx * 30;
        targetHoverY = ny * 24;
      };

      const handleMouseLeave = () => {
        targetHoverX = 0;
        targetHoverY = 0;
        cards.forEach((card) => {
          const s = cardState.get(card);
          s.tx = 0;
          s.ty = 0;
        });
      };

      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseleave", handleMouseLeave);
      };
    }
  }, [isLoading, images]);

  // Scroll-driven "enter from the center" effect:
  // the whole field zooms in from its center and progressively blurs as you scroll.
  useEffect(() => {
    if (isLoading || !zoomRef.current) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const el = zoomRef.current;
    let raf = 0;
    let sp = 0; // smoothed progress — glides between wheel steps instead of jumping

    const render = () => {
      // Spans the full 150vh intro so the zoom lands together with the logo,
      // the fade and the title fly-in.
      const dist = window.innerHeight * 1.5;
      const target = Math.min(1, Math.max(0, window.scrollY / dist));
      sp += (target - sp) * 0.16;
      if (Math.abs(target - sp) < 0.0005) sp = target;

      const zoomP = sp * sp; // gentle at first, accelerating as the boxes fly past
      const scale = 1 + zoomP * 7;
      const blur = Math.max(0, (sp - 0.1) / 0.9) * 14; // capped — heavy blur tanks the frame rate
      el.style.transform = `scale(${scale})`;
      el.style.filter = blur > 0.3 ? `blur(${blur}px)` : "none";
      // No opacity fade — the field stays fully opaque so no black shows through.
      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [isLoading]);

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

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center ">
        <div className="text-white text-2xl font-light">Loading images...</div>
      </div>
    );
  }

  return (
    <section>
      <div className="relative w-screen h-screen overflow-hidden">
        <div
          ref={zoomRef}
          className="relative w-screen h-screen overflow-hidden bg-white"
          style={{ willChange: "transform, filter", transformOrigin: "50% 50%" }}
        >
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
              width: "4000px", // Double width for duplicated pattern
              height: "1500px",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* First set of images */}
            {images.map((image, index) => {
              const layout = layoutData[index % layoutData.length];
              return (
                <div
                  key={image.id}
                  data-image-card
                  onClick={() => router.push(`/portfolio/${image.modelId}`)}
                  className="absolute overflow-hidden cursor-pointer group"
                  style={{
                    left: `${layout.x}px`,
                    top: `${layout.y}px`,
                    width: `${layout.w}px`,
                    height: `${layout.h}px`,
                    backgroundColor: "#0c0c0c",
                  }}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={layout.w}
                    height={layout.h}
                    className="w-full h-full object-cover opacity-30 group-hover:opacity-60 transition-opacity duration-300"
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

            {/* Duplicated set for infinite scroll effect */}
            {images.map((image, index) => {
              const layout = layoutData[index % layoutData.length];
              return (
                <div
                  key={`${image.id}-duplicate`}
                  data-image-card
                  onClick={() => router.push(`/portfolio/${image.modelId}`)}
                  className="absolute overflow-hidden cursor-pointer group"
                  style={{
                    left: `${layout.x + 2000}px`, // Offset by pattern width
                    top: `${layout.y}px`,
                    width: `${layout.w}px`,
                    height: `${layout.h}px`,
                    backgroundColor: "#0c0c0c",
                  }}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={layout.w}
                    height={layout.h}
                    className="w-full h-full object-cover opacity-30 group-hover:opacity-60 transition-opacity duration-300"
                    draggable={false}
                    priority={false}
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
        </div>{" "}
      </div>
    </section>
  );
}

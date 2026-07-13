"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Choose() {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // A title flying in during the scroll reveal can land under a still cursor
  // and fire onMouseEnter, showing that row's hover state even though the
  // pointer never moved onto it. Fix it with a latch: hover is "armed" by a
  // genuine pointer move and "disarmed" by scrolling. Because the reveal is
  // scroll-driven, a title arriving at the cursor is always disarmed (no real
  // move re-armed it), so it won't reveal — while moving the pointer onto a
  // row re-arms and reveals it. A latch (not a timestamp) so event ordering
  // between pointermove and mouseenter can't defeat it.
  const armedRef = useRef(false);
  const lastPosRef = useRef({ x: -1, y: -1 });
  useEffect(() => {
    const onMove = (e) => {
      // Scrolling can synthesise a pointermove at the same coordinates; only a
      // real change in position counts as the user moving the pointer.
      if (
        e.clientX !== lastPosRef.current.x ||
        e.clientY !== lastPosRef.current.y
      ) {
        lastPosRef.current = { x: e.clientX, y: e.clientY };
        armedRef.current = true;
      }
    };
    const disarm = () => {
      // Scrolling both disarms hover and clears any current reveal, so a row
      // can't stay lit (or relight) as the stack scrolls under a still cursor —
      // it only lights again once the pointer actually moves onto a row.
      armedRef.current = false;
      setHoveredIndex(null);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", disarm, { passive: true });
    window.addEventListener("wheel", disarm, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", disarm);
      window.removeEventListener("wheel", disarm);
    };
  }, []);

  const handleEnter = (index) => {
    // Not armed => this enter came from the reveal (a title reached the still
    // cursor), not from the pointer moving onto the row. Ignore it.
    if (!armedRef.current) return;
    setHoveredIndex(index);
  };

  const categories = [
    {
      label: "ALL",
      href: "/all",
      bgImage: "/images/img1.jpeg",
    },
    {
      label: "MODELS",
      href: "/models",
      bgImage: "/images/img8.jpeg",
    },
    {
      label: "TALENTS",
      href: "/talents",
      bgImage: "/images/img15.jpeg",
    },
    {
      label: "CREATIVES",
      href: "/creatives",
      bgImage: "/images/img22.jpeg",
    },
  ];

  const isHovered = hoveredIndex !== null;

  return (
    <div data-choose-root className="relative bg-white w-full overflow-hidden">
      {/* Background media layer — fades in on hover */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{ opacity: isHovered ? 1 : 0 }}
      >
        {categories.map((category, index) => (
          <div
            key={category.label}
            className="absolute inset-0 transition-opacity duration-500"
            style={{ opacity: hoveredIndex === index ? 1 : 0 }}
          >
            <Image
              src={category.bgImage}
              alt=""
              fill
              priority={false}
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/30" />
          </div>
        ))}
      </div>

      <div
        className="relative z-10 w-full h-[80vh] lg:h-[100vh] flex flex-col justify-center mix-blend-exclusion text-white"
        style={{
          paddingLeft: "1.25rem",
          paddingRight: "1.25rem",
          paddingTop: "3.25rem",
          paddingBottom: "3.25rem",
        }}
      >
        <div
          data-choose-titles
          className="relative flex w-full flex-col items-center gap-10 md:gap-14 lg:gap-16"
          style={{ willChange: "transform" }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {categories.map((category, index) => {
            const isActive = hoveredIndex === index;
            const isDimmed = hoveredIndex !== null && hoveredIndex !== index;
            // These rows start smaller and scale up faster during the intro
            // (driven per-frame by the scroll effect in app/page.js).
            const isFast =
              category.label === "MODELS" || category.label === "CREATIVES";
            const indexNumber = (
              <span
                className={`absolute bottom-1 md:bottom-2 text-sm italic transition-all duration-300 ${
                  index % 2 === 0 ? "right-full mr-4 md:mr-6" : "left-full ml-4 md:ml-6"
                }`}
                style={{
                  filter: isDimmed ? "blur(8px)" : "blur(0)",
                  opacity: isDimmed ? 0.4 : 1,
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
            );
            return (
              <Link
                key={index}
                href={category.href}
                data-fast={isFast ? "" : undefined}
                className="group relative"
                onMouseEnter={() => handleEnter(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {indexNumber}
                <h1
                  className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-[0.025em] leading-none whitespace-nowrap transition-all duration-300"
                  style={{
                    filter: isDimmed ? "blur(8px)" : "blur(0)",
                    opacity: isDimmed ? 0.4 : 1,
                  }}
                >
                  {category.label}
                </h1>
                <span
                  className={`absolute left-full top-1/2 text-3xl md:text-4xl transition-all duration-300 ${
                    index % 2 === 1 ? "ml-14 md:ml-16" : "ml-4 md:ml-6"
                  }`}
                  style={{
                    opacity: isActive ? 1 : 0,
                    transform: isActive
                      ? "translate(0, -50%)"
                      : "translate(-12px, -50%)",
                  }}
                >
                  →
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

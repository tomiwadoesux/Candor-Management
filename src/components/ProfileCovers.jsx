"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

// Small editorial variations, kept close to each source's own proportions.
const FORMATS = [
  { height: 60, width: 0.96, ratio: 1 },
  { height: 53, width: 0.86, ratio: 1.06 },
  { height: 64, width: 1, ratio: 0.95 },
  { height: 57, width: 0.9, ratio: 1.04 },
  { height: 62, width: 0.97, ratio: 0.97 },
  { height: 55, width: 0.88, ratio: 1.02 },
];

// The /001 image sequence inside a profile: the profile's own hero supplies
// the pinned text, while this transparent gallery passes in front of it.
export default function ProfileCovers({ items, onSelect }) {
  const galleryRef = useRef(null);

  useEffect(() => {
    const frames = [...galleryRef.current.querySelectorAll(".profile-covers__frame")];
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;

    const update = () => {
      raf = 0;
      // Read geometry together, then write transforms without React renders.
      const positions = frames.map((frame) => frame.getBoundingClientRect());
      frames.forEach((frame, index) => {
        const image = frame.querySelector("img");
        if (!image) return;
        if (media.matches) {
          image.style.transform = "none";
          return;
        }
        const rect = positions[index];
        // The image drifts down as its frame travels up. Clamp within the
        // 16% overscan so neither edge can reveal the frame's background.
        const travel = rect.height * 0.07;
        const offset = Math.max(-travel, Math.min(travel,
          (window.innerHeight / 2 - rect.top - rect.height / 2) * 0.12));
        image.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0) scale(1.16)`;
      });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(schedule);
    frames.forEach((frame) => observer.observe(frame));
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    media.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      media.removeEventListener("change", schedule);
    };
  }, [items]);

  return (
    <ol ref={galleryRef} className="profile-covers" aria-label="Cover images">
      {items.map((item, index) => {
        const format = FORMATS[index % FORMATS.length];
        return (
        <li
          key={item.id}
          className="profile-covers__item"
          style={{
            "--cover-ratio": (item.pxW / item.pxH) * format.ratio,
            "--cover-size": `${format.height}svh`,
            "--cover-width-factor": format.width,
          }}
        >
          <button
            type="button"
            className="profile-covers__frame"
            aria-label={`Open ${item.alt}`}
            onClick={() => onSelect(item)}
          >
            <Image
              src={item.src}
              alt={item.alt}
              fill
              sizes="(orientation: portrait) 100vw, 70vw"
              className="profile-covers__image"
              loading={index === 0 ? "eager" : "lazy"}
            />
          </button>
        </li>
        );
      })}
    </ol>
  );
}

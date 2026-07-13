// components/ModelFaceCursor.js
"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Image from "next/image";

const BOX_WIDTH = 120;
const BOX_HEIGHT = 120;
const OFFSET_X = 24;
const OFFSET_Y = 24;

export default function ModelNameCursor({ hoveredModel, show }) {
  const cursorRef = useRef(null);
  const [visible, setVisible] = useState(show);

  // Handle mounting/unmounting for fade out
  useEffect(() => {
    if (show) {
      setVisible(true);
    } else if (cursorRef.current) {
      gsap.to(cursorRef.current, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.in",
        onComplete: () => setVisible(false),
      });
    }
  }, [show]);

  // Animate in on mount
  useEffect(() => {
    if (visible && cursorRef.current) {
      gsap.set(cursorRef.current, { opacity: 0 });
      gsap.to(cursorRef.current, {
        opacity: 1,
        duration: 0.5,
        ease: "power2.out",
      });
    }
  }, [visible]);

  // Position logic
  const setCursorPosition = (e) => {
    const parent = cursorRef.current?.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const x = e.clientX - rect.left + OFFSET_X;
    const y = e.clientY - rect.top - BOX_HEIGHT - OFFSET_Y;
    gsap.set(cursorRef.current, { x, y });
  };

  useEffect(() => {
    if (!show) return;

    // Set initial position on mount
    const handleInitial = (e) => setCursorPosition(e);
    window.addEventListener("mousemove", handleInitial, { once: true });

    // Animate on mousemove
    const moveCursor = (e) => {
      const parent = cursorRef.current?.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const x = e.clientX - rect.left + OFFSET_X;
      const y = e.clientY - rect.top - BOX_HEIGHT - OFFSET_Y;
      gsap.to(cursorRef.current, {
        x,
        y,
        duration: 0.9,
        ease: "power3.out",
      });
    };
    window.addEventListener("mousemove", moveCursor);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mousemove", handleInitial, { once: true });
    };
  }, [show]);

  if (!visible || !hoveredModel) return null;

  // Pick the best image for the face
  const faceImg =
    hoveredModel.face ||
    hoveredModel.coverImage ||
    (hoveredModel.images && hoveredModel.images[0]) ||
    "";

  return (
    <div
      ref={cursorRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        width: BOX_WIDTH,
        height: BOX_HEIGHT,
        color: "#fff",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        fontSize: 12,
        fontWeight: 600,
        padding: 8,
        boxSizing: "border-box",
        zIndex: 50,
        opacity: 0, // initial opacity for GSAP
        borderRadius: 12,
        background: "rgba(0,0,0,0.85)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
        border: "2px solid #fff",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ width: "100%", height: 70, overflow: "hidden", marginBottom: 8 }}>
        {faceImg && (
          <Image
            src={faceImg}
            alt={hoveredModel.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
            draggable={false}
          />
        )}
      </div>
      {/* <div style={{ color: "#fff", textAlign: "left", fontWeight: 500, fontSize: 13 }}>
        <div>{hoveredModel.name}</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          Height: {hoveredModel.height}
        </div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          Gender: {hoveredModel.gender}
        </div>
      </div> */}
    </div>
  );
}

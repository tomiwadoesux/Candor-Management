"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const BOX_WIDTH = 110;
const BOX_HEIGHT = 2;
const OFFSET_X = -BOX_WIDTH + 12; // Adjust for right-aligned content
const OFFSET_Y = 12;

export default function ModelImageCursor({ hoveredModel, show }) {
  const cursorRef = useRef(null);
  const textRef = useRef(null);
  const pointerRef = useRef(null);
  const [visible, setVisible] = useState(show);

  // Handle mounting/unmounting for fade out
  // useEffect (() => "#CURSOR",{
  //  if (cursorRef) {
  //     // Animate out, then unmount
  //     gsap.to(cursorRef.current, {
  //       opacity: 0,
  //       duration: 0.5,
  //       ease: "power2.in",
  //       onComplete: () => setVisible(false),
  //     });
  //   }
  // }, [show]);

  useEffect(() => {
    if (show) {
      setVisible(true);
    } else if (cursorRef.current) {
      // Animate out, then unmount
      gsap.to(cursorRef.current, {
        opacity: 0,
        duration: 0.6,
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
        duration: 0.6,
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
    
    // Set both arrow and text to initial position immediately
    if (pointerRef.current) {
      gsap.set(pointerRef.current, { x, y });
    }
    if (textRef.current) {
      gsap.set(textRef.current, { x, y });
    }
  };

  useEffect(() => {
    if (!show) return;

    // Set initial position on mount
    const handleInitial = (e) => setCursorPosition(e);
    window.addEventListener("mousemove", handleInitial, { once: true });

    // Animate on mousemove with different speeds for arrow and text
    const moveCursor = (e) => {
      const parent = cursorRef.current?.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const x = e.clientX - rect.left + OFFSET_X;
      const y = e.clientY - rect.top - BOX_HEIGHT - OFFSET_Y;
      
      // Fast animation for the arrow
      if (pointerRef.current) {
        gsap.to(pointerRef.current, {
          x,
          y,
          duration: 0.1,
          ease: "none",
        });
      }
      
      // Slower animation for the text
      if (textRef.current) {
        gsap.to(textRef.current, {
          x,
          y,
          duration: 0.9,
          ease: "power3.out",
        });
      }
    };
    window.addEventListener("mousemove", moveCursor);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mousemove", handleInitial, { once: true });
    };
  }, [show]);

  if (!visible || !hoveredModel) return null;

  // Hide the system cursor when show is true

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
        zIndex: 10,
        opacity: 0, // initial opacity for GSAP
      }}
    >
      {/* Fast moving arrow */}
      <div
        ref={pointerRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
        }}
      >
        <svg
          id="pointer"
          width="13"
          height="13"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11.7713 11.771L4.22886 4.22854M4.22886 4.22854H10.8285M4.22886 4.22854V10.8282"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      
      {/* Slower moving text */}
      <div
        ref={textRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
        }}
      >
        <div className="flex gap-1 flex-row">
          <div style={{ width: "13px" }}></div> {/* Spacer for arrow */}
          <div
            style={{
              textAlign: "right",
              color: "#fff",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              lineHeight: "1.1",
            }}
          >
            <div style={{ fontWeight: 600 }}>{hoveredModel.name?.toUpperCase()}</div>
            <div style={{ fontWeight: 400 }}>{hoveredModel.talent?.toUpperCase()}</div>
            <div style={{ fontWeight: 400 }}>{hoveredModel.height?.toUpperCase()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
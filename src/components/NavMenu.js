"use client";
import { useEffect } from "react";
import { gsap } from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";

gsap.registerPlugin(MorphSVGPlugin);

export default function NavMenu() {
  useEffect(() => {
    // hide targets initially
    gsap.set(["#dbear2", "#mbear2", "#bbear2"], { opacity: 0 });

    const svg = document.querySelector("#menu-svg");

    // hover enter
    const enter = () => {
      gsap.to("#dbear", {
        duration: 0.4,
        morphSVG: "#dbear2",
        ease: "power2.inOut",
      });
      gsap.to("#bbear", {
        duration: 0.4,
        morphSVG: "#bbear2",
        ease: "power2.inOut",
      });
    };

    // hover leave
    const leave = () => {
      gsap.to("#dbear", {
        duration: 0.4,
        morphSVG: "#dbear",
        ease: "power2.inOut",
      });
      gsap.to("#bbear", {
        duration: 0.4,
        morphSVG: "#bbear",
        ease: "power2.inOut",
      });
    };

    svg.addEventListener("mouseenter", enter);
    svg.addEventListener("mouseleave", leave);

    return () => {
      svg.removeEventListener("mouseenter", enter);
      svg.removeEventListener("mouseleave", leave);
    };
  }, []);

  return (
    <div className=" absolute right-0 top-10 inline-block">
      <svg
        id="menu-svg"
        width="38"
        height="38"
        viewBox="0 0 38 38"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="Group 177">
          <rect id="Rectangle 199" width="38" height="38" fill="#0C0C0C" />
          <g id="Group 168">
            <g id="Frame 168">
              <line
                id="dbear"
                x1="6.25"
                y1="11.75"
                x2="32.5357"
                y2="11.75"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                id="mbear"
                x1="10.4286"
                y1="17.75"
                x2="28.3572"
                y2="17.75"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                id="bbear"
                x1="14.1428"
                y1="23.75"
                x2="24.6428"
                y2="23.75"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>
            <g id="Frame 190">
              <line
                id="dbear2"
                x1="14.1428"
                y1="11.75"
                x2="24.6428"
                y2="11.75"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                id="mbear2"
                x1="10.4286"
                y1="17.75"
                x2="28.3572"
                y2="17.75"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                id="bbear2"
                x1="6.2478"
                y1="23.75"
                x2="32.5378"
                y2="23.75"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}

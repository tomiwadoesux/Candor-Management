"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { projectsData } from "./projects.js";
import "../styles/loader-styles.css";

gsap.registerPlugin(CustomEase);
CustomEase.create("hop", "0.9, 0, 0.1, 1");

export default function Loader() {
  const containerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!containerRef.current) return;

      const projectsContainer = containerRef.current.querySelector(".projects");
      const locationsContainer = containerRef.current.querySelector(
        ".locations"
      );
      const gridImages = gsap.utils.toArray(".img");
      const heroImage = containerRef.current.querySelector(".img.hero-img");

      if (!projectsContainer || !locationsContainer) return;

      const allImageSources = Array.from(
        { length: 35 },
        (_, i) => `/images/img${i + 1}.jpeg`
      );

      const getRandomImageSet = () => {
        const shuffled = [...allImageSources].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 9);
      };

      function initializeDynamicContent() {
        projectsContainer.innerHTML = "";
        locationsContainer.innerHTML = "";

        projectsData.forEach((project) => {
          const projectItem = document.createElement("div");
          projectItem.className = "project-item";

          const projectName = document.createElement("p");
          projectName.textContent = project.name;

          const directorName = document.createElement("p");
          directorName.textContent = project.director;

          projectItem.appendChild(projectName);
          projectItem.appendChild(directorName);

          projectsContainer.appendChild(projectItem);
        });

        projectsData.forEach((project) => {
          const locationItem = document.createElement("div");
          locationItem.className = "location-item";

          const locationName = document.createElement("p");
          locationName.textContent = project.location;

          locationItem.appendChild(locationName);
          locationsContainer.appendChild(locationItem);
        });
      }

      function startImageRotation() {
        const totalCycles = 20;

        for (let cycle = 0; cycle < totalCycles; cycle++) {
          const randomImages = getRandomImageSet();

          gsap.to(
            {},
            {
              duration: 0,
              delay: cycle * 0.15,
              onComplete: () => {
                gridImages.forEach((img, index) => {
                  const imgElement = img.querySelector("img");

                  if (cycle === totalCycles - 1 && img === heroImage) {
                    imgElement.src = "/images/img5.jpeg";
                    gsap.set(".hero-img img", { scale: 2 });
                  } else {
                    imgElement.src = randomImages[index];
                  }
                });
              },
            }
          );
        }
      }

      function setupInitialStates() {
        // Boxes are fully open (no clip wipe) but invisible — they fade in.
        gsap.set(".img", {
          clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
          opacity: 0,
        });

        // List rows start invisible and nudged down so they drop in top-to-bottom.
        gsap.set(
          [
            ".projects-header",
            ".project-item",
            ".locations-header",
            ".location-item",
          ],
          { opacity: 0, y: 20 }
        );
      }

      function createAnimationTimelines() {
        const tl = gsap.timeline({ delay: 0.3 });

        // 1. Boxes appear individually with opacity.
        tl.to(
          ".img",
          {
            opacity: 1,
            duration: 0.4,
            stagger: 0.08,
            ease: "power2.out",
            onStart: () => {
              setTimeout(startImageRotation, 300);
            },
          },
          0
        );

        // 2. Lists drop in top-to-bottom, fast — starting early, alongside the boxes.
        tl.to(
          [".projects-header", ".project-item"],
          {
            opacity: 1,
            y: 0,
            duration: 0.2,
            stagger: 0.05,
            ease: "power2.out",
          },
          0.15
        );

        tl.to(
          [".locations-header", ".location-item"],
          {
            opacity: 1,
            y: 0,
            duration: 0.2,
            stagger: 0.05,
            ease: "power2.out",
          },
          0.15
        );

        // Brighten the rows to white as they settle.
        tl.to(".project-item", {
          color: "#fff",
          duration: 0.15,
          stagger: 0.05,
        });

        tl.to(
          ".location-item",
          {
            color: "#fff",
            duration: 0.15,
            stagger: 0.05,
          },
          "<"
        );

        // 3. Clear the lists — left and right columns leave top-to-bottom, together.
        const exit = "+=0.6";

        tl.to(
          [".projects-header", ".project-item"],
          {
            opacity: 0,
            duration: 0.2,
            stagger: 0.04,
          },
          exit
        );

        tl.to(
          [".locations-header", ".location-item"],
          {
            opacity: 0,
            duration: 0.2,
            stagger: 0.04,
          },
          exit
        );

        tl.to(
          ".overlay",
          {
            opacity: 0,
            duration: 0.4,
          },
          "-=0.1"
        );

        // 4. Close the boxes and hand off to the page.
        tl.to(
          ".img",
          {
            clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
            duration: 0.8,
            stagger: 0.05,
            ease: "hop",
          },
          "+=0.1"
        );

        tl.to(
          ".loader-wrapper",
          {
            opacity: 0,
            duration: 0.3,
            pointerEvents: "none",
          },
          "-=0.2"
        );
      }

      function init() {
        initializeDynamicContent();
        setupInitialStates();
        createAnimationTimelines();
      }

      init();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div ref={containerRef} className="loader-wrapper">
      <div className="overlay">
        {/* Projects Section */}
        <div className="projects">
          <div className="projects-header">
            <p>Project</p>
            <p>Director</p>
          </div>
        </div>

        {/* Empty center lane — reserves space for the image grid */}
        <div className="grid-spacer" aria-hidden="true"></div>

        {/* Locations Section */}
        <div className="locations">
          <div className="locations-header">
            <p>Location</p>
          </div>
        </div>
      </div>

      {/* Image Grid */}
      <div className="image-grid">
        <div className="grid-row">
          <div className="img">
            <img src="/images/img1.jpeg" alt="Grid 1" />
          </div>
          <div className="img">
            <img src="/images/img2.jpeg" alt="Grid 2" />
          </div>
          <div className="img">
            <img src="/images/img3.jpeg" alt="Grid 3" />
          </div>
        </div>
        <div className="grid-row">
          <div className="img">
            <img src="/images/img4.jpeg" alt="Grid 4" />
          </div>
          <div className="img">
            <img src="/images/img5.jpeg" alt="Grid 5" />
          </div>
          <div className="img">
            <img src="/images/img6.jpeg" alt="Grid 6" />
          </div>
        </div>
        <div className="grid-row">
          <div className="img">
            <img src="/images/img7.jpeg" alt="Grid 7" />
          </div>
          <div className="img">
            <img src="/images/img8.jpeg" alt="Grid 8" />
          </div>
          <div className="img hero-img">
            <img src="/images/img5.jpeg" alt="Hero" />
          </div>
        </div>
      </div>
    </div>
  );
}

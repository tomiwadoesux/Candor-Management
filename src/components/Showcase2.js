import React, { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ChevronLeft, ChevronRight } from "lucide-react";
import BlackLogo from "./black-logo";

const Showcase2 = () => {
  const videos = [
    {
      id: 1,
      title: "Veuve Clicquot x\nJacquemus\nJonas Lindstroem\nCommercials",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    },
    {
      id: 2,
      title: "Dior Sauvage\nJean-Baptiste\nMondino\nCommercials",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    },
    {
      id: 3,
      title: "Miss Dior\nManu Cossu\nCommercials",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    },
    {
      id: 4,
      title: "Eau Pure\nManu Cossu\nCommercials",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    },
    {
      id: 5,
      title: "Conquest of\nSpace\nArnaud Bresson\nCommercials",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    },
    // {
    //   id: 6,
    //   title: "FTT Live\nOnly at\nRoland Garros\nCommercials",
    //   url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    // },
    // {
    //   id: 7,
    //   title: "From Sunset to\nSunrise\nManu Cossu\nCommercials",
    //   url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    // },
  ];

  const [hoveredVideo, setHoveredVideo] = useState(null);
  const [mainVideo, setMainVideo] = useState(() => {
    // Pick a random video on initial load
    const randomIndex = Math.floor(Math.random() * videos.length);
    return videos[randomIndex];
  });
  const [isHoveringText, setIsHoveringText] = useState(false);
  const [progress, setProgress] = useState(0);

  const previewRef = useRef(null);
  const mainRef = useRef(null);
  const previewBoxRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });

  // Smooth mouse tracking with GSAP
  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };

      if (previewBoxRef.current && isHoveringText) {
        const boxWidth = 256; // w-64 = 256px
        const clampedX = Math.min(
          Math.max(e.clientX - 128, 0),
          window.innerWidth - boxWidth
        );

        gsap.to(previewBoxRef.current, {
          x: clampedX,
          duration: 0.6,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isHoveringText]);

  // Handle video changes for preview
  useEffect(() => {
    if (hoveredVideo && isHoveringText && previewRef.current) {
      // Fade in and play the preview video
      gsap.to(previewBoxRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      });

      previewRef.current
        .play()
        .catch((err) => console.log("Video play error:", err));
    } else if (previewBoxRef.current) {
      // Hide when not hovering text area
      gsap.to(previewBoxRef.current, {
        opacity: 0,
        scale: 0.9,
        duration: 0.2,
        ease: "power2.in",
      });
    }
  }, [hoveredVideo, isHoveringText]);

  const handleVideoClick = (video) => {
    setMainVideo(video);
    setProgress(0); // Reset progress
    setTimeout(() => {
      if (mainRef.current) {
        mainRef.current
          .play()
          .catch((err) => console.log("Main video play error:", err));
      }
    }, 100);
  };

  const handleVideoHover = (video) => {
    // Only change if it's a different video
    if (!hoveredVideo || hoveredVideo.id !== video.id) {
      setHoveredVideo(video);
    }
  };

  const handleTextEnter = (video) => {
    setIsHoveringText(true);
    handleVideoHover(video);
  };

  const handleTextLeave = () => {
    setIsHoveringText(false);
  };

  // Mobile Controls Logic
  const currentIndex = videos.findIndex((v) => v.id === mainVideo.id);

  const handleNext = (e) => {
    e?.stopPropagation();
    const nextIndex = (currentIndex + 1) % videos.length;
    handleVideoClick(videos[nextIndex]);
  };

  const handlePrev = (e) => {
    e?.stopPropagation();
    const prevIndex = (currentIndex - 1 + videos.length) % videos.length;
    handleVideoClick(videos[prevIndex]);
  };

  const handleTimeUpdate = () => {
    if (mainRef.current) {
      const duration = mainRef.current.duration;
      const currentTime = mainRef.current.currentTime;
      if (duration > 0) {
        setProgress((currentTime / duration) * 100);
      }
    }
  };

  return (
    <section className="pt-14 md:pt-28 lg:pt-20">
      <div className="flex justify-center pb-6">
        <h1 className="text-center text-black text-5xl md:text-7xl lg:text-8xl font-normal">showreel</h1>
      </div>
      <div className="flex flex-col">
        <div className="px-4 relative w-full aspect-square md:aspect-16/9 overflow-hidden">
          <div className="absolute inset-0">
            {mainVideo && (
              <>
                <video
                  ref={mainRef}
                  className="w-full h-full object-cover"
                  src={mainVideo.url}
                  muted
                  loop
                  playsInline
                  autoPlay
                  onTimeUpdate={handleTimeUpdate}
                />
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black opacity-40 pointer-events-none" />
              </>
            )}
          </div>

          {/* Desktop Progress Bar - Inside Video */}
          <div className="hidden md:block absolute bottom-0 left-0 right-0 z-20 h-1 bg-white/20">
            <div
              className="h-full bg-white transition-all duration-200 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Preview Box that follows mouse smoothly - positioned BELOW text */}
          {hoveredVideo && isHoveringText && (
            <div
              ref={previewBoxRef}
              className="w-64 h-36 fixed shadow-2xl pointer-events-none"
              style={{
                bottom: "60px", // Position above the text container
                zIndex: 10, // Lower z-index than text
                opacity: 0,
                transform: "scale(0.9)",
              }}
            >
              <video
                ref={previewRef}
                className="w-full h-full object-cover rounded"
                src={hoveredVideo.url}
                muted
                loop
                playsInline
              />
            </div>
          )}

          {/* Desktop Video Titles at Bottom */}
          <div
            className="hidden md:block absolute top-5 left-0 right-0 z-20"
            onMouseLeave={handleTextLeave}
          >
            <div className="flex justify-between items-end px-12 max-w-full">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="group cursor-pointer px-2 flex-1 max-w-[180px] relative z-20"
                  onMouseEnter={() => handleTextEnter(video)}
                  onClick={() => handleVideoClick(video)}
                >
                  <h5 className="text-xs uppercase text-white  leading-tight whitespace-pre-line">
                    {video.title}
                  </h5>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Controls (Below Video) */}
        <div className="md:hidden px-4 py-6 ">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-end">
              <h5 className="text-sm font-medium text-black uppercase leading-snug whitespace-pre-line">
                {mainVideo.title}
              </h5>
              <div className="flex items-center gap-6 mb-1">
                <button
                  onClick={handlePrev}
                  className="w-8 h-8 bg-black flex items-center justify-center hover:bg-gray-800 transition"
                >
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={handleNext}
                  className="w-8 h-8 bg-black flex items-center justify-center hover:bg-gray-800 transition"
                >
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Sleek Progress Bar */}
            <div className="w-full h-[2px] bg-black/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-black transition-all duration-200 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Showcase2;

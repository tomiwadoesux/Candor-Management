import React, { useState, useRef, useEffect, useMemo } from 'react';

export default function Showcase() {
  const videos = useMemo(() => [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
  ], []);

  const [activeVideo, setActiveVideo] = useState(videos[0]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const mainVideoRef = useRef(null);
  const thumbnailVideoRefs = useRef([]);

  useEffect(() => {
    const activeIndex = videos.indexOf(activeVideo);
    if (activeIndex !== -1 && thumbnailVideoRefs.current[activeIndex] && mainVideoRef.current) {
      const thumbnailVideo = thumbnailVideoRefs.current[activeIndex];
      mainVideoRef.current.currentTime = thumbnailVideo.currentTime;
    }
  }, [activeVideo, videos]);

  const handleMouseEnter = (videoSrc, index) => {
    setActiveVideo(videoSrc);
    setHoveredIndex(index);
  };

  return (
    <div className="relative pt-20 w-screen h-full px-6 flex-col flex gap-4 overflow-hidden">
      
      {/* <h1 className='text-6xl font-bold text-[#010101] relative z-10'>SHOWCASE</h1> */}
      <div className="w-full h-[72.3%] bg-black relative z-[1]">
        <video
          ref={mainVideoRef}
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          key={activeVideo}
        >
          <source src={activeVideo} type="video/mp4" />
        </video>
      </div>

      <div className="flex md:justify-evenly items-center relative z-[2] pb-[27px] md:flex-row gap-4 overflow-x-auto md:overflow-x-visible scrollbar-hide snap-x snap-mandatory bg-white">
        {videos.map((videoSrc, index) => (
          <div
            key={index}
            className="flex-shrink-0 md:flex-1 w-[45%] md:w-auto cursor-pointer snap-start"
            onMouseEnter={() => handleMouseEnter(videoSrc, index)}
            onClick={() => handleMouseEnter(videoSrc, index)}
          >
            <div className="aspect-video  overflow-hidden hover:opacity-80 transition-opacity">
              <video
                ref={(el) => (thumbnailVideoRefs.current[index] = el)}
                className="w-full h-full object-cover pointer-events-none"
                autoPlay
                loop
                muted
                playsInline
              >
                <source src={videoSrc} type="video/mp4" />
              </video>
            </div>

            <div className="mt-3">
              <h4 className="text-xs uppercase font-bold text-[#010101]">
                Video {index + 1}
              </h4>
              <p className="text-xs text-[#010101]/60 mt-0.5">
                SHOWCASE
              </p>
              <p className="text-xs text-[#010101]">Sample Video</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

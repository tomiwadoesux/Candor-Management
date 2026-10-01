"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// three.js + gsap ship with the sphere and are by far the heaviest thing on
// the page. Keep them out of the landing page's server render and its first
// load, and only mount the scene once the section is a viewport away — the
// WebGL frame loop is then warm by the time it's on screen, and never runs at
// all while the visitor is still up in the hero.
const Sphere2 = dynamic(() => import("../app/sphere2/Sphere2"), { ssr: false });

// The landing page closes on the sphere board rather than a written footer:
// the same /sphere2 view, whole, as the last full-viewport section. Its chrome
// is absolutely positioned, so once the section fills the screen that chrome
// lands exactly where it does on the standalone page.
export default function SphereFooter() {
  const ref = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (mounted) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setMounted(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setMounted(true);
        io.disconnect();
      },
      { rootMargin: "100% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mounted]);

  return (
    <section
      ref={ref}
      data-sphere-footer
      className="relative h-screen w-full overflow-hidden bg-white text-black"
    >
      {/* The canvas touch-action rule lives in styles/globals.css — see the
          [data-sphere-footer] canvas block there for why. */}
      {mounted && <Sphere2 embedded />}
    </section>
  );
}

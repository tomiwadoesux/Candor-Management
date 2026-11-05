"use client";

import { useEffect, useMemo, useState } from "react";
import MorphGallery from "@/components/MorphGallery";
import { photoNumber, photoRowSizes } from "./gallery";

const columnsFor = () => typeof window === "undefined" ? 4 : window.innerWidth >= 1024 ? 4 : window.innerWidth > 600 ? 3 : 2;

export default function Photography2Grid({ artworks, onSelect, animate }) {
  const [columns, setColumns] = useState(columnsFor);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const tablet = window.matchMedia("(min-width: 601px)");
    const update = () => setColumns(columnsFor());
    update();
    desktop.addEventListener("change", update);
    tablet.addEventListener("change", update);
    return () => {
      desktop.removeEventListener("change", update);
      tablet.removeEventListener("change", update);
    };
  }, []);

  const layout = useMemo(() => ({
    rowSizes: photoRowSizes(artworks, columns), minTail: 1,
  }), [artworks, columns]);
  const items = useMemo(() => artworks.map((art, index) => ({
    ...art, id: art.src, alt: art.title, label: photoNumber(index + 1),
    pxW: art.width, pxH: art.height,
  })), [artworks]);

  return <div aria-label="Artwork grid">
    <MorphGallery items={items} layout={layout} onSelect={onSelect} unoptimized reveal="viewport-fit"
      intro={animate ? "animate" : "instant"} className="photography-two-grid" />
  </div>;
}

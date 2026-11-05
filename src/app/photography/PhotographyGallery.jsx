"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import dimensions from "./image-dimensions.json";
import { bentoStyle, createBentoWithInfo } from "./bento-layout";

const number = (index) => String(index + 1).padStart(2, "0");

export default function PhotographyGallery({ project, folderIndex, previewIndices, expanded, returning, note, edits, variant, allowRotation, transition, onOpen, onToggle, onClose }) {
  const root = useRef(null);
  const [measured, setMeasured] = useState(dimensions);
  const [bounds, setBounds] = useState({ width: 1000, gap: 14, compact: false });
  // Keep Motion's layout measurements alive during a flight, but let the
  // floating photos own the movement. Re-enabling layout after arrival would
  // otherwise replay a stale projection underneath the handoff.
  const cardTransition = returning ? { duration: 0 } : transition;

  useLayoutEffect(() => {
    const element = root.current;
    const container = expanded ? element : element.parentElement;
    const measure = () => {
      const width = container.clientWidth;
      const gap = expanded ? parseFloat(getComputedStyle(element).columnGap) : Math.min(3, width / Math.max(6, previewIndices.length * 6));
      const compact = window.matchMedia("(max-width: 600px)").matches;
      setBounds((previous) => previous.width === width && previous.gap === gap && previous.compact === compact ? previous : { width, gap, compact });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [expanded, previewIndices.length]);

  const previewRatios = project.images.map((src) => {
    const intrinsic = measured[src];
    return intrinsic?.width > 0 && intrinsic?.height > 0 ? intrinsic.width / intrinsic.height : 1;
  });
  const fittedHeight = (bounds.width - bounds.gap * Math.max(0, previewIndices.length - 1)) / Math.max(1, previewIndices.reduce((sum, index) => sum + previewRatios[index], 0));
  // Short strips keep a comfortable preview size. Long strips share one
  // fitted height, preserving every image's ratio inside the page gutters.
  const previewHeight = Math.min(Math.max(88, bounds.width * 0.09), fittedHeight);

  // Crop/focal-point changes leave the composition alone. Only dimensions,
  // orientation, viewport size and the chosen arrangement affect placement.
  const shapeKey = project.images.map((src) => `${measured[src]?.width || 1}/${measured[src]?.height || 1}/${edits[src]?.rotation ?? "auto"}`).join("|");
  const composition = useMemo(() => expanded ? createBentoWithInfo(shapeKey.split("|").map((shape) => {
    const [width, height, rotation] = shape.split("/");
    return { aspectRatio: Number(width) / Number(height), rotation: rotation === "auto" ? undefined : Number(rotation) };
  }), { ...bounds, variant, allowRotation }) : { images: [] }, [expanded, shapeKey, bounds, variant, allowRotation]);
  const layout = composition.images;

  const info = (
    <aside className={`photography-project-copy${expanded ? " photography-info-tile" : ""}`} style={expanded ? bentoStyle(composition.info) : undefined}>
      <h2>{project.title.trim()}</h2>
      <p className="photography-project-meta"><span>Photography</span><span>{project.date}</span></p>
      <p className="photography-project-note">{note}</p>
      <p className="photography-project-count">{project.images.length} photographs</p>
      {expanded && <button type="button" className="photography-info-dismiss"
        aria-label={`Close folder ${number(folderIndex)}: ${project.title.trim()} from description`}
        onClick={onClose}>Close folder ( × )</button>}
    </aside>
  );

  return (
    <>
    {!expanded && info}
    <div className="photography-images" ref={root} style={{
      "--bento-unit": `${Math.max(1, (bounds.width - bounds.gap * 11) / 12)}px`,
      "--photography-preview-height": `${previewHeight}px`,
      columnGap: expanded ? undefined : `${bounds.gap}px`,
    }}>
      {expanded && info}
      <AnimatePresence initial={false} mode="popLayout">
      {project.images.map((src, index) => {
        if (!expanded && !previewIndices.includes(index)) return null;
        const edit = edits[src] || {};
        const rotation = expanded ? (layout[index]?.rotation || 0) : 0;
        return (
          <motion.figure layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ layout: cardTransition, opacity: { duration: cardTransition.duration === 0 ? 0 : 0.16 } }} key={src} className="photography-card"
            style={expanded ? bentoStyle(layout[index]) : undefined}>
            <motion.button layout="position" transition={cardTransition} type="button" className="photography-image"
              data-photo-index={index}
              style={{ "--preview-aspect": previewRatios[index] }}
              tabIndex={expanded ? 0 : -1}
              aria-label={expanded ? `View ${project.title.trim()}, photograph ${number(index)}` : `Open folder ${number(folderIndex)}: ${project.title.trim()}`}
              onClick={(event) => expanded ? onOpen(project, index) : onToggle(folderIndex, event)}>
              <span className="photography-image-canvas">
                <img src={src} alt={`${project.title.trim()}, photograph ${number(index)}`}
                  loading={expanded || folderIndex < 2 ? "eager" : "lazy"} draggable="false"
                  data-sideways={rotation % 180 !== 0}
                  style={{ transform: `translate(-50%, -50%) rotate(${rotation}deg)`, objectFit: expanded ? (edit.fit || "cover") : "contain", objectPosition: expanded ? `${edit.x ?? 50}% ${edit.y ?? 50}%` : "50% 50%" }}
                  onLoad={(event) => {
                    const { naturalWidth: width, naturalHeight: height } = event.currentTarget;
                    setMeasured((previous) => previous[src]?.width === width && previous[src]?.height === height ? previous : { ...previous, [src]: { width, height } });
                  }} />
                <span className="photography-image-monochrome" aria-hidden="true" />
                <span className="photography-image-shade" aria-hidden="true" />
              </span>
            </motion.button>
            <motion.figcaption layout="position" transition={cardTransition} aria-hidden={!expanded}>{number(index)}</motion.figcaption>
          </motion.figure>
        );
      })}
      </AnimatePresence>
    </div>
    </>
  );
}

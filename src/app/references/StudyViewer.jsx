"use client";

import { useEffect, useRef, useState } from "react";

// Native dialog provides focus trapping, background inertness and Escape.
export default function StudyViewer({ selection, onClose }) {
  const dialog = useRef(null);
  const [index, setIndex] = useState(selection.index || 0);
  const touch = useRef(null);
  const images = selection.images;
  const move = (direction) => setIndex((i) => (i + direction + images.length) % images.length);
  useEffect(() => {
    const node = dialog.current;
    const previousFocus = document.activeElement;
    node.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      node.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);
  const image = images[index];
  const photo = typeof image === "string" ? { src: image } : image;
  const title = photo.title || selection.title;
  const source = photo.source || selection.source;
  const number = (value) => String(value).padStart(selection.numberDigits || 1, "0");
  return (
    <dialog ref={dialog} className="study-viewer" aria-label={title} onCancel={onClose} data-lenis-prevent
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1);
        }
      }}>
      <header><span aria-live="polite">{title}</span><span>{number(index + 1)} / {number(images.length)}</span><button type="button" autoFocus onClick={onClose}>Close ( × )</button></header>
      <div className="study-viewer__picture" onTouchStart={(event) => { touch.current = event.touches[0].clientX; }} onTouchEnd={(event) => {
        if (touch.current === null) return;
        const delta = event.changedTouches[0].clientX - touch.current;
        if (Math.abs(delta) > 45) move(delta < 0 ? 1 : -1);
        touch.current = null;
      }}>
        <img src={photo.src} alt={photo.alt || photo.title || `${selection.title}, image ${index + 1}`} />
      </div>
      <footer><button type="button" onClick={() => move(-1)} disabled={images.length < 2}>← Previous</button><a href={source} target="_blank" rel="noreferrer">View original ↗</a><button type="button" onClick={() => move(1)} disabled={images.length < 2}>Next →</button></footer>
    </dialog>
  );
}

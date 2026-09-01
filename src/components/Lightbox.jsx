"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * Plain image lightbox for the morphing galleries on a model page.
 *
 * Shares the modal shell in styles/morph-gallery.css with the case modal on
 * /grid, but shows only the picture — on a profile the surrounding page is
 * already the caption. Escape and a backdrop click close it, focus moves into
 * the panel on open and returns to the tile you came from, and the page behind
 * is locked so the board can't scroll away underneath.
 */
export default function Lightbox({ item, onClose }) {
  const panelRef = useRef(null);
  const returnFocusRef = useRef(null);
  const open = Boolean(item);

  // Keep the last opened item through the closing transition, so the panel
  // fades out with its picture instead of blanking first.
  const [shown, setShown] = useState(item);
  useEffect(() => {
    if (item) setShown(item);
  }, [item]);

  const handleKey = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;

    returnFocusRef.current = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKey);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handleKey);
      returnFocusRef.current?.focus?.();
    };
  }, [open, handleKey]);

  if (!shown) return null;

  return (
    <div
      className="morph-modal"
      data-open={open ? "true" : "false"}
      aria-hidden={open ? undefined : true}
      // Inert while closed so the fade-out can't be tabbed into.
      inert={!open}
    >
      <div className="morph-modal__scrim" onClick={onClose} />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={shown.alt}
        tabIndex={-1}
        className="morph-modal__panel morph-modal__panel--plain"
      >
        <button
          type="button"
          onClick={onClose}
          className="morph-modal__close"
          aria-label="Close"
        >
          Close
        </button>

        <div className="morph-modal__media">
          <Image
            src={shown.src}
            alt={shown.alt}
            width={shown.pxW}
            height={shown.pxH}
            sizes="(max-width: 767px) 90vw, 70vw"
            className="h-full w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}

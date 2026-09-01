"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import MorphGallery from "./MorphGallery";

/**
 * /grid — Selected Work.
 *
 * The page chrome around the morphing gallery: the sticky bar tiles disappear
 * behind, the section heading, and the case modal a tile opens. The board and
 * its scroll-scrubbed entrance live in MorphGallery, which the model pages
 * share.
 *
 * The sticky bar is load-bearing, not decoration: it is opaque, so tiles slide
 * *under* it on the way out and appear to compress into the header. In the
 * reference that exit read is pure occlusion — nothing animates it.
 */

// The data stores both systems ("175 cm / 5'9\""); show only the metric half.
const metric = (v) => (v ? String(v).split("/")[0].trim() : "");

export default function CaseGrid({ items }) {
  const [active, setActive] = useState(null);

  // Memoised because MorphGallery re-binds its scroll listeners whenever the
  // item list identity changes — without this, opening the modal (a state
  // change here) would rebuild the board's bindings on every render.
  const tiles = useMemo(
    () => items.map((m) => ({ ...m, label: m.name, meta: m.talent })),
    [items]
  );

  // Counts under the heading come off the roster itself rather than being
  // typed in, so they can't drift out of date.
  const counts = items.reduce((acc, m) => {
    const key = (m.talent || "Talent").toUpperCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const categories = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-[#fafafa] text-[#0c0c0c]">
      {/* Opaque and sticky: this is the edge tiles disappear behind. */}
      <div className="sticky top-0 z-20 bg-[#fafafa]">
        <div className="flex items-center justify-between px-6 py-5 md:px-10">
          <span className="text-sm font-semibold uppercase tracking-[0.18em]">
            Candor
          </span>
          <nav className="flex gap-6 text-xs uppercase tracking-[0.14em] text-[#0c0c0c]/60">
            <Link href="/models" className="hover:text-[#0c0c0c]">
              Models
            </Link>
            <Link href="/" className="hover:text-[#0c0c0c]">
              Index
            </Link>
          </nav>
        </div>
      </div>

      <header className="flex flex-col gap-6 px-6 pb-24 pt-16 md:flex-row md:items-start md:gap-10 md:px-10 md:pb-40 md:pt-28">
        <ul className="flex shrink-0 gap-5 pt-2 text-[10px] uppercase leading-[1.7] tracking-[0.14em] text-[#0c0c0c]/50 md:w-32 md:flex-col md:gap-0">
          {categories.map(([label, n]) => (
            <li key={label}>
              {label} ({n})
            </li>
          ))}
        </ul>
        <h2 className="text-[13vw] leading-[0.88] tracking-[-0.02em] md:text-[5.5vw]">
          Selected Work
        </h2>
      </header>

      <MorphGallery
        items={tiles}
        onSelect={setActive}
        className="px-6 pb-48 md:px-10"
      />

      <CaseModal item={active} onClose={() => setActive(null)} />
    </main>
  );
}

/**
 * Selecting a tile opens the case rather than navigating, so you keep your
 * place on the board. Escape and a backdrop click both close it; focus moves
 * into the panel on open and returns to the tile you came from on close, and
 * the page behind is locked so the grid can't scroll away underneath.
 */
function CaseModal({ item, onClose }) {
  const panelRef = useRef(null);
  const returnFocusRef = useRef(null);
  const open = Boolean(item);

  // Keep the last opened item on screen through the closing transition, so the
  // panel fades out with its content instead of blanking first.
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
        aria-label={shown.name}
        tabIndex={-1}
        className="morph-modal__panel"
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
            sizes="(max-width: 767px) 90vw, 44vw"
            className="h-full w-full object-contain"
          />
        </div>

        <div className="morph-modal__meta">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#0c0c0c]/40">
            {shown.talent} — {shown.board}
          </p>
          <h3 className="mt-3 text-3xl leading-none tracking-[-0.02em] md:text-4xl">
            {shown.name}
          </h3>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 text-[11px] uppercase tracking-[0.1em]">
            {[
              ["Height", metric(shown.height)],
              ["Chest", metric(shown.chest)],
              ["Waist", metric(shown.waist)],
              ["Shoe", metric(shown.shoe)],
              ["From", shown.nationality],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="text-[#0c0c0c]/40">{label}</dt>
                <dd>{value || "—"}</dd>
              </div>
            ))}
          </dl>

          <p className="pt-8 max-w-prose text-sm leading-relaxed text-[#0c0c0c]/70">
            {shown.bio}
          </p>

          <Link
            href={`/models/${shown.id}`}
            className="mt-8 inline-block border-b border-current pb-1 text-[11px] uppercase tracking-[0.14em]"
          >
            Full profile
          </Link>
        </div>
      </div>
    </div>
  );
}

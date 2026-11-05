"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import "../styles/film-bars.css";

/**
 * The inline showreel's control bar, swapped in for the original hairline row
 * by FilmPlayer's `bar` prop (the fullscreen /video player keeps the row).
 * The title stays above the picture. Film names span the centred seek line,
 * with the icon controls directly below it.
 */

const pad = (n) => String(n).padStart(2, "0");
const clock = (s) =>
  Number.isFinite(s) && s > 0
    ? `${pad(Math.floor(s / 60))}:${pad(Math.floor(s % 60))}`
    : "00:00";

const Play = ({ playing }) =>
  playing ? (
    <svg width="9" height="10" viewBox="0 0 9 10" aria-hidden="true">
      <rect width="3" height="10" fill="currentColor" />
      <rect x="6" width="3" height="10" fill="currentColor" />
    </svg>
  ) : (
    <svg width="9" height="10" viewBox="0 0 9 10" aria-hidden="true">
      <path d="M0 0 L9 5 L0 10 Z" fill="currentColor" />
    </svg>
  );

const Sound = ({ muted }) => (
  <svg width="12" height="10" viewBox="0 0 12 10" aria-hidden="true">
    <path d="M0 3.5 H2.5 L6 0.5 V9.5 L2.5 6.5 H0 Z" fill="currentColor" />
    {muted ? (
      <path d="M8 3.5 L11 6.5 M11 3.5 L8 6.5" stroke="currentColor" fill="none" />
    ) : (
      <path d="M8 2.5 A3.5 3.5 0 0 1 8 7.5" stroke="currentColor" fill="none" />
    )}
  </svg>
);

export default function FilmBar({
  film, films, filmIndex, playing, muted, progress, duration, onPlay, onMute, onJump, onSeek,
}) {
  const [preview, setPreview] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const chaptersRef = useRef(null);
  const previewMode = useRef("pointer");
  const previewVisible = useRef(false);
  const reduceMotion = useReducedMotion();
  const x = useSpring(0, { duration: 0.35, bounce: 0 });
  const y = useMotionValue(0);
  const transform = useMotionTemplate`translate3d(${x}px, ${y}px, 0)`;

  const hidePreview = () => {
    previewVisible.current = false;
    setPreviewOpen(false);
  };

  useEffect(() => {
    const hide = () => {
      previewVisible.current = false;
      setPreviewOpen(false);
    };
    window.addEventListener("scroll", hide, { passive: true });
    window.addEventListener("resize", hide);
    window.addEventListener("blur", hide);
    return () => {
      window.removeEventListener("scroll", hide);
      window.removeEventListener("resize", hide);
      window.removeEventListener("blur", hide);
    };
  }, []);

  const positionPreview = (clientX, rowBottom, instant) => {
    // Centre the 192 × 140px preview below the row. Only its horizontal position
    // follows the pointer, so moving between names never lifts it over the text.
    const left = Math.max(16, Math.min(clientX - 96, window.innerWidth - 208));
    const top = Math.max(16, Math.min(rowBottom + 8, window.innerHeight - 156));
    x[instant ? "jump" : "set"](left);
    y.set(top);
  };

  const showPreview = (index, clientX, rowBottom, keyboard = false) => {
    previewMode.current = keyboard ? "keyboard" : "pointer";
    positionPreview(clientX, rowBottom, keyboard || reduceMotion || !previewVisible.current);
    previewVisible.current = true;
    setPreview(index);
    setPreviewOpen(true);
  };

  const previewNearestFilm = (event) => {
    if (event.pointerType === "touch" ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const row = event.currentTarget;
    const names = row.querySelectorAll(".fb-c__ch-name");
    let nearest = 0;
    let nearestCenter = event.clientX;
    let distance = Infinity;
    names.forEach((name, index) => {
      const rect = name.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const nextDistance = Math.abs(event.clientX - center);
      if (nextDistance < distance) {
        nearest = index;
        nearestCenter = center;
        distance = nextDistance;
      }
    });
    showPreview(nearest, reduceMotion ? nearestCenter : event.clientX, row.getBoundingClientRect().bottom);
  };

  const previewFocusedFilm = (event, index) => {
    if (!event.currentTarget.matches(":focus-visible")) return;
    const rect = event.currentTarget.querySelector(".fb-c__ch-name").getBoundingClientRect();
    showPreview(index, rect.left + rect.width / 2, chaptersRef.current.getBoundingClientRect().bottom, true);
  };

  return (
    <div className="fb fb-c">
      <div className="fb-c__top">
        {/* The look's name and credits resolve into these two centred lines. */}
        <div className="fb-c__lede" key={film.id}>
          <h4 className="fb-c__title" data-handoff-line="title">
            {film.client} ✕ {film.collaborator}
          </h4>
          <p className="fb-c__dir" data-handoff-line="credits">Directed by {film.director}</p>
        </div>
      </div>

      <div className="fb-c__bottom">
        <nav
          ref={chaptersRef}
          className="fb-c__chapters"
          aria-label="Choose a film"
          onPointerEnter={previewNearestFilm}
          onPointerMove={previewNearestFilm}
          onPointerLeave={() => { if (previewMode.current === "pointer") hidePreview(); }}
          onKeyDown={(event) => { if (event.key === "Escape") hidePreview(); }}
        >
          {films.map((f, i) => (
            <button
              key={f.id}
              type="button"
              className={i === filmIndex ? "fb-c__ch fb-c__ch--on" : "fb-c__ch"}
              aria-label={`${f.client} ✕ ${f.collaborator}. Directed by ${f.director}. Duration ${clock(f.duration)}`}
              aria-current={i === filmIndex || undefined}
              onFocus={(event) => previewFocusedFilm(event, i)}
              onBlur={() => { if (previewMode.current === "keyboard") hidePreview(); }}
              onClick={() => onJump(i)}
            >
              <span className="fb-c__ch-name">{f.client}</span>
              <span className="fb-c__ch-credit">Directed by {f.director}</span>
              <span className="fb-c__ch-duration">{clock(f.duration)}</span>
            </button>
          ))}
        </nav>
        <div className="fb-c__ctrls">
          <div className="fb-c__seek">
            <span className="fb-c__track" aria-hidden="true">
              <span style={{ transform: `scaleX(${progress})` }} />
            </span>
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progress * 100}
              disabled={!duration}
              aria-label="Playback position"
              aria-valuetext={`${clock(progress * duration)} of ${clock(duration)}`}
              onChange={(event) => onSeek(Number(event.target.value) / 100)}
            />
          </div>
          <div className="fb-c__actions">
            <button type="button" onClick={onPlay} aria-label={playing ? "Pause" : "Play"}>
              <Play playing={playing} />
            </button>
            <button type="button" onClick={onMute} aria-label={muted ? "Turn sound on" : "Turn sound off"}>
              <Sound muted={muted} />
            </button>
          </div>
        </div>
      </div>

      {preview !== null && createPortal(
        <motion.div
          className="fb-c-preview"
          data-open={previewOpen}
          data-keyboard={previewMode.current === "keyboard"}
          style={{ transform }}
          aria-hidden="true"
        >
          <div className="fb-c-preview__image">
            {films.map((f, i) => (
              <Image
                key={f.id}
                src={f.poster}
                alt=""
                fill
                sizes="192px"
                quality={35}
                loading="eager"
                style={{ opacity: i === preview ? 1 : 0 }}
              />
            ))}
          </div>
          <div className="fb-c-preview__duration">
            {clock(films[preview].duration)}
          </div>
        </motion.div>,
        document.body,
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import AdaptiveText from "./AdaptiveText";
import "../styles/film-carousel.css";

const wrap = (index, count) => ((index % count) + count) % count;

function Arrow({ direction }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path d={direction < 0 ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
        fill="none" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Keep a real frame visible before the image decodes, including cached loads.
function FilmPoster({ src, hidden }) {
  const [loaded, setLoaded] = useState(false);
  const captureImage = useCallback((image) => {
    if (image?.complete && image.naturalWidth > 0) setLoaded(true);
  }, []);
  return <Image src={src} alt="" fill sizes="(max-width: 767px) 80vw, 25vw"
    ref={captureImage}
    onLoad={() => setLoaded(true)}
    style={{ opacity: loaded && !hidden ? "var(--reel-media, 1)" : 0 }} />;
}

export default function FilmCarousel({ films, enabled }) {
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [readyCursor, setReadyCursor] = useState(null);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);
  const backdropRef = useRef(null);
  const gesture = useRef(null);
  const swiped = useRef(false);
  const userPaused = useRef(false);
  const activeIndex = wrap(cursor, films.length);
  const film = films[activeIndex];
  const ready = enabled && readyCursor === cursor;

  useEffect(() => {
    const video = videoRef.current;
    const backdrop = backdropRef.current;
    setProgress(0);
    setReadyCursor(null);
    setPlaying(false);
    userPaused.current = false;
    if (!video || !enabled) return;

    const play = () => {
      if (document.hidden || userPaused.current) return;
      video.play().catch(() => {});
      backdrop?.play().catch(() => {});
    };
    const visibility = () => {
      if (document.hidden) {
        video.pause();
        backdrop?.pause();
      } else play();
    };
    play();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      video.pause();
      backdrop?.pause();
    };
  }, [cursor, enabled]);

  const select = (next) => {
    if (next !== cursor) {
      setCursor(next);
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      userPaused.current = false;
      video.play().catch(() => {});
      backdropRef.current?.play().catch(() => {});
    } else {
      userPaused.current = true;
      video.pause();
      backdropRef.current?.pause();
    }
  };

  return (
    <section className="film-carousel" aria-label="Candor films" aria-roledescription="carousel"
      onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        setCursor((value) => value + (event.key === "ArrowLeft" ? -1 : 1));
      }}>
      <div className="film-carousel__backdrop" aria-hidden="true">
        <Image src={film.poster} alt="" fill sizes="100vw" priority style={{ opacity: ready ? 0 : 1 }} />
        <video key={film.id} ref={backdropRef} src={enabled ? film.src : undefined}
          muted loop playsInline crossOrigin="anonymous" preload="none" tabIndex={-1}
          style={{ opacity: ready ? 1 : 0 }} />
      </div>
      <div className="film-carousel__shade" aria-hidden="true" />

      <div className="film-carousel__stage"
        onPointerDown={(event) => {
          swiped.current = false;
          if (event.pointerType === "touch") gesture.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerCancel={() => { gesture.current = null; }}
        onPointerUp={(event) => {
          const start = gesture.current;
          gesture.current = null;
          if (!start) return;
          const dx = event.clientX - start.x;
          if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(event.clientY - start.y) * 1.5) return;
          swiped.current = true;
          setCursor((value) => value + (dx < 0 ? 1 : -1));
        }}
        onClickCapture={(event) => {
          if (!swiped.current) return;
          swiped.current = false;
          event.preventDefault();
          event.stopPropagation();
        }}>
        <div className="film-carousel__content">
          <div className="film-carousel__rail">
            {[-1, 0, 1, 2, 3].map((offset) => {
              const position = cursor + offset;
              const item = films[wrap(position, films.length)];
              const active = offset === 0;
              const depth = Math.max(0, offset);
              const scale = 1 - depth * 0.14;
              // Sum the preceding card widths so the smaller previews keep
              // the same narrow gutter as the active frame.
              const precedingWidths = offset - 0.14 * depth * (depth - 1) / 2;
              return (
                <div key={position} className="film-carousel__item"
                  data-active={active} data-position={offset}
                  aria-hidden={offset < 0 || offset > 2 || undefined}
                  style={{ transform: `translate3d(calc(${precedingWidths} * var(--reel-card-width) + ${offset} * var(--reel-gap)), 0, 0) scale(${scale})` }}>
                  <div className="film-carousel__caption" data-reel-caption={active || undefined}>
                    <AdaptiveText as="h4" data-reel-line="kicker">{`${item.client} ✕ ${item.collaborator}`}</AdaptiveText>
                    <AdaptiveText as="p" data-reel-line="credits">{`Directed by ${item.director}`}</AdaptiveText>
                  </div>
                  <button type="button" className="film-carousel__frame"
                    aria-label={active ? `${playing ? "Pause" : "Play"} ${item.client}` : `Play ${item.client}`}
                    aria-current={active || undefined} tabIndex={active ? 0 : -1}
                    onClick={() => select(position)}>
                    <span className="film-carousel__placeholder" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="24" height="24"><path d="m9 6 9 6-9 6Z" fill="none" stroke="currentColor" strokeWidth="1" /></svg>
                    </span>
                    <FilmPoster key={item.poster} src={item.poster} hidden={active && ready} />
                    {active && <video ref={videoRef} src={enabled ? item.src : undefined}
                      muted loop playsInline crossOrigin="anonymous" preload="metadata" tabIndex={-1} aria-hidden="true"
                      style={{ opacity: ready ? 1 : 0 }}
                      onPlaying={() => { setReadyCursor(cursor); setPlaying(true); }}
                      onPause={() => setPlaying(false)}
                      onTimeUpdate={(event) => {
                        const { currentTime, duration } = event.currentTarget;
                        setProgress(Number.isFinite(duration) && duration > 0 ? currentTime / duration : 0);
                        const backdrop = backdropRef.current;
                        if (backdrop?.readyState >= 1 && Math.abs(backdrop.currentTime - currentTime) > 0.3) {
                          backdrop.currentTime = currentTime;
                        }
                      }} />}
                  </button>
                  {active && <div className="film-carousel__progress" role="progressbar" aria-label="Film playback"
                    aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
                    <span style={{ transform: `scaleX(${progress})` }} />
                  </div>}
                </div>
              );
            })}
          </div>
          <AdaptiveText className="film-carousel__count" aria-hidden="true">{`${String(activeIndex + 1).padStart(2, "0")} / ${String(films.length).padStart(2, "0")}`}</AdaptiveText>
          <div className="film-carousel__arrows">
            <button type="button" aria-label="Previous film" onClick={() => setCursor((value) => value - 1)}>
              <Arrow direction={-1} />
            </button>
            <button type="button" aria-label="Next film" onClick={() => setCursor((value) => value + 1)}>
              <Arrow direction={1} />
            </button>
          </div>
        </div>
      </div>

      <span className="sr-only" aria-live="polite">{film.client}, film {activeIndex + 1} of {films.length}</span>
    </section>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * The player behind /video.
 *
 * One project at a time, full-bleed. Along the bottom edge: the name of the
 * person on screen set in the display face, the house they shot for beside it,
 * the transport, and the playback line running the whole width of the screen
 * beneath all of it — see styles/film-player.css for how any of that stays
 * legible over both a black rail and a white studio.
 *
 * The stage opens on the film's poster and dissolves into the moving image the
 * first time it is played, so arriving on the page is a photograph rather than
 * a black rectangle. After that the <video> holds the stage for good.
 *
 * There is no on-screen project navigation, so ← and → step between the films
 * — the only way to reach the rest of the reel. C opens the credits and M is
 * the sound, neither of which has a label on the frame any more.
 */

const KEY_HINTS = "Space, ← →, M, C, Esc";

/* Icons. All 10px on a common axis so a square, a triangle and a cross can
   share the same marker slot without any of them shifting the label. */
const Square = () => (
  <svg width="4" height="4" viewBox="0 0 4 4" aria-hidden="true">
    <rect width="4" height="4" fill="currentColor" />
  </svg>
);

const PlayIcon = () => (
  <svg width="8" height="9" viewBox="0 0 8 9" aria-hidden="true">
    <path d="M0 0 L8 4.5 L0 9 Z" fill="currentColor" />
  </svg>
);

const PauseIcon = () => (
  <svg width="8" height="9" viewBox="0 0 8 9" aria-hidden="true">
    <rect width="2.5" height="9" fill="currentColor" />
    <rect x="5.5" width="2.5" height="9" fill="currentColor" />
  </svg>
);

export default function FilmPlayer({ films }) {
  const videoRef = useRef(null);
  const trackRef = useRef(null);

  const [filmIndex, setFilmIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  // No switch on the frame any more — M is what turns the sound off and on.
  const [muted, setMuted] = useState(false);
  // Whether the film has ever shown a frame of its own. Until it has, the
  // stage holds the poster and the <video> stays hidden underneath — see the
  // stage markup for why the opening frame is not the poster attribute.
  const [started, setStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [creditsOpen, setCreditsOpen] = useState(false);

  const film = films[filmIndex];

  /* ── Transport ──────────────────────────────────────────────────────────── */

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, []);

  const seekTo = useCallback((clientX) => {
    const el = trackRef.current;
    const v = videoRef.current;
    if (!el || !v || !Number.isFinite(v.duration) || !v.duration) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    v.currentTime = ratio * v.duration;
    setProgress(ratio);
    // Scrubbing counts as starting: a seeked frame is the film, not the poster.
    setStarted(true);
  }, []);

  const nudge = useCallback((seconds) => {
    const v = videoRef.current;
    if (!v || !Number.isFinite(v.duration)) return;
    v.currentTime = Math.min(v.duration, Math.max(0, v.currentTime + seconds));
    setStarted(true);
  }, []);

  const goToFilm = useCallback(
    (delta) => setFilmIndex((i) => (i + delta + films.length) % films.length),
    [films.length]
  );

  /* ── Wiring ─────────────────────────────────────────────────────────────── */

  // New project, clean slate — back to the poster, playhead at zero, transport
  // idle. Changing films swaps the <video> src, so the element has to be told.
  useEffect(() => {
    const v = videoRef.current;
    setProgress(0);
    setStarted(false);
    setCreditsOpen(false);
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  }, [filmIndex]);

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.muted = muted;
  }, [muted]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // The scrubber owns the arrow keys while it has focus, for fine seeking.
      // Only those two, though: it now runs the full width of the screen and
      // takes focus on any click near the bottom edge, and swallowing the rest
      // would leave M — the only sound control on the page — dead until
      // something else was clicked.
      if (
        e.target?.getAttribute?.("role") === "slider" &&
        (e.key === "ArrowLeft" || e.key === "ArrowRight")
      ) {
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          goToFilm(-1);
          break;
        case "ArrowRight":
          e.preventDefault();
          goToFilm(1);
          break;
        case "m":
        case "M":
          setMuted((m) => !m);
          break;
        case "c":
        case "C":
          setCreditsOpen((c) => !c);
          break;
        case "Escape":
          setCreditsOpen(false);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, goToFilm]);

  const percent = Math.round(progress * 100);

  return (
    <div className="film">
      {/* The stage is one big play/pause target — the reason the chrome overlay
          above it is pointer-events: none apart from the controls themselves.
          Deliberately a div and not a button: it is a shortcut for the Play
          control in the row, which is the one that carries the label, the tab
          stop and the keyboard binding. Two tab stops for one action would only
          make the row harder to get through. */}
      <div className="film__stage" onClick={togglePlay}>
        {/* No poster attribute: the opening frame is the <Image> layered over
            this one, so the film can dissolve into the still instead of the
            stage jumping from the poster's proportions to the cut's. */}
        <video
          ref={videoRef}
          className="film__media"
          style={{ opacity: started ? 1 : 0 }}
          src={film.src}
          playsInline
          preload="metadata"
          onPlay={() => {
            setPlaying(true);
            setStarted(true);
          }}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => {
            const { currentTime, duration } = e.currentTarget;
            if (duration) setProgress(currentTime / duration);
          }}
        />

        <Image
          className="film__media"
          style={{ opacity: started ? 0 : 1 }}
          src={film.poster}
          alt={`${film.model} for ${film.client}`}
          fill
          sizes="100vw"
          priority
        />
      </div>

      <div className="film__chrome">
        <div className="film__foot">
          <header className="film-bar">
            {/* The one line in the display face, and the only thing on the
                frame that is a name rather than a label. */}
            <div className="film-cell film-cell--title">
              <span className="film-cell__mark">
                <Square />
              </span>
              <h1 className="film-title">{film.model}</h1>
            </div>

            <div className="film-cell">
              <span className="film-cell__mark">
                <Square />
              </span>
              <span className="film-cell__label">{film.client}</span>
            </div>

            <button type="button" className="film-cell" onClick={togglePlay}>
              <span className="film-cell__mark">
                {playing ? <PauseIcon /> : <PlayIcon />}
              </span>
              <span className="film-cell__label">
                {playing ? "Pause" : "Play"}
              </span>
            </button>

            <span className="film-cell__mark film-tick--end" aria-hidden="true">
              <Square />
            </span>
          </header>

          <aside
            id="film-credits"
            className="film-credits"
            data-open={creditsOpen}
            aria-hidden={!creditsOpen}
          >
            {film.credits.map((credit) => (
              <div className="film-credits__row" key={credit.role}>
                <span className="film-credits__role">{credit.role}</span>
                <span>{credit.name}</span>
              </div>
            ))}
            <div className="film-credits__row">
              <span className="film-credits__role">Keys</span>
              <span>{KEY_HINTS}</span>
            </div>
          </aside>
        </div>

        {/* Not a cell in the row any more: the line runs the full width of the
            screen along the very bottom edge, under everything else. It is
            positioned against the chrome's padding box rather than laid out
            inside it, which is what lets it reach past the page margin to both
            edges of the screen. */}
        <div
          ref={trackRef}
          className="film-scrub"
          role="slider"
          tabIndex={0}
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-valuetext={`${percent}%`}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            seekTo(e.clientX);
          }}
          onPointerMove={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) {
              seekTo(e.clientX);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") nudge(-5);
            else if (e.key === "ArrowRight") nudge(5);
            else return;
            e.preventDefault();
          }}
        >
          <span
            className="film-scrub__fill"
            style={{ "--progress": progress }}
          />
        </div>
      </div>
    </div>
  );
}

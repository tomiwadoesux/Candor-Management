"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * The player behind /video.
 *
 * One project at a time, full-bleed, with the whole of the chrome collected
 * into a single hairline row along the bottom edge — see
 * styles/film-player.css for how those labels stay legible over both a black
 * rail and a white studio.
 *
 * The stage opens on the film's poster and dissolves into the moving image the
 * first time it is played, so arriving on the page is a photograph rather than
 * a black rectangle. After that the <video> holds the stage for good.
 *
 * There is no on-screen project navigation, so ← and → step between the films
 * — the only way to reach the rest of the reel.
 *
 * ── Two placements, one player ───────────────────────────────────────────────
 * `inline` swaps the fixed full-screen stage for a 16:9 block that sits in the
 * page flow, which is what the landing page's showreel section is. Everything
 * else — the row, the blend, the poster dissolve, the credits panel — is the
 * same code in both, so the two can never drift apart.
 *
 * The keyboard is the one thing that cannot be shared. Fullscreen, the page IS
 * the player and it can own the window's keys; inline it is one section among
 * several, and stealing space bar or the arrows from someone scrolling the
 * landing page would be wrong. So the shortcuts bind to the window only when
 * the player owns the screen.
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

const SoundIcon = ({ muted }) => (
  <svg width="11" height="9" viewBox="0 0 11 9" aria-hidden="true">
    <path d="M0 3 H2 L5 0.5 V8.5 L2 6 H0 Z" fill="currentColor" />
    {muted ? (
      <path
        d="M7 3 L10 6 M10 3 L7 6"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
    ) : (
      <path
        d="M7 2.6 A3.2 3.2 0 0 1 7 6.4"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
    )}
  </svg>
);

const CloseIcon = () => (
  <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
    <path
      d="M0 0 L8 8 M8 0 L0 8"
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
    />
  </svg>
);

/* Inline, this takes Close's slot: the same 10px axis, opening right. */
const NextIcon = () => (
  <svg width="9" height="8" viewBox="0 0 9 8" aria-hidden="true">
    <path
      d="M0 4 H7.5 M4.5 1 L7.5 4 L4.5 7"
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
    />
  </svg>
);

export default function FilmPlayer({ films, exitHref = "/", inline = false }) {
  const videoRef = useRef(null);
  const trackRef = useRef(null);

  const [filmIndex, setFilmIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  // Opens with sound on, so the label reads "Mute" — the word on a control is
  // always what pressing it will do, never what the state currently is.
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
    // Inline, the player is a section on someone else's page — it does not get
    // to answer for the space bar or the arrow keys.
    if (inline) return;

    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // The scrubber owns its own arrows (fine seeking); let it have them.
      if (e.target?.getAttribute?.("role") === "slider") return;

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
  }, [togglePlay, goToFilm, inline]);

  const percent = Math.round(progress * 100);

  return (
    <div className="film" data-inline={inline || undefined}>
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
          alt={`${film.client} ✕ ${film.collaborator}`}
          fill
          sizes="100vw"
          priority
        />
      </div>

      <div className="film__chrome">
        <div className="film__foot">
          <header className="film-bar">
            <div className="film-cell film-cell--title">
              <span className="film-cell__mark">
                <Square />
              </span>
              <div>
                <h1 className="film-title">
                  {film.client}
                  <span className="film-title__x">✕</span>
                  {film.collaborator}
                </h1>
                <p className="film-meta">Director: {film.director}</p>
                <p className="film-meta">{film.disciplines}</p>
              </div>
            </div>

            <button
              type="button"
              className="film-cell"
              onClick={() => setCreditsOpen((c) => !c)}
              aria-expanded={creditsOpen}
              aria-controls="film-credits"
            >
              <span className="film-cell__mark">
                <Square />
              </span>
              <span className="film-cell__label">Credits</span>
            </button>

            <div className="film-cell film-cell--scrub">
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

            <button type="button" className="film-cell" onClick={togglePlay}>
              <span className="film-cell__mark">
                {playing ? <PauseIcon /> : <PlayIcon />}
              </span>
              <span className="film-cell__label">
                {playing ? "Pause" : "Play"}
              </span>
            </button>

            <button
              type="button"
              className="film-cell"
              onClick={() => setMuted((m) => !m)}
            >
              <span className="film-cell__mark">
                <SoundIcon muted={muted} />
              </span>
              <span className="film-cell__label">
                {muted ? "Unmute" : "Mute"}
              </span>
            </button>

            {/* Nothing to close out of when the player is a section — inline
                the last cell is the reel's own step to the next film. */}
            {inline ? (
              <button
                type="button"
                className="film-cell"
                onClick={() => goToFilm(1)}
              >
                <span className="film-cell__mark">
                  <NextIcon />
                </span>
                <span className="film-cell__label">Next</span>
              </button>
            ) : (
              <a className="film-cell" href={exitHref}>
                <span className="film-cell__mark">
                  <CloseIcon />
                </span>
                <span className="film-cell__label">Close</span>
              </a>
            )}

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
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * The player behind /video.
 *
 * One project at a time, full-bleed. Along the bottom edge: the name of the
 * person on screen set in the display face, the house they shot for beside it,
 * and the playback line running the whole width of the screen beneath both —
 * see styles/film-player.css for how any of that stays legible over both a
 * black rail and a white studio.
 *
 * There is no transport on the frame. The stage itself is the play/pause
 * target and Space does the same from the keyboard, so the only control with a
 * label is the credits toggle in the top right — a word and a box that takes
 * the mark when the panel is open.
 *
 * The stage opens on the film's poster and dissolves into the moving image the
 * first time it is played, so arriving on the page is a photograph rather than
 * a black rectangle. After that the <video> holds the stage for good.
 *
 * There is no on-screen project navigation, so ← and → step between the films
 * — the only way to reach the rest of the reel. C opens the credits, the same
 * as the toggle, and M is the sound, which has no label on the frame.
 */

const KEY_HINTS = "Space, ← →, M, C, Esc";

/* The one mark in the set. It opens every label in the row on its column line
   and it is also what drops into the credits box when the panel is open, so
   the toggle reads in the same vocabulary as everything else on the frame. */
const Square = () => (
  <svg width="4" height="4" viewBox="0 0 4 4" aria-hidden="true">
    <rect width="4" height="4" fill="currentColor" />
  </svg>
);

export default function FilmPlayer({ films }) {
  const videoRef = useRef(null);
  const trackRef = useRef(null);

  const [filmIndex, setFilmIndex] = useState(0);
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
      {/* The stage is the play/pause target — the reason the chrome overlay
          above it is pointer-events: none apart from the controls themselves.
          Deliberately a div and not a button: Space is the keyboard binding for
          the same action and the frame is not a tab stop, so the row stays two
          stops deep — the credits toggle and the scrubber. */}
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
          onPlay={() => setStarted(true)}
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
        {/* The top band. The only labelled control on the frame lives here,
            pushed to the right margin, with the panel hanging off it. */}
        <div className="film__head">
          <button
            type="button"
            className="film-cell film-cell--credits"
            aria-expanded={creditsOpen}
            aria-controls="film-credits"
            onClick={() => setCreditsOpen((c) => !c)}
          >
            <span className="film-cell__label">Credits</span>
            {/* A box the size of the marker slot, drawn in brackets and empty
                until the panel opens, when the same 4px square every label
                hangs off drops into it. */}
            <span className="film-box" data-open={creditsOpen} aria-hidden="true">
              <span className="film-box__mark">
                <Square />
              </span>
            </span>
          </button>

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

            <span className="film-cell__mark film-tick--end" aria-hidden="true">
              <Square />
            </span>
          </header>
        </div>

        {/* Not a cell in the row: the line runs the full width of the screen
            along the very bottom edge, under everything else. It is positioned
            against the chrome's padding box rather than laid out inside it,
            and pulled back out of that padding by the same amount on three
            sides — which is what lets it reach the actual edges of the screen
            rather than stopping on the page margin the labels honour. */}
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

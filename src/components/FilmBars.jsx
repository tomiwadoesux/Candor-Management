"use client";

import "../styles/film-bars.css";

/**
 * The inline showreel's control bar, swapped in for the original hairline row
 * by FilmPlayer's `bar` prop (the fullscreen /video player keeps the row).
 * The title is set large, and a chapter strip — one segment per film — doubles
 * as the scrubber for the current cut and the navigation for the rest.
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
  film, films, filmIndex, playing, muted, progress, duration,
  creditsOpen, onPlay, onMute, onCredits, onJump, scrubProps,
}) {
  return (
    <div className="fb fb-c">
      <div className="fb-c__top">
        <div className="fb-c__lede" key={film.id}>
          <p className="fb-c__kicker">
            {pad(filmIndex + 1)} — {film.disciplines}
          </p>
          <h3 className="fb-c__title">
            {film.client}
            <span>✕</span>
            {film.collaborator}
          </h3>
          <p className="fb-c__dir">Directed by {film.director}</p>
        </div>

        <div className="fb-c__ctrls">
          <span className="fb-c__time">
            {clock(progress * duration)} / {clock(duration)}
          </span>
          <button type="button" onClick={onPlay}>
            <Play playing={playing} /> {playing ? "Pause" : "Play"}
          </button>
          <button type="button" onClick={onMute}>
            <Sound muted={muted} /> {muted ? "Sound off" : "Sound on"}
          </button>
          <button
            type="button"
            onClick={onCredits}
            aria-expanded={creditsOpen}
            aria-controls="film-credits"
          >
            {creditsOpen ? "Hide credits" : "Credits"}
          </button>
        </div>
      </div>

      <div className="fb-c__chapters">
        {films.map((f, i) =>
          i === filmIndex ? (
            <div key={f.id} className="fb-c__ch fb-c__ch--on" {...scrubProps}>
              <span className="fb-c__bar">
                <span style={{ "--p": progress }} />
              </span>
              <span className="fb-c__label">
                {pad(i + 1)} {f.client}
              </span>
            </div>
          ) : (
            <button
              key={f.id}
              type="button"
              className="fb-c__ch"
              onClick={() => onJump(i)}
            >
              <span className="fb-c__bar">
                <span style={{ "--p": i < filmIndex ? 1 : 0 }} />
              </span>
              <span className="fb-c__label">
                {pad(i + 1)} {f.client}
              </span>
            </button>
          )
        )}
      </div>
    </div>
  );
}

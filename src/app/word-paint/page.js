import WordPaint, { FACES, PORTRAIT } from "../about-new/wordPaint/WordPaint";
import "./word-paint.css";

export const metadata = {
  title: "Word paint — Candor",
  robots: { index: false },
};

// /word-paint — the Darkroom word (see about-new/wordPaint) in its two photo
// modes, set in different faces, cases and lengths. A study page; delete
// when the treatment is settled.

const photo = (src) => `/_next/image?url=${encodeURIComponent(src)}&w=1920&q=70`;

const ROWS = [
  {
    title: "One portrait across the word",
    note: "The letters are windows onto a single photograph, so a stroke reveals a continuous image. This is what /about-new uses.",
    face: "wl-arno",
    words: [
      ["JOIN", PORTRAIT],
      ["JOIN", [photo("/photos/img14.jpeg")]],
      ["JOIN", [photo("/photos/img33.jpeg")]],
    ],
  },
  {
    title: "One face per letter",
    note: "Four faces dealt across the letters, each cropped to its own.",
    face: "wl-arno",
    words: [["JOIN", FACES]],
  },
  {
    title: "Wordmark, lowercase",
    note: "Inter, as the site's logotype.",
    face: "wl-sans",
    words: [
      ["candor", PORTRAIT],
      ["candor", FACES],
    ],
  },
  {
    title: "Sans caps, a board name",
    note: "Heavier strokes give the photograph the most room.",
    face: "wl-sans-caps",
    words: [
      ["MODELS", PORTRAIT],
      ["TALENTS", [photo("/photos/img14.jpeg")]],
      ["CREATIVES", FACES],
    ],
  },
  {
    title: "A line, not a word",
    note: "Smaller type: the hairline stays one pixel; the torch is the same size, so it covers more letters.",
    face: "wl-arno",
    words: [
      ["A different point of view.", PORTRAIT],
      ["Nothing to pay.", FACES],
    ],
  },
];

export default function WordPaintLab() {
  return (
    <div className="wl">
      <header className="wl-head">
        <h1>Word paint — Darkroom</h1>
        <p>
          The letters are windows onto a photograph; the pointer is the light. Move across any line to
          develop it.
        </p>
      </header>
      {ROWS.map((row) => (
        <section key={row.title} className="wl-row">
          <div className="wl-row-head">
            <h2>{row.title}</h2>
            <p>{row.note}</p>
          </div>
          {row.words.map(([word, faces], i) => (
            <WordPaint
              key={`${word}-${i}`}
              word={word}
              faces={faces}
              className={`wl-item ${row.face}`}
              wordClassName="wl-word"
              fitClassName="wl-fit"
            />
          ))}
        </section>
      ))}
    </div>
  );
}

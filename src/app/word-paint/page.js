import WordPaint, { FACES, PORTRAIT } from "../about-new/wordPaint/WordPaint";
import GroundSwitch from "./GroundSwitch";
import "./word-paint.css";

export const metadata = {
  title: "Word paint — Candor",
  robots: { index: false },
};

// /word-paint — "Join Candor" under each of wordPaintGL's looks. Every look
// runs the same paint sim and the same field; only the compositing differs,
// so they all weigh the same. Each row sets it twice: serif on one line with
// a portrait across both words, sans caps on two lines with a face per
// letter. A study page; delete when the treatment is settled.

const ROWS = [
  {
    look: "spectrum",
    title: "Spectrum",
    note: "The current one, after Lusion's AWARD title, kept quiet. It takes the page's ground (try the switch, bottom left): light on dark, ink on light. A faint hairline edge lit like a real one: the pointer is the light (a key light up-left when it's away), so the edges facing it catch a soft highlight and the far sides a dim coloured bounce, and a slow glint crosses the word now and then. The stroke leaves a muted tint from a looping spectrum, with the photograph faint inside it.",
  },
  {
    look: "darkroom",
    title: "Darkroom",
    note: "The print comes up as in the developer tray: shadows first, then mids, colour last; it sinks back to the latent as the light fades.",
  },
  {
    look: "wet",
    title: "Wet",
    note: "The stroke is developer poured on the paper. It has an edge — a meniscus that catches the light — and the print is up only inside it, seen through a skin of liquid that bends it.",
  },
  {
    look: "ripple",
    title: "Ripple",
    note: "The photograph is already there, under water. The pointer disturbs the surface: the image wobbles where the stroke falls off and rings of light run out across it, then it settles.",
  },
  {
    look: "grain",
    title: "Grain",
    note: "Silver. The print comes up grain by grain, each flipping from dark to its tone in its own time; the fresh stroke sparkles with grains that haven't settled.",
  },
  {
    look: "chrome",
    title: "Chrome",
    note: "The letters are cast, not printed. Each edge has a bevel the torch lights from the way it travels, so a sweep rolls a highlight along the edges; the photograph shows only as a reflection.",
  },
  {
    look: "smear",
    title: "Smear",
    note: "The print is wet and the pointer drags it: the image streaks along the stroke, the channels pull apart, and it stills again as the velocity dies.",
  },
  {
    look: "negative",
    title: "Negative",
    note: "The whole word is already there as a film negative, dim with the orange mask, and the torch turns it positive where it passes.",
  },
];

export default function WordPaintLab() {
  return (
    <div className="wl">
      <GroundSwitch />
      <header className="wl-head">
        <h1>Word paint — eight looks</h1>
        <p>
          The letters are windows onto a photograph; the pointer is the light. Move across any line.
          Same sim and same cost under every row; only what the light does to the picture changes.
        </p>
      </header>
      {ROWS.map((row) => (
        <section key={row.look} className="wl-row" id={row.look}>
          <div className="wl-row-head">
            <h2>{row.title}</h2>
            <p>{row.note}</p>
          </div>
          <WordPaint
            word="Join Candor"
            faces={PORTRAIT}
            look={row.look}
            className="wl-item wl-arno"
            wordClassName="wl-word"
            fitClassName="wl-fit"
          />
          <WordPaint
            word={"JOIN\nCANDOR"}
            faces={FACES}
            look={row.look}
            className="wl-item wl-sans-caps wl-two"
            wordClassName="wl-word"
            fitClassName="wl-fit"
          />
        </section>
      ))}
    </div>
  );
}

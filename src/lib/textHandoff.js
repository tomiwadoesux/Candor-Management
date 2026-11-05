const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const smooth = (value) => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// Lines leave one after another, bottom first, and all land by p = 1.
export const HANDOFF_STAGGER = 0.06;

// One line's share of the flight, delayed by its place in the stack: straight,
// for the scramble, and eased, for where the line is.
export function lineProgress(p, order = 0, stagger = HANDOFF_STAGGER, lines = 3) {
  return clamp((p - order * stagger) / (1 - (lines - 1) * stagger), 0, 1);
}

export function lineFlight(p, order = 0, stagger = HANDOFF_STAGGER, lines = 3) {
  return smooth(lineProgress(p, order, stagger, lines));
}

// Where a line starts at flight e. It hangs off an anchor that slides from the
// source's alignment point to the destination's (the middle of a centred line,
// the left edge of a left-aligned one), and is as wide as somewhere between
// the old text and the new. Not its live width: that jumps every time a
// scrambled letter drops off the end, and the line would twitch with it.
// `width` is each line box's, `text` the width of the words inside it.
export function placeLine(from, to, e) {
  const anchor = lerp(from.anchor, to.anchor, e);
  const x = lerp(from.left + from.anchor * from.width, to.left + to.anchor * to.width, e);
  return { x: x - anchor * lerp(from.text, to.text, e), y: lerp(from.top, to.top, e) };
}

// How much of the arriving copy is showing at flight e. The departing one
// keeps Selena's letter colours and the arriving one is the film's blended
// white, and they trade through the middle of the flight.
export function arrival(e) {
  return smooth((e - 0.3) / 0.4);
}

// The glyphs a letter re-rolls through, in the case it is settling into.
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+/<>";
const LOWER = "abcdefghijklmnopqrstuvwxyz0123456789#%&*+/<>";
// How long each letter spends scrambling, as a share of the scramble, and how
// many times it re-rolls over the whole of it.
const TURN = 0.3;
const ROLLS = 40;

// A small integer hash, so the scramble is a function of where the page is:
// it plays back the same in both directions and holds still when the scroll
// does.
const hash = (a, b) => {
  let h = Math.imul(a + 1, 374761393) ^ Math.imul(b + 1, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

// One line's text at scramble t: `from` at 0, `to` at 1. Letters take their
// turn roughly left to right, re-rolling through random glyphs before they
// settle, and a space in the new text opens as soon as its turn comes, so the
// new words take shape through the noise.
//
// Where one text is longer, the extra letters have nothing on the other side.
// Those blanks are held open as spaces until everything after them has gone
// too, so no letter ever slides along the line to close a gap.
export function scramble(from, to, t) {
  if (t <= 0) return from;
  if (t >= 1) return to;
  const n = Math.max(from.length, to.length);
  const roll = Math.floor(t * ROLLS);
  const out = [];
  for (let i = 0; i < n; i++) {
    const was = from[i] ?? "";
    const will = to[i] ?? "";
    const place = n > 1 ? i / (n - 1) : 0;
    const start = (1 - TURN) * (0.7 * place + 0.3 * hash(i, 0));
    if (t <= start) out.push(was);
    else if (t >= start + TURN || will === " ") out.push(will);
    else {
      const set = /\p{Ll}/u.test(will || was) ? LOWER : UPPER;
      out.push(set[Math.floor(hash(i, roll + 1) * set.length)]);
    }
  }
  while (out.length && out[out.length - 1] === "") out.pop();
  return out.map((ch) => ch || " ").join("");
}

// Only MODEL PORTFOLIO changes glyphs. The old and new credit trade places
// during the flight without ever mixing into a long scrambled sentence.
export function handoffFrame(from, to, p, scrambleLine = false) {
  const side = p < 0.5 ? "from" : "to";
  if (scrambleLine) return { side, text: scramble(from, to, p), opacity: 1 };
  return side === "from"
    ? { side, text: from, opacity: 1 - smooth((p - 0.25) / 0.25) }
    : { side, text: to, opacity: smooth((p - 0.5) / 0.25) };
}

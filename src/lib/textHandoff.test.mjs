import assert from "node:assert/strict";
import test from "node:test";
import { arrival, handoffFrame, lineFlight, lineProgress, placeLine, scramble } from "./textHandoff.js";

test("every line lands by the end, the first one first", () => {
  assert.equal(lineFlight(1, 0), 1);
  assert.equal(lineFlight(1, 2), 1);
  assert.equal(lineFlight(0, 0), 0);
  assert.ok(lineFlight(0.4, 0) > lineFlight(0.4, 2));
  assert.equal(lineProgress(0.06, 1), 0, "The second line waits one stagger");
});

test("a centred line leaves from its middle and lands on a left edge", () => {
  // The source box is wider than its words, which sit in its middle.
  const from = { left: 800, top: 96, width: 300, text: 200, anchor: 0.5 };
  const to = { left: 40, top: 700, width: 600, text: 420, anchor: 0 };
  assert.deepEqual(placeLine(from, to, 0), { x: 850, y: 96 });
  assert.deepEqual(placeLine(from, to, 1), { x: 40, y: 700 });
  const mid = placeLine(from, to, 0.5);
  assert.equal(mid.x, (950 + 40) / 2 - 0.25 * 310);
});

test("the arriving copy takes over through the middle of the flight", () => {
  assert.equal(arrival(0), 0);
  assert.equal(arrival(0.3), 0);
  assert.equal(arrival(0.5), 0.5);
  assert.equal(arrival(1), 1);
});

test("a scramble starts on one text and settles on the other", () => {
  const from = "SELENA FORREST";
  const to = "MAISON ORÍ ✕ NKEM";
  assert.equal(scramble(from, to, 0), from);
  assert.equal(scramble(from, to, 1), to);
  assert.equal(scramble(from, to, 0.9999), to, "Every letter has settled by the end");
  const mid = scramble(from, to, 0.5);
  assert.notEqual(mid, from);
  assert.notEqual(mid, to);
  assert.ok(mid.length <= to.length);
});

test("a scramble is the same every time it is read at the same point", () => {
  const a = scramble("MODEL PORTFOLIO", "01 — Video, Stills", 0.42);
  assert.equal(scramble("MODEL PORTFOLIO", "01 — Video, Stills", 0.42), a);
});

test("a line that shrinks never slides its letters along to close a gap", () => {
  const from = "photographed by Drew Vickers || hair by Shiori Takahashi";
  const to = "Directed by Marguerite Oduya";
  assert.equal(scramble(from, to, 1), to);
  for (let t = 0.05; t < 1; t += 0.05) {
    const mid = scramble(from, to, t);
    // Wherever a letter of the old text is still showing, it is in its own place.
    for (let i = 0; i < mid.length; i++) {
      if (i >= to.length && mid[i] !== " " && from[i] === mid[i]) assert.equal(mid[i], from[i]);
    }
    assert.ok(mid.length <= from.length);
    assert.notEqual(mid.at(-1), " ", "No trailing blanks");
  }
});

test("unchanged name and credit lines fade without overlapping", () => {
  for (let step = 0; step <= 100; step++) {
    const frames = ["Name", "Credits"].map(text => handoffFrame(text, `New ${text}`, step / 100));
    const visibleSides = new Set(frames.filter(frame => frame.opacity > 0 && frame.text).map(frame => frame.side));
    assert.ok(visibleSides.size <= 1, "Old and new type must never overlap, even across staggered lines");
  }
});

test("MODEL PORTFOLIO is the line that scrambles into the film heading", () => {
  const from = "MODEL PORTFOLIO";
  const to = "MAISON ORÍ ✕ NKEM";
  assert.equal(handoffFrame(from, to, 0, true).text, from);
  assert.equal(handoffFrame(from, to, 1, true).text, to);
  const mid = handoffFrame(from, to, 0.5, true);
  assert.notEqual(mid.text, from);
  assert.notEqual(mid.text, to);
  assert.equal(mid.opacity, 1);
  assert.ok(mid.text.length <= Math.max(from.length, to.length));
});

test("the shorter director line never inherits the long source credits", () => {
  const from = "photographed by Drew Vickers || hair by Shiori Takahashi || makeup by Laura Dominique";
  const to = "Directed by Marguerite Oduya";
  assert.deepEqual(handoffFrame(from, to, 0), { side: "from", text: from, opacity: 1 });
  assert.deepEqual(handoffFrame(from, to, 1), { side: "to", text: to, opacity: 1 });
  for (let step = 1; step < 100; step++) {
    const frame = handoffFrame(from, to, step / 100);
    if (frame.side === "from") assert.equal(frame.text, from);
    else assert.equal(frame.text, to, "The director credit never scrambles");
    assert.deepEqual(handoffFrame(from, to, step / 100), frame, "Reverse scrolling returns the same frame");
  }
});

import assert from "node:assert/strict";
import test from "node:test";
import { REEL_CHROME, REEL_HANDOFF, REEL_TIMELINE as T, advanceHandoff, eased, lerpRect, phase, reelProgress } from "./lookReel.js";

test("progress is 0 until the stage pins and 1 once the scene has played", () => {
  // A 2500px scene on a 1000px screen has 1500px of travel.
  assert.equal(reelProgress(400, 2500, 1000), 0);
  assert.equal(reelProgress(0, 2500, 1000), 0);
  assert.equal(reelProgress(-750, 2500, 1000), 0.5);
  assert.equal(reelProgress(-1500, 2500, 1000), 1);
  assert.equal(reelProgress(-2000, 2500, 1000), 1);
});

test("a part's window holds at both ends and eases through the middle", () => {
  assert.equal(phase(0.1, [0.25, 0.75]), 0);
  assert.equal(phase(0.5, [0.25, 0.75]), 0.5);
  assert.equal(phase(0.9, [0.25, 0.75]), 1);
  assert.equal(eased(0.5, [0.25, 0.75]), 0.5);
  assert.ok(eased(0.3, [0.25, 0.75]) < phase(0.3, [0.25, 0.75]), "Slow out of the start");
});

test("the film only takes over once the photo fills the frame", () => {
  assert.ok(REEL_HANDOFF.trigger >= T.grow[1]);
  assert.equal(eased(REEL_HANDOFF.trigger, T.grow), 1);
});

test("the text lands on a film that is already showing", () => {
  assert.equal(eased(1, REEL_CHROME.film), 1);
  assert.ok(REEL_CHROME.ctrls[0] > REEL_CHROME.film[1]);
});

test("the original text holds only until the portrait is ready", () => {
  let state = null;
  for (const p of [0, 0.1, 0.3, 0.5, REEL_HANDOFF.trigger - 0.001]) {
    state = advanceHandoff(state, p, p * 1000);
    assert.equal(state.value, 0);
    assert.equal(state.running, false);
  }
});

test("the earlier downward change finishes even when scrolling stops", () => {
  let state = advanceHandoff(null, 0, 0);
  state = advanceHandoff(state, REEL_HANDOFF.trigger, 100);
  assert.equal(state.value, 0);
  assert.equal(state.running, true);
  state = advanceHandoff(state, REEL_HANDOFF.trigger, 100 + REEL_HANDOFF.duration / 2);
  assert.equal(state.value, 0.5);
  state = advanceHandoff(state, REEL_HANDOFF.trigger, 100 + REEL_HANDOFF.duration);
  assert.equal(state.value, 1);
  assert.equal(state.running, false);
});

test("scrolling back up unwinds gradually and holds when stationary", () => {
  let state = advanceHandoff(null, 0.98, 0);
  state = advanceHandoff(state, (0.98 + REEL_HANDOFF.reverseEnd) / 2, 10);
  assert.ok(Math.abs(state.value - 0.5) < 1e-10);
  assert.equal(state.running, false);
  const held = advanceHandoff(state, (0.98 + REEL_HANDOFF.reverseEnd) / 2, 1000);
  assert.equal(held.value, state.value);
  state = advanceHandoff(held, REEL_HANDOFF.reverseEnd, 1010);
  assert.equal(state.value, 0);
});

test("reversing halfway through the quick change does not jump", () => {
  let state = advanceHandoff(null, 0, 0);
  state = advanceHandoff(state, REEL_HANDOFF.trigger, 100);
  state = advanceHandoff(state, REEL_HANDOFF.trigger, 100 + REEL_HANDOFF.duration / 2);
  const half = state.value;
  state = advanceHandoff(state, REEL_HANDOFF.trigger - 0.001, 230);
  assert.ok(state.value < half && state.value > half - 0.01);
  assert.equal(state.running, false);
  const interrupted = state.value;
  state = advanceHandoff(state, REEL_HANDOFF.trigger, 240);
  assert.equal(state.value, interrupted);
  state = advanceHandoff(state, REEL_HANDOFF.trigger, 240 + REEL_HANDOFF.duration);
  assert.equal(state.value, 1);
});

test("loading or jumping past the section shows a settled frame", () => {
  assert.equal(advanceHandoff(null, 0.98, 0).value, 1);
  assert.equal(advanceHandoff(advanceHandoff(null, 0, 0), 1, 10).value, 1);
});

test("every part is done before the scene releases", () => {
  for (const [name, [start, end]] of Object.entries(T)) {
    assert.ok(start >= 0 && start < end && end < 1, name);
  }
});

test("a rect opens out from one box to the other", () => {
  const half = { left: 0, top: 0, width: 960, height: 900 };
  const full = { left: 0, top: 0, width: 1920, height: 900 };
  assert.deepEqual(lerpRect(half, full, 0), half);
  assert.deepEqual(lerpRect(half, full, 1), full);
  assert.equal(lerpRect(half, full, 0.5).width, 1440);
});


test("placeholder frames are visible before the text arrives", () => {
  assert.ok(T.preview[0] < T.grow[1]);
  assert.ok(T.preview[1] < REEL_HANDOFF.trigger);
  assert.ok(REEL_HANDOFF.trigger <= 0.65);
});

import assert from "node:assert/strict";
import test from "node:test";
import { heatTransition } from "./heatTransition.js";

test("the boxes persist past their midpoint and fade near the top", () => {
  assert.equal(heatTransition(800, 720).opacity, 1);
  assert.equal(heatTransition(720, 720).active, false);
  assert.ok(heatTransition(360, 720).opacity > 0.35);
  assert.equal(heatTransition(720 * 0.12, 720).opacity, 0);
  assert.equal(heatTransition(-400, 720).active, false);
  const forward = [720, 540, 360, 180, 50].map(edge => heatTransition(edge, 720).opacity);
  const reverse = [50, 180, 360, 540, 720].map(edge => heatTransition(edge, 720).opacity);
  assert.deepEqual(forward, reverse.reverse());
});

test("the boxes hold at full strength through the first 30% of Selena's rise", () => {
  assert.equal(heatTransition(720 * 0.75, 720).opacity, 1);
  assert.equal(heatTransition(720 * 0.7, 720).opacity, 1);
  assert.ok(heatTransition(720 * 0.6, 720).opacity < 1);
  assert.equal(heatTransition(720 * 0.75, 720).active, true, "The shimmer still starts as Selena enters");
});

test("the narrow band stays attached to Selena at every viewport size", () => {
  for (const height of [320, 600, 844, 900, 1200, 2400]) {
    for (const edge of [height, height * 0.7, height * 0.3, 0, -80]) {
      const state = heatTransition(edge, height);
      assert.ok(Math.abs(state.top + state.height - edge) < 0.000001);
      assert.equal(state.lift, 0);
      assert.ok(state.height >= 72 && state.height <= 112);
      assert.ok(state.strength >= 0 && state.strength <= 1);
    }
  }
});

test("refraction outlives the card fade and stops when the edge leaves", () => {
  const afterFade = heatTransition(100, 900);
  assert.equal(afterFade.opacity, 0);
  assert.equal(afterFade.active, true, "Other content still refracts after the boxes disappear");
  for (const edge of [900, 901, 0, -1, -100]) {
    const state = heatTransition(edge, 900);
    assert.equal(state.active, false);
    assert.equal(state.strength, 0);
  }
});

test("subpixel scrolling and the final fade of refraction have no jump", () => {
  const a = heatTransition(600, 900);
  const b = heatTransition(599.9, 900);
  assert.ok(Math.abs(b.opacity - a.opacity) < 0.001);
  assert.ok(b.opacity < a.opacity);
  assert.ok(heatTransition(1, 900).strength < 0.001);
  assert.ok(heatTransition(899, 900).strength < 0.001);
  const strength = [0, 1, 12, 36, 72, 108].map(edge => heatTransition(edge, 900).strength);
  assert.deepEqual([...strength].sort((a, b) => a - b), strength);
});

test("reversing scroll retraces the same band and fade without state", () => {
  const edges = [900, 899.9, 800, 600, 360, 120, 60, 1, 0, -20];
  const forward = edges.map(edge => heatTransition(edge, 900));
  const reverse = [...edges].reverse().map(edge => heatTransition(edge, 900));
  assert.deepEqual(forward, reverse.reverse());
});

test("reduced motion keeps the slower fade and never runs the shimmer", () => {
  for (let edge = 900; edge > -100; edge -= 20) {
    const normal = heatTransition(edge, 844);
    const reduced = heatTransition(edge, 844, true);
    assert.equal(reduced.opacity, normal.opacity);
    assert.equal(reduced.active, false);
  }
});


test("portraits progressively lose colour and become monochrome while still visible", () => {
  const vh = 900;
  assert.equal(heatTransition(vh + 100, vh).grayscale, 0);
  assert.equal(heatTransition(vh, vh).grayscale, 0);
  const halfway = heatTransition(vh * 0.75, vh);
  assert.equal(halfway.grayscale, 0.5);
  assert.equal(halfway.opacity, 1);
  const monochrome = heatTransition(vh * 0.5, vh);
  assert.equal(monochrome.grayscale, 1);
  assert.ok(monochrome.opacity > 0.7);
  for (let edge = vh; edge >= -100; edge -= 20) {
    const current = heatTransition(edge, vh);
    assert.ok(current.grayscale >= 0 && current.grayscale <= 1);
    assert.ok(current.grayscale >= heatTransition(edge + 20, vh).grayscale);
    assert.equal(current.grayscale, heatTransition(edge, vh, true).grayscale);
  }
});

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

test("the band is raised above Selena and refraction outlives the box fade", () => {
  const state = heatTransition(600, 900);
  assert.equal(state.top + state.height, 600 - state.lift);
  assert.ok(state.lift >= 24 && state.lift <= 44);
  assert.ok(state.height <= 300);
  const afterFade = heatTransition(100, 900);
  assert.equal(afterFade.opacity, 0);
  assert.equal(afterFade.active, true, "Other content still refracts after the boxes disappear");
  assert.equal(heatTransition(afterFade.lift, 900).active, false);
});

test("subpixel scrolling and the final fade of refraction have no jump", () => {
  const a = heatTransition(600, 900);
  const b = heatTransition(599.9, 900);
  assert.ok(Math.abs(b.opacity - a.opacity) < 0.001);
  assert.ok(b.opacity < a.opacity);
  assert.ok(heatTransition(a.lift + 1, 900).strength < 0.001);
});

test("reduced motion keeps the slower fade and never runs the shimmer", () => {
  for (let edge = 900; edge > -100; edge -= 20) {
    const normal = heatTransition(edge, 844);
    const reduced = heatTransition(edge, 844, true);
    assert.equal(reduced.opacity, normal.opacity);
    assert.equal(reduced.active, false);
  }
});

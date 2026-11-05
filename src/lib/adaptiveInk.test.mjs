import assert from "node:assert/strict";
import test from "node:test";
import { comparePaintOrder, composite, inkForLuminance, luminance, mediaPoint } from "./adaptiveInk.js";

test("ink is pure black or white and accounts for saturated backgrounds", () => {
  for (const [rgb, ink] of [
    [[255, 255, 255], "#000000"], [[0, 0, 0], "#ffffff"],
    [[0, 0, 255], "#ffffff"], [[255, 255, 0], "#000000"],
    [[80, 80, 80], "#ffffff"], [[180, 180, 180], "#000000"],
  ]) assert.equal(inkForLuminance(luminance(rgb)), ink);
});

test("a light veil changes the ink decision over dark footage", () => {
  const dark = [20, 25, 30];
  assert.equal(inkForLuminance(luminance(dark)), "#ffffff");
  const softened = composite([250, 250, 250, 0.5], dark);
  assert.equal(inkForLuminance(luminance(softened)), "#000000");
});

test("near-equal contrast holds the previous ink without sticking on a new scene", () => {
  assert.equal(inkForLuminance(0.179, "#ffffff"), "#ffffff");
  assert.equal(inkForLuminance(0.179, "#000000"), "#000000");
  assert.equal(inkForLuminance(0.5, "#ffffff"), "#000000");
  assert.equal(inkForLuminance(0.01, "#000000"), "#ffffff");
});

test("image sampling follows cover crop, object position and letterboxing", () => {
  const box = { left: 0, top: 0, width: 200, height: 100 };
  assert.deepEqual(mediaPoint(100, 50, box, 100, 200, "cover"), [0.5, 0.5]);
  assert.deepEqual(mediaPoint(100, 50, box, 100, 200, "cover", [0.5, 0]), [0.5, 0.125]);
  assert.equal(mediaPoint(10, 50, box, 100, 200, "contain"), null);
  assert.deepEqual(mediaPoint(100, 50, box, 100, 200, "contain"), [0.5, 0.5]);
});

test("nested z-index stays inside its parent context", () => {
  assert.ok(comparePaintOrder([10, 5, 999, 6], [40, 2]) < 0);
  assert.ok(comparePaintOrder([10, 5], [10, 5, 0, 6]) < 0);
  assert.ok(comparePaintOrder([10, 5, 0, 9], [10, 5, 0, 6]) > 0);
});

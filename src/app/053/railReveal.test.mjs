import assert from "node:assert/strict";
import test from "node:test";
import { thumbnailReveal, railOval, arrangeRail } from "./railReveal.js";

test("distant rail images are hidden while the visible section stays fully bright", () => {
  assert.equal(thumbnailReveal({ top: 0, bottom: 100 }, 600, 720).opacity, "0");
  assert.equal(thumbnailReveal({ top: 1400, bottom: 1500 }, 100, 720).opacity, "0");
  assert.deepEqual(thumbnailReveal({ top: 410, bottom: 510 }, 100, 720), {
    opacity: "1", mask: "none", gray: "0.000", curve: 1,
  });
});

test("the long feather fades seven whole neighboring images at both ends", () => {
  let previous = 1;
  for (let distance = 100; distance <= 700; distance += 100) {
    const above = thumbnailReveal({ top: 950 - distance, bottom: 1050 - distance }, 1000, 720, 700);
    const below = thumbnailReveal({ top: 1670 + distance, bottom: 1770 + distance }, 1000, 720, 700);
    assert.equal(above.mask, "none", "The image itself is never cropped by the feather");
    assert.equal(above.opacity, below.opacity, "Both ends have the same falloff");
    assert.equal(above.curve, below.curve, "The rounded silhouette is symmetric");
    assert.ok(Number(above.opacity) < previous, "Each neighboring thumbnail fades further");
    previous = Number(above.opacity);
  }
  assert.equal(previous, 0);
});

test("the silhouette rounds off through the bright center without dimming visible photos", () => {
  const center = thumbnailReveal({ top: 1310, bottom: 1410 }, 1000, 720, 700);
  const shoulder = thumbnailReveal({ top: 1580, bottom: 1680 }, 1000, 720, 700);
  const tail = thumbnailReveal({ top: 2020, bottom: 2120 }, 1000, 720, 700);
  assert.equal(center.curve, 1);
  assert.ok(center.curve > shoulder.curve && shoulder.curve > tail.curve);
  assert.equal(shoulder.opacity, "1");
  assert.ok(Number(tail.opacity) < 1);
});

test("one oval encloses the band and follows fractional movement without an active-index jump", () => {
  const centers = [100, 125, 150, 175, 200];
  const widths = [20, 25, 30, 25, 20];
  const profile = [0.2, 0.8, 1, 0.8, 0.2];
  const oval = railOval(centers, widths, profile);
  assert.equal(oval.y, 150);
  assert.ok(oval.radiusX > 30 && oval.radiusY > 25);
  const shifted = railOval(centers.map((center) => center + 0.125), widths, profile);
  assert.ok(Math.abs(shifted.y - oval.y - 0.125) < 1e-9);
  assert.ok(Math.abs(shifted.radiusY - oval.radiusY) < 1e-9);
  const drifting = railOval(centers, widths, [0.19, 0.79, 1, 0.81, 0.21]);
  assert.ok(drifting.y > oval.y && drifting.y < oval.y + 1);
  assert.equal(railOval(centers, widths, [0, 0, 0, 0, 0]), null);
});

test("the rail reaches both screen edges without enlarging or overlapping photographs", () => {
  for (const height of [540, 844, 954, 1200]) {
    for (const active of [0, 26, 52]) {
      const profile = Array.from({ length: 53 }, (_, index) => Math.max(0, 1 - Math.abs(index - active) / 12));
      const weights = profile.map((amount) => 0.42 + 1.28 * amount);
      const { scales, centers } = arrangeRail(weights, profile, 14, height);
      assert.ok(Math.abs(centers[0] - scales[0] * 7) < 1e-9);
      assert.ok(Math.abs(centers.at(-1) + scales.at(-1) * 7 - height) < 1e-9);
      scales.forEach((scale, index) => {
        assert.ok(scale <= weights[index]);
        if (index) assert.ok(centers[index] - scale * 7 >= centers[index - 1] + scales[index - 1] * 7 + 1.999);
      });
    }
  }
});

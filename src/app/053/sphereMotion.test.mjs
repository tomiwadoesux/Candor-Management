import assert from "node:assert/strict";
import test from "node:test";
import { advanceCoast, advanceScroll, advanceSpring, rotatePoints } from "./sphereMotion.js";

test("horizontal dragging keeps its screen axis after the sphere tilts", () => {
  const points = [{ x: 0.6, y: 0, z: 0.8 }];
  rotatePoints(points, 0.8, 1.1);
  const height = points[0].y;
  rotatePoints(points, 0.25, 0);
  assert.equal(points[0].y, height);
  const horizontal = points[0].x;
  rotatePoints(points, 0, -0.25);
  assert.equal(points[0].x, horizontal);
});

test("long-running drift preserves the sphere without stretching", () => {
  const points = [{ x: 0.6, y: 0, z: 0.8 }];
  for (let frame = 0; frame < 30 * 60 * 10; frame += 1) {
    rotatePoints(points, 0.001, -0.0004);
  }
  const { x, y, z } = points[0];
  assert.ok(Math.abs(Math.hypot(x, y, z) - 1) < 1e-10);
});

test("drag response is the same at 60 and 120 Hz and settles without overshoot", () => {
  const run = (hz) => {
    const spring = { value: 0, target: 0.24, velocity: 0 };
    for (let frame = 0; frame < hz / 4; frame += 1) {
      const previous = spring.value;
      advanceSpring(spring, 1 / hz);
      assert.ok(spring.value >= previous && spring.value <= spring.target);
    }
    const halfway = spring.value;
    for (let frame = 0; frame < hz; frame += 1) advanceSpring(spring, 1 / hz);
    assert.equal(spring.value, spring.target);
    assert.equal(spring.velocity, 0);
    return halfway;
  };
  assert.ok(Math.abs(run(60) - run(120)) < 1e-12);
});

test("reversing a drag changes its target without jumping its presentation", () => {
  const spring = { value: 0, target: 0.3, velocity: 0 };
  advanceSpring(spring, 0.1);
  const previous = { ...spring };
  spring.target = -0.1;
  assert.equal(spring.value, previous.value);
  assert.equal(spring.velocity, previous.velocity);
  for (let frame = 0; frame < 90; frame += 1) advanceSpring(spring, 1 / 60);
  assert.equal(spring.value, -0.1);
  assert.equal(spring.velocity, 0);
});

test("automatic scroll rounds both ends without a stationary hold", () => {
  const scroll = { position: 99, direction: 1 };
  advanceScroll(scroll, 0.5, 10, 100);
  assert.equal(scroll.direction, -1);
  assert.ok(scroll.position > 99 && scroll.position < 100);
  scroll.position = 1;
  advanceScroll(scroll, 0.5, 10, 100);
  assert.equal(scroll.direction, 1);
  assert.ok(scroll.position > 0 && scroll.position < 1);
  scroll.position = 100;
  scroll.direction = 1;
  advanceScroll(scroll, 1 / 120, 10, 100);
  assert.ok(scroll.position < 100, "Movement continues on the very next frame at the endpoint");
});

test("automatic scroll follows the user's last direction at the same speed", () => {
  const scroll = { position: 50, direction: 1 };
  advanceScroll(scroll, 1, 12, 100);
  assert.ok(Math.abs(scroll.position - 62) < 1e-10);
  scroll.direction = -1;
  advanceScroll(scroll, 1, 12, 100);
  assert.ok(Math.abs(scroll.position - 50) < 1e-10);
  advanceScroll(scroll, 1, 12, 100);
  assert.ok(Math.abs(scroll.position - 38) < 1e-10);
});

test("fractional scrolling stays consistent across frame rates", () => {
  const run = (hz) => {
    const scroll = { position: 20, direction: 1 };
    for (let i = 0; i < hz * 5; i += 1) advanceScroll(scroll, 1 / hz, 7, 100);
    return scroll.position;
  };
  assert.ok(Math.abs(run(30) - 55) < 1e-10);
  assert.ok(Math.abs(run(120) - 55) < 1e-10);
  const noOverflow = { position: 0, direction: 1 };
  advanceScroll(noOverflow, 1, 12, 0);
  assert.equal(noOverflow.position, 0);
});

test("endpoint velocity turns continuously instead of flipping in one frame", () => {
  const scroll = { position: 94, direction: 1 };
  const velocities = [];
  for (let i = 0; i < 240; i += 1) {
    const before = scroll.position;
    advanceScroll(scroll, 1 / 120, 10, 100);
    velocities.push((scroll.position - before) * 120);
    assert.ok(scroll.position >= 0 && scroll.position <= 100);
  }
  assert.ok(velocities.some(v => v > 9.9) && velocities.some(v => v < -9.9));
  const changes = velocities.slice(1).map((v, i) => Math.abs(v - velocities[i]));
  assert.ok(Math.max(...changes) < 0.21, "Velocity changes gradually through the rounded end cap");
  assert.ok(velocities.every(v => v !== 0), "No stationary frames at the turn");
});

test("release momentum decays smoothly into the nonzero ambient speed", () => {
  const run = (hz) => {
    const coast = { x: 0.5, y: 0 };
    let travel = 0;
    let previousSpeed = Infinity;
    for (let i = 0; i < hz * 4; i += 1) {
      const delta = advanceCoast(coast, 1 / hz).x + 0.032 / hz;
      const speed = delta * hz;
      assert.ok(speed >= 0.032 && speed < previousSpeed);
      previousSpeed = speed;
      travel += delta;
    }
    return travel;
  };
  assert.ok(Math.abs(run(60) - run(120)) < 1e-10);
});

import assert from "node:assert/strict";
import test from "node:test";
import { nearestViewAnchor } from "./viewAnchor.js";

const viewport = { left: 0, top: 0, width: 400, height: 300 };
const card = (index, left, top, width, height, opacity = 1) => ({ index, rect: { left, top, width, height }, opacity });

test("a click under a large photograph follows its edge rather than a smaller photo's closer centre", () => {
  const cards = [card(3, 20, 40, 200, 100), card(8, 240, 155, 30, 30)];
  assert.equal(nearestViewAnchor(cards, 210, 150, viewport).index, 3);
});

test("offscreen and nearly invisible photographs cannot steal a background click", () => {
  const cards = [card(2, 320, 180, 50, 50), card(9, 380, 301, 20, 20), card(10, 380, 270, 20, 20, 0.055)];
  assert.equal(nearestViewAnchor(cards, 395, 299, viewport).index, 2);
  assert.equal(nearestViewAnchor(cards.slice(1), 395, 299, viewport), null);
});

test("overlapping sphere edges prefer the brighter front photograph", () => {
  const cards = [card(1, 100, 100, 60, 80, 0.3), card(2, 100, 100, 60, 80, 0.9)];
  assert.equal(nearestViewAnchor(cards, 130, 184, viewport).index, 2);
});

test("grid return preserves vertical placement with breathing room at both ends", () => {
  const offsetViewport = { left: 20, top: 100, width: 400, height: 400 };
  assert.equal(nearestViewAnchor([card(1, 50, 200, 80, 80)], 70, 285, offsetViewport).viewportY, 0.35);
  assert.equal(nearestViewAnchor([card(1, 50, 80, 80, 80)], 70, 165, offsetViewport).viewportY, 0.2);
  assert.equal(nearestViewAnchor([card(1, 50, 460, 80, 80)], 70, 455, offsetViewport).viewportY, 0.8);
});

test("the reference follows live image positions as the sphere moves", () => {
  const cards = [card(1, 100, 100, 50, 50), card(2, 250, 100, 50, 50)];
  assert.equal(nearestViewAnchor(cards, 125, 160, viewport).index, 1);
  [cards[0].rect, cards[1].rect] = [cards[1].rect, cards[0].rect];
  assert.equal(nearestViewAnchor(cards, 125, 160, viewport).index, 2);
  assert.equal(nearestViewAnchor([], 125, 160, viewport), null);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

// This repository has CommonJS package defaults; use its existing test style
// of loading an independent animation module as ESM without changing them.
const code = await readFile(new URL('./getty-motion.js', import.meta.url), 'utf8');
const { GETTY_YEARS, GETTY_CARD_COUNT, SCENE_LENGTH, getGettyFrame, getCardPosition } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

test('dates change at their measured landmarks, in both scroll directions', () => {
  for (let i = 1; i < GETTY_YEARS.length; i++) {
    const p = (1.8 + GETTY_YEARS[i].at * 10) / SCENE_LENGTH;
    assert.equal(getGettyFrame(p - 0.00001).yearIndex, i - 1);
    assert.equal(getGettyFrame(p + 0.00001).yearIndex, i);
    assert.equal(getGettyFrame(p - 0.00001).yearIndex, i - 1);
  }
});

test('artwork stays pinned throughout all date chapters before the zoom', () => {
  for (let time = 2; time <= 11.8; time += 0.1) {
    const frame = getGettyFrame(time / SCENE_LENGTH);
    assert.equal(frame.zoom, 0);
    assert.equal(frame.enter, 1);
    assert.equal(frame.exit, 0);
  }
  assert.equal(getGettyFrame(13 / SCENE_LENGTH).zoom, 1);
  assert.equal(getGettyFrame(19.6 / SCENE_LENGTH).exit, 1);
});

test('ledger only appears inside the expanded painting phase', () => {
  for (let i = 0; i <= 2000; i++) {
    const frame = getGettyFrame(i / 2000);
    if (frame.ledger > 0) assert.ok(frame.zoom > 0.9);
    for (const key of ['intro', 'enter', 'zoom', 'dim', 'ledger', 'exit', 'timelineOpacity']) {
      assert.ok(frame[key] >= 0 && frame[key] <= 1, key);
    }
  }
});

test('cards follow continuous reversible paths across dates at narrow and wide sizes', () => {
  for (const [width, height] of [[390, 844], [1280, 720], [1920, 1080]]) {
    for (let card = 0; card < GETTY_CARD_COUNT; card++) {
      for (const { at } of GETTY_YEARS) {
        const progress = (1.8 + at * 10) / SCENE_LENGTH;
        const a = getCardPosition(card, progress - 0.00001, width, height);
        const b = getCardPosition(card, progress + 0.00001, width, height);
        assert.ok(Number.isFinite(a.x) && Number.isFinite(a.y));
        assert.ok(Math.hypot(a.x - b.x, a.y - b.y) < 1);
        assert.deepEqual(a, getCardPosition(card, progress - 0.00001, width, height));
      }
    }
  }
});

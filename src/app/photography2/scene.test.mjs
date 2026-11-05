import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const load = async (path) => import(`data:text/javascript;base64,${Buffer.from(await readFile(new URL(path, import.meta.url), "utf8")).toString("base64")}`);
const { START_TIME, END_TIME, RUNWAY_VH, sceneProgress } = await load("./scene.js");
const { SCENE_LENGTH, getGettyFrame } = await load("../references/getty-motion.js");

test("the first frame starts with the introduction gone", () => {
  assert.equal(sceneProgress(0) * SCENE_LENGTH, START_TIME);
  assert.equal(getGettyFrame(sceneProgress(0)).intro, 0);
});

test("scrolling ends before the zoom and ledger while preserving the original movement rate", () => {
  assert.equal(sceneProgress(1) * SCENE_LENGTH, END_TIME);
  assert.equal(sceneProgress(-1), sceneProgress(0));
  assert.equal(sceneProgress(2), sceneProgress(1));
  assert.equal(RUNWAY_VH / 100 - 1, END_TIME - START_TIME);
  for (let i = 0; i <= 100; i++) {
    const frame = getGettyFrame(sceneProgress(i / 100));
    assert.equal(frame.zoom, 0);
    assert.equal(frame.ledger, 0);
    assert.equal(frame.exit, 0);
  }
});

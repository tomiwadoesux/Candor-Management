import test from "node:test";
import assert from "node:assert/strict";
import { MEDIA, TEXT, SURFACE, projectLayout, pickBucket, matchRoute, mergeRecording } from "./layoutMap.js";

const layout = {
  geometry: 2, vw: 1280, vh: 720, bg: "#fff", fg: "#000", colors: ["#000"],
  blocks: [[MEDIA, 40, 80, 320, 400, 0], [TEXT, 40, 500, 160, 12, 0], [SURFACE, 526, 660, 228, 40, 0]],
  anchors: [[2, [2, 2]]],
};

test("a taller viewport reveals content without stretching photos or text", () => {
  const projected = projectLayout(layout, 1280, 1000);
  assert.deepEqual(projected.blocks[0].slice(1, 5), [40, 80, 320, 400]);
  assert.equal(projected.blocks[1][4], 12);
  assert.deepEqual(projected.blocks[2].slice(1, 5), [526, 940, 228, 40]);
});

test("photos keep their aspect ratio and the navigation stays centred", () => {
  const projected = projectLayout(layout, 1440, 900);
  assert.equal(projected.blocks[0][3] / projected.blocks[0][4], 320 / 400);
  const nav = projected.blocks[2];
  assert.equal(nav[1] + nav[3] / 2, 720);
  assert.equal(900 - nav[2] - nav[4], 20);
});

test("fixed edge logos and full-screen scene frames retain their anchors", () => {
  const projected = projectLayout({ ...layout,
    blocks: [[MEDIA, 16, 14, 124, 24, 0], [MEDIA, 0, 0, 1280, 720, 0]],
    anchors: [[0, [1, 1]], [1, [4, 4]]],
  }, 1440, 900);
  assert.deepEqual(projected.blocks[0].slice(1, 5), [16, 14, 124, 24]);
  assert.deepEqual(projected.blocks[1].slice(1, 5), [0, 0, 1440, 900]);
});

test("phone, tablet and desktop use their own recordings", () => {
  const map = { buckets: { sm: { vw: 390 }, md: { vw: 900 }, lg: layout } };
  assert.equal(pickBucket(map, 390).vw, 390);
  assert.equal(pickBucket(map, 900).vw, 900);
  assert.equal(pickBucket(map, 1280), layout);
});

test("profiles select the shared profile map while exact routes win", () => {
  const routes = ["/models/[id]", "/models/new", "/agency"];
  assert.equal(matchRoute("/models/26", routes), "/models/[id]");
  assert.equal(matchRoute("/models/new/", routes), "/models/new");
  assert.equal(matchRoute("/deleted", routes), null);
});

test("a resized visitor cannot overwrite the canonical phone recording", () => {
  const phone = { ...layout, vw: 390, vh: 844 };
  const wide = { ...layout, vw: 718, vh: 774 };
  const map = { buckets: { sm: phone } };
  assert.equal(mergeRecording(map, "sm", wide), true);
  assert.equal(map.buckets.sm, phone);
  assert.equal(pickBucket(map, 718, 774), wide);
  assert.equal(pickBucket(map, 390, 844), phone);
  assert.equal(mergeRecording(map, "sm", wide), false);
});

test("an unstable arrival cannot replace a settled recording at that size", () => {
  const phone = { ...layout, vw: 390, vh: 844 };
  const map = { buckets: { sm: phone } };
  assert.equal(mergeRecording(map, "sm", { ...phone, blocks: [] }, true), false);
  assert.equal(map.buckets.sm, phone);
});

test("legacy stretched maps cannot displace a new geometry recording", () => {
  const legacy = { vw: 718, vh: 774, blocks: [] };
  const phone = { ...layout, vw: 390, vh: 844 };
  const map = { buckets: { sm: legacy } };
  mergeRecording(map, "sm", phone);
  assert.equal(pickBucket(map, 718, 774), phone);
});

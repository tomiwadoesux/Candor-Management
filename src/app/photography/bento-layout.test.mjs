import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const code = await readFile(new URL("./bento-layout.js", import.meta.url), "utf8");
const { createBentoLayout, createBentoWithInfo } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
const photos = (ratios) => ratios.map((aspectRatio) => ({ aspectRatio }));

function assertAligned(layout, count) {
  assert.equal(layout.length, count);
  const cells = new Set();
  let bottom = 0;
  for (const tile of layout) {
    assert.ok(Number.isInteger(tile.column) && Number.isInteger(tile.row));
    assert.ok(tile.column >= 1 && tile.column + tile.columns <= 13);
    assert.ok(tile.rows >= 2 && tile.columns >= 3);
    bottom = Math.max(bottom, tile.row + tile.rows - 1);
    for (let x = tile.column; x < tile.column + tile.columns; x++) {
      for (let y = tile.row; y < tile.row + tile.rows; y++) {
        const key = `${x},${y}`;
        assert.ok(!cells.has(key), `overlap at ${key}`);
        cells.add(key);
      }
    }
  }
  assert.equal(cells.size, bottom * 12, "each spread fills a complete rectangle");
}

test("arbitrary counts and extreme ratios remain aligned at desktop and phone widths", () => {
  for (const count of [0, 1, 2, 3, 5, 6, 7, 10, 11, 19, 25]) {
    const images = photos(Array.from({ length: count }, (_, i) => [0.1, 0.75, 1, 1.5, 10, NaN, 0][i % 7]));
    for (const options of [{ width: 1100 }, { width: 240, compact: true, gap: 8 }]) {
      assertAligned(createBentoLayout(images, options), count);
    }
  }
});

test("composition responds to dimensions and deliberate layout changes", () => {
  const portraits = photos([0.75, 0.75, 0.75, 0.75, 0.75, 0.75]);
  const original = createBentoLayout(portraits);
  assert.notDeepEqual(original, createBentoLayout(photos([2, 1.8, 0.75, 1, 3, 0.75])));
  assert.notDeepEqual(original, createBentoLayout(portraits, { variant: 1 }));
  assert.deepEqual(original, createBentoLayout(portraits));
  assert.ok(original.every((tile) => tile.rotation === 0), "photos stay upright by default");
});

test("automatic rotation is opt-in and manual rotation is respected", () => {
  const images = photos([0.4, 2.5, 0.75, 2.5, 1, 0.6]);
  const automatic = createBentoLayout(images, { allowRotation: true });
  assert.ok(automatic.some((tile) => tile.rotation === 90));
  images[0].rotation = 270;
  images[1].rotation = 0;
  const manual = createBentoLayout(images, { allowRotation: true });
  assert.equal(manual[0].rotation, 270);
  assert.equal(manual[1].rotation, 0);
  assertAligned(manual, images.length);
});

test("a narrow portrait set gets enough height to avoid severe cropping", () => {
  const width = 356;
  const gap = 8;
  const stride = (width - gap * 11) / 12 + gap;
  const layout = createBentoLayout(photos([0.75, 0.75, 0.75]), { width, gap, compact: true });
  for (const tile of layout) {
    const frameRatio = (tile.columns * stride - gap) / (tile.rows * stride - gap - 24);
    assert.ok(Math.min(frameRatio / 0.75, 0.75 / frameRatio) > 0.8, "at least 80% of each portrait remains visible");
  }
});

test("all existing folders pack without gaps or overlaps", async () => {
  const projects = JSON.parse(await readFile(new URL("../references/reference-data.json", import.meta.url))).alicia;
  const dimensions = JSON.parse(await readFile(new URL("./image-dimensions.json", import.meta.url)));
  for (const project of projects) {
    const images = project.images.map((src) => ({ aspectRatio: dimensions[src].width / dimensions[src].height }));
    assertAligned(createBentoLayout(images), images.length);
  }
});

test("information occupies one readable cell inside the full-width composition", async () => {
  const projects = JSON.parse(await readFile(new URL("../references/reference-data.json", import.meta.url))).alicia;
  const dimensions = JSON.parse(await readFile(new URL("./image-dimensions.json", import.meta.url)));
  const sets = [photos([0.75]), photos([0.1, 10, 1]), ...projects.map((project) => project.images.map((src) => ({ aspectRatio: dimensions[src].width / dimensions[src].height })))];
  assert.deepEqual(createBentoWithInfo([]), { images: [], info: undefined });
  for (const images of sets) {
    for (const width of [296, 366, 576, 740, 1172, 1892]) {
      const compact = width < 600;
      const gap = compact ? 8 : width < 900 ? 10 : 14;
      const composition = createBentoWithInfo(images, { width, compact, gap });
      assertAligned([...composition.images, composition.info], images.length + 1);
      assert.deepEqual(composition.images.map((tile) => tile.index), images.map((_, i) => i), "photo indices stay stable for the return animation");
      const stride = (width - gap * 11) / 12 + gap;
      assert.ok(composition.info.rows * stride - gap >= 360, "project details have room to wrap");
      assert.ok(composition.info.columns * stride - gap >= Math.min(compact ? 150 : 220, width * 0.45));
      assert.ok(composition.info.columns <= 6, "photos share the width with the information tile");
    }
  }
});

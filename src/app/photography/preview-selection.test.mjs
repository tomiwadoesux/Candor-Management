import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const code = await readFile(new URL("./preview-selection.js", import.meta.url), "utf8");
const { choosePreviewIndices } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);

test("a larger folder can show fewer previews than a smaller folder", () => {
  assert.equal(choosePreviewIndices(17, () => 0.1).length, 3);
  assert.equal(choosePreviewIndices(6, () => 0.7).length, 5);
});

test("previews are unique existing photographs, in their original order", () => {
  for (const total of [0, 1, 2, 3, 6, 17, 81]) {
    for (const random of [() => 0, () => 0.3, () => 0.999999]) {
      const indices = choosePreviewIndices(total, random);
      assert.ok(indices.length >= Math.min(2, total) && indices.length <= total);
      assert.equal(new Set(indices).size, indices.length);
      assert.ok(indices.every((index) => index >= 0 && index < total));
      assert.deepEqual(indices, [...indices].sort((a, b) => a - b));
    }
  }
});

test("the sample can include later photographs, rather than just the first ones", () => {
  let draw = 0;
  assert.deepEqual(choosePreviewIndices(17, () => draw++ === 0 ? 0 : 0.999999), [0, 16]);
});

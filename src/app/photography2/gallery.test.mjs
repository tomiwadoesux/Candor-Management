import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("./gallery.js", import.meta.url), "utf8");
const { photoNumber, photoRowSizes, swapArtwork, fieldPosition, featuredSize } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

test("photo labels use at least two digits", () => {
  for (const [value, label] of [[1, "01"], [2, "02"], [3, "03"], [9, "09"], [10, "10"], [25, "25"], [100, "100"]]) assert.equal(photoNumber(value), label);
});

test("mixed photo rows include three, four and landscape-only features without losing photos", () => {
  const portrait = { width: 800, height: 1200 };
  const landscape = { width: 1600, height: 900 };
  const photos = Array.from({ length: 25 }, (_, i) => [2, 3, 6, 8, 12, 15].includes(i) ? portrait : landscape);
  const rows = photoRowSizes(photos);
  assert.deepEqual(new Set(rows), new Set([3, 4, 1]));
  assert.equal(rows.reduce((total, size) => total + size, 0), photos.length);
  let offset = 0;
  for (const size of rows) {
    if (size === 1) assert.ok(photos[offset].width > photos[offset].height);
    offset += size;
  }
});

test("row planning covers short and portrait-only collections at each responsive width", () => {
  for (const columns of [2, 3, 4]) {
    for (let count = 0; count <= 40; count++) {
      const photos = Array.from({ length: count }, () => ({ width: 800, height: 1200 }));
      const rows = photoRowSizes(photos, columns);
      assert.equal(rows.reduce((total, size) => total + size, 0), count);
      assert.ok(rows.every((size) => size > 0 && size <= columns));
      if (columns > 2 && count > 1) assert.ok(rows.every((size) => size > 1), "portraits are kept in groups");
    }
  }
});

test("a selection exchanges both artworks and their descriptions without mutating the original", () => {
  const painting = { src: "painting", title: "Original painting", width: 1009, height: 1200 };
  const photo = { src: "photo", title: "Selected photograph", width: 200, height: 112 };
  const gallery = { featured: painting, cards: [photo, photo], selected: false };
  const next = swapArtwork(gallery, 0);
  assert.equal(next.featured, photo);
  assert.equal(next.cards[0], painting);
  assert.equal(next.cards[1], photo);
  assert.equal(gallery.cards[0], photo);
  assert.equal(swapArtwork(next, 1), next, "selecting the already featured artwork does not blink or replay");
  assert.equal(swapArtwork(next, 0).featured, painting, "the exchange can be reversed");
});

test("surrounding cards stay within the viewport width and travel continuously in both directions", () => {
  for (const [width, height] of [[320, 700], [390, 844], [768, 1024], [1304, 954], [1920, 1080]]) {
    for (let index = 0; index < 48; index++) {
      for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
        const position = fieldPosition(index, progress, width, height, 24);
        assert.ok(position.x - position.size / 2 >= 0);
        assert.ok(position.x + position.size / 2 <= width);
        const following = fieldPosition(index, progress + 0.00001, width, height, 24);
        assert.ok(Math.abs(position.y - following.y) < 1);
        assert.deepEqual(position, fieldPosition(index, progress, width, height, 24));
      }
    }
    for (const art of [{ width: 200, height: 112 }, { width: 78, height: 200 }, { width: 1009, height: 1200 }]) {
      const size = featuredSize(art, width, height);
      assert.ok(Math.abs(size.width / size.height - art.width / art.height) < 0.00001);
      assert.ok(size.width <= width * 0.48 && size.height <= height * 0.5 + 0.00001);
    }
  }
});

test("the sparse background descends against the foreground and every photograph passes through view", () => {
  const width = 1440, height = 900, perLayer = 24, backgroundCount = 8;
  for (let index = 0; index < perLayer; index++) {
    const front = fieldPosition(index, 0.5, width, height, perLayer);
    const frontNext = fieldPosition(index, 0.51, width, height, perLayer);
    assert.ok(frontNext.y < front.y, "foreground rises on downward scroll");
  }
  for (let index = 0; index < backgroundCount; index++) {
    const back = fieldPosition(index + perLayer, 0.5, width, height, perLayer, backgroundCount);
    const backNext = fieldPosition(index + perLayer, 0.51, width, height, perLayer, backgroundCount);
    assert.ok(backNext.y > back.y, "background descends on downward scroll");
    const inView = fieldPosition(index + perLayer, index / (backgroundCount - 1), width, height, perLayer, backgroundCount);
    assert.ok(inView.y > 0 && inView.y < height, "no background row is stranded off screen");
  }
  for (let step = 0; step <= 100; step++) {
    const visible = Array.from({ length: backgroundCount }, (_, i) => fieldPosition(i + perLayer, step / 100, width, height, perLayer, backgroundCount))
      .filter(({ y, size }) => y + size / 2 > 0 && y - size / 2 < height);
    assert.ok(visible.length <= 3, "the background stays sparse throughout the scroll");
  }
});

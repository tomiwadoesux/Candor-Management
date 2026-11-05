import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { BUCKETS, MAP_VERSION, bucketFor } from "../src/components/pageSkeleton/layoutMap.js";

const root = process.cwd();
const readJSON = async (file) => JSON.parse(await readFile(file, "utf8"));
const index = await readJSON(path.join(root, "public/skeletons/_routes.json"));
const pages = new Map();

async function scan(folder, segments = []) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    if (entry.isFile() && /^page\.(js|jsx|ts|tsx|mdx?)$/.test(entry.name)) {
      pages.set(`/${segments.join("/")}`, { folder, source: await readFile(path.join(folder, entry.name), "utf8") });
    } else if (entry.isDirectory() && !entry.name.startsWith("_") && !entry.name.startsWith("(.")) {
      const grouped = entry.name.startsWith("@") || /^\(.+\)$/.test(entry.name);
      await scan(path.join(folder, entry.name), grouped ? segments : [...segments, entry.name]);
    }
  }
}
await scan(path.join(root, "src/app"));

let recordings = 0;
for (const [route, page] of pages) {
  const redirect = page.source.match(/permanentRedirect\(["']([^"']+)["']\)/)?.[1];
  const target = redirect || route;
  assert.ok(index.routes[target], `${route}: no placeholder mapping for ${target}`);
  const loading = await readFile(path.join(page.folder, "loading.js"), "utf8");
  assert.ok(loading.includes(`route="${target}"`), `${route}: loading boundary uses a different map`);
  if (redirect) continue;

  const map = await readJSON(path.join(root, "public/skeletons", index.routes[route]));
  assert.equal(map.route, route, `${route}: wrong route in map`);
  assert.equal(map.v, MAP_VERSION, `${route}: unsupported format`);
  for (const { name } of BUCKETS) {
    const layout = map.buckets[name];
    assert.ok(layout, `${route}: missing ${name} recording`);
    assert.equal(layout.geometry, 2, `${route}: ${name} still stretches viewport geometry`);
    assert.equal(bucketFor(layout.vw), name, `${route}: recording in wrong breakpoint`);
    assert.ok(layout.vh > 0 && layout.blocks.length > 0, `${route}: empty ${name} recording`);
    for (const [i, b] of layout.blocks.entries()) {
      assert.ok(b.every(Number.isFinite), `${route}: invalid block ${i}`);
      assert.ok(b[1] >= 0 && b[2] >= 0 && b[3] > 0 && b[4] > 0, `${route}: invalid bounds ${i}`);
      assert.ok(b[1] + b[3] <= layout.vw + 2 && b[2] + b[4] <= layout.vh + 2, `${route}: block outside viewport ${i}`);
      assert.ok(layout.colors[b[5]], `${route}: missing colour ${i}`);
    }
    const anchored = new Set();
    for (const [i, modes] of layout.anchors || []) {
      assert.ok(Number.isInteger(i) && layout.blocks[i] && !anchored.has(i), `${route}: invalid anchor`);
      assert.ok(modes.length === 2 && modes.every(n => Number.isInteger(n) && n >= 1 && n <= 4), `${route}: invalid anchor modes`);
      anchored.add(i);
    }
    recordings++;
  }
}
for (const route of Object.keys(index.routes)) assert.ok(pages.has(route), `${route}: stale deleted page in index`);
console.log(`Verified ${Object.keys(index.routes).length} page maps, ${recordings} responsive recordings, and ${pages.size} loading boundaries.`);

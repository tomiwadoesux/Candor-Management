import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function fixture(supported = true) {
  const elements = [], attached = [];
  const element = (tag) => {
    const el = { tag, style: {}, dataset: {}, attributes: {}, children: [], removed: false,
      setAttribute(name, value) { this.attributes[name] = value; },
      append(...items) { this.children.push(...items); },
      remove() { this.removed = true; },
    };
    elements.push(el); return el;
  };
  const context = vm.createContext({
    CSS: { supports: () => supported },
    document: { createElement: element, createElementNS: (_, tag) => element(tag), body: { append(...nodes) { attached.push(...nodes); } } },
  });
  const source = readFileSync(new URL("./heatRenderer.js", import.meta.url), "utf8").replaceAll("export function", "function");
  const api = vm.runInContext(source + "\n({ acquireHeatRenderer, releaseHeatRenderer });", context);
  return { elements, attached, ...api };
}

test("all transitions reuse one live backdrop with exclusive ownership", () => {
  const f = fixture(), first = {}, second = {};
  const renderer = f.acquireHeatRenderer(first);
  assert.equal(f.acquireHeatRenderer(second), null);
  f.releaseHeatRenderer(second);
  assert.equal(f.acquireHeatRenderer(second), null);
  f.releaseHeatRenderer(first);
  assert.equal(f.acquireHeatRenderer(second), renderer);
  assert.equal(f.attached.length, 2, "Only one filter definition and one backdrop band");
  f.releaseHeatRenderer(second, true);
  assert.ok(f.attached.every(el => el.removed));
});

test("the live backdrop refracts content below the chrome without copying it", () => {
  const f = fixture(), owner = {};
  const renderer = f.acquireHeatRenderer(owner);
  renderer.configure(20);
  renderer.draw({ top: 200, width: 1280, height: 108, strength: 1, time: 2 });
  const band = f.attached[1];
  assert.equal(band.style.backdropFilter, 'url("#candor-heat-refraction")');
  assert.equal(band.style.zIndex, "20");
  assert.equal(band.style.width, "100%");
  assert.equal(band.style.pointerEvents, "none");
  assert.equal(band.style.display, "block");
  const displacement = f.elements.find(el => el.tag === "feDisplacementMap");
  assert.equal(displacement.attributes.in, "SourceGraphic");
  assert.ok(!f.elements.some(el => el.tag === "canvas" || el.tag === "img"));
  f.releaseHeatRenderer(owner);
  assert.equal(band.style.display, "none");
});

test("stationary heat rises at a steady speed without breathing or resizing the field", () => {
  const f = fixture(), renderer = f.acquireHeatRenderer({});
  const pose = { top: 200, width: 1280, height: 108, strength: 1, time: 2 };
  renderer.draw(pose);
  const offset = f.elements.find(el => el.tag === "feOffset");
  const noise = f.elements.find(el => el.tag === "feTurbulence");
  const displacement = f.elements.find(el => el.tag === "feDisplacementMap");
  const previous = Number(offset.attributes.dy);
  const frequency = noise.attributes.baseFrequency;
  const scale = displacement.attributes.scale;
  renderer.draw({ ...pose, time: 2.033 });
  const distance = Number(offset.attributes.dy) - previous;
  assert.ok(distance < 0 && distance > -1, "The field drifts upward by less than a pixel per 30fps frame");
  assert.equal(noise.attributes.baseFrequency, frequency);
  assert.equal(displacement.attributes.scale, scale);
  assert.equal(f.attached[1].style.transform, "translate3d(0,200.00px,0)");
});

test("stitched tiles supply the entire band through every wrap and viewport resize", () => {
  const f = fixture(), renderer = f.acquireHeatRenderer({});
  const noise = f.elements.find(el => el.tag === "feTurbulence");
  const tiled = f.elements.find(el => el.tag === "feTile");
  const offset = f.elements.find(el => el.tag === "feOffset");
  const displacement = f.elements.find(el => el.tag === "feDisplacementMap");
  assert.equal(noise.attributes.stitchTiles, "stitch");
  assert.equal(tiled.attributes.in, noise.attributes.result);
  assert.equal(offset.attributes.in, tiled.attributes.result);
  const tileHeight = Number(noise.attributes.height);
  let previousOffset = 0, wraps = 0;
  for (let time = 0; time < 20; time += 1 / 30) {
    renderer.draw({ top: 200, width: 1280, height: 112, strength: 1, time });
    const current = Number(offset.attributes.dy);
    assert.ok(current <= 0 && current >= -tileHeight);
    assert.ok(Number(tiled.attributes.height) >= 112 - current, "Advected pixels are always backed by a full tile");
    const step = current - previousOffset;
    if (step > 0) {
      wraps++;
      assert.ok(Math.abs(step - tileHeight) < 1, "The seam advances by exactly one stitched tile minus one frame of travel");
    }
    previousOffset = current;
  }
  assert.ok(wraps > 0);
  renderer.draw({ top: 80, width: 390, height: 72, strength: 1, time: 20 });
  assert.equal(Number(tiled.attributes.width), 390);
  assert.equal(Number(displacement.attributes.width), 390);
  assert.equal(Number(displacement.attributes.height), 72);
  assert.equal(f.attached[1].style.height, "72px");
});

test("heat tapers its displacement vector without blurring or double-exposing the picture", () => {
  const f = fixture(), renderer = f.acquireHeatRenderer({});
  renderer.draw({ top: 200, width: 1280, height: 108, strength: 1, time: 0 });
  const find = result => f.elements.find(el => el.attributes.result === result);
  const envelope = find("envelope");
  const eddies = find("eddies");
  const neutral = find("neutral");
  const map = find("heat-map");
  assert.equal(envelope.tag, "feImage");
  assert.equal(eddies.attributes.in2, "envelope");
  assert.equal(eddies.attributes.operator, "in");
  assert.equal(neutral.tag, "feFlood");
  assert.equal(neutral.attributes["flood-color"], "rgb(50%,50%,50%)");
  assert.equal(map.attributes.in, "eddies");
  assert.equal(map.attributes.in2, "neutral");
  assert.equal(map.attributes.operator, "over");
  assert.equal(f.elements.find(el => el.tag === "feDisplacementMap").attributes.in2, "heat-map");
  assert.ok(!f.elements.some(el => el.tag === "feGaussianBlur"));
  assert.equal(f.attached[1].style.maskImage, undefined);
  assert.equal(f.attached[1].style.webkitMaskImage, undefined);
});

test("stronger displacement stays bounded and fades completely to an undistorted backdrop", () => {
  const f = fixture(), renderer = f.acquireHeatRenderer({});
  const displacement = f.elements.find(el => el.tag === "feDisplacementMap");
  for (let time = 0; time < 120; time += 0.5) {
    for (const strength of [0, 0.1, 0.5, 1]) {
      renderer.draw({ top: 200, width: 1280, height: 108, strength, time });
      const scale = Number(displacement.attributes.scale);
      assert.ok(scale >= 0 && scale <= 14);
      if (strength === 0) assert.equal(scale, 0);
    }
  }
});

test("unsupported backdrop filters leave the normal fade available", () => {
  const f = fixture(false);
  assert.equal(f.acquireHeatRenderer({}), null);
  assert.equal(f.attached.length, 0);
});

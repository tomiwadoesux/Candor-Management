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

test("the backdrop filters source graphics without requiring photos or text copies", () => {
  const f = fixture(), owner = {};
  const renderer = f.acquireHeatRenderer(owner);
  renderer.configure(45);
  renderer.draw({ top: 200, height: 280, strength: 1, time: 2 });
  const band = f.attached[1];
  assert.equal(band.style.backdropFilter, 'url("#candor-heat-refraction")');
  assert.equal(band.style.width, "100%");
  assert.equal(band.style.pointerEvents, "none");
  assert.equal(band.style.display, "block");
  const displacement = f.elements.find(el => el.tag === "feDisplacementMap");
  assert.equal(displacement.attributes.in, "SourceGraphic");
  assert.ok(Number(displacement.attributes.scale) >= 9 && Number(displacement.attributes.scale) <= 18);
  assert.ok(!f.elements.some(el => el.tag === "canvas" || el.tag === "img"));
  f.releaseHeatRenderer(owner);
  assert.equal(band.style.display, "none");
});

test("stationary scrolling still changes refraction and softness over time", () => {
  const f = fixture();
  const renderer = f.acquireHeatRenderer({});
  const pose = { top: 200, height: 280, strength: 1, time: 2 };
  renderer.draw(pose);
  const offset = f.elements.find(el => el.tag === "feOffset");
  const displacement = f.elements.find(el => el.tag === "feDisplacementMap");
  const blur = f.elements.find(el => el.tag === "feGaussianBlur");
  const previous = Number(offset.attributes.dy);
  const previousScale = displacement.attributes.scale;
  const previousBlur = blur.attributes.stdDeviation;
  renderer.draw({ ...pose, time: 2.033 });
  assert.ok(Math.abs(Number(offset.attributes.dy) - previous) < 0.6);
  assert.notEqual(displacement.attributes.scale, previousScale);
  assert.notEqual(blur.attributes.stdDeviation, previousBlur);
  assert.equal(f.elements.find(el => el.tag === "feTurbulence").attributes.seed, "8");
  const band = f.attached[1];
  assert.equal(band.style.transform, "translate3d(0,200.00px,0)", "Refraction moves even though the band stays still");
});

test("idle flares remain bounded and fade fully to an undistorted backdrop", () => {
  const f = fixture(), renderer = f.acquireHeatRenderer({});
  const displacement = f.elements.find(el => el.tag === "feDisplacementMap");
  const blur = f.elements.find(el => el.tag === "feGaussianBlur");
  for (let time = 0; time < 120; time += 0.5) {
    renderer.draw({ top: 200, height: 280, strength: 1, time });
    assert.ok(Number(displacement.attributes.scale) >= 9 && Number(displacement.attributes.scale) <= 18);
    assert.ok(Number(blur.attributes.stdDeviation) >= 0.2 && Number(blur.attributes.stdDeviation) <= 0.85);
  }
  renderer.draw({ top: 200, height: 280, strength: 0, time: 120 });
  assert.equal(Number(displacement.attributes.scale), 0);
  assert.equal(Number(blur.attributes.stdDeviation), 0);
});

test("unsupported backdrop filters leave the normal fade available", () => {
  const f = fixture(false);
  assert.equal(f.acquireHeatRenderer({}), null);
  assert.equal(f.attached.length, 0);
});

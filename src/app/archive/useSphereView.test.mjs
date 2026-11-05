import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

// Model a browser that rounds native scrollTop, then verify the actual visual
// position (native scroll plus the field transform), not just target numbers.
function fixture() {
  let now = 0, nextFrame = 0, nativeTop = 0, lastScrollEvent = 0, renders = 0;
  const frames = new Map(), listeners = new Map(), mutations = [], cleanups = [], gridFrames = [], returns = [];
  const field = { offsetLeft: 10, offsetTop: 0, style: {} };
  const page = { dataset: {} };
  const items = Array.from({ length: 53 }, (_, i) => ({
    offsetParent: field, offsetLeft: 80 + i % 7 * 140, offsetTop: Math.floor(i / 7) * 180,
    offsetWidth: 80, offsetHeight: 100, style: {},
    querySelector() { return { style: {} }; },
    getBoundingClientRect() { return { left: this.offsetLeft - 30, top: this.offsetTop, width: 80, height: 100 }; },
  }));
  const scroller = {
    parentElement: page, clientWidth: 1280, clientHeight: 720, scrollHeight: 3348,
    get scrollTop() { return nativeTop; },
    set scrollTop(value) { nativeTop = Math.round(Math.max(0, Math.min(2628, value))); },
    setPointerCapture() {}, hasPointerCapture() { return false; }, releasePointerCapture() {},
    addEventListener(name, fn) { listeners.set(name, fn); },
    removeEventListener(name) { listeners.delete(name); },
    getBoundingClientRect() { return { left: 0, top: 0 }; },
  };
  const dialog = { open: false };
  const motion = { matches: false, addEventListener(_, fn) { this.change = fn; }, removeEventListener() {} };
  const document = {
    hidden: false,
    addEventListener(name, fn) { listeners.set(name, fn); },
    removeEventListener(name) { listeners.delete(name); },
  };
  const options = {
    scrollRef: { current: scroller }, itemRefs: { current: items }, previewRef: { current: dialog },
    reduceRef: { current: false }, onReturn(...args) { returns.push(args); }, onSelect() {},
    onGridFrame(top, height) { gridFrames.push({ top, height }); },
  };
  const context = vm.createContext({
    useState(initial) { return [initial, () => { renders++; }]; },
    useRef(current) { return { current }; }, useEffect(fn) { cleanups.push(fn()); },
    window: { matchMedia: () => motion }, document,
    ResizeObserver: class { observe() {} disconnect() {} },
    MutationObserver: class { constructor(fn) { mutations.push(fn); } observe() {} disconnect() {} },
    getComputedStyle() { return { opacity: "1", getPropertyValue: () => "cubic-bezier(0.32, 0.72, 0, 1)" }; },
    requestAnimationFrame(fn) { frames.set(++nextFrame, fn); return nextFrame; },
    cancelAnimationFrame(id) { frames.delete(id); }, performance: { now: () => now }, options,
  });
  vm.runInContext(readFileSync(new URL("./sphereMotion.js", import.meta.url), "utf8").replaceAll("export function", "function"), context);
  vm.runInContext(readFileSync(new URL("./viewAnchor.js", import.meta.url), "utf8").replaceAll("export function", "function"), context);
  const source = readFileSync(new URL("./useSphereView.js", import.meta.url), "utf8")
    .replace(/^import .*$/gm, "").replace("export default function", "function");
  const hook = vm.runInContext(source + "\nuseSphereView(options);", context);
  const visualTop = () => nativeTop - Number(field.style.transform?.match(/, ([\d.-]+)px/)?.[1] || 0);
  function step(count = 1) {
    for (let i = 0; i < count; i++) {
      now += 1000 / 60;
      const batch = [...frames.values()]; frames.clear(); batch.forEach(fn => fn(now));
      if (nativeTop !== lastScrollEvent) {
        lastScrollEvent = nativeTop;
        listeners.get("scroll")?.();
      }
    }
  }
  function scrollTo(top) {
    listeners.get("wheel")({ deltaY: top - nativeTop });
    scroller.scrollTop = top;
    listeners.get("scroll")();
    lastScrollEvent = nativeTop;
  }
  return { api: hook.apiRef.current, items, frames, gridFrames, returns, visualTop, step, scrollTo, scroller, dialog, motion,
    notifyDialog: () => mutations.forEach(fn => fn()), renders: () => renders, cleanup: () => cleanups.forEach(fn => fn()) };
}

test("fractional grid motion never stalls on rounded scrollTop or the native handoff", () => {
  const f = fixture();
  let before = f.visualTop();
  for (let i = 0; i < 120; i++) {
    f.step();
    const delta = f.visualTop() - before;
    assert.ok(delta > 0 && delta < 0.2, `Smooth subpixel step: ${delta}`);
    before = f.visualTop();
  }
  f.scrollTo(500);
  before = f.visualTop();
  for (let i = 0; i < 60; i++) {
    f.step();
    assert.ok(f.visualTop() > before, "Native handoff has no stationary frame");
    before = f.visualTop();
  }
  f.scrollTo(400);
  before = f.visualTop();
  f.step(60);
  assert.ok(f.visualTop() < before, "Last manual direction persists");
  assert.equal(f.renders(), 0);
  f.cleanup();
  assert.equal(f.frames.size, 0);
});

test("view changes centre the chosen image while preserving the sphere's evolving arrangement", () => {
  const f = fixture();
  f.api.change("sphere", 10, { instant: true });
  const initial = f.items[0].style.transform;
  f.api.keyDown({ key: "ArrowRight", preventDefault() {} });
  f.api.keyDown({ key: "ArrowUp", preventDefault() {} });
  f.api.change("grid", 10, { instant: true, viewportY: 0.35 });
  assert.deepEqual(f.returns.at(-1), [10, false, 0.35]);
  f.api.change("sphere", 10, { instant: true });
  assert.notEqual(f.items[0].style.transform, initial, "Returning never resets to the original sphere orientation");
  const item = f.items[10];
  const [, tx, ty, scale] = item.style.transform.match(/translate3d\(([-\d.]+)px, ([-\d.]+)px, 0\) scale\(([-\d.]+)\)/).map(Number);
  assert.ok(Math.abs(10 + item.offsetLeft + tx + item.offsetWidth * scale / 2 - 640) < 0.001);
  assert.ok(Math.abs(item.offsetTop + ty + item.offsetHeight * scale / 2 - 348) < 0.001);
  const before = item.style.transform;
  f.step(3);
  assert.notEqual(item.style.transform, before, "Ambient movement continues after bringing the image forward");
  f.cleanup();
});

test("a flick released before the next frame coasts into ongoing rotation", () => {
  const f = fixture();
  f.api.change("sphere", 10, { instant: true });
  const initial = f.items[0].style.transform;
  f.api.pointerDown({ button: 0, pointerId: 1, clientX: 300, clientY: 360 });
  f.api.pointerMove({ pointerId: 1, clientX: 500, clientY: 360 });
  f.api.pointerUp({ pointerId: 1 });
  f.step();
  assert.notEqual(f.items[0].style.transform, initial);
  for (let i = 0; i < 180; i++) {
    const before = f.items[0].style.transform;
    f.step();
    assert.notEqual(f.items[0].style.transform, before, "Release never has a stationary frame");
    assert.equal(f.frames.size, 1, "Only one animation loop runs");
  }
  assert.equal(f.renders(), 1, "Motion does not rerender React");
  f.cleanup();
});

test("modal, reduced motion, and explicit pause still stop background work", () => {
  const f = fixture();
  f.dialog.open = true; f.notifyDialog();
  assert.equal(f.frames.size, 0);
  f.dialog.open = false; f.notifyDialog();
  assert.equal(f.frames.size, 1);
  f.motion.matches = true; f.motion.change();
  assert.equal(f.frames.size, 0);
  f.motion.matches = false; f.motion.change();
  f.api.keyDown({ code: "Space", target: f.scroller, preventDefault() {} });
  assert.equal(f.frames.size, 0);
  f.cleanup();
});

test("rail scrubbing moves continuously, reverses, and keeps the reveal in sync", () => {
  const f = fixture();
  f.scrollTo(400); f.step(5);
  const initial = f.visualTop();
  f.api.beginScrub(); f.api.scrubTo(1200);
  assert.equal(f.visualTop(), initial, "Setting a destination never teleports the grid");
  let before = initial;
  for (let i = 0; i < 18; i++) {
    f.step();
    const top = f.visualTop();
    assert.ok(top > before && top < 1200, "Dragging down moves the content upward through intermediate positions");
    assert.ok(Math.abs(f.gridFrames.at(-1).top - top) < 0.0001, "Feathering tracks the rendered position, including fractional pixels");
    assert.equal(f.frames.size, 1);
    before = top;
  }
  f.api.scrubTo(600);
  assert.equal(f.visualTop(), before, "Reversing preserves the live position");
  f.step(60);
  assert.ok(Math.abs(f.visualTop() - 600) < 1);
  f.api.endScrub();
  before = f.visualTop();
  f.step(60);
  assert.ok(f.visualTop() < before, "Ambient scroll keeps the last upward direction");
  assert.equal(f.renders(), 0);
  f.cleanup();
});

test("a rail click released before paint travels through the grid and never brakes to a stop", () => {
  const f = fixture();
  f.api.beginScrub(); f.api.scrubTo(1200); f.api.endScrub();
  let before = f.visualTop();
  for (let i = 0; i < 240; i++) {
    f.step();
    assert.ok(f.visualTop() > before, "Release hands off to nonzero ambient motion");
    before = f.visualTop();
  }
  assert.ok(before > 1200 && before < 1250);
  f.cleanup();
});

test("manual rail navigation still works with reduced motion or automatic movement paused", () => {
  const f = fixture();
  f.motion.matches = true; f.motion.change();
  f.api.beginScrub(); f.api.scrubTo(900); f.api.endScrub();
  assert.equal(f.visualTop(), 900);
  assert.equal(f.gridFrames.at(-1).top, 900);
  assert.equal(f.frames.size, 0);
  f.motion.matches = false; f.motion.change();
  f.api.keyDown({ code: "Space", target: f.scroller, preventDefault() {} });
  f.api.beginScrub(); f.api.scrubTo(1200); f.api.endScrub();
  f.step(240);
  assert.ok(Math.abs(f.visualTop() - 1200) < 0.001);
  assert.equal(f.frames.size, 0, "Manual movement settles without restarting paused auto-scroll");
  f.cleanup();
});

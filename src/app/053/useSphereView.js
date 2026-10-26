"use client";

import { useEffect, useRef, useState } from "react";
import { advanceCoast, advanceScroll, advanceSpring, rotatePoints } from "./sphereMotion";
import { nearestViewAnchor } from "./viewAnchor";

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const DRIFT_SPEED = 0.032; // radians / second: 20% slower, roughly 3¼ minutes per turn
const DRIFT_INTERVAL = 1000 / 60;
const DRAG_SPEED = 0.0012;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const radiusFor = (width, height) => Math.max(60, Math.min((width - 100) / 2, (height - 170) / 2));

function point(index, count) {
  const y = 1 - 2 * (index + 0.5) / count;
  const ring = Math.sqrt(1 - y * y);
  return { x: Math.cos(index * GOLDEN_ANGLE) * ring, y, z: Math.sin(index * GOLDEN_ANGLE) * ring };
}

// The existing 53 DOM cards are also the sphere. Only their transforms and
// opacity move; no canvas or duplicate gallery. One loop also scrolls the grid.
// Sphere updates are capped at 60fps; grid motion changes one parent transform.
export default function useSphereView({ scrollRef, itemRefs, previewRef, reduceRef, onReturn, onSelect, onGridFrame }) {
  const [view, setView] = useState("grid");
  const viewRef = useRef("grid");
  const movingRef = useRef(false);
  const apiRef = useRef({});
  const callbacks = useRef({ onReturn, onSelect, onGridFrame });
  callbacks.current = { onReturn, onSelect, onGridFrame };

  useEffect(() => {
    const scroller = scrollRef.current;
    const items = itemRefs.current;
    const field = items[0].offsetParent;
    const points = items.map((_, index) => point(index, items.length));
    const positions = points.map((point) => ({ ...point }));
    const sharpLayers = items.map((item) => item.querySelector("[data-sharp]"));
    const softLayers = items.map((item) => item.querySelector("[data-soft]"));
    const page = scroller.parentElement;
    const dragYaw = { value: 0, target: 0, velocity: 0 };
    const dragPitch = { value: 0, target: 0, velocity: 0 };
    const coast = { x: 0, y: 0 };
    let releasePending = false;
    let idleFrame = 0;
    let lastIdlePaint = 0;
    let lastIdleUpdate = 0;
    let driftAngle = Math.PI / 8;
    const scroll = { position: scroller.scrollTop, direction: 1 };
    const rail = { active: false, following: false, value: scroller.scrollTop, target: scroller.scrollTop, velocity: 0 };
    let writtenScrollTop = scroller.scrollTop;
    let observedScrollTop = scroller.scrollTop;
    let nativeScrollUntil = 0;
    let paused = false;
    let animations = [];
    let revision = 0;
    let gesture = null;
    let dragged = false;
    let layout;

    const measure = () => {
      layout = {
        width: scroller.clientWidth, height: scroller.clientHeight,
        scrollTop: scroller.scrollTop,
        scrollLimit: scroller.scrollHeight - scroller.clientHeight,
        cards: items.map((item) => ({
          x: field.offsetLeft + item.offsetLeft,
          y: field.offsetTop + item.offsetTop,
          w: item.offsetWidth, h: item.offsetHeight,
        })),
      };
    };

    const sphere = () => {
      const { width, height } = layout;
      const radius = radiusFor(width, height);
      const cardHeight = clamp(radius * 0.23, 30, 76);
      return positions.map(({ x: rx, y: ry, z: rz }, index) => {
        const depth = (rz + 1) / 2;
        const far = clamp(-rz, 0, 1);
        const fog = far * far * (3 - 2 * far);
        const perspective = 3.5 / (3.5 - rz * 0.65) * (1 - 0.28 * fog);
        const card = layout.cards[index];
        const scale = cardHeight / card.h * (0.2 + depth * 0.8);
        const x = width / 2 + rx * radius * perspective;
        const y = height / 2 - 12 - ry * radius * perspective;
        return {
          transform: `translate3d(${(x - card.x - card.w * scale / 2).toFixed(3)}px, ${(y + layout.scrollTop - card.y - card.h * scale / 2).toFixed(3)}px, 0) scale(${scale.toFixed(5)})`,
          opacity: 0.055 + depth * 0.945,
          depth, fog,
          x: x - card.w * scale / 2, y: y - card.h * scale / 2, scale,
        };
      });
    };

    const paint = () => {
      const poses = sphere();
      poses.forEach((pose, index) => {
        items[index].style.transform = pose.transform;
        items[index].style.opacity = pose.opacity.toFixed(4);
        // Two cached surfaces: blend into a fixed soft copy at the far wall.
        // The blur radius never changes, avoiding a live filter on every card.
        sharpLayers[index].style.opacity = (1 - pose.fog).toFixed(3);
        softLayers[index].style.opacity = pose.fog.toFixed(3);
        const layer = String(Math.round(pose.depth * 100));
        if (items[index].style.zIndex !== layer) items[index].style.zIndex = layer;
      });
      return poses;
    };

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const canDrift = () => (!movingRef.current || viewRef.current === "sphere")
      && (!paused || rail.following) && !document.hidden && !motion.matches
      && !previewRef.current?.open;

    const driftSpeed = () => radiusFor(layout.width, layout.height) * DRIFT_SPEED * 3.5 / (3.5 - 0.65);

    const paintGrid = (writeNative) => {
      let top = scroller.scrollTop;
      if (writeNative && Math.abs(top - scroll.position) >= 1) {
        scroller.scrollTop = scroll.position;
        top = writtenScrollTop = observedScrollTop = scroller.scrollTop;
      }
      field.style.transform = `translate3d(0, ${(top - scroll.position).toFixed(4)}px, 0)`;
      callbacks.current.onGridFrame?.(scroll.position, layout.height);
    };

    const stopScrub = () => {
      rail.active = rail.following = false;
      rail.value = rail.target = scroll.position;
      rail.velocity = 0;
    };

    const stopIdle = () => {
      cancelAnimationFrame(idleFrame);
      idleFrame = 0;
      page.dataset.drifting = "false";
    };

    const idleTick = (time) => {
      idleFrame = 0;
      if (!canDrift()) { stopIdle(); return; }
      const steering = dragYaw.value !== dragYaw.target || dragPitch.value !== dragPitch.target;
      if (viewRef.current === "grid" || steering || time - lastIdlePaint >= DRIFT_INTERVAL - 0.5) {
        const seconds = Math.min((time - lastIdleUpdate) / 1000, 0.064);
        lastIdleUpdate = time;
        lastIdlePaint = time - (time - lastIdlePaint) % DRIFT_INTERVAL;
        if (viewRef.current === "sphere") {
          const glide = advanceCoast(coast, seconds);
          rotatePoints(positions,
            advanceSpring(dragYaw, seconds) + glide.x + Math.cos(driftAngle) * DRIFT_SPEED * seconds,
            advanceSpring(dragPitch, seconds) + glide.y + Math.sin(driftAngle) * DRIFT_SPEED * seconds);
          paint();
          if (releasePending) {
            // Sample after integrating this frame, including very quick
            // flicks whose final pointer event arrived before the next paint.
            coast.x = dragYaw.velocity;
            coast.y = dragPitch.velocity;
            for (const spring of [dragYaw, dragPitch]) spring.value = spring.target = spring.velocity = 0;
            releasePending = false;
          }
          if (steering && !gesture && dragYaw.value === dragYaw.target && dragPitch.value === dragPitch.target) selectFront();
        } else {
          // Keep the gentle drift underneath native scrolling too. While
          // native momentum owns scrollTop, only the parent transform moves.
          const speed = driftSpeed();
          if (rail.following) {
            if (!rail.active && !paused) {
              // On release, follow a moving destination. The spring blends
              // straight into ambient motion instead of braking to a halt.
              const destination = { position: rail.target, direction: scroll.direction };
              advanceScroll(destination, seconds, speed, layout.scrollLimit);
              rail.target = destination.position;
              scroll.direction = destination.direction;
            }
            advanceSpring(rail, seconds);
            scroll.position = rail.value = clamp(rail.value, 0, layout.scrollLimit);
            const ambient = paused ? 0 : speed * scroll.direction;
            if (!rail.active && Math.abs(rail.velocity - ambient) < 0.2
              && Math.abs(rail.target - rail.value) < (paused ? 0.001 : speed * 0.15 + 0.05)) rail.following = false;
          } else {
            advanceScroll(scroll, seconds, speed, layout.scrollLimit);
          }
          // Compensate for rounded native pixels on the compositor. This also
          // keeps movement continuous while ownership returns from a gesture.
          paintGrid(rail.following || (!gesture && time >= nativeScrollUntil));
        }
      }
      idleFrame = requestAnimationFrame(idleTick);
    };

    const syncIdle = () => {
      if (document.hidden || previewRef.current?.open) { stopDrag(); stopScrub(); }
      if (!canDrift()) { stopIdle(); return; }
      if (idleFrame) return;
      lastIdlePaint = lastIdleUpdate = performance.now();
      page.dataset.drifting = "true";
      idleFrame = requestAnimationFrame(idleTick);
    };

    function stopDrag() {
      coast.x = coast.y = 0;
      releasePending = false;
      for (const spring of [dragYaw, dragPitch]) {
        spring.value = spring.target = spring.velocity = 0;
      }
    }

    const cancel = () => {
      revision += 1;
      stopIdle();
      animations.forEach((animation) => animation.cancel());
      animations = [];
      stopDrag();
      stopScrub();
    };

    const settle = () => {
      movingRef.current = false;
      delete page.dataset.moving;
      items.forEach((item, index) => {
        item.style.willChange = "";
        if (viewRef.current === "grid") {
          item.style.transform = "";
          item.style.opacity = "";
          item.style.zIndex = "";
          sharpLayers[index].style.opacity = "";
          softLayers[index].style.opacity = "";
        }
      });
      if (viewRef.current === "grid") {
        measure();
        scroll.position = writtenScrollTop = observedScrollTop = scroller.scrollTop;
        field.style.transform = "";
        callbacks.current.onGridFrame?.(scroll.position, layout.height);
      }
      syncIdle();
    };

    const change = (next, index, { instant = false, sourceRect = null, viewportY = 0.5 } = {}) => {
      const before = items.map((item) => ({ rect: item.getBoundingClientRect(), opacity: getComputedStyle(item).opacity }));
      if (sourceRect) before[index] = { rect: sourceRect, opacity: "1" };
      cancel();
      field.style.transform = "";
      movingRef.current = true;
      page.dataset.moving = "true";
      page.dataset.viewInstant = String(instant || reduceRef.current);
      if (next === "sphere" && viewRef.current !== "sphere") {
        // Keep the sphere's current orientation and neighbours. Rotate this
        // actual photo to the front instead of rebuilding the initial layout.
        const selected = positions[index];
        rotatePoints(positions,
          -Math.atan2(selected.x, selected.z),
          Math.atan2(selected.y, Math.hypot(selected.x, selected.z)));
      }
      viewRef.current = next;
      setView(next);
      // Scroll before calculating the destination, but compensate every card
      // from its live screen position so the return never jumps to the top.
      if (next === "grid") callbacks.current.onReturn(index, false, viewportY);
      measure();
      scroll.position = writtenScrollTop = observedScrollTop = scroller.scrollTop;
      nativeScrollUntil = 0;
      if (next === "grid") callbacks.current.onGridFrame?.(scroll.position, layout.height);
      const bounds = scroller.getBoundingClientRect();
      const targets = next === "sphere" ? sphere() : layout.cards.map((card) => ({
        transform: `translate3d(${-card.w / 2}px, 0, 0) scale(1)`,
        opacity: 1, depth: 0, x: card.x - card.w / 2, y: card.y - layout.scrollTop, scale: 1,
      }));
      const currentRevision = revision;
      const ease = getComputedStyle(page).getPropertyValue("--ease-drawer").trim();
      targets.forEach((target, i) => {
        const item = items[i];
        const card = layout.cards[i];
        const { rect, opacity } = before[i];
        item.style.transform = target.transform;
        item.style.opacity = target.opacity;
        sharpLayers[i].style.opacity = next === "sphere" ? 1 - target.fog : "";
        softLayers[i].style.opacity = next === "sphere" ? target.fog : "";
        if (next === "sphere") item.style.zIndex = Math.round(target.depth * 100);
        if (instant || reduceRef.current) return;
        item.style.willChange = "transform, opacity";
        // Invisible grid cards begin just beyond the viewport, rather than
        // crossing thousands of pixels from the bottom of the long page.
        const startTop = rect.top - bounds.top;
        const startY = clamp(startTop, -rect.height - 80, layout.height + 80);
        const endY = clamp(target.y, -card.h * target.scale - 80, layout.height + 80);
        // Animate an offset on top of the live sphere pose. Its base keeps
        // rotating without rewriting (and restarting) the transition effect.
        const from = `translate3d(${(rect.left - bounds.left - target.x) / target.scale}px, ${(startY - target.y) / target.scale}px, 0) scale(${rect.width / card.w / target.scale})`;
        const to = `translate3d(0, ${(endY - target.y) / target.scale}px, 0) scale(1)`;
        const startsOutside = startTop + rect.height < 0 || startTop > layout.height;
        const endsOutside = target.y + card.h * target.scale < 0 || target.y > layout.height;
        const timing = { duration: 800, easing: ease };
        animations.push(
          item.animate([{ transform: from }, { transform: to }], { ...timing, composite: "add" }),
          item.animate([{ opacity: startsOutside ? 0 : opacity }, { opacity: endsOutside ? 0 : target.opacity }], timing),
        );
      });
      if (!animations.length) settle();
      else Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
        if (revision === currentRevision) { animations = []; settle(); }
      });
      syncIdle();
    };

    const selectFront = () => {
      const poses = sphere();
      const front = poses.reduce((best, pose, index) => pose.depth > poses[best].depth ? index : best, 0);
      callbacks.current.onSelect(front);
    };

    const endDrag = (event) => {
      if (!gesture || gesture.id !== event.pointerId) return;
      if (Math.abs(scroller.scrollTop - gesture.scroll) > 6) dragged = true;
      if (dragged && viewRef.current === "sphere") {
        selectFront();
        // Match the live velocity at release, then coast toward ambient speed.
        // No position snap and no spring that first tries to stop completely.
        releasePending = !motion.matches && !paused;
      }
      if (scroller.hasPointerCapture(event.pointerId)) scroller.releasePointerCapture(event.pointerId);
      gesture = null;
      delete page.dataset.dragging;
      syncIdle();
    };

    apiRef.current = {
      change,
      nearestAt(x, y) {
        const { left, top } = scroller.getBoundingClientRect();
        return nearestViewAnchor(items.map((item, index) => ({
          index, rect: item.getBoundingClientRect(), opacity: Number(getComputedStyle(item).opacity),
        })), x, y, { left, top, width: scroller.clientWidth, height: scroller.clientHeight });
      },
      beginScrub() {
        if (!rail.following) rail.velocity = paused || motion.matches ? 0 : scroll.direction * driftSpeed();
        rail.value = rail.target = scroll.position;
        rail.active = rail.following = true;
        nativeScrollUntil = 0;
        syncIdle();
        return scroll.position;
      },
      scrubTo(top) {
        const target = clamp(top, 0, layout.scrollLimit);
        if (target !== rail.target) scroll.direction = Math.sign(target - rail.target);
        rail.target = target;
        if (motion.matches) {
          scroll.position = rail.value = target;
          rail.velocity = 0;
          paintGrid(true);
        } else syncIdle();
      },
      endScrub() {
        rail.active = false;
        if (motion.matches) rail.following = false;
        syncIdle();
      },
      pointerDown(event) {
        dragged = false;
        if (event.button !== 0) return;
        stopScrub();
        stopDrag();
        gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, scroll: scroller.scrollTop };
      },
      pointerMove(event) {
        if (!gesture || gesture.id !== event.pointerId) return;
        if (Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) > 6) dragged = true;
        if (!dragged) return;
        const dx = event.clientX - gesture.x;
        const dy = event.clientY - gesture.y;
        gesture.x = event.clientX;
        gesture.y = event.clientY;
        if (viewRef.current === "grid") {
          if (event.pointerType === "touch" && dy) scroll.direction = -Math.sign(dy);
          return;
        }
        scroller.setPointerCapture(event.pointerId);
        page.dataset.dragging = "true";
        dragYaw.target += dx * DRAG_SPEED;
        dragPitch.target += dy * DRAG_SPEED;
        if (dx || dy) driftAngle = Math.atan2(dy, dx);
        if (motion.matches || paused) {
          rotatePoints(positions, dx * DRAG_SPEED, dy * DRAG_SPEED);
          stopDrag();
          paint();
        } else syncIdle();
      },
      pointerUp: endDrag,
      pointerCancel(event) { dragged = true; stopDrag(); endDrag(event); },
      consumeDrag(event) { return event.detail !== 0 && dragged; },
      keyDown(event) {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.code === "Space" && event.target === scroller) {
          event.preventDefault();
          stopScrub();
          paused = !paused;
          syncIdle();
          return;
        }
        if (viewRef.current === "grid") {
          stopScrub();
          if (["ArrowDown", "PageDown", "End"].includes(event.key)) scroll.direction = 1;
          if (["ArrowUp", "PageUp", "Home"].includes(event.key)) scroll.direction = -1;
          return;
        }
        const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
        if (!directions[event.key]) return;
        event.preventDefault();
        cancel();
        settle();
        driftAngle = Math.atan2(directions[event.key][1], directions[event.key][0]);
        rotatePoints(positions, directions[event.key][0] * Math.PI / 24, directions[event.key][1] * Math.PI / 24);
        paint();
        selectFront();
      },
    };

    const resize = () => {
      stopScrub();
      measure();
      if (viewRef.current !== "sphere" && !movingRef.current) return;
      cancel();
      settle();
      if (viewRef.current === "sphere") paint();
    };
    const onMotion = () => {
      if (motion.matches) { cancel(); settle(); }
      syncIdle();
    };
    const onWheel = (event) => {
      if (viewRef.current === "grid" && !event.ctrlKey && event.deltaY) {
        stopScrub();
        scroll.direction = Math.sign(event.deltaY);
      }
    };
    const onScroll = () => {
      const top = scroller.scrollTop;
      if (viewRef.current === "grid" && !movingRef.current && top !== writtenScrollTop) {
        const delta = top - observedScrollTop;
        if (delta) {
          stopScrub();
          scroll.direction = Math.sign(delta);
          scroll.position = clamp(scroll.position + delta, 0, layout.scrollLimit);
          // Defer native writes, never visual movement, while momentum runs.
          nativeScrollUntil = performance.now() + 64;
        }
        if (!canDrift()) {
          scroll.position = top;
          field.style.transform = "";
        }
        callbacks.current.onGridFrame?.(scroll.position, layout.height);
      }
      observedScrollTop = top;
    };
    const observer = new ResizeObserver(resize);
    const dialogObserver = new MutationObserver(syncIdle);
    observer.observe(scroller);
    dialogObserver.observe(previewRef.current, { attributes: true, attributeFilter: ["open"] });
    scroller.addEventListener("wheel", onWheel, { passive: true });
    scroller.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", syncIdle);
    motion.addEventListener("change", onMotion);
    measure();
    syncIdle();
    return () => {
      cancel();
      field.style.transform = "";
      observer.disconnect();
      dialogObserver.disconnect();
      scroller.removeEventListener("wheel", onWheel);
      scroller.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", syncIdle);
      motion.removeEventListener("change", onMotion);
      apiRef.current = {};
    };
  }, [scrollRef, itemRefs, previewRef, reduceRef]);

  return { view, viewRef, movingRef, apiRef };
}

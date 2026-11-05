"use client";

import { useEffect, useRef } from "react";
import { arrangeRail, railOval } from "./railReveal";

const APPROACH_DISTANCE = 220;
const GROWTH = 0.35;
const NEIGHBOR_RADIUS = 3;
// A critically damped spring with Apple's 0.4s response. Exact integration
// preserves velocity on reversal and is stable across display refresh rates.
const OMEGA = (2 * Math.PI) / 0.4;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function advance(spring, seconds) {
  const error = spring.value - spring.target;
  const velocity = spring.velocity + OMEGA * error;
  const decay = Math.exp(-OMEGA * seconds);
  spring.value = spring.target + (error + velocity * seconds) * decay;
  spring.velocity = (spring.velocity - OMEGA * velocity * seconds) * decay;
  return Math.abs(spring.value - spring.target) > 0.001 || Math.abs(spring.velocity) > 0.001;
}

export default function useProximityRail(railRef, previewRef) {
  const centersRef = useRef([]);
  const revealRef = useRef(() => {});

  useEffect(() => {
    const rail = railRef.current;
    const items = [...rail.children];
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const strength = { value: 0, target: 0, velocity: 0 };
    const pointerY = { value: 0, target: 0, velocity: 0 };
    let profile = items.map(() => 0);
    let bounds;
    let baseHeight;
    let baseGap;
    let baseWidths;
    let viewportHeight;
    let frame = 0;
    let lastTime = 0;

    const restore = () => {
      items.forEach((item) => {
        item.style.willChange = "";
      });
      paint();
    };

    const measure = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      bounds = rail.getBoundingClientRect();
      baseHeight = parseFloat(getComputedStyle(items[0]).height);
      baseGap = parseFloat(getComputedStyle(rail).rowGap);
      baseWidths = items.map((item) => baseHeight * Number(item.style.getPropertyValue("--ratio")));
      viewportHeight = window.innerHeight;
      strength.value = strength.target = strength.velocity = 0;
      restore();
    };

    const paint = () => {
      const step = baseHeight + baseGap;
      const arrange = (weights) => arrangeRail(weights, profile, baseHeight, viewportHeight, baseGap);
      // Size identifies the active band; its neighbors recede progressively.
      // Preserve every photograph's aspect ratio as the band moves.
      const weights = profile.map((amount) => 0.42 + 1.28 * amount * amount);
      const resting = arrange(weights);
      const restingTop = bounds.top;
      const anchorY = clamp(pointerY.value, restingTop + resting.centers[0], restingTop + resting.centers.at(-1));
      const expanded = arrange(weights.map((weight, index) => {
        const distance = Math.abs(restingTop + resting.centers[index] - anchorY);
        const reach = (baseHeight * resting.scales[index] + baseGap) * NEIGHBOR_RADIUS;
        const falloff = Math.cos(clamp(distance / reach, 0, 1) * Math.PI / 2) ** 2;
        return weight * (1 + GROWTH * strength.value * falloff);
      }));
      const { scales, centers } = expanded;

      centersRef.current = centers.map((center) => bounds.top + center);
      items.forEach((item, index) => {
        const naturalCenter = bounds.top + step * index + baseHeight / 2;
        const offset = centersRef.current[index] - naturalCenter;
        item.style.transform = `translate3d(0, ${offset.toFixed(3)}px, 0) scale(${scales[index].toFixed(4)})`;
      });
      const oval = railOval(centersRef.current, scales.map((scale, index) => baseWidths[index] * scale), profile);
      // One small CSS mask for the entire strip, sharing the gallery's frame.
      // No blur filters, perspective, extra animation loop, or React updates.
      rail.style.maskImage = oval
        ? `radial-gradient(ellipse ${oval.radiusX.toFixed(3)}px ${oval.radiusY.toFixed(3)}px at calc(100% - ${oval.inset.toFixed(3)}px) ${(oval.y - bounds.top).toFixed(3)}px, #000 28%, rgb(0 0 0 / .92) 50%, rgb(0 0 0 / .74) 65%, rgb(0 0 0 / .4) 80%, rgb(0 0 0 / .1) 92%, transparent 100%)`
        : "none";
    };

    revealRef.current = (next) => {
      if (!next.some((amount, index) => amount !== profile[index])) return;
      profile = next;
      paint();
    };

    const tick = (time) => {
      frame = 0;
      const seconds = Math.min((time - lastTime) / 1000, 0.064);
      lastTime = time;
      const movingStrength = advance(strength, seconds);
      const movingPointer = advance(pointerY, seconds);
      if (!movingStrength && strength.target === 0) {
        strength.value = strength.velocity = 0;
        restore();
        return;
      }
      paint();
      if (movingStrength || movingPointer) frame = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (frame) return;
      lastTime = performance.now();
      items.forEach((item) => { item.style.willChange = "transform"; });
      frame = requestAnimationFrame(tick);
    };

    const leave = () => {
      strength.target = 0;
      if (strength.value > 0) wake();
    };

    const onPointerMove = (event) => {
      if (!finePointer.matches || event.pointerType !== "mouse" || previewRef.current?.open || rail.inert) {
        leave();
        return;
      }
      const horizontal = clamp(1 - (bounds.right - event.clientX) / APPROACH_DISTANCE, 0, 1);
      const outsideY = Math.max(bounds.top - event.clientY, event.clientY - bounds.bottom, 0);
      const vertical = clamp(1 - outsideY / 80, 0, 1);
      const proximity = horizontal * horizontal * (3 - 2 * horizontal) * vertical;
      if (reducedMotion.matches) {
        return;
      }
      if (strength.value === 0) {
        pointerY.value = event.clientY;
        pointerY.velocity = 0;
      }
      pointerY.target = event.clientY;
      strength.target = proximity;
      if (proximity > 0 || strength.value > 0) wake();
    };
    const onPointerOut = (event) => { if (!event.relatedTarget) leave(); };
    const onVisibility = () => { if (document.hidden) measure(); };
    const onKeyDown = () => { if (strength.value > 0) measure(); };
    const observer = new ResizeObserver(measure);
    measure();
    observer.observe(rail);
    window.addEventListener("resize", measure);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut, { passive: true });
    window.addEventListener("blur", leave);
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibility);
    finePointer.addEventListener("change", measure);
    reducedMotion.addEventListener("change", measure);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("blur", leave);
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibility);
      finePointer.removeEventListener("change", measure);
      reducedMotion.removeEventListener("change", measure);
      revealRef.current = () => {};
    };
  }, [railRef, previewRef]);

  return { centersRef, revealRef };
}

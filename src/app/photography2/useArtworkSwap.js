"use client";

import { useCallback, useEffect, useRef } from "react";

const DURATION = 280;
// The site's casting-menu curve: immediate movement, a soft landing.
const EASING = "cubic-bezier(.32, .72, 0, 1)";

function screenBlur(image, rect) {
  const blur = Number(getComputedStyle(image).filter.match(/blur\(([\d.]+)px\)/)?.[1] || 0);
  return blur * rect.width / Math.max(1, image.offsetWidth);
}

function capture(image) {
  if (!image) return null;
  const rect = image.getBoundingClientRect();
  if (!rect.width || !rect.height || rect.bottom < 0 || rect.top > window.innerHeight || getComputedStyle(image).visibility === "hidden") return null;
  const source = image.tagName === "IMG" ? image : image.querySelector("img");
  const focusing = source !== image;
  return {
    src: source.currentSrc || source.src, rect, opacity: getComputedStyle(image).opacity, blur: screenBlur(image, rect),
    focusBlur: focusing ? screenBlur(source, rect) : 0,
    saturation: focusing ? Number(getComputedStyle(source).filter.match(/saturate\(([\d.]+)\)/)?.[1] || 1) : 1,
  };
}

export default function useArtworkSwap() {
  const flights = useRef(new Map());
  const pending = useRef([]);

  const finish = useCallback((key) => {
    const flight = flights.current.get(key);
    if (!flight) return;
    flights.current.delete(key);
    flight.extraAnimation?.cancel();
    if (flight.target) flight.target.style.visibility = "";
    flight.ghost?.remove();
    flight.animation?.cancel();
  }, []);

  const cancel = useCallback(() => {
    pending.current = [];
    [...flights.current.keys()].forEach(finish);
  }, [finish]);

  const prepare = useCallback((center, card, index) => {
    const cardKey = `card-${index}`;
    // Interrupted selections start from the copies' current visual positions.
    const centerShot = capture(flights.current.get("center")?.ghost || center);
    const cardShot = capture(flights.current.get(cardKey)?.ghost || card);
    finish("center");
    finish(cardKey);
    pending.current = [["center", center, cardShot], [cardKey, card, centerShot]];
    for (const [key, target, shot] of pending.current) {
      target.style.visibility = "hidden";
      let ghost = null;
      if (shot) {
        ghost = document.createElement("div");
        ghost.dataset.artworkFlight = key;
        ghost.dataset.phase = "travel";
        ghost.setAttribute("aria-hidden", "true");
        Object.assign(ghost.style, {
          position: "fixed", zIndex: "100", pointerEvents: "none", margin: "0", maxWidth: "none",
          left: `${shot.rect.left}px`, top: `${shot.rect.top}px`, width: `${shot.rect.width}px`, height: `${shot.rect.height}px`,
          transformOrigin: "top left", objectFit: "contain", opacity: shot.opacity, filter: `blur(${shot.blur}px)`, willChange: "transform, opacity",
        });
        const copy = document.createElement("img");
        copy.src = shot.src;
        copy.alt = "";
        Object.assign(copy.style, { display: "block", width: "100%", height: "100%", objectFit: "contain", maxWidth: "none", filter: `blur(${shot.focusBlur}px) saturate(${shot.saturation})` });
        ghost.appendChild(copy);
        document.body.appendChild(ghost);
      }
      flights.current.set(key, { target, ghost, shot });
    }
  }, [finish]);

  const play = useCallback(() => {
    const requests = pending.current;
    pending.current = [];
    for (const [key] of requests) {
      const flight = flights.current.get(key);
      if (!flight) continue;
      const { target, ghost, shot } = flight;
      const end = target.getBoundingClientRect();
      const opacity = getComputedStyle(target).opacity;
      if (ghost) {
        const transform = `translate(${end.left - shot.rect.left}px, ${end.top - shot.rect.top}px) scale(${end.width / shot.rect.width}, ${end.height / shot.rect.height})`;
        // Compensate for the flying copy's scale so its softness matches the
        // destination exactly when it hands back to the real image.
        const endBlur = screenBlur(target, end) * shot.rect.width / Math.max(1, end.width);
        flight.animation = ghost.animate([{ transform: "none", opacity: shot.opacity, filter: `blur(${shot.blur}px)` }, { transform, opacity, filter: `blur(${endBlur}px)` }], { duration: DURATION, easing: EASING, fill: "forwards" });
        const initialFocus = `blur(${shot.focusBlur}px) saturate(${shot.saturation})`;
        if (key === "center") {
          // Focus changes with the early acceleration, then clears before
          // the final settle. Retarget from the current blur on rapid clicks.
          flight.extraAnimation = ghost.querySelector("img").animate([
            { filter: initialFocus, offset: 0, easing: EASING },
            { filter: `blur(${Math.max(3, shot.focusBlur)}px) saturate(.7)`, offset: 0.22, easing: EASING },
            { filter: "blur(0px) saturate(1)", offset: 0.85 },
            { filter: "blur(0px) saturate(1)", offset: 1 },
          ], { duration: DURATION, easing: "linear", fill: "forwards" });
        } else if (shot.focusBlur || shot.saturation !== 1) {
          flight.extraAnimation = ghost.querySelector("img").animate([
            { filter: initialFocus }, { filter: "blur(0px) saturate(1)" },
          ], { duration: DURATION, easing: EASING, fill: "forwards" });
        }
      } else {
        // A selection made before the center enters has no visible photo to
        // return. Reveal that replacement directly in its surrounding slot.
        target.style.visibility = "";
        flight.animation = target.animate([{ opacity: 0 }, { opacity }], { duration: 160, fill: "forwards" });
      }
      flight.animation.finished.then(() => {
        if (flights.current.get(key) === flight) finish(key);
      }).catch(() => {});
    }
  }, [finish]);

  useEffect(() => {
    const hidden = () => { if (document.hidden) cancel(); };
    window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("touchmove", cancel, { passive: true });
    window.addEventListener("resize", cancel);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchmove", cancel);
      window.removeEventListener("resize", cancel);
      document.removeEventListener("visibilitychange", hidden);
      cancel();
    };
  }, [cancel]);

  return { prepare, play, cancel };
}

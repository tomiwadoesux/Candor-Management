"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export const FOLDER_RETURN_DURATION = 400;
const EASING = "cubic-bezier(.77, 0, .175, 1)";

// Gallery layout is immediate while the floating photos move. Keep fractional
// coordinates so the last frame matches the real card down to the subpixel.
function destinationRect(element) {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { left, top, width, height };
}

function snapshot(element, index) {
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height || rect.bottom <= 0 || rect.top >= window.innerHeight || rect.right <= 0 || rect.left >= window.innerWidth) return null;
  const canvases = Array.from(element.children).filter((child) => child.classList.contains("photography-image-canvas"));
  if (!canvases.length) return null;
  const style = getComputedStyle(element);
  const canvas = document.createElement("span");
  canvas.className = "photography-image-canvas";
  const content = document.createElement("span");
  const width = parseFloat(style.width);
  const height = parseFloat(style.height);
  Object.assign(content.style, {
    position: "absolute", left: "0px", top: "0px", width: `${width}px`, height: `${height}px`,
    transformOrigin: "top left", transform: `scale(${rect.width / width}, ${rect.height / height})`,
  });
  // Preserve the actual composite if a second click interrupts the crop blend.
  for (const original of canvases) {
    const copy = original.cloneNode(true);
    copy.style.opacity = getComputedStyle(original).opacity;
    content.appendChild(copy);
  }
  canvas.appendChild(content);
  return { index, rect, opacity: Number(style.opacity), canvas };
}

function makeCard(layer, photo) {
  const node = document.createElement("div");
  node.className = "photography-image photography-return-card";
  node.dataset.photoIndex = String(photo.index);
  Object.assign(node.style, {
    position: "fixed", left: `${photo.rect.left}px`, top: `${photo.rect.top}px`,
    width: `${photo.rect.width}px`, height: `${photo.rect.height}px`,
    transformOrigin: "top left", pointerEvents: "none", opacity: String(photo.opacity ?? 1),
  });
  const canvas = photo.canvas.cloneNode(true);
  canvas.querySelectorAll("img").forEach((image) => { image.loading = "eager"; });
  node.appendChild(canvas);
  layer.appendChild(node);
  return node;
}

export default function useFolderReturn() {
  const [returningIndices, setReturningIndices] = useState([]);
  const pending = useRef(null);
  const flights = useRef(new Map());

  const dispose = useCallback((index) => {
    const entries = index === undefined ? [...flights.current.entries()] : [[index, flights.current.get(index)]];
    for (const [key, current] of entries) {
      if (!current) continue;
      flights.current.delete(key);
      current.animations.forEach((animation) => animation.cancel());
      current.layer.remove();
      current.removeListeners?.();
    }
  }, []);

  const cancel = useCallback(() => {
    pending.current = null;
    dispose();
    setReturningIndices([]);
  }, [dispose]);

  const prepare = useCallback((requests) => {
    // A quick reopen starts from the photos' current visual positions rather
    // than jumping to the thumbnails and restarting the trip.
    const prepared = requests.map(({ section, index, previewIndices }) => {
      const current = flights.current.get(index);
      const snapshots = current
        ? current.cards.map(({ node, index: photo }) => snapshot(node, photo)).filter(Boolean)
        : Array.from(section.querySelectorAll(".photography-image")).map((element) => snapshot(element, Number(element.dataset.photoIndex))).filter(Boolean);
      return { section, index, previewIndices, snapshots };
    }).filter(({ snapshots }) => snapshots.length);
    dispose();
    pending.current = prepared;
    setReturningIndices(prepared.map(({ index }) => index));
    for (const { index, snapshots } of prepared) {
      const layer = document.createElement("div");
      layer.className = "photography-return-layer";
      layer.setAttribute("aria-hidden", "true");
      document.body.appendChild(layer);
      // Hold the visible photos in place while React lays out the destination.
      // This also avoids a blank frame when responsive measurements settle.
      flights.current.set(index, { index, layer, cards: snapshots.map((photo) => ({ node: makeCard(layer, photo), index: photo.index })), animations: [] });
    }
    return prepared.length > 0;
  }, [dispose]);

  const play = useCallback(() => {
    const requests = pending.current;
    if (!requests?.length) return false;
    pending.current = null;
    for (const request of requests) {
      const expanded = request.section.dataset.open === "true";
      const targets = Array.from(request.section.querySelectorAll(".photography-image"))
        .map((element) => ({ element, index: Number(element.dataset.photoIndex) }))
        .filter(({ index }) => expanded || request.previewIndices.includes(index));
      if (!targets.length) {
        dispose(request.index);
        setReturningIndices((indices) => indices.filter((index) => index !== request.index));
        continue;
      }

      const current = flights.current.get(request.index);
      if (!current) continue;
      const { layer } = current;
      layer.replaceChildren();
      current.cards = [];
      const sources = expanded ? targets.map((target) => {
        const exact = request.snapshots.find((photo) => photo.index === target.index);
        if (exact) return exact;
        const nearest = request.snapshots.reduce((previous, photo) => Math.abs(photo.index - target.index) < Math.abs(previous.index - target.index) ? photo : previous);
        return { index: target.index, rect: nearest.rect, canvas: target.element.querySelector(".photography-image-canvas").cloneNode(true), emerging: true };
      }) : request.snapshots;

      for (const photo of sources) {
        const target = targets.reduce((nearest, candidate) => Math.abs(candidate.index - photo.index) < Math.abs(nearest.index - photo.index) ? candidate : nearest);
        const end = destinationRect(target.element);
        if (!end.width || !end.height) continue;
        const node = makeCard(layer, photo);
        current.cards.push({ node, index: photo.index });
        if (target.index === photo.index) {
          // Resolve crop, focal point and rotation while the frame is moving.
          // This destination canvas has its final dimensions; the inverse
          // scale fits it into the start frame and cancels out upon arrival.
          const destinationCanvas = target.element.querySelector(".photography-image-canvas").cloneNode(true);
          destinationCanvas.querySelectorAll("img").forEach((image) => { image.loading = "eager"; });
          Object.assign(destinationCanvas.style, {
            position: "absolute", left: "0px", top: "0px", width: `${end.width}px`, height: `${end.height}px`,
            transformOrigin: "top left", transform: `scale(${photo.rect.width / end.width}, ${photo.rect.height / end.height})`,
            backgroundColor: getComputedStyle(target.element).backgroundColor,
          });
          node.appendChild(destinationCanvas);
          // Keep the source opaque underneath: fading both layers would briefly
          // expose the page background and create a brightness flash.
          current.animations.push(destinationCanvas.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FOLDER_RETURN_DURATION * 0.8, easing: "ease", fill: "forwards" }));
        }
        const transform = `translate(${end.left - photo.rect.left}px, ${end.top - photo.rect.top}px) scale(${end.width / photo.rect.width}, ${end.height / photo.rect.height})`;
        current.animations.push(node.animate([{ transform: "none" }, { transform }], { duration: FOLDER_RETURN_DURATION, easing: EASING, fill: "forwards" }));
        if (photo.emerging || (target.index === photo.index && photo.opacity < 1)) {
          current.animations.push(node.animate([{ opacity: photo.emerging ? 0 : photo.opacity }, { opacity: 1 }], { duration: 160, fill: "forwards" }));
        }
        // Photos outside the random preview tuck into the nearest slot, fading
        // only at the end of the return instead of vanishing at full size.
        if (target.index !== photo.index) {
          current.animations.push(node.animate([{ opacity: photo.opacity ?? 1, offset: 0 }, { opacity: photo.opacity ?? 1, offset: 0.8 }, { opacity: 0, offset: 1 }], { duration: FOLDER_RETURN_DURATION, fill: "forwards" }));
        }
      }

      const finish = () => {
        if (flights.current.get(request.index) !== current) return;
        current.settled = true;
        setReturningIndices((indices) => indices.filter((index) => index !== request.index));
      };
      window.addEventListener("resize", finish, { once: true });
      window.addEventListener("wheel", finish, { once: true, passive: true });
      current.removeListeners = () => {
        window.removeEventListener("resize", finish);
        window.removeEventListener("wheel", finish);
      };
      Promise.all(current.animations.map((animation) => animation.finished)).then(finish).catch(() => {});
    }
    return true;
  }, [dispose]);

  // This runs after React has revealed the actual gallery, before that frame
  // paints. A requestAnimationFrame alone could remove the copy before React's
  // commit and expose one blank frame.
  useLayoutEffect(() => {
    for (const [index, current] of flights.current) {
      if (current.settled && !returningIndices.includes(index)) dispose(index);
    }
  }, [returningIndices, dispose]);

  useEffect(() => dispose, [dispose]);
  return { returningIndices, prepare, play, cancel };
}

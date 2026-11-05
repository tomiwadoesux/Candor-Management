"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import referenceData from "../references/reference-data.json";
import StudyViewer from "../references/StudyViewer";
import PhotographyGallery from "./PhotographyGallery";
import useFolderReturn, { FOLDER_RETURN_DURATION } from "./useFolderReturn";

const PROJECTS = referenceData.alicia;
const number = (index) => String(index + 1).padStart(2, "0");
function layoutTop(folder) {
  let top = 0;
  for (let node = folder; node; node = node.offsetParent) top += node.offsetTop;
  return top;
}
const NOTES = [
  "Silhouettes, gestures, and the details between them.",
  "A close look at objects, materials, and everyday rituals.",
  "Portraits and the small variations of a pose.",
  "An ongoing conversation between a figure and the frame.",
  "New gestures. Another way of looking.",
  "Form, texture, and the character of an object.",
  "A familiar subject, seen a little differently.",
  "A still-life study of fragrance and form.",
  "Objects gathered around the table.",
  "Flowers, arrangements, and passing moments.",
  "A study of shape and the space around it.",
];

export default function PhotographyPage({ previews }) {
  const [active, setActive] = useState(null);
  const [viewer, setViewer] = useState(null);
  const [instant, setInstant] = useState(false);
  const [reflowing, setReflowing] = useState(false);
  const [movingFolders, setMovingFolders] = useState([]);
  const [hoverEnabled, setHoverEnabled] = useState(true);
  const [preferences, setPreferences] = useState({ edits: {}, folders: {} });
  const reduce = useReducedMotion();
  const folders = useRef([]);
  const triggers = useRef([]);
  const anchor = useRef(null);
  const { returningIndices, prepare: prepareReturn, play: playReturn, cancel: cancelReturn } = useFolderReturn();
  const transition = reduce || instant
    ? { duration: 0 }
    : { duration: 0.28, ease: [0.77, 0, 0.175, 1] };

  const toggle = useCallback((index, event) => {
    const next = active === index ? null : index;
    if (event?.detail !== 0 && !reduce) {
      const indices = new Set([...returningIndices, index]);
      if (active !== null) indices.add(active);
      prepareReturn([...indices].map((sourceIndex) => ({ section: folders.current[sourceIndex], index: sourceIndex, previewIndices: previews[sourceIndex] })));
    } else {
      cancelReturn();
    }
    // A second click can reverse the layout and cancel an in-flight scroll.
    window.scrollTo({ top: window.scrollY, behavior: "instant" });
    anchor.current = { index, viewportTop: folders.current[index].getBoundingClientRect().top, opening: next !== null };
    setInstant(event?.detail === 0);
    setHoverEnabled(false);
    setReflowing(event?.detail !== 0 && !reduce);
    setMovingFolders([active, index]);
    setActive(next);
  }, [active, reduce, returningIndices, previews, prepareReturn, cancelReturn]);

  useEffect(() => {
    if (!reflowing) return;
    const timeout = window.setTimeout(() => setReflowing(false), returningIndices.length ? FOLDER_RETURN_DURATION : 280);
    return () => window.clearTimeout(timeout);
  }, [active, reflowing, returningIndices]);

  useLayoutEffect(() => {
    const pending = anchor.current;
    if (!pending) return;
    anchor.current = null;
    const top = layoutTop(folders.current[pending.index]);
    // Compensate for the space removed above the chosen folder before paint.
    // Its number stays under the pointer instead of jumping up the page.
    const previousTop = pending.viewportTop < 64 ? 112 : pending.viewportTop;
    const anchored = Math.max(0, top - previousTop);
    if (Math.abs(window.scrollY - anchored) > 1) window.scrollTo({ top: anchored, behavior: "instant" });
    if (returningIndices.length) {
      if (pending.opening && previousTop >= window.innerHeight * 0.35) {
        window.scrollTo({ top: Math.max(0, top - 112), behavior: "instant" });
      }
      const frame = requestAnimationFrame(playReturn);
      return () => cancelAnimationFrame(frame);
    }
    if (!pending.opening || previousTop < window.innerHeight * 0.35) return;
    const frame = requestAnimationFrame(() => {
      window.scrollTo({ top: Math.max(0, top - 112), behavior: reduce || instant ? "instant" : "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [active, instant, reduce, returningIndices, playReturn]);

  function close(event) {
    if (active === null) return;
    const index = active;
    toggle(index, event);
    triggers.current[index]?.focus({ preventScroll: true });
  }

  useEffect(() => {
    const escape = (event) => {
      if (event.key !== "Escape" || viewer || active === null) return;
      const index = active;
      toggle(index, { detail: 0 });
      requestAnimationFrame(() => {
        triggers.current[index]?.focus({ preventScroll: true });
      });
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [active, viewer, toggle]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("candor-photography-arrangements-v1"));
      if (saved?.edits && saved?.folders) setPreferences(saved);
    } catch { /* Previously saved crops are optional. */ }
  }, []);

  function openImage(project, index) {
    setViewer({ ...project, index, source: `https://aliciadubuis.com/projects/${project.slug}` });
  }

  return (
    <main aria-label="Photography" className={`photography-page ${active !== null ? "photography-page--open" : ""}`} data-reflowing={reflowing}
      data-hover-enabled={hoverEnabled}
      onPointerMove={() => { if (!reflowing && !returningIndices.length) setHoverEnabled(true); }}>
      <LayoutGroup id="photography-folders">
        <div className="photography-folders">
          {PROJECTS.map((project, index) => {
            const expanded = active === index;
            const id = `photography-folder-${number(index)}`;
            const settings = preferences.folders[project.slug] || {};
            return (
              <section
                className="photography-folder"
                data-open={expanded}
                data-moving={reflowing && movingFolders.includes(index)}
                data-returning={returningIndices.includes(index)}
                key={project.slug}
                ref={(node) => { folders.current[index] = node; }}
                aria-labelledby={`${id}-trigger`}
              >
                <div className="photography-folder-heading">
                  <motion.button
                    layout="position"
                    transition={transition}
                    ref={(node) => { triggers.current[index] = node; }}
                    id={`${id}-trigger`}
                    type="button"
                    aria-label={`${expanded ? "Close" : "Open"} folder ${number(index)}: ${project.title.trim()}`}
                    aria-expanded={expanded}
                    aria-controls={id}
                    onClick={(event) => toggle(index, event)}
                  >{number(index)}</motion.button>
                </div>

                <div className="photography-folder-layout" id={id}>
                  <PhotographyGallery project={project} folderIndex={index} expanded={expanded} note={NOTES[index]}
                    previewIndices={previews[index]}
                    returning={returningIndices.includes(index)}
                    edits={preferences.edits} variant={settings.variant || 0} allowRotation={!!settings.allowRotation}
                    transition={transition} onOpen={openImage} onToggle={toggle} onClose={close} />
                </div>
              </section>
            );
          })}
        </div>
      </LayoutGroup>

      {viewer && <StudyViewer selection={viewer} onClose={() => setViewer(null)} />}
    </main>
  );
}

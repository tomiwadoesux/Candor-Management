"use client";

import { useRef, useState } from "react";
import referenceData from "./reference-data.json";
import { useStudyScroll, jumpTo } from "./useStudyScroll";

const { alicia } = referenceData;
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];

export default function AliciaStudy({ onOpen }) {
  const root = useRef(null);
  const [mode, setMode] = useState("index");
  const [about, setAbout] = useState(false);
  useStudyScroll(root, ({ root: node, height, reduced }) => {
    node.querySelectorAll("[data-strip-body]").forEach((body) => {
      const box = body.getBoundingClientRect();
      const bottomFade = Math.max(0, Math.min(1, (height - box.top) / (height * 0.15)));
      const topFade = Math.max(0, Math.min(1, box.bottom / (height * 0.35)));
      body.style.opacity = reduced ? "1" : String(Math.min(topFade, bottomFade));
    });
  });
  const open = (project, index = 0) => onOpen({ ...project, index, source: `https://aliciadubuis.com/projects/${project.slug}` });
  return (
    <main ref={root} className={`alicia-study alicia-study--${mode}`}>
      <header className="alicia-head">
        <button type="button" onClick={() => jumpTo(0)}>ALICIA DUBUIS</button>
        <div>Photography <small>REP.</small> QUADRIGA <small>E.</small> info@aliciadubuis.com <button onClick={() => setAbout(!about)}>Read More ( {about ? "−" : "+"} )</button></div>
        <button type="button" onClick={() => { setMode("index"); jumpTo(0); }}>ARCHIVE <i>Super Flattering I, Super Flattering II, (31...)</i></button>
      </header>
      <nav className="alicia-mode" aria-label="Gallery layout">
        <button aria-pressed={mode === "overview"} onClick={() => { setMode("overview"); jumpTo(0); }}>OVERVIEW</button><span>/</span><button aria-pressed={mode === "index"} onClick={() => { setMode("index"); jumpTo(0); }}>INDEX</button>
      </nav>
      {about && <aside className="alicia-about"><p>Photography by Alicia Dubuis. Fashion, objects and personal work.</p><a href="https://aliciadubuis.com/" target="_blank" rel="noreferrer">Visit the photographer’s website ↗</a><button onClick={() => setAbout(false)}>Close ( − )</button></aside>}
      <h1 className="study-sr-only">Alicia Dubuis — selected projects</h1>
      <div className="alicia-projects">
        {alicia.map((project, i) => (
          <section className="alicia-project" key={project.slug}>
            <h2><span>{ROMAN[i]}</span><button onClick={() => open(project)}>{project.title}</button></h2>
            <div data-strip-body>
              {mode === "index" ? (
                <div className="alicia-strip">
                  {project.images.map((src, index) => <button key={src} onClick={() => open(project, index)} aria-label={`Open ${project.title}, image ${index + 1}`}><img src={src} alt={`${project.title}, image ${index + 1}`} loading={i === 0 ? "eager" : "lazy"} /></button>)}
                </div>
              ) : <button className="alicia-cover" onClick={() => open(project)}><img src={project.images[0]} alt={project.title} loading={i === 0 ? "eager" : "lazy"} /></button>}
              <p className="alicia-caption"><button onClick={() => open(project)}>{project.title} <small>DATE</small> {project.date} — <span>Images ({project.images.length} ...) ( + )</span></button></p>
            </div>
          </section>
        ))}
      </div>
      <footer className="alicia-footer"><span>Photography © Alicia Dubuis</span><a href="https://aliciadubuis.com/" target="_blank" rel="noreferrer">Original portfolio ↗</a></footer>
    </main>
  );
}

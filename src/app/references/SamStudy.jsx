"use client";

import { Fragment, useState } from "react";
import referenceData from "./reference-data.json";
import { jumpTo } from "./useStudyScroll";

const { sam } = referenceData;
// Short study captions, rather than a copy of the original editorial text.
const NOTES = [
  "Water returns to Kati Thanda–Lake Eyre. An aerial study of the lake’s changing surface in 2025.",
  "People absorbed in their craft, observed through the grain of a 16mm camera.",
  "An invitation to the unfamiliar, photographed for the University of Queensland.",
  "Life and landscape on cattle stations in Queensland’s Gulf Country.",
  "A documentary portrait of people and place in outback Queensland.",
  "Endangered and endemic life along the Mary River.",
  "A film following the people and process behind Australian South Sea pearls.",
];

export default function SamStudy({ onOpen }) {
  const [view, setView] = useState("overview");
  const [active, setActive] = useState(null);
  const open = (project, index = 0) => onOpen({ ...project, index, source: `https://samthies.com/projects/${project.slug}/` });
  const hover = (i) => (event) => { if (event.pointerType === "mouse") setActive(i); };
  return (
    <main className={`sam-study ${active !== null ? "sam-study--focused" : ""}`}>
      <header className="sam-head"><button onClick={() => jumpTo(0)}>Sam Thies</button><div><button aria-pressed={view === "overview"} onClick={() => { setView("overview"); setActive(null); }}>Overview</button><span> / </span><button aria-pressed={view === "list"} onClick={() => { setView("list"); setActive(null); }}>List</button></div><span>Projects, <a href="https://samthies.com/shop/" target="_blank" rel="noreferrer">Shop</a>, <a href="https://samthies.com/about/" target="_blank" rel="noreferrer">About</a></span></header>
      <h1 className="study-sr-only">Sam Thies — projects</h1>
      <div className={`sam-${view}`} onPointerLeave={() => setActive(null)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setActive(null); }}>
        {sam.map((project, i) => view === "overview" ? <Fragment key={project.slug}>
          <button className="sam-description" data-active={active === i} onPointerEnter={hover(i)} onFocus={() => setActive(i)} onClick={() => open(project)}>
            <span className="sam-number">{i + 1}.1—{i + 1}.{project.images.length}</span>
            <h2>{project.title}</h2><span>{project.services}</span><p>{NOTES[i]}</p>
          </button>
          {project.images.map((image, j) => <button key={image.src} className="sam-image" data-active={active === i} onPointerEnter={hover(i)} onFocus={() => setActive(i)} onClick={() => open(project, j)} aria-label={`Open ${project.title}, image ${j + 1}`}>
            <span className="sam-number">{i + 1}.{j + 1}</span><img src={image.src} alt={`${project.title}, image ${j + 1}`} style={{ aspectRatio: image.ratio < 1 ? image.ratio : "4 / 3" }} loading={i < 2 ? "eager" : "lazy"} />
          </button>)}
        </Fragment> : <button className="sam-list-row" key={project.slug} data-active={active === i} onPointerEnter={hover(i)} onFocus={() => setActive(i)} onClick={() => open(project)}><span>{project.title}</span><span>{project.category}</span><span>{project.services}</span><span>({project.images.length})</span><span>{project.year}</span></button>)}
      </div>
      <footer className="sam-footer">Photography © Sam Thies <a href="https://samthies.com/projects/" target="_blank" rel="noreferrer">Original portfolio ↗</a></footer>
    </main>
  );
}

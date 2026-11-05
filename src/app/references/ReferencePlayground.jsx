"use client";

import { useEffect, useState } from "react";
import AliciaStudy from "./AliciaStudy";
import SamStudy from "./SamStudy";
import SortStudy from "./SortStudy";
import StudioStudy from "./StudioStudy";
import EvolveStudy from "./EvolveStudy";
import StudyViewer from "./StudyViewer";
import { jumpTo } from "./useStudyScroll";

const STUDIES = [
  { id: "alicia", name: "Alicia", component: AliciaStudy, source: "https://aliciadubuis.com/" },
  { id: "sam", name: "Sam Thies", component: SamStudy, source: "https://samthies.com/projects/" },
  { id: "sort", name: "Sort Office", component: SortStudy, source: "https://sort-office.com/" },
  { id: "studio", name: "Nothin’", component: StudioStudy, source: "https://www.noth.in/#studio" },
  { id: "evolve", name: "Evolve", component: EvolveStudy, source: "https://madeinevolve.com/" },
];
const readStudy = () => {
  const id = new URLSearchParams(window.location.search).get("study");
  return STUDIES.find((study) => study.id === id) || STUDIES[0];
};

export default function ReferencePlayground({ initialStudy }) {
  const [study, setStudy] = useState(() => STUDIES.find((item) => item.id === initialStudy) || STUDIES[0]);
  const [selection, setSelection] = useState(null);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const read = () => { setStudy(readStudy()); setSelection(null); };
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);
  function choose(next) {
    setSelection(null);
    setStudy(next);
    const url = new URL(window.location.href);
    url.searchParams.set("study", next.id);
    window.history.pushState({}, "", url);
    jumpTo(0);
  }
  const Study = study.component;
  return (
    <div className={`reference-playground study--${study.id}`}>
      <Study key={study.id} onOpen={(item) => setSelection({ ...item, source: item.source || study.source })} />
      {hidden ? <button className="study-restore" onClick={() => setHidden(false)}>Studies +</button> : (
        <nav className="study-switch" aria-label="Reference studies">
          <span className="study-switch__label">Playground</span>
          <div className="study-switch__options">
            {STUDIES.map((item) => <button key={item.id} type="button" aria-pressed={item.id === study.id} onClick={() => choose(item)}>{item.name}</button>)}
          </div>
          <a href="/photography">Photography ↗</a>
          <a href="/photography2">Photography 2 ↗</a>
          <a href={study.source} target="_blank" rel="noreferrer" aria-label={`Open ${study.name} original website`}>Original ↗</a>
          <button type="button" onClick={() => setHidden(true)} aria-label="Hide playground controls">−</button>
        </nav>
      )}
      {selection && <StudyViewer key={`${study.id}-${selection.title}`} selection={selection} onClose={() => setSelection(null)} />}
    </div>
  );
}

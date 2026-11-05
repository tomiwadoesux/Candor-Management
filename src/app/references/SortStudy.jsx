"use client";

import { useState } from "react";
import referenceData from "./reference-data.json";
import { jumpTo } from "./useStudyScroll";

const { sort } = referenceData;
const SLUGS = ["departmentofinterest", "betabar", "evac", "letterbet", "nodobjects", "mycoaudio", "miriambrellenthin", "touski", "reigningchamp"];

export default function SortStudy({ onOpen }) {
  const [view, setView] = useState("work");
  const open = (item, index) => onOpen({ title: item.title, images: [item.image], source: `https://sort-office.com/${SLUGS[index]}/` });
  return (
    <main className="sort-study">
      <header className="sort-head">
        <button onClick={() => { setView("work"); jumpTo(0); }}>SORT OFFICE</button>
        <button aria-pressed={view === "info"} onClick={() => { setView(view === "info" ? "work" : "info"); jumpTo(0); }}>Info</button>
        <button aria-pressed={view === "index"} onClick={() => { setView(view === "index" ? "work" : "index"); jumpTo(0); }}>Index</button>
        <button aria-pressed={view === "contact"} onClick={() => { setView(view === "contact" ? "work" : "contact"); jumpTo(0); }}>Contact</button>
      </header>
      <h1 className="study-sr-only">Sort Office — selected work</h1>
      {view === "work" && <div className="sort-work">
        {[0, 1, 2].map((row) => <div className={`sort-row sort-row--${row}`} key={row}>
          {sort.slice(row * 3, row * 3 + 3).map((item, j) => <button key={item.title} className="sort-project" onClick={() => open(item, row * 3 + j)}>
            <img src={item.image} alt={item.title} loading={row === 0 ? "eager" : "lazy"} />
            <span className="sort-caption">
              <span>[{String(item.number).padStart(2, "0")}]</span>
              <span>{item.title}</span>
            </span>
          </button>)}
        </div>)}
      </div>}
      {view === "index" && <div className="sort-index">{sort.map((item, i) => <button key={item.title} onClick={() => open(item, i)}><span>[{String(item.number).padStart(2, "0")}]</span><span>{item.title}</span><img src={item.image} alt="" /><span>↗</span></button>)}</div>}
      {view === "info" && <section className="sort-info"><h2>A creative office.<br />A considered point of view.</h2><p>Identity, art direction and digital design for makers and brands.</p><a href="https://sort-office.com/info/" target="_blank" rel="noreferrer">More about Sort Office ↗</a></section>}
      {view === "contact" && <section className="sort-info"><h2>Start a conversation.</h2><a href="https://sort-office.com/" target="_blank" rel="noreferrer">Contact Sort Office on the original website ↗</a></section>}
      <footer className="sort-footer"><span>Work © Sort Office</span><button onClick={() => jumpTo(0)}>Back to top ↑</button></footer>
    </main>
  );
}

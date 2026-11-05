"use client";

import { useRef } from "react";
import referenceData from "./reference-data.json";
import { useStudyScroll } from "./useStudyScroll";

const { studio } = referenceData;
export default function StudioStudy({ onOpen }) {
  const root = useRef(null);
  useStudyScroll(root, ({ root: node, top, height, reduced }) => {
    const p = Math.max(0, Math.min(1, -top / height));
    const left = node.querySelector("[data-studio-left]");
    const right = node.querySelector("[data-studio-right]");
    // The screenshot's small frame travels 100px, its large neighbour 60px.
    // Images counter-pan inside their clipped frames (-8% and +10%).
    left.style.transform = `translateY(${reduced ? 0 : p * -100}px)`;
    right.style.transform = `translateY(${reduced ? 0 : p * -60}px)`;
    left.querySelector("img").style.transform = reduced ? "none" : `translateY(${-p * 8}%) scale(1.16)`;
    right.querySelector("img").style.transform = reduced ? "none" : `translateY(${p * 10 - 5}%) scale(1.16)`;
    const heading = node.querySelector("[data-studio-heading]");
    const box = heading.getBoundingClientRect();
    const reveal = Math.max(0, Math.min(1, (height - box.top) / (height * 0.45)));
    heading.style.clipPath = reduced ? "none" : `inset(${(1 - reveal) * 100}% 0 0)`;
  });
  return (
    <main ref={root} className="studio-study">
      <section className="studio-intro">
        <h1>( The Studio )</h1>
        <p className="studio-statement">We called it Nothin’ because it started as a paradox,<br className="studio-desktop-break" /> an empty space open enough to become anything:<br className="studio-desktop-break" /> a campaign, a space, an event, a system...</p>
        <figure className="studio-small" data-studio-left><button onClick={() => onOpen({ title: "Nothin’ — something unexpected", images: studio })}><span className="studio-small__crop"><img src={studio[0]} alt="A silver sculptural form resting on a concrete cube" /></span></button><figcaption>or something<br />unexpected.</figcaption></figure>
        <button className="studio-large" data-studio-right onClick={() => onOpen({ title: "Nothin’ — something unexpected", images: studio, index: 1 })}><img src={studio[1]} alt="A pastel inflated loop floating above a green landscape" /></button>
      </section>
      <section className="studio-perspective"><h2 data-studio-heading>Forms follow<br />perspective.</h2><div className="studio-services"><span>We design :</span><ul>{["Brand identities", "Campaigns", "Digital experiences", "Events", "Visual systems"].map((label) => <li key={label}>{label}</li>)}</ul></div></section>
      <footer className="studio-footer"><span>Creative work © Nothin’</span><a href="https://www.noth.in/" target="_blank" rel="noreferrer">Visit Nothin’ ↗</a></footer>
      <a className="studio-ask" href="https://www.noth.in/#contact" target="_blank" rel="noreferrer">ASK US</a>
    </main>
  );
}

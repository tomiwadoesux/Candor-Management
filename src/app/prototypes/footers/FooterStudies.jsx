"use client";
import {useState,useEffect} from "react";
import FooterEdition,{editions} from "@/components/FooterEditions";
import s from "./studies.module.css";

const number=i=>String(i+1).padStart(2,"0");
export default function FooterStudies({initialVariant}) {
  const [index,set]=useState(initialVariant>=1 && initialVariant<=16 && Number.isInteger(initialVariant)?initialVariant-1:0);
  function select(i) {
    const next=(i+editions.length)%editions.length;
    set(next);
    const url=new URL(location.href);
    url.searchParams.set("v",String(next+1));
    history.replaceState(null,"",url);
  }
  useEffect(()=>{
    function key(e) {
      if(e.altKey||e.metaKey||e.ctrlKey||e.target.closest('input,select,textarea'))return;
      if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();select(index+(e.key==="ArrowLeft"?-1:1));}
    }
    window.addEventListener("keydown",key); return ()=>window.removeEventListener("keydown",key);
  },[index]);
  return <main className={s.lab}><header className={s.header}><div className={s.title}><h1>Candor <i>/</i> Footer studies</h1><span>Collection II</span></div>
    <nav className={s.index} aria-label="Choose a footer">{editions.map(([n],i)=><button key={n} aria-current={i===index?"true":undefined} onClick={()=>select(i)}><small>{number(i)}</small>{n}</button>)}</nav>
    </header><section className={s.preview} aria-label="Selected footer"><div className={s.controls}><span aria-live="polite">{number(index)} / 16　　{editions[index][0]}</span><div><button aria-label="Previous footer" onClick={()=>select(index-1)}>←</button><button aria-label="Next footer" onClick={()=>select(index+1)}>→</button></div></div><FooterEdition key={index} index={index}/></section></main>;
}

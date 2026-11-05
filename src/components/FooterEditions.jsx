"use client";

import { useState } from "react";
import LogoAnimation from "./LogoAnimation";
import { agency, contactMailto, joinMailto, divisions } from "../../data/agency";
import s from "./FooterEditions.module.css";

const frames = ["summer-portrait", "white-heels", "photographers-hands", "silver-study", "city-in-motion"];
const offices = agency.offices.map(o => o.city);
const roster = divisions.map(d => [d.label,d.href]);
const desks = [["Enquiries",contactMailto],["Representation",joinMailto],["Get scouted","/get-scouted"]];
const agencyLinks = [["Agency","/agency"],["Contact","/contact"],["Privacy","/privacy"]];
function Links({items}) {
  return items.map(([name,href]) => <a key={href} href={href}>{name}</a>);
}
function Photo({i=0}) {
  return <img src={'/photography2/'+frames[i]+'.webp'} alt="" />;
}
function Tag({children}) { return <small className={s.tag}>{children}</small>; }
function EndFrame() {
  return <div className={s.endFrame}><Photo/><Tag>Fig. 01　/　End frame</Tag><nav><Links items={desks}/></nav></div>;
}
function SideNotes() {
  return <div className={s.sideNotes}><Tag>Candor　/　Directory</Tag><nav><Links items={roster}/></nav><aside><Tag>Agency desk</Tag><Links items={desks}/></aside></div>;
}
function Contents() {
  return <div className={s.contents}>{roster.map(([name,href],i)=><a href={href} key={href}><Tag>0{i+1}</Tag><i/><strong>{name}</strong></a>)}</div>;
}
function SplitDecision() {
  return <div className={s.split}><a href="/contact"><Tag>For clients　/　01</Tag>Book talent</a><a href="/get-scouted"><Tag>For talent　/　02</Tag>Get scouted</a></div>;
}
function Docket() {
  return <div className={s.docket}><div><Tag>Office copy</Tag><strong>Booking desk</strong></div><dl>{[[agency.contact.phone,agency.contact.phoneHref],[agency.contact.email,contactMailto],[agency.join.email,joinMailto]].map(([v,h],i)=><div key={h}><dt>{["Phone","Bookings","Talent"][i]}</dt><dd><a href={h}>{v}</a></dd></div>)}</dl></div>;
}
function ContactSheet() {
  const [selected,set]=useState(0);
  return <div className={s.sheet}><div><Tag>Contact sheet　/　{String(selected+1).padStart(2,"0")}</Tag><a href="/models">View roster ↗</a></div><div className={s.film}>{frames.map((name,i)=><button type="button" key={name} aria-label={'Expand '+name.replaceAll('-',' ')} aria-pressed={selected===i} onClick={()=>set(i)}><Photo i={i}/></button>)}</div></div>;
}
function OfficeLine() {
  const [city,set]=useState(0);
  return <div className={s.office}><div><Tag>Office directory</Tag>{offices.map((name,i)=><button key={name} aria-pressed={city===i} onClick={()=>set(i)}>{name}</button>)}</div><aside><Tag>{agency.offices[city].country}</Tag><strong>{offices[city]}</strong><a href="/contact">Contact the agency ↗</a></aside></div>;
}
function Marginalia() {
  return <div className={s.marginNote}><Tag>Marginal notes<br/>Candor Management</Tag><p>Models<sup>01</sup>, talents<sup>02</sup><br/>and creatives<sup>03</sup>.</p><nav><Links items={roster}/></nav></div>;
}
function Foldout() {
  return <div className={s.foldout}>{[["Roster",roster],["Booking desk",desks],["Agency",agencyLinks]].map(([name,items],i)=><details key={name} open={i===0}><summary><Tag>0{i+1}</Tag>{name}</summary><nav><Links items={items}/></nav></details>)}</div>;
}
function FilmLeader() {
  return <div className={s.leader}><div><Tag>Agency reel　 /　 End titles</Tag><a href="/sphere2">Enter talent sphere ↗</a></div><div className={s.perfs}>{frames.map((n,i)=><figure key={n}><Photo i={i}/><figcaption>F · 0{i+1}</figcaption></figure>)}</div></div>;
}
function Postcard() {
  return <div className={s.card}><div><Tag>Correspondence</Tag><a href={contactMailto}>Write to us.</a></div><address><Tag>To　/　Candor Management</Tag>{offices.join(' · ')}<a href={contactMailto}>{agency.contact.email}</a></address></div>;
}
function Tracklist() {
  return <div className={s.tracks}><Tag>Side B　/　Agency index</Tag>{[...roster,...agencyLinks].map(([n,h],i)=><a href={h} key={h}><span>{String(i+1).padStart(2,'0')}</span>{n}<i/>↗</a>)}</div>;
}
function Switchboard() {
  const [tab,set]=useState(0);
  return <div className={s.switcher}><div>{["Book","Join","Explore"].map((n,i)=><button key={n} aria-pressed={tab===i} onClick={()=>set(i)}>{n}</button>)}</div><nav><Links items={[[[agency.contact.email,contactMailto],["Contact desk","/contact"]],[[agency.join.email,joinMailto],["Apply for representation","/get-scouted"]],roster][tab]}/></nav></div>;
}
function CaptionCard() {
  return <div className={s.captionCard}><Photo i={2}/><div><Tag>Plate III　/　Agency archive</Tag><a href="/creatives">Behind the image ↗</a></div></div>;
}
function Staircase() {
  return <nav className={s.stairs}>{roster.map(([n,h],i)=><a href={h} key={h}><Tag>0{i+1}</Tag>{n}</a>)}</nav>;
}
function TearOff() {
  return <div className={s.tear}><div><Tag>Talent enquiries</Tag><a href={joinMailto}>Take our number.</a></div><a className={s.stub} href={agency.join.phoneHref}><Tag>Representation　 /　 Tel.</Tag>{agency.join.phone}<i aria-hidden="true"/></a></div>;
}

export const editions = [
  ["End frame",EndFrame],["Side notes",SideNotes],["Contents",Contents],["Split decision",SplitDecision],
  ["Office docket",Docket],["Contact sheet",ContactSheet],["Office line",OfficeLine],["Marginalia",Marginalia],
  ["Foldout",Foldout],["Film leader",FilmLeader],["Postcard",Postcard],["Tracklist",Tracklist],
  ["Switchboard",Switchboard],["Caption card",CaptionCard],["Staircase",Staircase],["Tear-off",TearOff]
];
export default function FooterEdition({index=0}) {
  const [,Body]=editions[index];
  return <footer id="credits" data-ink-fixed="" data-edition={index+1} className={s.footer}>
    <Body/>
    <div className={s.colophon}><a href="/agency">Candor Management</a><nav><Links items={[["Contact","/contact"],["Get scouted","/get-scouted"],["Privacy","/privacy"]]}/></nav></div>
    <a className={s.mark} aria-label="Candor home" href="/"><LogoAnimation animate={false} tight/></a>
  </footer>;
}

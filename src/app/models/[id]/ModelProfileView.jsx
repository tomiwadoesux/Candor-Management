"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/header";
import LogoAnimation from "@/components/LogoAnimation";
import FitText, { initialCaps } from "@/components/FitText";
import ProfileGallery from "@/components/ProfileGallery";
import ProfilePortfolioSection from "@/components/ProfilePortfolioSection";
import ProfileSocialLinks from "@/components/ProfileSocialLinks";
import Lightbox from "@/components/Lightbox";

const metric = (value) => value ? String(value).split("/")[0].trim() : "";
const titleCase = (value) => value ? String(value).toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) : "";

export default function ModelProfileView({ model, sections, scrollItems }) {
  const [lightbox, setLightbox] = useState(null);
  const pageRef = useRef(null);
  const openingItems = useMemo(() => scrollItems.slice(0, 4), [scrollItems]);
  const displayName = model.stageName || model.name;
  const fullName = model.fullName || model.name;
  const doodle = model.doodle ?? {
    src: "/images/doodles/world.svg",
    alt: "Hand-drawn globe with an orbit and small stars",
  };

  const facts = [
    ["Height", metric(model.height)],
    ["Chest", metric(model.chest)],
    ["Waist", metric(model.waist)],
    ["Hips", metric(model.hips)],
    ["Shoe", metric(model.shoe)],
  ].filter(([, value]) => value);
  const about = sections?.find(({ kind }) => kind === "about");
  const biography = about?.text ?? model.bio;
  const bioDetails = sections ? (about?.details ?? []) : [
    ["Eyes", model.eyeColor?.toLowerCase()],
    ["Nationality", titleCase(model.nationality)],
    ["Based", model.based],
    ["Board", titleCase(model.board)],
  ].filter(([, value]) => value);

  // Only measure the initial split. Profile details never translate, scale,
  // or disappear when the gallery passes through the left column.
  useEffect(() => {
    const page = pageRef.current;
    const photoGrid = page.querySelector(".profile-intro-grid");
    const right = page.querySelector(".profile-hero__right");
    const lower = page.querySelector(".profile-hero__lower");
    let disposed = false;
    const measure = () => {
      if (disposed || !photoGrid) return;
      const inset = parseFloat(getComputedStyle(page).getPropertyValue("--profile-inset")) || 16;
      const photoBottom = photoGrid.offsetHeight + inset;
      const available = Math.max(0, window.innerHeight - lower.offsetHeight);
      right.style.setProperty("--profile-photo-bottom", `${Math.min(photoBottom, available)}px`);
    };
    const observer = new ResizeObserver(measure);
    if (photoGrid) observer.observe(photoGrid);
    observer.observe(lower);
    measure();
    document.fonts?.ready.then(measure).catch(() => {});
    window.addEventListener("resize", measure);
    return () => {
      disposed = true;
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [model.id]);

  return (
    <section ref={pageRef} data-has-photos={scrollItems.length > 0} className="model-profile bg-[#fafafa] text-[#0c0c0c] min-h-screen">
      <Header />
      <div className="profile-background-brand" aria-hidden="true">
        <LogoAnimation animate={false} tight className="profile-background-logo" />
      </div>
      <div data-profile-hero className="profile-hero">
        <div className="profile-hero__left">
          <div className="profile-hero__primary">
            <div className="profile-hero__gallery">
              <ProfileGallery items={openingItems} onSelect={setLightbox} preview />
            </div>
          </div>
        </div>

        <div className="profile-hero__right">
          <div className="profile-hero__identity">
            <div className="profile-name-row">
              <h1 className="profile-name uppercase">
                <FitText ignoreTransform maxFontSize={180} align="left" className="font-normal leading-none profile-name__text">
                  <span data-name-text>{initialCaps(displayName, "0.1em")}</span>
                </FitText>
              </h1>
              <p className="profile-full-name">{initialCaps(fullName, "0.22em")}</p>
            </div>
            <figure className="profile-doodle">
              <Image src={doodle.src} alt={doodle.alt || `${displayName} drawing`} width={560} height={320}
                className="profile-doodle__art" />
              {doodle.caption && <figcaption className="profile-doodle__caption">{doodle.caption}</figcaption>}
            </figure>
          </div>
          <div className="profile-hero__lower">
            <div className="profile-hero__details-column">
              <div className="profile-hero__measurements">
                <dl className="profile-facts" aria-label={`${model.name}'s measurements`}>
                  {facts.map(([label, value]) => (
                    <div key={label} className="profile-facts__item">
                      <dt>{label}</dt><dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="profile-actions">
                <ProfileSocialLinks socials={model.socials} name={fullName} />
              </div>
            </div>
            <div className="profile-hero__copy-column">
              <div className="profile-hero__bio-cell">
                <div className="profile-bio">
                  {sections
                    ? biography?.split(/\n+/).map((paragraph, index) => <p key={index}>{paragraph}</p>)
                    : <p><strong>{fullName}</strong>{biography ? ` — ${biography}` : ""}</p>}
                  {bioDetails.length > 0 && <p className="profile-bio__details">
                    {bioDetails.map(([label, value]) => <strong key={label}>{label}: {value}.</strong>)}
                  </p>}
                </div>
                <a className="profile-download" href={`/models/${encodeURIComponent(model.id)}/card`} download>
                  Save Card
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12l4 4v12a2 2 0 0 1-2 2Z" />
                    <path d="M7 3v6h10V3M7 21v-8h10v8" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
        <div data-board id="profile-portfolio" className="profile-board">
          <ProfileGallery items={scrollItems} onSelect={setLightbox} />
          {sections?.filter(({ kind }) => kind !== "gallery" && kind !== "about").map((section) => (
            <section key={section.key} className="pb-20" aria-label={section.label}>
              <ProfilePortfolioSection section={section} name={model.name} onSelect={setLightbox} />
            </section>
          ))}
        </div>
      </div>
      <Lightbox item={lightbox} onClose={() => setLightbox(null)} />
    </section>
  );
}

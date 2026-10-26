"use client";

import Image from "next/image";
import Link from "next/link";
import { createRef, useEffect, useMemo, useRef, useState } from "react";
import ContrastText from "@/components/ContrastText";
import styles from "./gallery.module.css";

export default function Gallery001({ faces, agencyName, contactHref }) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const galleryRef = useRef(null);
  const frameRefs = useMemo(() => faces.map(() => createRef()), [faces]);
  const contrastSources = useMemo(() => {
    // Only decode nearby images for the contrast map; the rest stay lazy.
    const start = Math.max(0, activeIndex - 1);
    const end = Math.min(faces.length, Math.max(1, activeIndex + 2));
    return faces.slice(start, end).map((face, offset) => ({
      src: face.image,
      ref: frameRefs[start + offset],
      objectPosition: { x: 0.5, y: 0.15 },
    }));
  }, [activeIndex, faces, frameRefs]);

  useEffect(() => {
    const items = Array.from(galleryRef.current.children);
    let observer;
    const visible = new Set();

    // A narrow band through the viewport's center selects the current face.
    // Observe the sections so the mobile sticky hold belongs to that face too.
    const observe = () => {
      observer?.disconnect();
      visible.clear();
      const band = Math.round(window.innerHeight / 2) - 1;
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) visible.add(entry.target);
            else visible.delete(entry.target);
          });

          if (visible.size) {
            const current = items.findLastIndex((item) => visible.has(item));
            setActiveIndex(current);
          } else if (items[0].getBoundingClientRect().top > window.innerHeight / 2) {
            setActiveIndex(-1);
          }
        },
        { rootMargin: `-${band}px 0px -${band}px 0px` },
      );
      items.forEach((item) => observer.observe(item));
    };

    observe();
    window.addEventListener("resize", observe);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", observe);
    };
  }, []);

  return (
    <main className={styles.page}>
      <h1 className={styles.srOnly}>{agencyName} — Selected faces</h1>

      <div className={styles.titleOverlay} aria-hidden="true">
        <ContrastText
          key={activeIndex}
          as="h2"
          sources={contrastSources}
          fallback="#000000"
          outsideColor="#000000"
          className={`${styles.headline} ${activeIndex < 0 ? styles.brand : ""}`}
        >
          {activeIndex < 0 ? agencyName : faces[activeIndex].name}
        </ContrastText>
      </div>

      <ol className={styles.gallery} ref={galleryRef} aria-label="Selected faces">
        {faces.map((face, index) => (
          <li
            id={`face-${face.id}`}
            className={styles.project}
            style={{ "--ratio": face.ratio }}
            key={face.id}
          >
            <Link
              ref={frameRefs[index]}
              href={face.href}
              className={styles.frame}
              data-gallery-frame
              aria-label={`View ${face.name}'s profile`}
            >
              <Image
                src={face.image}
                alt={face.name}
                fill
                sizes="(orientation: portrait) 100vw, 90vh"
                priority={index === 0}
                className={styles.image}
              />
            </Link>
          </li>
        ))}
      </ol>

      <a className={styles.contact} href={contactHref}>Get in touch <span aria-hidden="true">↗</span></a>
      <span className={styles.counter} aria-hidden="true">
        {String(Math.max(0, activeIndex + 1)).padStart(2, "0")} / {String(faces.length).padStart(2, "0")}
      </span>
    </main>
  );
}

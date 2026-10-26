"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import LogoAnimation from "@/components/LogoAnimation";
import ChromeLink from "@/components/ChromeLink";
import styles from "./gallery.module.css";

const navigation = [
  { label: "Selected", href: "#selected" },
  { label: "Models", href: "/models" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Gallery002({ faces, agencyName, contactHref, offices }) {
  const [view, setView] = useState("grid");
  const [menuOpen, setMenuOpen] = useState(false);
  const heroRef = useRef(null);
  const headerRef = useRef(null);
  const dialogRef = useRef(null);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    const header = headerRef.current;
    const hero = heroRef.current;
    let frame = 0;
    let start = 0;
    let heroHeight = 0;
    let headerHeight = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      // Follow the document until the navigation reaches the top edge.
      // No eased scroll follower: the header stays attached to the photograph.
      header.style.transform = `translateY(${Math.max(0, start - y)}px)`;
      header.dataset.surface = y + headerHeight >= heroHeight ? "paper" : "image";
    };
    const measure = () => {
      heroHeight = hero.offsetHeight;
      headerHeight = header.offsetHeight;
      const midpoint = window.matchMedia("(min-width: 768px)").matches ? 0.5 : 0.44;
      start = Math.max(0, heroHeight * midpoint - headerHeight / 2);
      update();
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(hero);
    observer.observe(header);
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, []);

  const closeMenu = useCallback(() => {
    dialogRef.current?.close();
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // A menu opened on a phone must not remain over a resized desktop view.
    const desktop = window.matchMedia("(min-width: 768px)");
    const onResize = () => { if (desktop.matches) closeMenu(); };
    desktop.addEventListener("change", onResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      desktop.removeEventListener("change", onResize);
    };
  }, [menuOpen, closeMenu]);

  const openMenu = () => {
    dialogRef.current?.showModal();
    setMenuOpen(true);
  };

  return (
    <main className={styles.page}>
      <a className={styles.skipLink} href="#selected">Skip to selected faces</a>

      <header ref={headerRef} className={styles.header} data-surface="image">
        <Link className={styles.wordmark} href="/002" aria-label={`${agencyName} — 002 home`}>
          <span aria-hidden="true"><LogoAnimation tight animate={false} className={styles.logo} /></span>
        </Link>
        <nav className={styles.desktopNav} aria-label="Main navigation">
          {navigation.map((item) => (
            <ChromeLink key={item.label} href={item.href}>{item.label}</ChromeLink>
          ))}
        </nav>
        <button
          ref={menuButtonRef}
          className={styles.menuButton}
          type="button"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="menu-002"
          onClick={openMenu}
        >
          <span aria-hidden="true">[+]</span>
        </button>
      </header>

      <section ref={heroRef} className={styles.hero} aria-label="Introduction">
        <Image
          src="/photos/img4.jpeg"
          alt="A portrait in a long black coat against a deep red studio backdrop"
          fill
          priority
          sizes="100vw"
          className={styles.heroImage}
        />
        <div className={styles.heroShade} aria-hidden="true" />
        <h1 className={styles.srOnly}>{agencyName} — Models, talents and creatives</h1>
        <div className={styles.heroFooter}>
          {/* Profile URLs are not configured yet; do not invent account links. */}
          <ul className={styles.heroSocials} aria-label="Social media">
            <li>Instagram</li>
            <li>TikTok</li>
            <li>Twitter</li>
          </ul>
        </div>
      </section>

      <section className={styles.selected} id="selected" aria-labelledby="selection-title">
        <div className={styles.toolbar}>
          <h2 id="selection-title">Selected faces <span>({String(faces.length).padStart(2, "0")})</span></h2>
          <div className={styles.viewSwitcher} role="group" aria-label="Display selected faces">
            {["grid", "list"].map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={view === mode}
                onClick={() => setView(mode)}
              >
                <span aria-hidden="true">[{view === mode ? "X" : "\u00a0"}]</span> {mode}
              </button>
            ))}
          </div>
        </div>

        <ol className={styles.gallery} data-view={view} aria-label="Selected faces">
          {faces.map((face, index) => {
            const wide = index % 16 === 7 || index % 16 === 14;
            return (
              <li key={face.id} className={styles.card}>
                <Link className={styles.cardLink} href={face.href} aria-label={`View ${face.name}'s profile`}>
                  <div className={styles.media}>
                    <Image
                      src={face.image}
                      alt={face.name}
                      fill
                      sizes={view === "list" ? "64px" : `(max-width: 767px) calc(100vw - 24px), ${wide ? "67vw" : "33vw"}`}
                      className={styles.cardImage}
                    />
                  </div>
                  <div className={styles.caption}>
                    <span className={styles.number}>{`1.${index + 1}`}</span>
                    <span className={styles.category}>[{face.category}]</span>
                    <h3 className={styles.name}>{face.name}</h3>
                    <span className={styles.profileArrow} aria-hidden="true">↗</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>

        <div className={styles.selectionEnd}>
          <span>Individuality, in good company.</span>
          <Link href="/models">Explore all models <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} {agencyName} Management</span>
        <Link href="/get-scouted">Get scouted</Link>
        <a href={contactHref}>Get in touch ↗</a>
        <Link href="/privacy">Privacy</Link>
        <span>{offices.join(" / ")}</span>
      </footer>

      <dialog
        id="menu-002"
        ref={dialogRef}
        className={styles.menu}
        aria-label="Navigation"
        data-lenis-prevent
        onClose={() => {
          setMenuOpen(false);
          menuButtonRef.current?.focus({ preventScroll: true });
        }}
      >
        <div className={styles.menuTop}>
          <Link className={styles.wordmark} href="/002" onClick={closeMenu} aria-label={`${agencyName} — 002 home`}>
            <span aria-hidden="true"><LogoAnimation tight animate={false} className={styles.logo} /></span>
          </Link>
          <button className={styles.menuClose} type="button" onClick={closeMenu} aria-label="Close menu">[−]</button>
        </div>
        <nav className={styles.menuNav} aria-label="Mobile navigation">
          {navigation.map((item, index) => (
            <Link key={item.label} href={item.href} onClick={closeMenu}>
              <span>0{index + 1}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.menuFooter}>
          <a href={contactHref} onClick={closeMenu}>Get in touch ↗</a>
          <Link href="/get-scouted" onClick={closeMenu}>Become a talent ↗</Link>
          <span>{offices.join(" / ")}</span>
        </div>
      </dialog>
    </main>
  );
}

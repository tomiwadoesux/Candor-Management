"use client";

import { useRef, useState } from "react";
import ChromeLink from "@/components/ChromeLink";
import ViewControls from "./ViewControls";
import styles from "./gallery.module.css";

function outsideCard(event) {
  if (event.target !== event.currentTarget) return false;
  const bounds = event.currentTarget.getBoundingClientRect();
  return event.clientX < bounds.left || event.clientX > bounds.right
    || event.clientY < bounds.top || event.clientY > bounds.bottom;
}

export default function ModelPreview({ dialogRef, person, study, photo, onStep, onClose, view, onViewChange, onBackground }) {
  const pressedOutside = useRef(false);
  const closeButtonRef = useRef(null);
  const lastActionRef = useRef(null);
  const [previewAction, setPreviewAction] = useState("portfolio");

  const previewLink = (event) => {
    if (event.type === "pointerenter" && event.pointerType !== "mouse") return;
    setPreviewAction(event.currentTarget.dataset.preview);
  };

  const resetPreview = (event) => {
    const focusedLink = event.currentTarget.querySelector("a:focus-visible");
    setPreviewAction(focusedLink?.dataset.preview || "portfolio");
  };

  const close = (event) => {
    dialogRef.current.dataset.instant = String(event.detail === 0);
    dialogRef.current.close();
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.preview}
      aria-labelledby="model-preview-name"
      onClose={() => {
        setPreviewAction("portfolio");
        onClose();
      }}
      onCancel={() => { dialogRef.current.dataset.instant = "true"; }}
      onPointerDown={(event) => {
        pressedOutside.current = outsideCard(event) || !event.target.closest("button, a, h2, p, dl, [data-portrait]");
      }}
      onClick={(event) => {
        if (pressedOutside.current && (outsideCard(event) || !event.target.closest("button, a, h2, p, dl, [data-portrait]"))) onBackground(event);
      }}
      onKeyDown={(event) => {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        // Keep tabbing within the card rather than into the browser chrome.
        if (event.key === "Tab") {
          const boundary = event.shiftKey ? closeButtonRef.current : lastActionRef.current;
          if (event.target === boundary) {
            event.preventDefault();
            (event.shiftKey ? lastActionRef.current : closeButtonRef.current).focus();
          }
        }
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          setPreviewAction(event.target.closest("a[data-preview]")?.dataset.preview || "portfolio");
          onStep(event.key === "ArrowRight" ? 1 : -1);
        }
      }}
    >
      <div className={styles.previewCard}>
        <header className={styles.previewHeader}>
          <span>{person.category}</span>
          <span className={styles.previewCount} aria-live="polite" aria-atomic="true">
            <span className={styles.srOnly}>{person.name}, </span>{study.number} <span>/ 053</span>
          </span>
          <button ref={closeButtonRef} className={styles.close} onClick={close} aria-label="Close model card" autoFocus>
            <span>Close</span>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </button>
        </header>

        <div className={styles.previewBody} data-preview={previewAction}>
          <section className={styles.profileDetails}>
            <h2 id="model-preview-name" className={styles.profileName}>{person.name}</h2>
            <nav
              className={styles.profileActions}
              aria-label={`${person.name} profile`}
              onPointerLeave={resetPreview}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setPreviewAction("portfolio");
              }}
            >
              <ChromeLink
                className={styles.indexLink}
                href={`/models/${person.id}`}
                prefetch={false}
                data-preview="portfolio"
                data-active={previewAction === "portfolio"}
                onPointerEnter={previewLink}
                onFocus={previewLink}
              >
                Portfolio
                <span className={styles.indexNote}>Photographs &amp; profile</span>
              </ChromeLink>
              <ChromeLink
                className={styles.indexLink}
                href={person.enquiryHref}
                prefetch={false}
                data-preview="enquiry"
                data-active={previewAction === "enquiry"}
                onPointerEnter={previewLink}
                onFocus={previewLink}
              >
                Enquiry
                <span className={styles.indexNote}>Bookings &amp; collaborations</span>
              </ChromeLink>
            </nav>
          </section>

          <div className={styles.portraitFrame} data-portrait aria-hidden="true">
            <div className={styles.portraitWindow}>
              <div className={styles.largeColor} style={{
                backgroundColor: study.color,
                // The cached thumbnail stays beneath the preview while it loads.
                backgroundImage: photo ? `url("${photo.preview}"), url("${photo.thumbnail}")` : undefined,
              }} />
              <div className={styles.enquiryPreview}>
                <span className={styles.enquiryEyebrow}>Bookings &amp; collaborations</span>
                <p className={styles.enquiryMessage}>{person.name},<br />for your<br />next project.</p>
                <span className={styles.enquiryCaption}>Tell us what you have in mind.</span>
              </div>
            </div>
          </div>
        </div>

        <footer className={styles.previewFooter}>
          <ViewControls view={view} onChange={onViewChange} lastButtonRef={lastActionRef} />
        </footer>
      </div>
    </dialog>
  );
}

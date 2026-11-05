import styles from "./gallery.module.css";

export default function ViewControls({ view, onChange, lastButtonRef }) {
  return (
    <div className={styles.viewIcons} role="group" aria-label="Gallery view">
      <button type="button" className={styles.viewOption} aria-pressed={view === "grid"} aria-label="Grid view" title="Grid view" onClick={(event) => onChange("grid", event)}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
          <rect x="4" y="4" width="6" height="6" />
          <rect x="14" y="4" width="6" height="6" />
          <rect x="4" y="14" width="6" height="6" />
          <rect x="14" y="14" width="6" height="6" />
        </svg>
      </button>
      <button ref={lastButtonRef} type="button" className={styles.viewOption} aria-pressed={view === "sphere"} aria-label="Sphere view" title={view === "sphere" ? "Return to grid" : "Sphere view"} onClick={(event) => onChange(view === "sphere" ? "grid" : "sphere", event)}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" />
          <path d="m12 3.5-3 4.8-4.7.1M12 3.5l5.1 3.8 3.2 6.6M9 8.3l8.1-1-2.2 7.1L9 8.3l-2.1 8.6 8-2.5 1.9 4.6M3.5 12l3.4 4.9 5.1 3.6 2.9-6.1 5.4-.5" />
        </svg>
      </button>
    </div>
  );
}

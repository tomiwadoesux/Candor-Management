"use client";

import { useEffect, useRef, useState } from "react";

// An email address as a mailto link with a quiet "copy" beside it. Plenty of
// people have no mail app set up for mailto: — a webmail user clicking the
// link gets nothing — so the address is also one click from the clipboard.
export default function CopyEmail({ email, href, className = "" }) {
  const [state, setState] = useState("idle"); // idle | copied | failed
  const timer = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(email);
      setState("copied");
    } catch {
      setState("failed");
    }
    timer.current = setTimeout(() => setState("idle"), 1800);
  };

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-3 gap-y-1 ${className}`}>
      <a className="ag-link break-all" href={href || `mailto:${email}`}>
        {email}
      </a>
      <button
        type="button"
        onClick={copy}
        className="cursor-pointer text-[11px] uppercase tracking-[0.07em] transition-opacity hover:opacity-100"
        style={{ color: "var(--ag-faint)" }}
        aria-label={`Copy ${email}`}
      >
        <span aria-live="polite">
          {state === "copied" ? "Copied" : state === "failed" ? "Select to copy" : "Copy"}
        </span>
      </button>
    </span>
  );
}

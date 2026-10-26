"use client";

import { useEffect, useState } from "react";
import { localParts, offsetLabel, pad2, statusLine } from "./officeTime";

// One shared ticker for every clock on the page. Each <LocalClock> used to
// mean its own setInterval; six of them drift apart by a few ms and the
// colons blink out of step, which reads as broken rather than alive.
const listeners = new Set();
let timer = 0;

function subscribe(fn) {
  listeners.add(fn);
  if (!timer) {
    // Align to the next whole second so every clock turns over together.
    const tick = () => {
      const now = new Date();
      for (const l of listeners) l(now);
      timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    };
    timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
  }
  return () => {
    listeners.delete(fn);
    if (!listeners.size) {
      clearTimeout(timer);
      timer = 0;
    }
  };
}

// The current time, re-rendering once a second. null on the server and on the
// first client render, so server and client agree on markup — a clock rendered
// on the server would be a second stale and fail hydration.
export function useNow() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    return subscribe(setNow);
  }, []);
  return now;
}

// "15:04" in the office's zone, with the colon ticking. The label is for
// screen readers: the digits alone say nothing about where.
export function LocalClock({ timeZone, city, className = "" }) {
  const now = useNow();
  if (!now) {
    return (
      <span className={`ag-num ${className}`} aria-hidden="true">
        --<span className="opacity-40">:</span>--
      </span>
    );
  }
  const p = localParts(timeZone, now);
  const hh = pad2(p.hour);
  const mm = pad2(p.minute);
  return (
    <time
      className={`ag-num ${className}`}
      dateTime={`${hh}:${mm}`}
      aria-label={city ? `${hh}:${mm} in ${city}` : undefined}
    >
      {hh}
      <span className="ag-colon" aria-hidden="true">
        :
      </span>
      {mm}
    </time>
  );
}

// "UTC+1". Worked out in the browser, not at build time: these pages are
// static, and an offset baked in during a summer build would be an hour out
// all winter.
export function ZoneLabel({ timeZone, className = "" }) {
  const now = useNow();
  return (
    <span className={`ag-num ${className}`}>
      {now ? offsetLabel(timeZone, now) : "UTC"}
    </span>
  );
}

// The dot and "Open — closes 18:00" line under an office's clock.
export function OfficeStatus({ office, className = "" }) {
  const now = useNow();
  if (!now) {
    // Hold the line's height so nothing jumps when it fills in.
    return (
      <span className={`flex items-center gap-2 ${className}`}>
        <span className="ag-dot" />
        <span className="opacity-0">Closed</span>
      </span>
    );
  }
  const s = statusLine(office, now);
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span className="ag-dot" data-open={s.open} aria-hidden="true" />
      <span>{s.text}</span>
    </span>
  );
}

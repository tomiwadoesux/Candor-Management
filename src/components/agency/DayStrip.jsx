"use client";

import { useEffect, useMemo, useState } from "react";
import { fromMinutes, intersectSpans, officeSpansInDay, pad2 } from "./officeTime";
import { useNow } from "./Clock";

/**
 * DayStrip — the three offices' working hours, drawn on the VISITOR's clock.
 *
 * A booker in Paris wants to know when they can reach Lagos, Manchester and
 * Dallas, in Paris time. So the axis is the visitor's own day, midnight to
 * midnight, and each office's hours are converted onto it from that office's
 * zone. Where every bar overlaps is the window when all three desks are in at
 * once; it is shaded across the rows and spelled out in a sentence underneath.
 * A hairline marks now.
 *
 * Everything depends on the visitor's zone, which the server cannot know, so
 * the strip draws nothing until it has mounted (the rows hold their height).
 * It redraws every minute and at local midnight.
 */

// The spans and their overlap are worked out in officeTime.js, which is pure
// and tested on its own; this file only draws them.
const DAY = 1440;
const pct = (m) => `${(m / DAY) * 100}%`;

export default function DayStrip({ offices }) {
  const now = useNow();
  const [zone, setZone] = useState(null);

  useEffect(() => {
    try {
      setZone(Intl.DateTimeFormat().resolvedOptions().timeZone || null);
    } catch {
      setZone(null);
    }
  }, []);

  // The visitor's midnight, recomputed when the date turns over.
  const dateKey = now ? `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}` : null;
  const dayStart = useMemo(() => {
    if (!now) return null;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey]);

  const rows = useMemo(() => {
    if (dayStart === null) return null;
    return offices.map((o) => ({ office: o, spans: officeSpansInDay(o, dayStart) }));
  }, [offices, dayStart]);

  const shared = useMemo(
    () => (rows ? intersectSpans(rows.map((r) => r.spans)) : []),
    [rows]
  );
  const nowMin = now ? now.getHours() * 60 + now.getMinutes() : null;

  // The sentence under the strip — what the drawing means, in words.
  let summary = " ";
  if (rows) {
    const anyOpen = rows.some((r) => r.spans.length);
    // A window that runs past the visitor's midnight arrives as two pieces,
    // one at each end of the day (Tokyo sees 23:00–24:00 and 00:00–02:00).
    // Said aloud it is one stretch, 23:00 to 02:00, so join it back up.
    const windows = [...shared].sort((p, q) => p[0] - q[0]);
    if (windows.length > 1 && windows[0][0] === 0 && windows[windows.length - 1][1] === 1440) {
      const head = windows.shift();
      const tail = windows.pop();
      windows.push([tail[0], head[1]]);
    }
    if (windows.length) {
      const spans = windows
        .map(([a, b]) => `${fromMinutes(a)} to ${fromMinutes(b)}`)
        .join(" and from ");
      summary = `All three desks are in together from ${spans} your time.`;
    } else if (anyOpen) {
      summary = "The three desks don't overlap today. Write to us, and the next desk to open will pick it up.";
    } else {
      summary = "All three desks are closed today. Write to us, and we'll reply when the first one opens.";
    }
  }

  return (
    <figure className="w-full">
      {/* axis: the visitor's own hours */}
      <div className="grid grid-cols-[96px_1fr] gap-x-4 md:grid-cols-[180px_1fr_88px]">
        <figcaption className="ag-label self-end" style={{ color: "var(--ag-faint)" }}>
          {/* "America/Chicago" -> "Chicago": the city a person would say. */}
          {zone ? `Your time — ${zone.split("/").pop().replace(/_/g, " ")}` : "Your time"}
        </figcaption>
        <div className="relative h-5" aria-hidden="true">
          {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => (
            <span
              key={h}
              className={`ag-num absolute bottom-0 -translate-x-1/2 text-[11px] ${
                h % 6 ? "hidden md:block" : ""
              }`}
              style={{ left: pct(h * 60), color: "var(--ag-faint)" }}
            >
              {h === 0 ? "" : pad2(h)}
            </span>
          ))}
        </div>
        <span className="hidden md:block" />
      </div>

      <div className="relative mt-3">
        {/* The shared window, shaded across every row. Its own grid keeps it
            aligned with the bars' column at every width. */}
        <div
          className="pointer-events-none absolute inset-0 grid grid-cols-[96px_1fr] gap-x-4 md:grid-cols-[180px_1fr_88px]"
          aria-hidden="true"
        >
          <span />
          <div className="relative">
            {shared.map(([a, b]) => (
              <span
                key={`${a}-${b}`}
                className="absolute inset-y-0"
                style={{
                  left: pct(a),
                  width: pct(b - a),
                  background: "rgb(0 116 158 / 0.22)",
                  boxShadow: "inset 1px 0 0 rgb(90 184 220 / 0.5), inset -1px 0 0 rgb(90 184 220 / 0.5)",
                }}
              />
            ))}
            {nowMin !== null && (
              <span
                className="absolute -inset-y-2 w-px"
                style={{ left: pct(nowMin), background: "var(--ag-ink)" }}
              />
            )}
          </div>
        </div>

        <ul className="relative flex flex-col">
          {offices.map((o, i) => {
            const spans = rows ? rows[i].spans : [];
            return (
              <li
                key={o.city}
                className="grid grid-cols-[96px_1fr] items-center gap-x-4 border-t border-[var(--ag-rule)] py-3 last:border-b md:grid-cols-[180px_1fr_88px]"
              >
                <span className="text-[13px]">{o.city}</span>
                <span className="relative block h-3">
                  {/* the whole day, faintly, so a closed office still has a
                      track rather than a gap */}
                  <span
                    className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
                    style={{ background: "var(--ag-rule)" }}
                  />
                  {spans.map(([a, b]) => (
                    <span
                      key={`${a}-${b}`}
                      className="absolute inset-y-0"
                      style={{ left: pct(a), width: pct(b - a), background: "var(--ag-ink)" }}
                    />
                  ))}
                </span>
                <span
                  className="ag-num hidden text-right text-[12px] md:block"
                  style={{ color: "var(--ag-mute)" }}
                >
                  {o.hours ? `${o.hours.open}–${o.hours.close}` : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="ag-body pt-5" style={{ color: "var(--ag-ink)" }} aria-live="off">
        {summary}
      </p>
      <p className="pt-1 text-[12px]" style={{ color: "var(--ag-faint)" }}>
        Office hours shown in each office&rsquo;s own time on the right, drawn in yours on the strip.
      </p>
    </figure>
  );
}

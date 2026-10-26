// Time sums for the offices in data/agency.js.
//
// Pure functions over a Date and an IANA zone — no React, no state — so the
// clocks, the open/closed status and the /contact day strip all read the same
// numbers. Intl does every daylight-saving sum: Manchester and Dallas change
// their clocks (on different weekends), Lagos never does, so nothing here
// hard-codes an offset.

const DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Formatters are expensive to build and these run every second, so each zone
// gets one, made on first use.
const partsFormatters = new Map();
const offsetFormatters = new Map();

export const pad2 = (n) => String(n).padStart(2, "0");

// "09:30" -> 570
export const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + (m || 0);
};

// 570 -> "09:30". Wraps past midnight in either direction.
export const fromMinutes = (mins) => {
  const m = ((Math.round(mins) % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
};

// The wall-clock reading in `timeZone` at `date`: weekday (0 = Sunday), hour,
// minute, second. hourCycle h23 rather than hour12:false — some engines print
// midnight as "24" under the latter.
export function localParts(timeZone, date = new Date()) {
  let f = partsFormatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    partsFormatters.set(timeZone, f);
  }
  const p = {};
  for (const { type, value } of f.formatToParts(date)) p[type] = value;
  return {
    day: DOW[p.weekday] ?? 0,
    hour: Number(p.hour),
    minute: Number(p.minute),
    second: Number(p.second),
  };
}

// Minutes east of UTC in `timeZone` at `date` (Lagos +60, Dallas in summer
// -300). Read from the zone's own "GMT+01:00" name rather than worked out by
// subtracting two Dates, which is off by one around a clock change.
export function offsetMinutes(timeZone, date = new Date()) {
  let f = offsetFormatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "longOffset",
    });
    offsetFormatters.set(timeZone, f);
  }
  const name =
    f.formatToParts(date).find((p) => p.type === "timeZoneName")?.value ||
    "GMT";
  const m = /GMT([+-−])(\d{1,2})(?::?(\d{2}))?/.exec(name);
  if (!m) return 0; // plain "GMT"
  const sign = m[1] === "+" ? 1 : -1;
  return sign * (Number(m[2]) * 60 + Number(m[3] || 0));
}

// "UTC+1", "UTC−5", "UTC" — with a real minus sign, set in tabular figures by
// whoever prints it.
export function offsetLabel(timeZone, date = new Date()) {
  const off = offsetMinutes(timeZone, date);
  if (!off) return "UTC";
  const h = Math.floor(Math.abs(off) / 60);
  const m = Math.abs(off) % 60;
  return `UTC${off > 0 ? "+" : "−"}${h}${m ? `:${pad2(m)}` : ""}`;
}

// The office's opening hours as minutes of the local day, or null on a day it
// is shut.
function hoursOn(office, day) {
  const h = office.hours;
  if (!h || !h.days?.includes(day)) return null;
  return [toMinutes(h.open), toMinutes(h.close)];
}

export function isOpen(office, date = new Date()) {
  const p = localParts(office.timeZone, date);
  const span = hoursOn(office, p.day);
  if (!span) return false;
  const now = p.hour * 60 + p.minute;
  return now >= span[0] && now < span[1];
}

// One line under the clock: "Open — closes 18:00", "Closed — opens 09:00",
// "Closed — opens Mon 09:00". Looks up to a week ahead, so a long weekend or a
// closed office never reads as "opens never".
export function statusLine(office, date = new Date()) {
  const p = localParts(office.timeZone, date);
  const now = p.hour * 60 + p.minute;
  const today = hoursOn(office, p.day);

  if (today && now >= today[0] && now < today[1]) {
    return { open: true, text: `Open — closes ${fromMinutes(today[1])}` };
  }
  if (today && now < today[0]) {
    return { open: false, text: `Closed — opens ${fromMinutes(today[0])}` };
  }
  for (let ahead = 1; ahead <= 7; ahead++) {
    const day = (p.day + ahead) % 7;
    const span = hoursOn(office, day);
    if (span) {
      const when = ahead === 1 ? "tomorrow" : DAY_NAMES[day];
      return { open: false, text: `Closed — opens ${when} ${fromMinutes(span[0])}` };
    }
  }
  return { open: false, text: "Closed" };
}

// The stretch of a working day when every office is open at once, in UTC
// minutes — the window a client can reach all three desks. Uses each office's
// offset on `date`, so it moves when the clocks do. null when there is none.
export function sharedWindowUTC(offices, date = new Date()) {
  let start = -Infinity;
  let end = Infinity;
  for (const o of offices) {
    if (!o.hours) return null;
    const off = offsetMinutes(o.timeZone, date);
    start = Math.max(start, toMinutes(o.hours.open) - off);
    end = Math.min(end, toMinutes(o.hours.close) - off);
  }
  return end > start ? [start, end] : null;
}

// A UTC minute-of-day as the local "HH:MM" in `timeZone` on `date`.
export function utcToLocal(minUTC, timeZone, date = new Date()) {
  return fromMinutes(minUTC + offsetMinutes(timeZone, date));
}

// --- the /contact day strip ------------------------------------------------
// The strip draws each office's hours on the VISITOR's day, so these work in
// absolute instants: "Lagos opens at 09:00 on its own Tuesday" becomes a
// moment, and that moment becomes minutes after the visitor's midnight.

const DAY_MIN = 1440;

// Wall-clock date in `timeZone` at instant `t` (ms): year, month, day, weekday.
export function datePartsIn(timeZone, t) {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const p = {};
  for (const { type, value } of f.formatToParts(t)) p[type] = value;
  return {
    y: Number(p.year),
    m: Number(p.month),
    d: Number(p.day),
    dow: DOW[p.weekday] ?? 0,
  };
}

// The instant (ms) at which `timeZone` reads y-m-d plus `minutes`. Uses the
// zone's offset at noon that day — right everywhere except inside the hour a
// clock changes, and no office opens at 02:00.
export function instantIn(timeZone, { y, m, d }, minutes) {
  const off = offsetMinutes(timeZone, new Date(Date.UTC(y, m - 1, d, 12)));
  return Date.UTC(y, m - 1, d, 0, minutes) - off * 60000;
}

// An office's open spans inside the 24 hours from `dayStart` (ms, the
// visitor's midnight), as [from, to] minutes after it. The office's own
// previous and next days are checked as well: Dallas's afternoon is the small
// hours of the following day in Lagos.
export function officeSpansInDay(office, dayStart) {
  const spans = [];
  if (!office.hours) return spans;
  const open = toMinutes(office.hours.open);
  const close = toMinutes(office.hours.close);
  for (const shift of [-1, 0, 1]) {
    const date = datePartsIn(office.timeZone, dayStart + (12 + shift * 24) * 3600000);
    if (!office.hours.days.includes(date.dow)) continue;
    const a = (instantIn(office.timeZone, date, open) - dayStart) / 60000;
    const b = (instantIn(office.timeZone, date, close) - dayStart) / 60000;
    const from = Math.max(a, 0);
    const to = Math.min(b, DAY_MIN);
    if (to > from) spans.push([from, to]);
  }
  return spans;
}

// Where every list of spans overlaps: the times all offices are open at once.
export function intersectSpans(lists) {
  if (!lists.length) return [];
  let acc = lists[0];
  for (const spans of lists.slice(1)) {
    const next = [];
    for (const [a1, b1] of acc) {
      for (const [a2, b2] of spans) {
        const a = Math.max(a1, a2);
        const b = Math.min(b1, b2);
        if (b > a) next.push([a, b]);
      }
    }
    acc = next;
  }
  return acc;
}

// Lat/lng as a caption: "6.52° N  3.38° E".
export function coordsLabel([lat, lng]) {
  const f = (v) => Math.abs(v).toFixed(2);
  return `${f(lat)}° ${lat >= 0 ? "N" : "S"}  ${f(lng)}° ${lng >= 0 ? "E" : "W"}`;
}

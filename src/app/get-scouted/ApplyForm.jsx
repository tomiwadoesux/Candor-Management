"use client";

import { useState } from "react";

// The application form. Split out of page.js so the copy above it stays a
// server component.
//
// Validation runs here AND in the route handler — this half is for the
// applicant (immediate, per-field), the server half is the one that actually
// decides, since anything in the browser can be bypassed.

const FIELD =
  "w-full border-0 border-b border-black/25 bg-transparent pb-2 text-[15px] text-[#0c0c0c] placeholder-black/30 focus:border-black focus:outline-none";
const LABEL = "text-[12px] uppercase tracking-[0.02em] text-[#0c0c0c]/45";

// Age is checked from the date of birth rather than asked for directly — a
// typed age is a claim, a date is checkable and stays true next year.
//
// Parsed from the string's parts, not via `new Date(dob)`, which reads a bare
// ISO date as UTC midnight and so lands on the previous day west of Greenwich.
// Must stay in step with the same function in api/apply/route.js, which is the
// check that actually decides.
function ageFrom(dob) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dob).trim());
  if (!match) return null;
  const [, y, m, d] = match.map(Number);

  const probe = new Date(y, m - 1, d);
  if (
    probe.getFullYear() !== y ||
    probe.getMonth() !== m - 1 ||
    probe.getDate() !== d
  ) {
    return null;
  }

  const now = new Date();
  let age = now.getFullYear() - y;
  const monthDelta = now.getMonth() + 1 - m;
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < d)) age -= 1;
  return age;
}

const REQUIRED = ["name", "email", "dob", "city", "height"];

export default function ApplyForm({ minAge = 18 }) {
  const [values, setValues] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    city: "",
    height: "",
    instagram: "",
    note: "",
  });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  const set = (key) => (e) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  function validate() {
    const next = {};
    for (const key of REQUIRED) {
      if (!values[key].trim()) next[key] = "Required";
    }
    if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) {
      next.email = "That doesn't look like an email address";
    }
    const age = ageFrom(values.dob);
    if (values.dob && age === null) next.dob = "That date isn't valid";
    else if (age !== null && age < minAge) {
      next.dob = `You must be ${minAge} or over to apply through this form`;
    }
    if (!consent) next.consent = "Required";
    return next;
  }

  async function onSubmit(e) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="mt-8 border border-black/15 p-6 md:p-8">
        <h3 className="text-[15px] font-bold">Application received</h3>
        <p className="mt-2 max-w-lg text-[14px] leading-[1.55] text-[#0c0c0c]/70">
          Thank you — someone on the board will read it. If you haven&rsquo;t
          heard from us within four weeks, it&rsquo;s a no for now.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-8 max-w-2xl">
      <div className="grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2">
        <Field id="name" label="Full name" error={errors.name}>
          <input id="name" className={FIELD} value={values.name} onChange={set("name")} autoComplete="name" />
        </Field>

        <Field id="email" label="Email" error={errors.email}>
          <input id="email" type="email" className={FIELD} value={values.email} onChange={set("email")} autoComplete="email" />
        </Field>

        <Field id="dob" label="Date of birth" error={errors.dob}>
          <input id="dob" type="date" className={FIELD} value={values.dob} onChange={set("dob")} />
        </Field>

        <Field id="phone" label="Phone" hint="Optional" error={errors.phone}>
          <input id="phone" type="tel" className={FIELD} value={values.phone} onChange={set("phone")} autoComplete="tel" />
        </Field>

        <Field id="city" label="City & country" error={errors.city}>
          <input id="city" className={FIELD} value={values.city} onChange={set("city")} placeholder="Lagos, Nigeria" />
        </Field>

        <Field id="height" label="Height" error={errors.height}>
          <input id="height" className={FIELD} value={values.height} onChange={set("height")} placeholder="175 cm / 5'9&quot;" />
        </Field>

        <Field id="instagram" label="Instagram" hint="Optional" error={errors.instagram}>
          <input id="instagram" className={FIELD} value={values.instagram} onChange={set("instagram")} placeholder="@" />
        </Field>
      </div>

      <div className="mt-7">
        <Field id="note" label="Anything else" hint="Optional">
          <textarea id="note" rows={3} className={`${FIELD} resize-none`} value={values.note} onChange={set("note")} />
        </Field>
      </div>

      {/* Digitals upload is deliberately NOT wired yet: there is nowhere to
          put the files. Until a store is connected, applicants are asked for
          them by email rather than being given an upload that silently drops
          what they send. */}
      <p className="mt-8 border-l-2 border-black/15 pl-4 text-[13px] leading-[1.55] text-[#0c0c0c]/60">
        Send your six digitals by email once you&rsquo;ve submitted this form —
        we&rsquo;ll match them to your application by name.
      </p>

      <label className="mt-8 flex items-start gap-3 text-[13px] leading-[1.5]">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#00749E]"
        />
        <span className={errors.consent ? "text-[#b00]" : "text-[#0c0c0c]/70"}>
          I confirm I am {minAge} or over, and I agree to Candor holding the
          details above for the purpose of considering this application.
        </span>
      </label>

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-8 cursor-pointer bg-[#00749E] px-4 py-2.5 text-[13px] font-bold uppercase tracking-[0.02em] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "[ Submit application ]"}
      </button>

      {status === "error" && (
        <p role="alert" className="mt-4 text-[13px] text-[#b00]">
          Something went wrong sending that. Try again, or email us directly.
        </p>
      )}
    </form>
  );
}

function Field({ id, label, hint, error, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={LABEL}>
        {label}
        {hint && <span className="ml-2 normal-case text-[#0c0c0c]/30">{hint}</span>}
      </label>
      {children}
      {error && (
        <span role="alert" className="text-[12px] text-[#b00]">
          {error}
        </span>
      )}
    </div>
  );
}

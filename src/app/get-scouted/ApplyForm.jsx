"use client";

import { cloneElement, useState } from "react";
import Link from "next/link";
import { agency, joinMailto } from "../../../data/agency";

// The application form. Split out of page.js so the copy above it stays a
// server component.
//
// Validation runs here AND in the route handler — this half is for the
// applicant (immediate, per-field), the server half is the one that actually
// decides, since anything in the browser can be bypassed.

const FIELD = "scout-input";

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
    if (Object.keys(found).length) {
      e.currentTarget.elements.namedItem(Object.keys(found)[0])?.focus();
      return;
    }

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
      <div className="scout-success" role="status">
        <h3>Application received.</h3>
        <p>Thank you — someone on the board will read it. If you haven&rsquo;t heard from us within four weeks, it&rsquo;s a no for now.</p>
        <p>One last step: email your six digitals with your full name.</p>
        <a href={joinMailto}>{agency.join.email}</a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="scout-form" aria-label="Scouting application" aria-busy={status === "sending"}>
      <p className="scout-form__intro">All fields are required unless marked optional.</p>
      <div className="scout-form__grid">
        <Field id="name" label="Full name" error={errors.name}>
          <input id="name" className={FIELD} value={values.name} onChange={set("name")} autoComplete="name" />
        </Field>
        <Field id="email" label="Email" error={errors.email}>
          <input id="email" type="email" className={FIELD} value={values.email} onChange={set("email")} autoComplete="email" />
        </Field>
        <Field id="dob" label="Date of birth" error={errors.dob}>
          <input id="dob" type="date" className={FIELD} value={values.dob} onChange={set("dob")} autoComplete="bday" />
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
          <input id="instagram" className={FIELD} value={values.instagram} onChange={set("instagram")} placeholder="@yourname" autoCapitalize="none" spellCheck={false} />
        </Field>
      </div>
      <div className="scout-form__note">
        <Field id="note" label="Anything else" hint="Optional">
          <textarea id="note" rows={3} className={FIELD} value={values.note} onChange={set("note")} placeholder="A little about you…" />
        </Field>
      </div>
      <p className="scout-form__digitals">After submitting, send your six digitals to <a href={joinMailto}>{agency.join.email}</a>. Include your full name so we can match them to your application.</p>
      <label className="scout-consent">
        <input id="consent" name="consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? "consent-error" : undefined} />
        <span>I confirm I am {minAge} or over and I&rsquo;ve read <Link href="/privacy#applicants">how Candor handles applications</Link>.</span>
      </label>
      {errors.consent && <p id="consent-error" role="alert" className="scout-field__error">Please confirm before submitting.</p>}
      <button type="submit" disabled={status === "sending"} className="scout-submit">{status === "sending" ? "Sending…" : "Submit application"}<span aria-hidden="true">↗</span></button>
      {status === "error" && <p role="alert" className="scout-form__error">Something went wrong sending that. Try again, or <a href={joinMailto}>email us directly</a>.</p>}
    </form>
  );
}

function Field({ id, label, hint, error, children }) {
  return (
    <div className="scout-field">
      <label htmlFor={id}>{label}{hint && <span>{hint}</span>}</label>
      {cloneElement(children, {
        name: id,
        required: !hint,
        "aria-invalid": Boolean(error),
        "aria-describedby": error ? `${id}-error` : undefined,
      })}
      {error && <span id={`${id}-error`} role="alert" className="scout-field__error">{error}</span>}
    </div>
  );
}

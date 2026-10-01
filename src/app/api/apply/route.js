// POST /api/apply — the /get-scouted application endpoint.
//
// ─────────────────────────────────────────────────────────────────────────
// NOT YET PERSISTING. There is no datastore connected to this project, so a
// valid application is validated, logged, and then dropped. The `persist()`
// call below is the single seam to fill in — see the TODO there.
//
// This is deliberate rather than unfinished: silently accepting applications
// into nowhere while telling the applicant "application received" would be
// worse than not shipping the form. Before this goes live, either
//   (a) connect a store and implement persist(), or
//   (b) point the form at a mailto: so submissions reach a human.
// ─────────────────────────────────────────────────────────────────────────

const MIN_AGE = 18;

// Everything the form sends. Anything not on this list is discarded rather
// than stored — an endpoint that persists arbitrary posted JSON is how you end
// up holding data you never meant to collect.
const FIELDS = [
  "name",
  "email",
  "phone",
  "dob",
  "city",
  "height",
  "instagram",
  "note",
];

const REQUIRED = ["name", "email", "dob", "city", "height"];

const MAX = { name: 120, email: 200, phone: 40, city: 120, height: 60, instagram: 60, note: 2000 };

// Age from a "YYYY-MM-DD" date of birth.
//
// The parts are pulled out of the string rather than handed to `new Date(dob)`:
// that parses a bare ISO date as UTC MIDNIGHT, so west of Greenwich it lands on
// the previous day in local time. The age gate then read someone who turns 18
// tomorrow as already 18 — which is exactly the case this check exists to
// catch. Comparing plain numbers keeps it timezone-free.
function ageFrom(dob) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dob).trim());
  if (!match) return null;
  const [, y, m, d] = match.map(Number);

  // Reject a date that doesn't exist (2009-02-30 would otherwise roll over).
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

function validate(body) {
  const errors = {};
  const clean = {};

  for (const key of FIELDS) {
    const raw = body?.[key];
    const value = typeof raw === "string" ? raw.trim() : "";
    if (value.length > (MAX[key] ?? 500)) {
      errors[key] = "Too long";
      continue;
    }
    clean[key] = value;
  }

  for (const key of REQUIRED) {
    if (!clean[key]) errors[key] = "Required";
  }

  if (clean.email && !/^\S+@\S+\.\S+$/.test(clean.email)) {
    errors.email = "Invalid email";
  }

  // The age gate. The form checks this too, but that check is a courtesy —
  // this one is the one that counts, because the browser half can be skipped.
  if (clean.dob) {
    const age = ageFrom(clean.dob);
    if (age === null) errors.dob = "Invalid date";
    else if (age < MIN_AGE) errors.dob = `Applicants must be ${MIN_AGE} or over`;
    else if (age > 120) errors.dob = "Invalid date";
  }

  return { errors, clean };
}

// TODO: no datastore is connected to this project yet.
//
// When one is, this is the only function that should need writing. It must:
//   - write the application somewhere durable, and
//   - keep it out of logs and out of version control.
//
// Whatever it becomes, the age gate above stays: this endpoint should never
// store a record for someone under 18.
async function persist(application) {
  console.log(
    "[apply] application received (NOT STORED — no datastore connected):",
    { name: application.name, city: application.city }
  );
  return { stored: false };
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Malformed request" }, { status: 400 });
  }

  const { errors, clean } = validate(body);
  if (Object.keys(errors).length) {
    return Response.json({ errors }, { status: 422 });
  }

  try {
    await persist(clean);
  } catch (err) {
    // Don't echo the underlying error to the client — it can carry
    // connection details. Log it, and tell the applicant to email instead.
    console.error("[apply] persist failed:", err);
    return Response.json(
      { error: "Could not save that application" },
      { status: 500 }
    );
  }

  return Response.json({ ok: true }, { status: 201 });
}

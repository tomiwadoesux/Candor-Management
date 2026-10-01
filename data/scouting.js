// data/scouting.js
//
// Everything /get-scouted says, in one place — so the requirements, the
// digitals brief and the process can be corrected by whoever runs the board
// without touching the page.
//
// PLACEHOLDER COPY. The structure is right; the specifics are the agency's to
// confirm — particularly the height ranges and the response window, which are
// promises to applicants and shouldn't ship as guesses.

export const scouting = {
  // The page's opening claim. Short, and first on the page.
  intro:
    "We look for faces we haven't seen before. No experience is needed and no experience counts against you — what we want is a clear set of pictures and an honest application.",

  // THE ANTI-SCAM NOTICE. This sits above the form, not in the footer.
  // Fake scouts trading on agency names are common, and the single most
  // useful thing an agency site can do about it is state the rule plainly
  // and name the only address applications are read at.
  noFees: {
    heading: "We never charge a fee",
    body: "Candor does not charge for applications, tests, portfolios, or placement on a board. We will never ask you for payment. Applications are only read at the address below — if someone approaches you claiming to scout for Candor from any other account, it is not us.",
  },

  // 18+ only for now. Stated once, plainly, and enforced by the form.
  eligibility: {
    minAge: 18,
    note: "You must be 18 or over to apply. We are not accepting applications from under-18s through this form at present.",
  },

  requirements: [
    { label: "Age", detail: "18 or over" },
    { label: "Women", detail: "5'8\" – 6'0\" (173 – 183 cm)" },
    { label: "Men", detail: "5'11\" – 6'3\" (180 – 190 cm)" },
    {
      label: "Based",
      detail: "Anywhere. We represent talent in Lagos, Manchester and Dallas, and work with clients internationally.",
    },
  ],

  // What we are NOT looking for — the single highest-leverage block on the
  // page. Being specific here is what keeps the inbox usable.
  notLookingFor: [
    "Retouched or filtered photographs",
    "Professional portfolio shots — we want to see you, not a photographer's work",
    "Group photos, or pictures with anyone else in frame",
    "Mirror selfies",
  ],

  // The digitals brief. `reference` points at a board image standing in for
  // the shot — swap these for real reference frames when they exist.
  digitals: {
    heading: "Your digitals",
    intro:
      "Six pictures, taken on a phone, in natural light against a plain wall. No makeup, hair down, fitted plain clothing, flat shoes or bare feet. These are not meant to be flattering — they are meant to be accurate.",
    shots: [
      { shot: "Head, straight on", guidance: "Face to camera, neutral expression, hair back off the face.", reference: "/images/img1.jpeg" },
      { shot: "Head, profile", guidance: "Turned fully to one side.", reference: "/images/img2.jpeg" },
      { shot: "Head, three-quarter", guidance: "Halfway between the two above.", reference: "/images/img3.jpeg" },
      { shot: "Full length, front", guidance: "Whole body in frame, arms relaxed at your sides.", reference: "/images/img4.jpeg" },
      { shot: "Full length, side", guidance: "Whole body, turned fully to one side.", reference: "/images/img5.jpeg" },
      { shot: "Hands", guidance: "Both hands, palms down, no rings.", reference: "/images/img6.jpeg" },
    ],
  },

  // What happens after submit. The response window is a promise — confirm it
  // before this goes live.
  process: [
    { step: "We read it", detail: "Every application is looked at by someone on the board, not filtered automatically." },
    { step: "We reply within four weeks", detail: "If you haven't heard from us in four weeks, it's a no for now. It isn't a no forever — boards change, and you're welcome to apply again in six months." },
    { step: "We meet", detail: "If we'd like to take it further we'll invite you to meet us, in person where we can and by video where we can't. You never pay to attend." },
  ],

  // Open calls. Empty is a valid state — the page hides the section.
  openCalls: [],
};

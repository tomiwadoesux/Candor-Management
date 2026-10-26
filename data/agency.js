// data/agency.js
//
// The agency's own details — the one place they live.
//
// These strings were previously hardcoded in five separate components
// (app/sphere2/Sphere2.jsx, components/Choose.js, components/ModelRail.jsx,
// components/InNav.js and components/footer.js), and had already drifted: the
// footer carried a candor@email.com / +234 123 458 7890 pair that appears
// nowhere else, and InNav a third phone number again. Import from here instead
// of retyping, so a change to a phone number is one edit.
//
// The split matters and is deliberate: JOIN is the talent-facing address
// (people asking to be represented), CONTACT is the client-facing one
// (bookers). The sphere board and the Choose section already present them as
// two separate columns — "MODELS & TALENT" and "INFO" — and that division is
// the thing to preserve, not flatten.

export const agency = {
  name: "Candor",
  legalName: "Candor Management",
  founded: "2015",

  // Talent-facing: applications, submissions, "become a talent".
  join: {
    label: "Models & Talent",
    email: "join@candormanagement.com",
    phone: "+44 812 751 8055",
    // tel: hrefs want no spaces or punctuation.
    phoneHref: "tel:+448127518055",
  },

  // Client-facing: bookings, press, general enquiries.
  contact: {
    label: "Info",
    email: "contact@candormanagement.com",
    phone: "+234 817 751 8066",
    phoneHref: "tel:+2348177518066",
  },

  // The three cities already named in the nav's Studios column.
  //
  // `timeZone` is an IANA zone, so /contact and /about can print each office's
  // local time and whether it is open — Intl does the daylight-saving sums,
  // which matter here: Manchester and Dallas both move their clocks, Lagos
  // never does, so the overlap between the three changes twice a year.
  // `coords` is the city centre (lat, lng), printed as a caption, not a pin.
  //
  // PLACEHOLDER HOURS. Monday to Friday, 09:00–18:00 local, is a guess at a
  // booking desk's day. Confirm each office's real hours before launch: the
  // contact page tells a client whether someone will pick up.
  //
  // `address` is the street address, printed on /contact when filled in. The
  // UK e-commerce rules require the geographic address the business is
  // established at, and Nigerian data-protection law the place of business —
  // a city name alone satisfies neither.
  offices: [
    {
      city: "Lagos",
      country: "Nigeria",
      timeZone: "Africa/Lagos",
      coords: [6.5244, 3.3792],
      hours: { days: [1, 2, 3, 4, 5], open: "09:00", close: "18:00" },
      address: null,
    },
    {
      city: "Manchester",
      country: "United Kingdom",
      timeZone: "Europe/London",
      coords: [53.4808, -2.2426],
      hours: { days: [1, 2, 3, 4, 5], open: "09:00", close: "18:00" },
      address: null,
    },
    {
      city: "Dallas",
      country: "United States",
      timeZone: "America/Chicago",
      coords: [32.7767, -96.797],
      hours: { days: [1, 2, 3, 4, 5], open: "09:00", close: "18:00" },
      address: null,
    },
  ],

  socials: [
    { label: "Instagram", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "Youtube", href: "#" },
  ],
};

// The three divisions, in nav order. `slug` is the route, `division` is the
// field on a model record (data/models.js), and `sublabels` are the discipline
// headings the nav already prints under each — kept here so the nav, the
// boards and the filters all read one list.
export const divisions = [
  {
    slug: "models",
    division: "models",
    label: "Models",
    href: "/models",
    sublabels: ["New Faces", "Development", "Established", "Mainboard"],
  },
  {
    slug: "talents",
    division: "talents",
    label: "Talents",
    href: "/talents",
    sublabels: ["Actor", "Dancer", "Make Up Artist", "Hair Stylist"],
  },
  {
    slug: "creatives",
    division: "creatives",
    label: "Creatives",
    href: "/creatives",
    sublabels: ["Fashion Stylist", "Artist", "Photographer", "Creative Director"],
  },
];

// mailto:/tel: hrefs, so a component never has to build one.
export const joinMailto = `mailto:${agency.join.email}`;
export const contactMailto = `mailto:${agency.contact.email}`;

// A mailto: with the subject line filled in, so an enquiry lands in the right
// pile without the site inventing an inbox per department. /contact uses it to
// route press and bookings through the one client address.
export const mailtoWith = (email, subject) =>
  `mailto:${email}?subject=${encodeURIComponent(subject)}`;

// The registered company behind the site, for the footer of every agency page
// and for the privacy policy's "who we are".
//
// PLACEHOLDER — EVERY NULL HERE IS A LAUNCH BLOCKER for the UK office. A UK
// company's website must show its registered name, company number, place of
// registration and registered office address (the Companies (Trading
// Disclosures) rules). The pages print whichever of these are filled in and
// skip the rest, so nothing invented ever reaches the screen — but a null is a
// gap a lawyer will ask about, not a style choice.
export const legal = {
  // The name on the certificate of incorporation, which may not be the
  // trading name ("Candor Management" may be "Candor Management Ltd").
  registeredName: agency.legalName,
  companyNumber: null, // e.g. "12345678"
  placeOfRegistration: null, // e.g. "England and Wales"
  registeredOffice: null, // e.g. "1 Example Street, Manchester M1 1AA"
  // VAT number, if registered. The UK e-commerce rules want it on the site
  // when the business is VAT-registered.
  vatNumber: null,
  // The ICO data protection fee reference, once paid. Printed in the privacy
  // policy when present.
  icoRegistration: null,
  // NIGERIA. With applicants, talent and client contacts together, Candor is
  // very likely a "data controller of major importance" under the Nigeria
  // Data Protection Act 2023 (more than 200 people's data in six months):
  // that means registering with the NDPC and designating a Data Protection
  // Officer whose contact is published. Both print in /privacy when filled.
  ndpcRegistration: null,
  dpo: null, // e.g. { name: "…", email: "dpo@candormanagement.com" }
  // Where privacy requests go. Falls back to the client address until a
  // dedicated mailbox exists — a privacy@ alias is worth setting up.
  privacyEmail: null,
};

export const privacyEmail = legal.privacyEmail || agency.contact.email;

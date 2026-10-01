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
  offices: [
    { city: "Lagos", country: "Nigeria" },
    { city: "Manchester", country: "United Kingdom" },
    { city: "Dallas", country: "United States" },
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

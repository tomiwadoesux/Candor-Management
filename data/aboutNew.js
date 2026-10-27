// data/aboutNew.js
//
// Everything /about-new prints, in one place, so the page can be rewritten
// without touching its layout.
//
// PLACEHOLDER COPY. The layout is a study of a reference page; the words are
// Candor's own drafts and every name below is a stand-in. The counts, cities
// and inboxes are read from data/models.js and data/agency.js, so they move
// when the roster does.

import { about } from "./about";
import { agency, divisions } from "./agency";
import { models } from "./models";
import { scouting } from "./scouting";

const boardCount = (division) =>
  models.filter((m) => m.division === division).length;

export const aboutNew = {
  nav: [
    { label: "Home", href: "/" },
    { label: "Models", href: "/models" },
    { label: "About", href: "/about-new", current: true },
    { label: "Talents", href: "/talents" },
    { label: "Contact", href: "/contact" },
  ],
  cta: { label: "Get scouted", href: "/get-scouted" },

  // Opening statement. The first line is indented in the layout.
  statement:
    "We are scouts, bookers and agents in Lagos, Manchester and Dallas, finding faces early and building careers that outlast the first booking.",

  // The row under the statement: a two-line label, then the promises, which
  // are the titles /about already makes in data/about.js.
  promisesLabel: ["Four promises", "behind every board"],
  promises: about.principles.map((p) => p.title),
  promisesNote:
    "None of these are slogans. They decide how we scout, who we put forward and what we will never sell you: no shoots, no courses, no portfolios.",

  // The one giant word, set in the display face, with a line under it laid
  // out like the header: the name on the left, the way in on the right.
  bigWord: "JOIN",
  bigWordCaption: "candor",

  // The tilted wall of pictures. Four columns; each moves at its own speed.
  wall: [
    ["/photos/img1.jpeg", "/photos/img12.jpeg", "/photos/img3.jpeg"],
    ["/photos/img14.jpeg", "/photos/img5.jpeg", "/photos/img16.jpeg"],
    ["/photos/img17.jpeg", "/photos/img18.jpeg", "/photos/img19.jpeg"],
    ["/photos/img20.jpeg", "/photos/img21.jpeg", "/photos/img22.jpeg"],
  ],

  // Second statement, revealed word by word as it scrolls through.
  belief:
    "A first test shoot should never cost a thing. Talent is found, not bought. We build boards on that, then put the right face in front of the right client, in whichever city the job lands.",

  founder: {
    label: "The founder",
    image: "/photos/img7.jpeg",
    quote:
      "“I started Candor because too many people were asked to pay before anyone had looked at them. Here, we look first, and we say what we see.”",
    name: "Founder Name",
    role: "Founder & Director",
    link: { label: "Instagram", href: "#" },
  },

  team: {
    // "+6 bookers": the count is the list's own length.
    noun: "bookers",
    people: [
      { name: "Name Surname", role: "Head Booker, Lagos", image: "/photos/img24.jpeg" },
      { name: "Name Surname", role: "Head Booker, Manchester", image: "/photos/img25.jpeg" },
      { name: "Name Surname", role: "Head Booker, Dallas", image: "/photos/img26.jpeg" },
      { name: "Name Surname", role: "Talent Agent", image: "/photos/img27.jpeg" },
      { name: "Name Surname", role: "Creatives Agent", image: "/photos/img28.jpeg" },
      { name: "Name Surname", role: "Scouting Lead", image: "/photos/img29.jpeg" },
    ],
  },

  // The black band.
  approach: {
    title: ["Built on", "candor"],
    blocks: [
      {
        title: "Three cities, one board",
        body: "Lagos, Manchester and Dallas share one roster, so a face scouted in one city can be booked in all three without starting again.",
      },
      {
        title: "Development before exposure",
        body: "New faces test, learn and build a book with us before they are put forward. Nobody is sent to a casting they are not ready for.",
      },
    ],
    close:
      "We tell talent where they stand and tell clients exactly who they are booking. That is the whole name.",
    images: ["/photos/img9.jpeg", "/photos/img10.jpeg"],
  },

  // The drifting strip of faces and the address under it.
  strip: {
    title: ["Booked by people,", "never by a filter"],
    // `ratio` is height / width; the strip is top-aligned so the bottoms step.
    items: [
      { src: "/photos/img30.jpeg", ratio: 1.16 },
      { src: "/photos/img31.jpeg", ratio: 0.66 },
      { src: "/photos/img32.jpeg", ratio: 0.9 },
      { src: "/photos/img33.jpeg", ratio: 1.16 },
      { src: "/photos/img34.jpeg", ratio: 0.72 },
      { src: "/photos/img35.jpeg", ratio: 1.0 },
      { src: "/photos/img2.jpeg", ratio: 1.16 },
      { src: "/photos/img4.jpeg", ratio: 0.66 },
    ],
    email: agency.join.email,
  },

  // ---- from /get-scouted ---------------------------------------------------
  // Read from data/scouting.js rather than retyped, so this page can never
  // promise an applicant more, or differently, than the application page.
  scouting: {
    requirements: {
      label: "Before you apply",
      items: scouting.requirements,
      note: scouting.eligibility.note,
    },
    noFees: {
      label: "Before anything else",
      title: scouting.noFees.heading,
      body: scouting.noFees.body,
      email: agency.join.email,
    },
    digitals: {
      label: "Your digitals",
      title: `${scouting.digitals.shots.length} pictures, nothing more`,
      intro: scouting.digitals.intro,
      shots: scouting.digitals.shots,
      leaveOutLabel: "What to leave out",
      leaveOut: scouting.notLookingFor,
    },
    process: {
      label: "After you apply",
      title: "What comes next",
      steps: scouting.process,
    },
    // The questions are this page's; every answer is the scouting page's own.
    faq: {
      label: "Questions",
      items: [
        { q: "Do I need experience?", a: scouting.intro },
        { q: "Is there a fee to apply or to join?", a: scouting.noFees.body },
        { q: "How old do I have to be?", a: scouting.eligibility.note },
        {
          q: "Where do I need to live?",
          a: scouting.requirements.find((r) => r.label === "Based")?.detail,
        },
        { q: "What shouldn't I send?", list: scouting.notLookingFor },
        { q: "When will I hear back?", a: scouting.process[1]?.detail },
      ],
    },
    cta: {
      label: "Get scouted",
      title: ["Six pictures.", "One honest answer."],
      href: "/get-scouted#apply",
      link: "Start your application",
      note: "No experience needed. Nothing to pay.",
    },
  },

  // The reassurances as numbers. Each is counted from the same source the
  // sentences above come from, except the reply window, which data/scouting.js
  // states in words ("within four weeks") — change both together.
  stats: {
    label: "At a glance",
    items: [
      { value: 0, label: "Fees to apply, to join, or for a test shoot" },
      { value: 4, label: "Weeks, at most, to an honest answer" },
      { value: scouting.digitals.shots.length, label: "Pictures, taken on a phone" },
      { value: agency.offices.length, label: "Cities sharing one roster" },
    ],
  },

  // The four principles from data/about.js, title and body, as expanding
  // cards. They replace the titles-only promises list in layouts 2 and 3.
  principles: {
    label: "What we promise",
    items: about.principles,
  },

  // Every name on the roster, as one paragraph; each opens its portrait.
  names: {
    label: "The faces",
    hint: "Hover a name",
    people: models.map((m) => ({
      id: m.id,
      name: m.name,
      face: m.face || m.coverImage,
    })),
  },

  // The jump links under the opening, in the order a layout places them.
  // Only sections with an anchor get one.
  anchors: {
    boards: { id: "boards", label: "The boards" },
    requirements: { id: "requirements", label: "Before you apply" },
    digitals: { id: "digitals", label: "Your digitals" },
    process: { id: "next", label: "What comes next" },
    names: { id: "faces", label: "The faces" },
    offices: { id: "cities", label: "Where we are" },
    faq: { id: "questions", label: "Questions" },
    apply: { id: "apply", label: "Apply" },
  },

  // ---- from the original /about --------------------------------------------
  boards: {
    label: "The boards",
    rows: divisions.map((d) => ({
      ...d,
      count: boardCount(d.division),
      image: about.divisionImages[d.slug],
    })),
  },
  offices: {
    label: "Where we are",
    items: agency.offices,
  },

  footer: {
    tagline: "Honest from the first frame.",
    bookingsLabel: "Bookings:",
    bookingsEmail: agency.contact.email,
    newsletterLabel: "Castings and news (no spam)",
    links: [
      { label: "Home", href: "/" },
      { label: "Models", href: "/models" },
      { label: "Talents", href: "/talents" },
      { label: "Creatives", href: "/creatives" },
      { label: "About", href: "/about-new" },
      { label: "Contact", href: "/contact" },
    ],
    socials: agency.socials,
    cities: agency.offices.map((o) => `${o.city}—${o.country}`),
    legal: [
      { label: "Privacy", href: "/privacy" },
      { label: `© ${new Date().getFullYear()}`, href: null },
    ],
    wordmark: "candor",
  },
};

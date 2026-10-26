// data/about.js
//
// Everything /about says, in one place, so the agency's own words can be
// corrected without touching the page.
//
// PLACEHOLDER COPY. The structure is right; the voice and the claims are the
// agency's to confirm. Every principle below repeats a promise /get-scouted
// already makes (data/scouting.js) — no fees, a person reads every
// application, unretouched digitals, an answer in four weeks — so if one of
// those changes there, change it here too. The About page must never promise
// more than the application page does.

export const about = {
  // The hero. The agency is named for a word; the page opens by defining it.
  word: "Candor",
  pronunciation: "/ˈkan-dər/",
  sense: "noun. The quality of being open and honest; frankness.",
  line: "A model and talent agency in Lagos, Manchester and Dallas.",

  // The photographs the darkroom print develops, in order. `focus` is where
  // the face is, 0..1 from the top left, so a wide screen crops around it
  // rather than through it. Dark grounds develop best: a print with a pale
  // background comes up as a field of white paper.
  prints: [
    { src: "/photos/img12.jpeg", focus: [0.5, 0.42] },
    { src: "/photos/img14.jpeg", focus: [0.56, 0.36] },
    { src: "/photos/img1.jpeg", focus: [0.5, 0.38] },
    { src: "/photos/img25.jpeg", focus: [0.5, 0.4] },
  ],

  // The one paragraph that says what the name commits the agency to.
  statement:
    "Candor means telling the truth. We tell talent where they stand, we tell clients exactly who they are booking, and we never ask anyone to pay for the chance to be seen.",

  principles: [
    // "No upfront fees", not "no fees, ever": an agency that takes commission
    // on work it finds is charging a fee in the eyes of UK agency law (and of
    // the FTC and Nigeria's consumer-protection law, which both police
    // misleading fee claims). What Candor promises — nothing to apply, to
    // join, or for shoots, portfolios or courses — is stated exactly.
    {
      title: "No upfront fees",
      body: "We never charge to apply, to join a board, or for test shoots, portfolios or courses, and we'll never make work depend on buying any of them. Anyone asking for money in our name is not us.",
      link: { href: "/get-scouted", label: "How to apply" },
    },
    {
      title: "Read by a person",
      body: "Every application is looked at by someone who books the board. Nothing is filtered out by software before a person has seen it.",
    },
    {
      title: "Accurate, not flattering",
      body: "We ask for digitals taken in daylight, with no make-up and no retouching, because a booking depends on who actually walks into the room.",
    },
    {
      title: "An answer in four weeks",
      body: "If you haven't heard from us in four weeks, it's a no for now, not a no forever. Boards change, and you're welcome to apply again in six months.",
    },
  ],

  // One picture per board for the hover on the divisions list — the board's
  // own imagery once real campaigns exist.
  divisionImages: {
    models: "/photos/img13.jpeg",
    talents: "/photos/img20.jpeg",
    creatives: "/photos/img5.jpeg",
  },

  close: {
    clients: {
      label: "Clients",
      title: "Booking?",
      body: "Tell us the job, the dates and the city. The desk nearest you will come back with options.",
      link: { href: "/contact", label: "Contact the desks" },
    },
    talent: {
      label: "Representation",
      title: "Want to be seen?",
      body: "No experience needed and nothing to pay to apply. Six pictures and an honest application.",
      link: { href: "/get-scouted", label: "Get scouted" },
    },
  },
};

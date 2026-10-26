// data/contact.js
//
// What /contact says. The addresses and numbers themselves live in
// data/agency.js — this file only decides which of them each kind of enquiry
// is sent to, and with what subject line, so the agency can re-route press or
// bookings without editing the page.
//
// PLACEHOLDER COPY, like data/scouting.js: the routing is a sensible default
// (clients and press to the client inbox, talent to the join inbox), but who
// actually answers what is the agency's call.

export const contact = {
  intro: "Bookings, representation and press, across three time zones. Pick the reason you're writing and we'll know where to send it.",

  // `inbox` names a block in data/agency.js ("contact" or "join"). `subject`
  // pre-fills the email so it lands in the right pile.
  routes: [
    {
      key: "bookings",
      title: "Bookings",
      body: "Book talent, ask for options or request a package. Tell us the job, the dates and the city, and the nearest desk will come back to you.",
      inbox: "contact",
      subject: "Booking enquiry",
      phone: true,
    },
    {
      key: "representation",
      title: "Representation",
      // The last sentence is the Equality Act's reasonable-adjustments duty,
      // which applies to agencies that find people work.
      body: "To be considered for a board, apply through Get scouted. Once you have, send your six digitals to the address below. If you need to apply another way, or want help sending your pictures, write to us and we'll make it work.",
      inbox: "join",
      subject: "Digitals",
      phone: true,
      link: { href: "/get-scouted", label: "Get scouted" },
    },
    {
      key: "press",
      title: "Press",
      body: "Interviews, features, image requests and anything else for print or broadcast.",
      inbox: "contact",
      subject: "Press enquiry",
      phone: false,
    },
  ],

  // The recruitment-scam notice. Scam "scouts" trading on agency names are the
  // most common harm an agency's name is used for, so the contact page — the
  // page someone checks when a message looks off — says it plainly. The fee
  // promise itself is data/scouting.js's noFees; this adds what to do.
  // The specifics follow what the agencies in the 2026 survey publish (Select,
  // Premier, IMG, NEXT, Models 1, United Agents) and the FTC's guidance on
  // modelling scams. Each is a promise: keep them true.
  warning: {
    heading: "If someone asks you for money in our name",
    body: "It isn't us. Candor never charges to apply, to join a board, or for test shoots, portfolios or courses.",
    rules: [
      "We never ask for payment by gift card, cryptocurrency or wire transfer.",
      "We never ask for nude or underwear photographs.",
      "We never require you to use a particular photographer.",
      "We don't guarantee work, and anyone who does is not us.",
    ],
    check: "Our only email addresses end in @candormanagement.com. If you're unsure whether a message is from us, forward it to the address below and we'll tell you.",
  },
};

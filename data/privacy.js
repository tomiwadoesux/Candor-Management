// data/privacy.js
//
// The privacy policy, as data, so it can be corrected without touching the
// page. Rendered by src/app/privacy/page.js; strings may use the tiny markup
// documented in src/components/agency/Rich.jsx — [label](href), **bold**,
// `code`, and {{key}} for a value from the page's `vars`.
//
// DRAFT FOR LEGAL REVIEW. Written on 20 October 2026 from what the site
// actually does — checked against the code: what the apply form collects,
// that nothing sets a cookie, the one sessionStorage key, the hosts the pages
// load from — and from research into the UK, Nigerian and Texan rules for a
// business like this, with every legal claim checked against primary sources
// (legislation.gov.uk, ico.org.uk, the NDPA 2023 and NDPC GAID 2025 texts,
// Texas statutes). It reflects the UK Data (Use and Access) Act 2025 changes
// in force since 5 February and 19 June 2026, and the Information Commission
// replacing the Information Commissioner on 30 September 2026.
//
// It is a careful first draft, not legal advice. Before launch:
//  - fill in `legal` in data/agency.js (company details, ICO fee reference,
//    NDPC registration and a Data Protection Officer — very likely required
//    in Nigeria) and the office street addresses;
//  - confirm the retention periods below and the corporate structure (which
//    Candor company is the controller for which office changes the "who we
//    are" and transfers sections);
//  - have a UK and a Nigerian data-protection lawyer read it.
// Re-check it whenever the site starts collecting something new: an upload,
// analytics, a newsletter, an embedded player.

export const privacy = {
  // Change this whenever the substance changes. It is also the effective
  // date (California's online privacy law asks for one).
  updated: "2026-10-20",

  // Unsuccessful applications, deleted this many months after we reply.
  // Six is the most Nigerian law allows where no contract follows (NDPC GAID
  // 2025 Art. 21(2)), and matches "apply again in six months" on /get-scouted.
  applicantMonths: 6,

  // The short version, first — the ICO's "layered" approach: the summary a
  // person actually reads, then the detail for anyone who wants it.
  summary: [
    "We only collect what you send us (an application, a booking, an email) and what a website needs to work.",
    "We don't use analytics or advertising cookies, and we never sell personal data.",
    "You have to be 18 or over to apply through this site.",
    "You can ask to see, correct or delete what we hold about you at any time by writing to {{privacyEmail}}.",
  ],

  // "At a glance": one row per kind of person we hold data about.
  glance: [
    {
      who: "Applicants",
      what: "Name, contact details, date of birth, city, height, Instagram handle, your note, and the digitals you email us.",
      why: "To consider you for representation and reply to you.",
      basis: "Steps you ask us to take before a contract",
      keep: "Deleted within {{applicantMonths}} months of our reply, unless we go on to represent you",
    },
    {
      who: "Talent we represent",
      what: "Profile details and pictures we publish, contracts, booking and payment records, identity documents where required.",
      why: "To represent you, put you forward for work and pay you.",
      basis: "Contract, legal obligation, legitimate interests",
      keep: "While we represent you, then at least a year, and as long as tax law requires",
    },
    {
      who: "Clients and bookers",
      what: "Names, work contact details, booking and billing details.",
      why: "To take bookings, deliver them and invoice.",
      basis: "Contract, legitimate interests",
      keep: "At least a year after the last booking, and as long as tax law requires",
    },
    {
      who: "Website visitors",
      what: "The technical details every browser sends (IP address, browser type, pages requested), and one setting kept in your browser.",
      why: "To deliver the site and keep it secure.",
      basis: "Legitimate interests",
      keep: "Server logs for the short period our host keeps them; the browser setting until you close the tab",
    },
  ],

  // The full policy. `id` is the anchor (/privacy#applicants is linked from
  // the application form — keep that one). Blocks: { p }, { list }, { note },
  // and { widget: "introMemory" } for the switch in the website section.
  sections: [
    {
      id: "who-we-are",
      title: "Who we are",
      blocks: [
        { p: "Candor Management (**Candor**, **we**, **us**) is a model and talent agency with offices in Lagos, Manchester and Dallas. We decide how and why the personal data described here is used, which makes us its **controller**." },
        { p: "This policy covers people who apply to us, the talent we represent, the clients we work with, and anyone using this website. If you have a question about it, write to {{privacyEmail}}, or call us on {{contactPhone}}." },
      ],
    },
    {
      id: "applicants",
      title: "If you apply to us",
      blocks: [
        { p: "When you apply through [Get scouted](/get-scouted), we ask for your name, email address, date of birth, city and country and height. We need these, and the six digitals we ask you to email afterwards, to consider you: without them we can't assess an application. Your phone number, Instagram handle and note are optional." },
        { p: "We use your application only to decide whether to offer you representation and to reply to you. Someone who books the board reads every one. We don't share applicants' details with clients." },
        { p: "Our legal basis is that you've asked us to consider you, which is a step towards a contract with you (Article 6(1)(b) of the UK GDPR; section 25(1)(b) of the Nigeria Data Protection Act 2023). You can withdraw your application at any time by writing to {{joinEmail}}, and we'll delete it." },
        { p: "**One automatic check.** The form works out your age from your date of birth and won't accept an application from anyone under 18. That is the only decision made without a person. If you think it has got your age wrong, write to {{joinEmail}} and someone will look at it. People make every other decision about applications." },
        { p: "If we don't take your application further, we delete it, including your digitals and any copies in our mailboxes, within {{applicantMonths}} months of replying to you. If we offer to represent you, what you sent becomes part of your talent record, described next." },
        { note: "Your photographs show what you look like, and we use them only to consider your application. People look at them; we don't run them through facial recognition or any similar technology, and we don't use them to infer anything else about you." },
      ],
    },
    {
      id: "talent",
      title: "If we represent you",
      blocks: [
        { p: "To represent you we hold your contact details, our agreement with you, details of the work we book for you, payment and tax details, and identity or right-to-work documents where the law or a client requires them." },
        { p: "We publish a profile of you on this website and in the comp cards and packages we send to clients. It can include your name or stage name, height and other measurements, hair and eye colour, nationality, a short biography and pictures. We agree how your pictures are used in writing, in our agreement with you." },
        { p: "We share your details with clients, castings and partner agencies only to find you work. You can ask us to change or take down anything on your profile at any time. When we stop representing you, we take your profile off this site and ask clients who have your comp card to delete it." },
        { p: "Our legal bases are our agreement with you, our legal obligations (for example to keep tax and agency records), and our legitimate interest in promoting the people we represent." },
        { p: "We keep your record while we represent you, then for at least a year afterwards, as UK agency rules require, and for as long as tax and company law require us to keep business records." },
      ],
    },
    {
      id: "clients",
      title: "If you book with us",
      blocks: [
        { p: "If you work for a client, casting director or production, we hold your name, your work contact details, and the details of the bookings, options and invoices between us." },
        { p: "We use them to take and deliver bookings, invoice and keep our accounts. Our legal bases are the contract with your company and our legitimate interest in keeping a working relationship with the people we book for. We keep them for at least a year after your last booking, and for as long as tax and company law require." },
      ],
    },
    {
      id: "from-others",
      title: "Information we get from others",
      blocks: [
        { p: "Sometimes we learn about you from someone else: a scout or another agency who recommends you to us, a client giving feedback after a casting or booking, or a public profile you've pointed us to, such as your Instagram." },
        { p: "When that happens, we tell you what we have and where it came from within a month, or the first time we contact you if that's sooner, and we treat it exactly as this policy describes." },
      ],
    },
    {
      id: "website",
      title: "If you visit this website",
      blocks: [
        { p: "Like any website, ours receives the technical details your browser sends with each request: your IP address, browser type and the pages you ask for. Our hosting provider records these in server logs, which it keeps for a short period to run the site and protect it from abuse." },
        { p: "**No tracking.** We don't use analytics, advertising or social-media tracking, and the site sets no cookies of its own, which is why there's no cookie banner. Because we don't track you across sites, your browser's Do Not Track setting doesn't change anything here." },
        { p: "**One setting in your browser.** After the opening animation on the home page plays, we save a small note in your browser's session storage (`candor:intro-seen`) so the animation doesn't replay every time you come back to the home page. It contains no personal data, never leaves your device, and is deleted when you close the tab. You can switch it off here:" },
        { widget: "introMemory" },
        { p: "**Fonts and media from other hosts.** Our typefaces are delivered by Bunny Fonts, and some images and video may be served from other content delivery networks. Your browser connects to those servers to fetch the files, which means they receive your IP address. They are used only to display the site. If you'd rather your browser didn't contact them, you can block third-party fonts and media in your browser settings and the site will use fonts already on your device." },
      ],
    },
    {
      id: "sharing",
      title: "Who we share it with",
      blocks: [
        { p: "We share personal data only where we need to:" },
        {
          list: [
            "**Clients and their productions**, when we put talent forward or confirm a booking. We never share applicants' details with clients.",
            "**Our offices** in Lagos, Manchester and Dallas, so the right desk can handle a booking or an application.",
            "**Service providers** who work for us, such as our website host, email provider, file storage and accountants. They act on our instructions under written agreements and may use the data only to provide their service to us.",
            "**Professional advisers and authorities**, such as lawyers, auditors, regulators and tax authorities, where the law requires it.",
          ],
        },
        { p: "We never sell personal data, and we don't share it with anyone for their own marketing or for advertising." },
      ],
    },
    {
      id: "transfers",
      title: "Moving data between countries",
      blocks: [
        { p: "Our offices are in Nigeria, the United Kingdom and the United States, and some of our service providers are based abroad, so your data may be handled in a country other than your own." },
        {
          list: [
            "**From the UK to the United States**, we rely on the UK's data bridge where the recipient is certified to it, and otherwise on the UK International Data Transfer Agreement or Addendum.",
            "**From the UK to Nigeria**, which has no UK adequacy decision, we use the UK International Data Transfer Agreement or Addendum, with an assessment of the risks.",
            "**From Nigeria**, we transfer data where the destination protects it adequately, where the transfer is needed for the steps you've asked us to take or for our contract with you, or with your informed consent, as the Nigeria Data Protection Act 2023 allows.",
          ],
        },
        { p: "Data protection laws abroad may not match your own. Ask us at {{privacyEmail}} for details of the safeguards that cover your data, or for a copy of them." },
      ],
    },
    {
      id: "security",
      title: "Keeping it safe",
      blocks: [
        { p: "We limit access to personal data to the people at Candor who need it for their work, and we use service providers who protect the data they hold for us under written agreements." },
        { p: "If a breach puts your data at risk, we report it to the regulator within the time the law sets (72 hours in the UK and Nigeria) and tell you directly where it's likely to affect you." },
      ],
    },
    {
      id: "your-rights",
      title: "Your rights",
      blocks: [
        { p: "Wherever you are, you can ask us to:" },
        {
          list: [
            "tell you whether we hold data about you, and give you a copy;",
            "correct anything that's wrong or incomplete;",
            "delete it, where we no longer need it or have no legal reason to keep it;",
            "stop or limit how we use it, or object to a use based on our legitimate interests;",
            "send it to you, or to someone else, in a common electronic format;",
            "stop any use that relies on your consent. Withdrawing is as easy as giving it.",
          ],
        },
        { p: "Write to {{privacyEmail}}. It's free. We may ask you to confirm who you are first. We reply within 30 days; if a request is complicated and the law allows us longer, we'll tell you within those 30 days and explain why. Some rights have limits, for example where we must keep tax records, and if one applies we'll say so." },
        { p: "These rights come from the UK GDPR and the Data Protection Act 2018, the Nigeria Data Protection Act 2023, and, where they apply to you, the laws of your US state." },
      ],
    },
    {
      id: "complaints",
      title: "Complaints",
      blocks: [
        { p: "If you're unhappy with how we've handled your data, please tell us first, at {{privacyEmail}} or on {{contactPhone}}. We'll acknowledge your complaint within 30 days, keep you updated, and tell you the outcome." },
        { p: "You can also complain to a regulator at any time:" },
        {
          list: [
            "in the UK, the Information Commission (ICO): [ico.org.uk/make-a-complaint](https://ico.org.uk/make-a-complaint/), or 0303 123 1113;",
            "in Nigeria, the Nigeria Data Protection Commission: [ndpc.gov.ng](https://ndpc.gov.ng), or [info@ndpc.gov.ng](mailto:info@ndpc.gov.ng);",
            "in Texas, the Office of the Attorney General: [texasattorneygeneral.gov](https://www.texasattorneygeneral.gov/consumer-protection).",
          ],
        },
      ],
    },
    {
      id: "under-18s",
      title: "Under-18s",
      blocks: [
        { p: "This website isn't meant for children. You must be 18 or over to apply through it, and the form won't accept a date of birth under 18; we don't keep the details of anyone it turns away. If you think we hold data about someone under 18, write to {{privacyEmail}} and we'll delete it." },
      ],
    },
    {
      id: "changes",
      title: "Changes to this policy",
      blocks: [
        { p: "This version took effect on the date at the top of the page. When we change how we use personal data, we update this page and that date. If a change affects talent we represent or people whose applications we hold, we tell them directly." },
      ],
    },
  ],
};

import assert from "node:assert/strict";
import { test } from "node:test";
import { getProfileSections, isTalentOrCreative } from "./profilePortfolio.js";

const keys = (person) => getProfileSections(person).map((section) => section.key);

test("authored covers sit before About and empty covers stay hidden", () => {
  const person = { talent: "Creative", focus: "Creative Direction", images: ["/portfolio.jpg"], bio: "Biography" };
  assert.deepEqual(keys({ ...person, portfolio: { covers: [] } }), ["PORTFOLIO", "ABOUT"]);
  const sections = getProfileSections({ ...person, portfolio: { covers: [{ src: "/cover.jpg", label: "Cover study", meta: "Study" }] } });
  assert.deepEqual(sections.map(({ key }) => key), ["PORTFOLIO", "COVERS", "ABOUT"]);
  assert.equal(sections[1].label, "Covers");
  assert.equal(sections[1].kind, "gallery");
  assert.equal(sections[1].items[0].meta, "Study");
});

test("legacy assigned images stay neutral for every existing discipline", () => {
  for (const talent of ["Actor", "Dancer"]) {
    assert.deepEqual(keys({ talent, division: "talents", images: ["/image.jpg"] }), ["PHOTOS"]);
  }
  for (const talent of ["Make Up Artist", "Hair Stylist", "Fashion Stylist", "Photographer", "Fashion Designer", "Artist"]) {
    assert.deepEqual(keys({ talent, division: "creatives", images: ["/image.jpg"] }), ["PORTFOLIO"]);
  }
  assert.deepEqual(keys({ talent: "Talent", division: "talents", images: ["/image.jpg"] }), ["PHOTOS"]);
  assert.deepEqual(keys({ talent: "Creative", division: "creatives", images: ["/image.jpg"] }), ["PORTFOLIO"]);
});

test("specialized galleries require explicit content and follow the discipline", () => {
  const portfolio = {
    headshots: ["/portrait.jpg"], editorial: ["/editorial.jpg"], campaigns: [],
    projects: [{ image: "/project.jpg", href: "/projects/example", description: "Direction and set design" }],
    collections: ["/collection.jpg"], artworks: ["/painting.jpg"],
  };
  assert.deepEqual(keys({ talent: "Actor", portfolio }), ["HEADSHOTS"]);
  assert.deepEqual(keys({ talent: "Photographer", portfolio }), ["EDITORIAL"]);
  assert.deepEqual(keys({ talent: "Fashion Designer", portfolio }), ["COLLECTIONS", "EDITORIAL"]);
  assert.deepEqual(keys({ talent: "Artist", portfolio }), ["ARTWORKS", "PROJECTS"]);
  const [project] = getProfileSections({ talent: "Creative", focus: "Creative Direction", portfolio });
  assert.equal(project.key, "PROJECTS");
  assert.equal(project.items[0].href, "/projects/example");
  assert.equal(project.items[0].description, "Direction and set design");
});

test("missing content, empty arrays and unassigned portrait fields produce no work sections", () => {
  assert.deepEqual(getProfileSections(null), []);
  assert.deepEqual(getProfileSections({}), []);
  assert.deepEqual(keys({ talent: "Actor", face: "/face.jpg", coverImage: "/cover.jpg", polaroids: ["/digital.jpg"], portfolio: { headshots: [], credits: [], cv: "#" } }), []);
  assert.deepEqual(keys({ talent: "Creative Director", portfolio: { projects: [{ title: "Unillustrated project", href: "/project" }] } }), []);
});

test("poster-only and unsafe videos are hidden while direct, embedded and external videos remain", () => {
  const sections = getProfileSections({ talent: "Dancer", portfolio: {
    reel: [{ poster: "/poster.jpg" }, { src: "javascript:alert(1)" }],
    performances: [
      { src: "/video/dance.mp4", title: "Stage", poster: "/poster.jpg" },
      { embedUrl: "https://player.vimeo.com/video/123", title: "Movement" },
      { href: "https://www.youtube.com/watch?v=example", title: "Live" },
    ],
  } });
  assert.deepEqual(sections.map(({ key }) => key), ["PERFORMANCES"]);
  assert.equal(sections[0].kind, "videos");
  assert.equal(sections[0].items.length, 3);
  assert.equal(sections[0].items[0].src, "/video/dance.mp4");
  assert.equal(sections[0].items[1].embedUrl, "https://player.vimeo.com/video/123");
  assert.equal(sections[0].items[2].href, "https://www.youtube.com/watch?v=example");
});

test("per-image credit maps cannot be mistaken for a performer's credits", () => {
  const person = { talent: "Actor", credits: { "/image.jpg": { label: "A caption", meta: "Campaign" } } };
  assert.deepEqual(keys(person), []);
  assert.deepEqual(keys({ ...person, portfolio: { credits: person.credits } }), []);
  const [credits] = getProfileSections({ ...person, portfolio: { credits: [{ title: "A production", role: "Lead", client: "Theatre", year: 2025 }, { role: "No project" }] } });
  assert.deepEqual(credits.items, [{ title: "A production", role: "Lead", client: "Theatre", year: "2025" }]);
});

test("explicit empty neutral galleries override legacy images", () => {
  const images = ["/legacy.jpg"];
  for (const field of ["photos", "photo"]) {
    assert.deepEqual(keys({ talent: "Actor", images, portfolio: { [field]: [] } }), []);
  }
  assert.deepEqual(keys({ talent: "Photographer", images, portfolio: { portfolio: [] } }), []);
});

test("generic hybrid performer inherits actor and dancer sections without inventing content", () => {
  const person = { talent: "Talent", focus: "Actor · Dancer", division: "talents", images: ["/photo.jpg"], portfolio: {
    headshots: ["/headshot.jpg"], showreel: { src: "/acting.mp4" }, reel: "/dance.mp4",
    performances: [{ href: "https://vimeo.com/123" }], cv: { href: "/documents/cv.pdf" },
  } };
  assert.deepEqual(keys(person), ["HEADSHOTS", "SHOWREEL", "REEL", "PERFORMANCES", "PHOTOS", "CV"]);
  assert.equal(isTalentOrCreative(person), true);
  assert.equal(isTalentOrCreative({ division: "models" }), false);
});

test("about can contain biography, facts only, or explicitly authored copy", () => {
  assert.deepEqual(getProfileSections({ based: "Lagos" }), [{ key: "ABOUT", label: "About", kind: "about", text: "", details: [["Based", "Lagos"]] }]);
  const [about] = getProfileSections({ bio: "Legacy biography", portfolio: { about: { text: "Authored biography", details: [["Language", "Yoruba"], ["Missing", ""]] } } });
  assert.equal(about.text, "Authored biography");
  assert.deepEqual(about.details, [["Language", "Yoruba"]]);
});

test("invalid media and document URLs cannot create sections or outbound links", () => {
  const sections = getProfileSections({ talent: "Actor", portfolio: {
    headshots: ["javascript:alert(1)", "//bad.example/image.jpg", "https://example.com/image.jpg", { src: "/safe.jpg", href: "data:text/html,unsafe" }],
    cv: "javascript:alert(1)",
  } });
  assert.deepEqual(sections.map(({ key }) => key), ["HEADSHOTS"]);
  assert.equal(sections[0].items.length, 2);
  assert.equal(sections[0].items[1].href, undefined);
});

test("YouTube and Vimeo page URLs become supported embeds instead of native video sources", () => {
  const [section] = getProfileSections({ talent: "Actor", portfolio: { showreel: [
    "https://www.youtube.com/watch?v=abc_123-Xyz&t=42s",
    { src: "https://youtu.be/def_456-Xyz" },
    "https://vimeo.com/123456789",
    { src: "https://vimeo.com/123456789/abcdef1234" },
    "https://www.youtube.com/shorts/ghi_789-Xyz",
  ] } });
  assert.deepEqual(section.items.map((item) => item.embedUrl), [
    "https://www.youtube-nocookie.com/embed/abc_123-Xyz?start=42",
    "https://www.youtube-nocookie.com/embed/def_456-Xyz",
    "https://player.vimeo.com/video/123456789",
    "https://player.vimeo.com/video/123456789?h=abcdef1234",
    "https://www.youtube-nocookie.com/embed/ghi_789-Xyz",
  ]);
  assert.ok(section.items.every((item) => !item.src));
});

test("only supported embed hosts and paths can create iframes", () => {
  const [section] = getProfileSections({ talent: "Actor", portfolio: { showreel: [
    { embedUrl: "https://www.youtube.com/embed/abc_123-Xyz?rel=0" },
    { embedUrl: "https://player.vimeo.com/video/123456789?h=secret" },
    { embedUrl: "https://example.com/player/123" },
    { embedUrl: "https://www.youtube.com/channel/example" },
    { embedUrl: "https://player.vimeo.com/settings" },
    { embedUrl: "https://www.youtube.com.evil.test/embed/example" },
    { embedUrl: "/external-player" },
  ] } });
  assert.equal(section.items[0].embedUrl, "https://www.youtube-nocookie.com/embed/abc_123-Xyz?rel=0");
  assert.equal(section.items[1].embedUrl, "https://player.vimeo.com/video/123456789?h=secret");
  assert.ok(section.items.slice(2).every((item) => !item.embedUrl && item.href));
});

test("native files preserve signed sources and safe captions; provider pages remain outbound links", () => {
  const [section] = getProfileSections({ talent: "Actor", portfolio: { showreel: [
    { src: "https://media.example.com/file?signature=abc", captions: "/captions/reel.en.vtt" },
    { src: "/films/reel.mp4", captions: "javascript:alert(1)" },
    { src: "https://vimeo.com/channels/example" },
  ] } });
  assert.equal(section.items[0].src, "https://media.example.com/file?signature=abc");
  assert.equal(section.items[0].captions, "/captions/reel.en.vtt");
  assert.equal(section.items[1].captions, undefined);
  assert.equal(section.items[2].src, undefined);
  assert.equal(section.items[2].href, "https://vimeo.com/channels/example");
});

test("personal details retain the location without a discipline row", () => {
  for (const [talent, focus] of [["Talent", "Actor · Dancer"], ["Creative", "Creative Direction"]]) {
    const [about] = getProfileSections({ talent, focus, based: "Lagos" });
    assert.deepEqual(about.details, [["Based", "Lagos"]]);
  }
  assert.deepEqual(getProfileSections({ talent: "Photographer", focus: "Editorial & Campaign" }), []);
  const [about] = getProfileSections({ portfolio: { about: {
    text: "I'm a photographer based in Manchester.",
    details: [["Discipline", "Photographer"], ["Based", "Manchester"], ["Language", "English"]],
  } } });
  assert.equal(about.text, "I'm a photographer based in Manchester.");
  assert.deepEqual(about.details, [["Based", "Manchester"], ["Language", "English"]]);
});

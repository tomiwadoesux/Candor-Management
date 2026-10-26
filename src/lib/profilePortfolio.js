/**
 * Optional authored profile content lives in person.portfolio:
 *   photos/headshots/portfolio/editorial/campaigns/beauty/celebrity/projects/
 *   collections/artworks/covers: [{ src, alt?, label?, meta?, description?, href? }]
 *   showreel/reel/films/performances: [{ src?, embedUrl?, href?, poster?, title?, captions? }]
 *   credits: [{ title, role?, client?, year? }]
 *   cv: "/documents/cv.pdf" or { href }
 *   about: text or { text, details?: [[label, value]] }
 * Gallery strings and { image } are also accepted. Video entries need a
 * source or destination, not just a poster. No work or credits are inferred
 * from a discipline, portrait, polaroid, shared image pool or placeholder film.
 */

const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const text = (value) => typeof value === "string" ? value.trim() : "";
const record = (value) => value && typeof value === "object" && !Array.isArray(value);
const list = (value) => Array.isArray(value) ? value : [];

// Relative paths stay on this site. Exclude protocol-relative paths, control
// characters, backslashes and executable schemes from both media and links.
function safeUrl(value) {
  const candidate = text(value);
  if (!candidate || candidate.startsWith("#") || candidate.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(candidate)) return "";
  if (/^[a-z][a-z\d+.-]*:/i.test(candidate) && !/^https?:\/\//i.test(candidate)) return "";
  try {
    const parsed = new URL(candidate, "https://candor.invalid/");
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? candidate : "";
  } catch {
    return "";
  }
}

const positiveNumber = (value) => typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;

function videoLocation(value, requireEmbed = false) {
  const candidate = safeUrl(value);
  if (!candidate) return {};
  const url = new URL(candidate, "https://candor.invalid/");
  const host = url.host.toLowerCase();
  const youtube = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(host);
  const shortYoutube = ["youtu.be", "www.youtu.be"].includes(host);
  const vimeo = ["vimeo.com", "www.vimeo.com"].includes(host);
  const vimeoPlayer = host === "player.vimeo.com";
  if (youtube || shortYoutube) {
    const embedded = youtube && url.pathname.match(/^\/embed\/([\w-]+)\/?$/);
    const id = embedded?.[1]
      || (shortYoutube ? url.pathname.match(/^\/([\w-]+)\/?$/)?.[1] : null)
      || (youtube && url.pathname === "/watch" ? url.searchParams.get("v") : null)
      || (youtube ? url.pathname.match(/^\/(?:shorts|live)\/([\w-]+)\/?$/)?.[1] : null);
    if (id && /^[\w-]+$/.test(id)) {
      const embed = new URL(`https://www.youtube-nocookie.com/embed/${id}`);
      if (embedded) embed.search = url.search;
      else {
        const start = url.searchParams.get("start") || url.searchParams.get("t");
        if (start && /^\d+s?$/.test(start)) embed.searchParams.set("start", start.replace(/s$/, ""));
      }
      return { embedUrl: embed.href };
    }
    return { href: candidate };
  }
  if (vimeoPlayer || vimeo) {
    const match = vimeoPlayer
      ? url.pathname.match(/^\/video\/(\d+)\/?$/)
      : url.pathname.match(/^\/(\d+)(?:\/([a-z\d]+))?\/?$/i);
    if (match) {
      const embed = new URL(`https://player.vimeo.com/video/${match[1]}`);
      embed.search = url.search;
      if (match[2]) embed.searchParams.set("h", match[2]);
      return { embedUrl: embed.href };
    }
    return { href: candidate };
  }
  // Arbitrary pages are links, never iframes. Native sources may be signed
  // file URLs without an extension, so they are not extension-filtered.
  return requireEmbed ? { href: candidate } : { src: candidate };
}

function galleryItems(value, person, key) {
  const seen = new Set();
  return list(value).flatMap((entry, index) => {
    const item = typeof entry === "string" ? { src: entry } : record(entry) ? entry : {};
    const src = safeUrl(item.src || item.image || item.url);
    if (!src || seen.has(src)) return [];
    seen.add(src);
    const result = {
      id: text(item.id) || `${key.toLowerCase()}-${index + 1}`,
      src,
      alt: text(item.alt) || `${text(person.name) || "Artist"} portfolio image ${index + 1}`,
    };
    for (const field of ["label", "meta", "description"]) {
      if (text(item[field])) result[field] = text(item[field]);
    }
    if (safeUrl(item.href)) result.href = safeUrl(item.href);
    for (const field of ["pxW", "pxH"]) {
      if (positiveNumber(item[field])) result[field] = item[field];
    }
    return [result];
  });
}

function videoItems(value, label, key) {
  // A single reel can be authored without wrapping it in an array.
  const entries = Array.isArray(value) ? value : value ? [value] : [];
  return entries.flatMap((entry, index) => {
    const item = typeof entry === "string" ? { src: entry } : record(entry) ? entry : {};
    const source = videoLocation(item.src);
    const embedded = videoLocation(item.embedUrl, true);
    const src = source.src;
    const embedUrl = embedded.embedUrl || source.embedUrl;
    const href = safeUrl(item.href) || embedded.href || source.href;
    if (!src && !embedUrl && !href) return [];
    const result = {
      id: text(item.id) || `${key.toLowerCase()}-${index + 1}`,
      title: text(item.title) || `${label}${entries.length > 1 ? ` ${index + 1}` : ""}`,
    };
    if (src) result.src = src;
    if (embedUrl) result.embedUrl = embedUrl;
    if (href) result.href = href;
    if (safeUrl(item.poster)) result.poster = safeUrl(item.poster);
    if (src && safeUrl(item.captions)) result.captions = safeUrl(item.captions);
    if (text(item.description)) result.description = text(item.description);
    return [result];
  });
}

function creditItems(value) {
  return list(value).flatMap((entry) => {
    const item = typeof entry === "string" ? { title: entry } : record(entry) ? entry : {};
    if (!text(item.title)) return [];
    const result = { title: text(item.title) };
    for (const field of ["role", "client"]) {
      if (text(item[field])) result[field] = text(item[field]);
    }
    const year = typeof item.year === "number" && Number.isFinite(item.year) ? String(item.year) : text(item.year);
    if (year) result.year = year;
    return [result];
  });
}

const LABELS = {
  HEADSHOTS: "Headshots", SHOWREEL: "Showreel", REEL: "Reel", PHOTOS: "Photos",
  PERFORMANCES: "Performances", CREDITS: "Credits", CV: "CV", ABOUT: "About",
  PORTFOLIO: "Portfolio", COVERS: "Covers", BEAUTY: "Beauty", EDITORIAL: "Editorial", CAMPAIGNS: "Campaigns",
  CELEBRITY: "Celebrity", FILMS: "Films", PROJECTS: "Projects", COLLECTIONS: "Collections", ARTWORKS: "Artworks",
};
const VIDEOS = new Set(["SHOWREEL", "REEL", "FILMS", "PERFORMANCES"]);

export function isTalentOrCreative(person) {
  return ["talents", "creatives"].includes(text(person?.division).toLowerCase());
}

function sectionOrder(person) {
  const role = text(person.talent).toLowerCase();
  const generic = !role || ["talent", "creative", "creatives"].includes(role);
  const discipline = generic ? text(person.focus).toLowerCase() : role;
  const actor = /\b(actor|actress|acting)\b/.test(discipline);
  const dancer = /\b(dancer|dance|choreographer|choreography)\b/.test(discipline);
  if (actor || dancer) return {
    performer: true,
    keys: [
      ...(actor ? ["HEADSHOTS", "SHOWREEL"] : []),
      ...(dancer ? ["REEL", "PERFORMANCES"] : []),
      "PHOTOS", "CREDITS", "CV", "ABOUT",
    ],
  };
  if (/make\s?up|\bhair\b|groom/.test(discipline)) return {
    performer: false,
    keys: ["PORTFOLIO", "BEAUTY", "EDITORIAL", "CAMPAIGNS", "CELEBRITY", "FILMS", "ABOUT"],
  };
  if (/stylist|styling/.test(discipline)) return {
    performer: false,
    keys: ["PORTFOLIO", "EDITORIAL", "CAMPAIGNS", "CELEBRITY", "FILMS", "ABOUT"],
  };
  if (/photograph/.test(discipline)) return {
    performer: false,
    keys: ["PORTFOLIO", "EDITORIAL", "CAMPAIGNS", "FILMS", "ABOUT"],
  };
  if (/director|direction/.test(discipline)) return {
    performer: false,
    keys: ["PROJECTS", "CAMPAIGNS", "FILMS", "PORTFOLIO", "ABOUT"],
  };
  if (/designer|fashion design/.test(discipline)) return {
    performer: false,
    keys: ["COLLECTIONS", "EDITORIAL", "CAMPAIGNS", "FILMS", "PORTFOLIO", "ABOUT"],
  };
  if (/artist|illustrat|paint|sculpt/.test(discipline)) return {
    performer: false,
    keys: ["ARTWORKS", "PROJECTS", "PORTFOLIO", "FILMS", "ABOUT"],
  };
  return text(person.division).toLowerCase() === "creatives" ? {
    performer: false,
    keys: ["PORTFOLIO", "PROJECTS", "EDITORIAL", "CAMPAIGNS", "FILMS", "ABOUT"],
  } : {
    performer: true,
    keys: ["PHOTOS", "SHOWREEL", "PERFORMANCES", "CREDITS", "CV", "ABOUT"],
  };
}

function aboutContent(person, portfolio) {
  const authored = portfolio.about;
  const description = own(portfolio, "about")
    ? typeof authored === "string" ? text(authored) : text(authored?.text || authored?.bio)
    : text(person.bio);
  const detailSource = record(authored) && Array.isArray(authored.details)
    ? authored.details
    : [["Based", person.based]];
  const details = detailSource.flatMap((entry) =>
    Array.isArray(entry) && text(entry[0]) && text(entry[0]).toLowerCase() !== "discipline" && text(entry[1])
      ? [[text(entry[0]), text(entry[1])]] : []
  );
  return { text: description, details };
}

export function getProfileSections(person) {
  if (!record(person)) return [];
  const portfolio = record(person.portfolio) ? person.portfolio : {};
  const { performer, keys } = sectionOrder(person);
  const neutralKey = performer ? "PHOTOS" : "PORTFOLIO";
  const orderedKeys = keys.flatMap((key) => key === "ABOUT" ? ["COVERS", key] : [key]);
  return orderedKeys.flatMap((key) => {
    const label = LABELS[key];
    if (key === "ABOUT") {
      const content = aboutContent(person, portfolio);
      return content.text || content.details.length ? [{ key, label, kind: "about", ...content }] : [];
    }
    if (key === "CV") {
      const href = safeUrl(typeof portfolio.cv === "string" ? portfolio.cv : portfolio.cv?.href);
      return href ? [{ key, label, kind: "document", href }] : [];
    }
    let source = portfolio[key.toLowerCase()];
    if (key === "PHOTOS" && !own(portfolio, "photos") && own(portfolio, "photo")) source = portfolio.photo;
    if (key === neutralKey && !own(portfolio, key.toLowerCase()) && !(key === "PHOTOS" && own(portfolio, "photo"))) {
      source = person.images;
    }
    if (key === "CREDITS") {
      const items = creditItems(source);
      return items.length ? [{ key, label, kind: "credits", items }] : [];
    }
    const kind = VIDEOS.has(key) ? "videos" : "gallery";
    const items = kind === "videos" ? videoItems(source, label, key) : galleryItems(source, person, key);
    return items.length ? [{ key, label, kind, items }] : [];
  });
}

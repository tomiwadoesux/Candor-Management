// THE MEASURER — turns the page as rendered into a layout map bucket.
//
// Development only: the recorder imports this, and the recorder is only ever
// loaded behind a NODE_ENV check, so none of it reaches a production bundle.
//
// It walks the live DOM once and keeps what a reader would see in the first
// screen, nothing else:
//
//   text      one bar per LINE, from Range.getClientRects() on each text node,
//             so wrapped paragraphs come out ragged exactly where the real
//             ones are, and a vertical rail comes out vertical.
//   media     img, video, canvas, iframe, large svg, url() backgrounds —
//             recorded as a block and not descended into.
//   surfaces  any background that differs from what is behind it. A dark
//             band on a light page, a card, a pill. Same-colour wrappers are
//             skipped, so the map is not a pile of nested boxes.
//   borders   one thin rect per side, or a stroked outline when all four
//             sides match and the box is wholly on screen.
//
// Everything is clipped through overflow:hidden ancestors and the viewport,
// and anything at near-zero opacity is dropped with its subtree.
//
// Two attributes steer it from the markup:
//
//   data-skeleton="skip"    leave this element and everything in it out
//   data-skeleton="block"   draw this element as one media block, don't
//                           look inside (a WebGL scene, a dense collage)

import { MAP_VERSION, SURFACE, MEDIA, TEXT, RULE, OUTLINE } from "./layoutMap";

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "TEMPLATE",
  "LINK",
  "META",
  // The Next.js dev overlay and badge. They are a shadow root inside a custom
  // element, so nothing inside would be found anyway, but the host box is.
  "NEXTJS-PORTAL",
]);

const MEDIA_TAGS = new Set(["IMG", "VIDEO", "CANVAS", "IFRAME", "OBJECT", "EMBED"]);

// An svg smaller than this on both sides is an icon — an arrow, a glyph —
// and is drawn as ink alongside the text it sits next to, not as a picture.
const ICON_MAX = 40;

// Past this the file stops being cheap to fetch on hover. A dense first
// screen rarely gets near it; the cap is for runaway pages (a 400-tile grid).
const MAX_BLOCKS = 900;

// Skeleton bars sit at roughly the x-height-to-cap-height band of the type,
// not the full line box. Full-height bars read as blocks, not as lines.
const BAR_RATIO = 0.62;

// ---------------------------------------------------------------------------
// Colour. Computed styles come back as rgb(), rgba(), and — for Tailwind v4's
// palette — oklch(). Painting each string onto a 1px canvas and reading the
// pixel back normalises all of them without a colour-space parser.
// ---------------------------------------------------------------------------

let paint = null;
const parsed = new Map();

function parseColor(str) {
  if (!str || str === "transparent" || str === "none") return [0, 0, 0, 0];
  const hit = parsed.get(str);
  if (hit) return hit;

  if (!paint) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    paint = canvas.getContext("2d", { willReadFrequently: true });
  }
  paint.clearRect(0, 0, 1, 1);
  paint.fillStyle = "#000";
  paint.fillStyle = str;
  paint.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = paint.getImageData(0, 0, 1, 1).data;
  const rgba = [r, g, b, a / 255];
  parsed.set(str, rgba);
  return rgba;
}

// What a translucent colour actually looks like over its backdrop.
function over([r, g, b, a], [br, bg, bb], opacity = 1) {
  const t = a * opacity;
  return [
    Math.round(r * t + br * (1 - t)),
    Math.round(g * t + bg * (1 - t)),
    Math.round(b * t + bb * (1 - t)),
  ];
}

function luminance([r, g, b]) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function distance(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
}

function hex([r, g, b]) {
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// Ink that reads on a given backdrop: near-black on light, near-white on dark.
function contrastInk(backdrop) {
  return luminance(backdrop) > 0.5 ? [12, 12, 12] : [245, 245, 245];
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

function clipTo(r, c) {
  const l = Math.max(r.left, c.l);
  const t = Math.max(r.top, c.t);
  const rr = Math.min(r.right, c.r);
  const b = Math.min(r.bottom, c.b);
  if (rr - l < 1 || b - t < 1) return null;
  return { l, t, r: rr, b };
}

// How much of `outer` the box `inner` covers, 0–1.
function cover(inner, outer) {
  const w = Math.min(inner.r, outer.r) - Math.max(inner.l, outer.l);
  const h = Math.min(inner.b, outer.b) - Math.max(inner.t, outer.t);
  if (w <= 0 || h <= 0) return 0;
  return (w * h) / ((outer.r - outer.l) * (outer.b - outer.t));
}

function radiusOf(cs, w, h) {
  const raw = cs.borderTopLeftRadius;
  if (!raw || raw === "0px") return 0;
  const n = parseFloat(raw);
  if (!n) return 0;
  const px = raw.endsWith("%") ? (n / 100) * Math.min(w, h) : n;
  return Math.min(px, w / 2, h / 2);
}

function clipsChildren(cs) {
  return (
    cs.overflowX !== "visible" ||
    cs.overflowY !== "visible" ||
    (cs.contain && /paint|strict|content/.test(cs.contain))
  );
}

// ---------------------------------------------------------------------------

export function captureLayout({ exclude } = {}) {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const viewport = { l: 0, t: 0, r: vw, b: vh };

  const bodyCs = getComputedStyle(document.body);
  const htmlCs = getComputedStyle(document.documentElement);
  let pageBg = parseColor(bodyCs.backgroundColor);
  if (pageBg[3] < 0.5) pageBg = parseColor(htmlCs.backgroundColor);
  const bg = pageBg[3] < 0.5 ? [255, 255, 255] : over(pageBg, [255, 255, 255]);
  const fg = (() => {
    const c = over(parseColor(bodyCs.color), bg);
    return Math.abs(luminance(c) - luminance(bg)) < 0.3 ? contrastInk(bg) : c;
  })();

  // Paint order: everything in normal flow first, then everything that is
  // fixed, sticky or lifted by z-index, so a fixed header's panel covers the
  // page text under it the way it does on screen. Inside each layer, panels
  // and pictures go in DOM order and text goes last, on top of them.
  const layers = [
    { shapes: [], text: [] },
    { shapes: [], text: [] },
  ];

  const colors = [];
  const colorIndex = new Map();
  const ci = (rgb) => {
    const h = hex(rgb);
    if (!colorIndex.has(h)) {
      colorIndex.set(h, colors.length);
      colors.push(h);
    }
    return colorIndex.get(h);
  };

  const push = (layer, kind, box, color, r = 0) => {
    const x = Math.round(box.l);
    const y = Math.round(box.t);
    const w = Math.max(1, Math.round(box.r - box.l));
    const h = Math.max(1, Math.round(box.b - box.t));
    const block = [kind, x, y, w, h, ci(color)];
    if (r >= 1) block.push(Math.round(r));
    (kind === TEXT ? layers[layer].text : layers[layer].shapes).push(block);
    return block;
  };

  // Panels a picture fills, settled once the walk is done. See releaseHeld().
  const held = [];

  const range = document.createRange();

  function text(node, cs, ctx, layer) {
    range.selectNodeContents(node);
    const rects = range.getClientRects();
    if (!rects.length) return;

    // Gradient or clipped text has a transparent fill and no usable colour
    // of its own — ink for its backdrop stands in for it.
    let color = parseColor(cs.webkitTextFillColor || cs.color);
    if (color[3] * ctx.opacity < 0.08) {
      if (cs.backgroundClip !== "text" && cs.webkitBackgroundClip !== "text") return;
      color = [...contrastInk(ctx.backdrop), 1];
    }
    let ink = over(color, ctx.backdrop, ctx.opacity);
    // Blend-mode headings and the like can be the same colour as what is
    // behind them in the DOM while reading fine on screen. A bar that would
    // vanish into its backdrop takes contrasting ink instead.
    if (Math.abs(luminance(ink) - luminance(ctx.backdrop)) < 0.12) {
      ink = contrastInk(ctx.backdrop);
    }

    const fs = parseFloat(cs.fontSize) || 16;
    const vertical = /^(vertical|sideways)/.test(cs.writingMode);

    for (const r of rects) {
      if (r.width < 2 || r.height < 2) continue;
      let bar;
      if (vertical) {
        const w = Math.min(r.width, Math.max(2, fs * BAR_RATIO));
        const l = r.left + (r.width - w) / 2;
        bar = { left: l, right: l + w, top: r.top, bottom: r.bottom };
      } else {
        const h = Math.min(r.height, Math.max(2, fs * BAR_RATIO));
        const t = r.top + (r.height - h) / 2;
        bar = { left: r.left, right: r.right, top: t, bottom: t + h };
      }
      const box = clipTo(bar, ctx.clip);
      if (box) {
        push(layer, TEXT, box, ink);
        // Every panel this text is set on now carries type. See below.
        for (let s = ctx.surface; s && !s.text; s = s.parent) s.text = true;
      }
    }
  }

  function walk(el, ctx) {
    if (SKIP_TAGS.has(el.tagName)) return;
    if (exclude && exclude(el)) return;
    const hint = el.getAttribute("data-skeleton");
    if (hint === "skip") return;

    const cs = getComputedStyle(el);
    if (cs.display === "none") return;

    const opacity = ctx.opacity * (parseFloat(cs.opacity) || 0);
    if (opacity < 0.06) return;

    const pos = cs.position;
    let layer = ctx.layer;
    if (pos === "fixed" || pos === "sticky" || (pos !== "static" && parseInt(cs.zIndex, 10) > 0)) {
      layer = 1;
    }

    // A fixed element escapes every ancestor's overflow; only the viewport
    // still clips it.
    const outer = pos === "fixed" ? viewport : ctx.clip;
    let clip = outer;
    let backdrop = ctx.backdrop;
    // The nearest panel drawn under this element:
    // { block, box, under, parent, text } — `text` once any type is set on it.
    let surface = ctx.surface;

    const rect = el.getBoundingClientRect();
    const box = clipTo(rect, clip);
    const shown = cs.visibility === "visible" && box;

    if (clipsChildren(cs)) {
      if (!box) return; // clipped away entirely: nothing inside can show
      clip = box;
    }

    if (shown) {
      const w = rect.width;
      const h = rect.height;
      const r = radiusOf(cs, w, h);
      const isSvg = el.namespaceURI === "http://www.w3.org/2000/svg";

      if (hint === "block" || MEDIA_TAGS.has(el.tagName) || (isSvg && el.tagName === "svg")) {
        if (isSvg && w < ICON_MAX && h < ICON_MAX) {
          push(layer, TEXT, box, over([...contrastInk(backdrop), 1], backdrop));
          return;
        }
        const block = push(layer, MEDIA, box, contrastInk(backdrop), r);
        if (surface && cover(box, surface.box) >= 0.85) held.push({ surface, media: block });
        return;
      }
      if (isSvg) return; // inner svg nodes are covered by their <svg>

      const fill = parseColor(cs.backgroundColor);
      if (fill[3] * opacity >= 0.35 && w >= 6 && h >= 6) {
        const seen = over(fill, backdrop, opacity);
        if (distance(seen, backdrop) > 10) {
          const block = push(layer, SURFACE, box, seen, r);
          surface = { block, box, under: backdrop, parent: surface, text: false };
        }
        if (fill[3] * opacity >= 0.6) backdrop = seen;
      }

      if (cs.backgroundImage && cs.backgroundImage.includes("url(")) {
        const block = push(layer, MEDIA, box, contrastInk(backdrop), r);
        if (surface && cover(box, surface.box) >= 0.85) held.push({ surface, media: block });
      }

      const sides = ["Top", "Right", "Bottom", "Left"].map((s) => ({
        w: cs[`border${s}Style`] === "none" ? 0 : parseFloat(cs[`border${s}Width`]) || 0,
        c: cs[`border${s}Color`],
      }));
      if (sides.some((s) => s.w >= 0.5)) {
        const whole =
          sides.every((s) => s.w >= 0.5 && s.c === sides[0].c) &&
          box.l === rect.left &&
          box.t === rect.top &&
          box.r === rect.right &&
          box.b === rect.bottom;
        if (whole) {
          const c = parseColor(sides[0].c);
          if (c[3] * opacity >= 0.06) push(layer, OUTLINE, box, over(c, backdrop, opacity), r);
        } else {
          const lines = [
            { left: rect.left, right: rect.right, top: rect.top, bottom: rect.top + sides[0].w },
            { left: rect.right - sides[1].w, right: rect.right, top: rect.top, bottom: rect.bottom },
            { left: rect.left, right: rect.right, top: rect.bottom - sides[2].w, bottom: rect.bottom },
            { left: rect.left, right: rect.left + sides[3].w, top: rect.top, bottom: rect.bottom },
          ];
          sides.forEach((s, i) => {
            if (s.w < 0.5) return;
            const c = parseColor(s.c);
            if (c[3] * opacity < 0.06) return;
            // An element's own overflow never clips its own border.
            const line = clipTo(lines[i], outer);
            if (line) push(layer, RULE, line, over(c, backdrop, opacity));
          });
        }
      }
    }

    const next = { clip, opacity, backdrop, layer, surface };
    for (const child of el.childNodes) {
      if (child.nodeType === 1) walk(child, next);
      else if (child.nodeType === 3 && cs.visibility === "visible" && child.data.trim()) {
        text(child, cs, next, layer);
      }
    }
  }

  walk(document.body, { clip: viewport, opacity: 1, backdrop: bg, layer: 0, surface: null });
  range.detach?.();

  // A picture filling the panel it sits in hides that panel once it loads. A
  // photo tile on a dark placeholder ground should read as a picture, not as
  // a black slab, so the panel is dropped and the picture takes the ink of
  // whatever is behind the panel.
  //
  // Unless text is set on it — text inside it in the DOM, not text from a
  // fixed bar that happens to float over it. A dark hero with a full-bleed
  // photo and white type over it needs its dark ground, or the white bars
  // have nothing to read against.
  const dropped = new Set();
  for (const { surface, media } of held) {
    if (surface.text) continue;
    dropped.add(surface.block);
    media[5] = ci(contrastInk(surface.under));
  }

  const blocks = [];
  for (const { shapes, text: lines } of layers) {
    blocks.push(...shapes.filter((b) => !dropped.has(b)), ...mergeLines(lines));
  }

  return {
    v: MAP_VERSION,
    vw,
    vh,
    bg: hex(bg),
    fg: hex(fg),
    colors,
    blocks: blocks.length > MAX_BLOCKS ? trim(blocks) : blocks,
  };
}

// A line set in three spans — "Hello <em>there</em> world" — comes back as
// three rects. Runs on the same baseline, in the same ink, that nearly touch
// are one line to a reader, so they become one bar.
function mergeLines(lines) {
  const sorted = [...lines].sort((a, b) => a[5] - b[5] || a[2] - b[2] || a[1] - b[1]);
  const out = [];
  for (const b of sorted) {
    const prev = out[out.length - 1];
    if (
      prev &&
      prev[5] === b[5] &&
      Math.abs(prev[2] - b[2]) <= 1 &&
      Math.abs(prev[4] - b[4]) <= 1 &&
      b[1] - (prev[1] + prev[3]) <= Math.max(4, b[4] * 0.9) &&
      b[1] >= prev[1]
    ) {
      prev[3] = Math.max(prev[3], b[1] + b[3] - prev[1]);
      continue;
    }
    out.push([...b]);
  }
  return out;
}

// Over the cap, the smallest blocks go first — they are the ones nobody
// would miss in a one-second glance.
function trim(blocks) {
  const keep = new Set(
    blocks
      .map((b, i) => [b[3] * b[4], i])
      .sort((a, b) => b[0] - a[0])
      .slice(0, MAX_BLOCKS)
      .map(([, i]) => i)
  );
  return blocks.filter((_, i) => keep.has(i));
}

// Coarse fingerprint — positions rounded to 4px, colours to 16 steps a
// channel — so the recorder can tell a real change from sub-pixel jitter or
// a placeholder tint drifting as photos cycle, and a page that is still
// moving from one at rest.
export function layoutSignature(bucket) {
  const q = (n) => Math.round(n / 4);
  const tone = (h) => h.replace(/[0-9a-f]{2}/g, (c) => (parseInt(c, 16) >> 4).toString(16));
  return `${bucket.vw}x${bucket.vh}|${bucket.bg}|${bucket.blocks
    .map((b) => `${b[0]}:${q(b[1])},${q(b[2])},${q(b[3])},${q(b[4])}:${tone(bucket.colors[b[5]])}`)
    .join(";")}`;
}

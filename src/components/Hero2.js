"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import Image from "next/image";
import { useRouter } from "next/navigation";
import DuotoneText from "@/components/DuotoneText";

gsap.registerPlugin(Draggable);

// Desktop layout — local model images (remote picsum was flaky, cards randomly
// stayed black). Staggered scatter, no aligned rows. The grid is centered and
// repeats every 2000px, so the screen shows layout-x ~1280-2000 on the left
// half and ~0-720 (as the duplicate) on the right half — cards live in those
// ranges so most of them are actually on screen. The wordmark channel
// (x 1650-2000 and 0-350, y 620-880) stays empty so CANDOR always reads.
// TEMPORARY layout-editing mode: every card renders as a flat grey box with
// its slot number instead of its photograph, so the field can be rearranged
// by number. First set = 1..13, duplicate set = 14..26 (same slots, +2000px).
// Flip to false to get the photographs back; nothing else changes.
export const NUMBER_CARDS = false;
export const SLOT_COUNT = 9;
// Labels of the two slots the MODELS / TALENTS cards sit on top of. The
// duplicate set is lettered (B1..B9) so no label is ever ambiguous: slot 3 of
// the first set, slot 7 of the duplicate set.
export const BOARD_SLOT_NUMBERS = ["3", "B7"];

// Nine cards, not thirteen. The field was dense enough that the wordmark and
// the two board cards had to compete with it; thinning it lets the photographs
// read individually and gives the CANDOR channel room to breathe.
//
// What went: the three "far stretch" cards around x830-850, which only ever
// appeared on ultrawide screens or at the end of a hover pan, and one of the
// three stacked down the left column. The survivors were then RESPACED across
// the pattern rather than left where they were — deleting alone leaves holes
// where cards used to be, which reads as a broken grid instead of a sparse one.
//
// Two rules the coordinates answer to, both load-bearing:
//   1. The wordmark channel (x 1650-2000 and 0-350, y 620-880) stays EMPTY, so
//      CANDOR always reads against clean background.
//   2. The two `board` cards keep their exact positions. Choose.js grows the
//      MODELS / TALENTS cards out of these and cross-fades them by
//      data-board-src, so moving one desynchronises the homepage intro.
//
// Composition: think of the screen as five columns (outer left, inner left,
// wordmark, inner right, outer right) by three bands. The two board cards hold
// the outer-column middles; the wordmark holds the centre. The rest is placed
// so that no two cards share a top edge, every gutter is 60px or more, and the
// SIZES carry a hierarchy — one hero portrait (top right), tall portraits in
// the outer columns, landscapes tucked against the wordmark, and one small
// square so the field has a quiet note in it. Uniform sizes were what made the
// previous nine read as a grid with pieces missing.
// The inner-left bottom cell is left empty on purpose; the bottom-left portrait
// is shifted inward to sit under that gap.
const layoutDataDesktop = [
  // left half of the screen
  { x: 1280, y: 230, w: 310, h: 440, img: "/images/img3.jpeg" }, // outer, tall
  { x: 1650, y: 310, w: 350, h: 240, img: "/images/img12.jpeg" }, // inner, landscape above the wordmark
  // LOCKED. Flanks the wordmark on the left; the MODELS card starts life
  // exactly on top of this one and fades it out underneath (data-board-src).
  { x: 1290, y: 740, w: 350, h: 260, img: "/images/img1.jpeg", board: 0 },
  { x: 1380, y: 1070, w: 300, h: 400, img: "/images/img19.jpeg" }, // bottom, portrait, nudged inward
  // right half of the screen (shown via the duplicate set)
  { x: 380, y: 190, w: 360, h: 420, img: "/images/img14.jpeg" }, // outer, the hero portrait
  { x: 70, y: 340, w: 220, h: 220, img: "/images/img5.jpeg" }, // inner, small square above the wordmark
  // LOCKED. Mirrors it on the right (via the duplicate set); the TALENTS card
  // starts on top of this one and fades it out the same way.
  { x: 350, y: 680, w: 370, h: 270, img: "/images/img24.jpeg", board: 1 },
  { x: 30, y: 1020, w: 280, h: 230, img: "/images/img28.jpeg" }, // inner, landscape under the wordmark
  { x: 430, y: 1050, w: 290, h: 400, img: "/images/img9.jpeg" }, // outer, tall
];

// The base tone a card sits on while it waits for its photograph. These sit on
// the SITE background (#fafafa / white), so a waiting card is very nearly
// invisible — it reads as empty page, and the ash shimmer sweeping through it
// is the only thing that marks where an image is about to land. Barely-there
// variation keeps the field from looking mechanically uniform.
const PLACEHOLDER_TONES = [
  "#fafafa",
  "#f7f7f7",
  "#fbfbfa",
  "#f8f8f9",
  "#fafaf9",
  "#f9f8f8",
  "#fafbfb",
  "#f8f9fa",
  "#fbfafa",
  "#f9f9f8",
  "#f8fafa",
  "#fafaf8",
  "#f9f9fa",
];

// The cards arrive one at a time, in SCATTERED order — never a left-to-right
// sweep. The coloured box is what a card looks like before its image is ready;
// the photo then fades in over it once decoded.
const REVEAL_STEP = 32; // ms between consecutive cards entering
const REVEAL_MS = 260; // ms for a single card's fade-up
const IMG_FADE_MS = 260; // ms for a photo to fade in over its card
// Resting opacity of a revealed photograph. 0.42 was tuned against a near-black
// card, where a low value read as a moody dark image. Over the site's white
// background the same value just washes the photo out to a pale ghost, so the
// photographs are shown much closer to full strength now.
const IMG_OPACITY = 0.92;
// Guaranteed shimmer time after a card lands, before its photo is allowed in.
// Without this a cached image is `complete` on the first frame and the card
// would jump straight to the photograph — the shimmer would never be seen at
// all on a reload. Enough for roughly one visible sweep.
const SHIMMER_MIN_MS = 780;

// Entry ORDER, scattered on purpose. The layout array runs left-half then
// right-half, so revealing by index sweeps the screen left to right. A fixed
// shuffle (not Math.random, so every visitor sees the same considered
// choreography) breaks that: consecutive entries land in unrelated corners,
// which reads as cards appearing one by one at random across the whole field.
// Coprime stride over the card count — visits every index exactly once, and
// never lands adjacent twice in a row. 7 and 9 share no factor, so this still
// holds at the reduced count (the loop below also self-corrects if it ever
// stops being coprime).
const ORDER_STRIDE = 7;

export default function Hero2() {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [layoutData, setLayoutData] = useState(layoutDataDesktop);
  const gridRef = useRef(null);
  const containerRef = useRef(null);

  const zoomRef = useRef(null);
  const router = useRouter();
  const nextIdRef = useRef(0);
  // Scroll-driven "separation" amount (0 at rest). The zoom loop writes it; the
  // magnet loop reads it and drifts each card outward, so the two effects share
  // one card transform instead of fighting over it.
  const sepRef = useRef(0);
  // The layer carrying the intro's blur and fade. The whole field lives on it
  // now: nothing is exempt, because the board cards are no longer hero cards
  // in disguise — Choose owns its own two and flies them itself.
  const fieldRef = useRef(null);
  // Tracks which cards have already revealed, so a re-render never replays a
  // reveal that has already happened.
  const revealedRef = useRef(null);

  const config = {
    gridSize: 5000,
    dragBounds: 1500,
    parallaxIntensity: 0.15,
    inertia: true,
    edgeResistance: 0.8,
  };

  useEffect(() => {
    const initialImages = layoutData.map((layout, index) => {
      return {
        id: `img-${nextIdRef.current++}`,
        src: layout.img || `https://picsum.photos/seed/${index}/400/400`,
        alt: `Image ${index + 1}`,
        modelName: `Image ${index + 1}`,
        modelId: index + 1,
      };
    });

    setImages(initialImages);
    setIsLoading(false);
  }, [layoutData]);

  useEffect(() => {
    if (!isLoading && gridRef.current && images.length > 0) {
      const grid = gridRef.current;
      const container = containerRef.current;
      if (!grid || !container) return;

      // Check if device is mobile/tablet
      const isMobile = window.innerWidth < 1024;

      // Mouse hover interactions
      let targetHoverX = 0;
      let targetHoverY = 0;
      let currentHoverX = 0;
      let currentHoverY = 0;
      let autoScrollX = 0;

      const updatePosition = () => {
        // Auto-scroll slowly to the right ONLY on mobile/tablet devices
        if (isMobile) {
          autoScrollX -= 0.3; // Slow continuous scroll

          // Reset position when scrolled one full pattern width
          if (autoScrollX <= -5000) {
            autoScrollX = 0;
          }
        }

        // Smooth hover transitions
        currentHoverX += (targetHoverX - currentHoverX) * 0.1;
        currentHoverY += (targetHoverY - currentHoverY) * 0.1;

        gsap.set(grid, {
          x: currentHoverX + (isMobile ? autoScrollX : 0),
          y: currentHoverY,
        });
        requestAnimationFrame(updatePosition);
      };
      updatePosition();

      // Magnetic pull on individual cards
      const cards = grid.querySelectorAll("[data-image-card]");
      const cardState = new Map();
      const MAGNET_RADIUS = 340; // px — how far the cursor's pull reaches
      const MAGNET_STRENGTH = 0.3; // fraction of the gap a card closes at most

      // Each card's offset from the grid centre — the direction it drifts as the
      // intro zoom progresses. Proportional to distance, so the whole field
      // dilates about the centre while card sizes stay put => the gaps between
      // cards visibly open up (they pull apart, not just scale as one block).
      const gridCX = grid.offsetWidth / 2;
      const gridCY = grid.offsetHeight / 2;

      cards.forEach((card) => {
        cardState.set(card, {
          tx: 0,
          ty: 0,
          cx: 0,
          cy: 0,
          dirX: card.offsetLeft + card.offsetWidth / 2 - gridCX,
          dirY: card.offsetTop + card.offsetHeight / 2 - gridCY,
          // Untransformed centre within the grid. Cached because it never
          // changes — the card only ever MOVES via transform, which does not
          // affect offsetLeft/offsetTop.
          baseX: card.offsetLeft + card.offsetWidth / 2,
          baseY: card.offsetTop + card.offsetHeight / 2,
        });
      });

      // Where the grid's own origin sits on screen, so a card's screen centre
      // can be derived from its cached layout centre without touching the DOM.
      let gridOriginX = 0;
      let gridOriginY = 0;
      const measureGridOrigin = () => {
        const r = grid.getBoundingClientRect();
        // getBoundingClientRect reflects the grid's current pan transform;
        // subtract it to recover the untransformed origin.
        gridOriginX = r.left - currentHoverX - (isMobile ? autoScrollX : 0);
        gridOriginY = r.top - currentHoverY;
      };
      measureGridOrigin();
      window.addEventListener("resize", measureGridOrigin);

      const animateMagnets = () => {
        const sep = sepRef.current; // 0 at rest, grows with the intro scroll
        cards.forEach((card) => {
          const s = cardState.get(card);

          s.cx += (s.tx - s.cx) * 0.12;
          s.cy += (s.ty - s.cy) * 0.12;
          // Magnet hover offset + outward separation, combined into one
          // transform so the two never clobber each other's card.style.transform.
          const sx = s.cx + s.dirX * sep;
          const sy = s.cy + s.dirY * sep;
          card.style.transform = `translate3d(${sx}px, ${sy}px, 0)`;
        });
        requestAnimationFrame(animateMagnets);
      };
      animateMagnets();

      // --- Sequential card reveal ---
      // Two independent stages, which is the whole point:
      //   1. The CARD (its colour block) fades in one by one, on a fixed
      //      stagger. This is pure choreography — it does not wait for any
      //      network, so the field always builds up in a clean sequence.
      //   2. Each PHOTO fades in over its own card whenever that image has
      //      actually decoded. A slow image just means its card sits as a
      //      colour block for longer, which is exactly what the colour is for.
      // Keeping these separate is what stops a slow network from turning the
      // reveal into an arbitrary, clumpy order.
      if (!revealedRef.current) revealedRef.current = new WeakSet();
      const revealed = revealedRef.current;
      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const timers = [];

      // Pick a stride coprime with the card count so `(i * stride) % n` visits
      // every slot exactly once. If ORDER_STRIDE ever shares a factor with the
      // count (someone adds a card), walking up finds the next valid stride —
      // so the scatter degrades gracefully instead of silently collapsing into
      // a few cards revealing and the rest never appearing at all.
      const gcd = (a, b) => (b ? gcd(b, a % b) : a);
      let stride = ORDER_STRIDE;
      while (cards.length > 1 && gcd(stride, cards.length) !== 1) stride++;

      cards.forEach((card, i) => {
        const img = card.querySelector("[data-card-img]");

        // Guard the WHOLE card once, before either stage registers anything.
        // The effect re-runs on re-render; without this, stage 2 would stack a
        // duplicate load listener and a duplicate shimmer timer every time.
        if (revealed.has(card)) return;
        revealed.add(card);

        // Position in the entry sequence — scattered, not index order, so the
        // field fills in at random across the screen rather than sweeping.
        // Deterministic (no Math.random), so the choreography is the same
        // every load and the two duplicate card sets stay interleaved.
        const slot = (i * stride) % cards.length;
        const cardDelay = reduced ? 0 : slot * REVEAL_STEP;

        // --- stage 2: the photo, gated on its own load AND the shimmer ---
        const revealPhoto = () => {
          if (!img) return;
          // Stop the shimmer first: the sweep is the "waiting" state, so it
          // must end as the photograph takes over. The class fades the sweep
          // layer out rather than cutting it, so a card that finishes loading
          // mid-sweep doesn't snap.
          card.classList.add("is-loaded");
          img.style.transition = reduced
            ? "none"
            : `opacity ${IMG_FADE_MS}ms ease, filter 300ms ease`;
          void img.offsetHeight;
          img.style.opacity = String(IMG_OPACITY);
        };
        if (img) {
          // Two independent gates, both of which must open: the image has to
          // be decoded, AND the card's shimmer window has to have elapsed.
          // Whichever finishes last triggers the reveal.
          let imgReady = false;
          let shimmerDone = false;
          const tryReveal = () => {
            if (imgReady && shimmerDone) revealPhoto();
          };
          const onReady = () => {
            imgReady = true;
            tryReveal();
          };
          // `complete` covers cache hits, which fire no load event and would
          // otherwise stay invisible forever.
          if (img.complete && img.naturalWidth > 0) onReady();
          else {
            img.addEventListener("load", onReady, { once: true });
            // A failed image just keeps shimmering out to its base tone.
            img.addEventListener("error", onReady, { once: true });
          }
          // The window starts when this card lands, not at mount, so a card
          // revealed late in the stagger still shimmers for its full time.
          const st = setTimeout(
            () => {
              shimmerDone = true;
              tryReveal();
            },
            reduced ? 0 : cardDelay + SHIMMER_MIN_MS
          );
          timers.push(st);
        }

        // --- stage 1: the card itself, on a scattered stagger ---
        const t = setTimeout(() => {
          // Transition OPACITY ONLY. The magnet/separation loop writes
          // card.style.transform every frame — letting a transition touch
          // transform would make that loop lag a frame behind and turn the
          // hover magnetism and the scroll separation into mush.
          card.style.transition = reduced
            ? "none"
            : `opacity ${REVEAL_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
          void card.offsetHeight;
          // The two cards a board card replaces are never shown: the real
          // MODELS / TALENTS card sits in their slot from the first frame and
          // only borrows their position. Revealing them here would flash a
          // duplicate photograph underneath it.
          if (card.dataset.boardSrc == null || NUMBER_CARDS)
            card.style.opacity = "1";
        }, cardDelay);
        timers.push(t);
      });

      // Hover pan: moving the cursor drifts the whole field the same way, so
      // hovering toward an edge reveals more of the rectangles. Kept small —
      // the cards hug the wordmark now, so a bigger pan would slide them
      // over the letters.
      const handleMouseMove = (e) => {
        const nx = (e.clientX / window.innerWidth) * 2 - 1; // -1 .. 1
        const ny = (e.clientY / window.innerHeight) * 2 - 1;
        targetHoverX = nx * 30;
        targetHoverY = ny * 24;

        // --- Cursor attraction ---
        // Cards near the pointer lean toward it, as if the cursor carried a
        // small gravitational pull. Read each card's live screen box (it is
        // being transformed every frame by the pan / magnet / separation
        // loops, so a cached layout position would be wrong) and set a TARGET
        // offset; animateMagnets eases toward it, which is what keeps the
        // motion soft instead of snapping to the cursor.
        const panX = currentHoverX + (isMobile ? autoScrollX : 0);
        const panY = currentHoverY;
        for (let k = 0; k < cards.length; k++) {
          const card = cards[k];
          const st = cardState.get(card);
          if (!st) continue;
          // Screen centre from cached layout + the grid's current pan. No
          // getBoundingClientRect here: 26 forced reflows on every mousemove
          // would stutter, and reading the already-transformed box would feed
          // the card's own magnet offset back into its next target.
          const cxScreen = gridOriginX + panX + st.baseX;
          const cyScreen = gridOriginY + panY + st.baseY;
          const dx = e.clientX - cxScreen;
          const dy = e.clientY - cyScreen;
          const dist = Math.hypot(dx, dy);
          if (dist < MAGNET_RADIUS) {
            // Falls off with distance: strongest right under the cursor,
            // easing to nothing at the edge of the radius, so cards don't all
            // lurch at once when the pointer crosses the field.
            const pull = (1 - dist / MAGNET_RADIUS) * MAGNET_STRENGTH;
            st.tx = dx * pull;
            st.ty = dy * pull;
          } else {
            st.tx = 0;
            st.ty = 0;
          }
        }
      };

      const handleMouseLeave = () => {
        targetHoverX = 0;
        targetHoverY = 0;
        cards.forEach((card) => {
          const s = cardState.get(card);
          s.tx = 0;
          s.ty = 0;
        });
      };

      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseleave", handleMouseLeave);
        window.removeEventListener("resize", measureGridOrigin);
        timers.forEach(clearTimeout);
      };
    }
  }, [isLoading, images]);

  // Scroll-driven "enter from the center" effect:
  // the whole field zooms in from its center and progressively blurs as you scroll.
  useEffect(() => {
    if (isLoading || !zoomRef.current) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const el = zoomRef.current;
    let raf = 0;
    let sp = 0; // smoothed progress — glides between wheel steps instead of jumping

    const render = () => {
      // Spans the full 150vh intro so the zoom lands together with the logo,
      // the fade and the title fly-in.
      const dist = window.innerHeight * 1.5;
      const target = Math.min(1, Math.max(0, window.scrollY / dist));
      sp += (target - sp) * 0.16;
      if (Math.abs(target - sp) < 0.0005) sp = target;

      // The field LINGERS: the zoom is held back (pow 2.4) so the cards stay
      // near their resting size through the first half of the intro and only
      // accelerate away at the end — they hang around while the logo does its
      // own animation instead of rushing off immediately.
      const zoomP = Math.pow(sp, 2.4);
      const scale = 1 + zoomP * 6;
      // Blur tracks the MOTION, not the raw scroll. The cards barely move for
      // the first stretch (zoom is sp^2.4), so a blur keyed to sp alone went
      // soft while the field was still sitting still — the photographs were
      // smeared before they had travelled anywhere. Keying it to the same
      // held-back shape means the field is sharp while it is composed, and
      // only goes soft once it is genuinely moving.
      const blurP = Math.max(0, (sp - 0.18) / 0.82);
      const blur = Math.pow(blurP, 1.25) * 9;
      // Fade begins only once the field is genuinely on its way out, and
      // completes right at the end — so the dissolve is actually visible as
      // the cards leave rather than being over before they move.
      const fade = Math.pow(Math.max(0, (sp - 0.55) / 0.45), 1.15);
      el.style.transform = `scale(${scale})`;
      // Blur and fade go on the FIELD layer rather than the zoom container,
      // which keeps the container free to carry the scale on its own.
      const fieldEl = fieldRef.current;
      if (fieldEl) {
        fieldEl.style.filter = blur > 0.3 ? `blur(${blur}px)` : "none";
        fieldEl.style.opacity = (1 - Math.min(1, fade)).toFixed(3);
      }
      el.style.filter = "none";
      el.style.opacity = "1";
      // Separation is front-loaded (pow < 1) so the gaps start opening from the
      // very first scroll — ahead of the back-loaded zoom — reading as the field
      // pulling apart, then flying past. The magnet loop applies it per card.
      // Separation also held back (was pow 0.7, which opened the gaps from the
      // very first pixel of scroll) so the field stays composed while it
      // lingers, then pulls apart as it goes.
      sepRef.current = Math.pow(sp, 1.5) * 0.6;
      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [isLoading]);

  const resetView = () => {
    if (gridRef.current) {
      gsap.to(gridRef.current, {
        x: 0,
        y: 0,
        duration: 1,
        ease: "power2.inOut",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center ">
        <div className="text-white text-2xl font-light">Loading images...</div>
      </div>
    );
  }

  return (
    <section>
      <div className="relative w-screen h-screen overflow-hidden">
        <div
          data-hero-zoom
          ref={zoomRef}
          className="relative w-screen h-screen overflow-hidden bg-white"
          style={{
            willChange: "transform, filter, opacity",
            transformOrigin: "50% 50%",
          }}
        >
        <div className="absolute inset-0 " />

        {/* The field layer takes the intro's blur and fade. */}
        <div
          ref={fieldRef}
          className="w-full h-full"
          style={{ willChange: "filter, opacity" }}
        >
        {/* Main Grid Container */}
        <div
          ref={containerRef}
          className="w-full h-full relative"
          style={{ touchAction: "none" }}
        >
          <div
            ref={gridRef}
            className="absolute"
            style={{
              width: "4000px", // Double width for duplicated pattern
              height: "1500px",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* First set of images */}
            {images.map((image, index) => {
              const layout = layoutData[index % layoutData.length];
              return (
                <div
                  key={image.id}
                  data-image-card
                  {...(layout.board === 0 ? { "data-board-src": "0" } : {})}
                  onClick={() => router.push(`/models/${image.modelId}`)}
                  className="absolute overflow-hidden cursor-pointer group hero-card-shimmer"
                  style={{
                    left: `${layout.x}px`,
                    top: `${layout.y}px`,
                    width: `${layout.w}px`,
                    height: `${layout.h}px`,
                    backgroundColor:
                      PLACEHOLDER_TONES[index % PLACEHOLDER_TONES.length],
                    // The reveal sequence fades each card up from 0, one by
                    // one; the photo inside fades in separately once loaded.
                    opacity: 0,
                  }}
                >
                  {NUMBER_CARDS ? (
                    <div
                      className="w-full h-full flex items-center justify-center select-none"
                      style={{ backgroundColor: "#b8b8b8" }}
                    >
                      <span className="text-black font-medium text-5xl tabular-nums">
                        {(index % layoutData.length) + 1}
                      </span>
                    </div>
                  ) : (
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={layout.w}
                    height={layout.h}
                    data-card-img
                    /* Starts fully transparent so the coloured placeholder is
                       what shows until this image has loaded; the reveal
                       sequence fades it up once it is ready. */
                    className="w-full h-full object-cover"
                    style={{ opacity: 0 }}
                    draggable={false}
                    priority={index < 3}
                  />
                  )}
                  {/* No wash over the photo at all. The name is per-letter
                      black or white, sampled from the image behind it, so it
                      reads without a scrim dimming the photograph. */}
                  <div className="absolute inset-0 flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <DuotoneText
                      as="p"
                      imageSrc={image.src}
                      className="font-medium tracking-wide text-sm"
                      /* The mask has to be framed like the photo, and the
                         photo fills the whole card — so the layers span the
                         card box (inset-0 above) rather than a caption strip,
                         and the name is placed inside it by items-end. */
                      frame={{ width: "100%", height: "100%" }}
                      /* The photo rests at IMG_OPACITY over the card's own
                         near-white tone, so the pixels behind the name are
                         lighter than the file. Matting from the file alone
                         biased every card toward white text. */
                      alpha={IMG_OPACITY}
                      backdrop={250}
                    >
                      {image.modelName}
                    </DuotoneText>
                  </div>
                </div>
              );
            })}

            {/* Duplicated set for infinite scroll effect */}
            {images.map((image, index) => {
              const layout = layoutData[index % layoutData.length];
              return (
                <div
                  key={`${image.id}-duplicate`}
                  data-image-card
                  {...(layout.board === 1 ? { "data-board-src": "1" } : {})}
                  onClick={() => router.push(`/models/${image.modelId}`)}
                  className="absolute overflow-hidden cursor-pointer group hero-card-shimmer"
                  style={{
                    left: `${layout.x + 2000}px`, // Offset by pattern width
                    top: `${layout.y}px`,
                    width: `${layout.w}px`,
                    height: `${layout.h}px`,
                    backgroundColor:
                      PLACEHOLDER_TONES[index % PLACEHOLDER_TONES.length],
                    // The reveal sequence fades each card up from 0, one by
                    // one; the photo inside fades in separately once loaded.
                    opacity: 0,
                  }}
                >
                  {NUMBER_CARDS ? (
                    <div
                      className="w-full h-full flex items-center justify-center select-none"
                      style={{ backgroundColor: "#b8b8b8" }}
                    >
                      <span className="text-black font-medium text-5xl tabular-nums">
                        {"B" + ((index % layoutData.length) + 1)}
                      </span>
                    </div>
                  ) : (
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={layout.w}
                    height={layout.h}
                    data-card-img
                    /* Starts fully transparent so the coloured placeholder is
                       what shows until this image has loaded; the reveal
                       sequence fades it up once it is ready. */
                    className="w-full h-full object-cover"
                    style={{ opacity: 0 }}
                    draggable={false}
                    priority={false}
                  />
                  )}
                  {/* No wash over the photo at all. The name is per-letter
                      black or white, sampled from the image behind it, so it
                      reads without a scrim dimming the photograph. */}
                  <div className="absolute inset-0 flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <DuotoneText
                      as="p"
                      imageSrc={image.src}
                      className="font-medium tracking-wide text-sm"
                      /* The mask has to be framed like the photo, and the
                         photo fills the whole card — so the layers span the
                         card box (inset-0 above) rather than a caption strip,
                         and the name is placed inside it by items-end. */
                      frame={{ width: "100%", height: "100%" }}
                      /* The photo rests at IMG_OPACITY over the card's own
                         near-white tone, so the pixels behind the name are
                         lighter than the file. Matting from the file alone
                         biased every card toward white text. */
                      alpha={IMG_OPACITY}
                      backdrop={250}
                    >
                      {image.modelName}
                    </DuotoneText>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </div>
        </div>{" "}

      </div>
    </section>
  );
}

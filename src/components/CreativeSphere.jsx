"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import CustomEase from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

// cubic-bezier(0.32, 0.72, 0, 1) — the same curve Search.js uses for the
// drawer, so the sphere opens in the site's own motion language
const OPEN_EASE = CustomEase.create("candorOpen", "M0,0 C0.32,0.72 0,1 1,1");

/**
 * CreativeSphere — a draggable 3D globe of image cards.
 *
 * Cards are spread evenly over a sphere (Fibonacci / golden-angle spiral) and
 * always face the camera. Dragging rotates the whole sphere in screen space
 * (trackball feel) with momentum on release; the sphere idles on a slow
 * auto-rotation until the first interaction.
 *
 * A fixed "lens" sits at the centre of the globe: whichever card is passing
 * through the middle is largest, its neighbours a step smaller, tapering to
 * the rim. Back-hemisphere cards are smaller and faded.
 *
 * Opening is two steps. The first click on a card brings it forward on its
 * own, left-aligned with its details in a column beside it, and leaves the
 * rest of the sphere alone. Clicking that same card again is what tips the
 * other cards out into the board (fixed slots, or tidy masonry columns when
 * no slots are given). Clicking a board card swaps it in; clicking the open
 * card on the board selects it, and empty space / Esc closes.
 */
const DEFAULTS = {
  radius: 330, // px — sphere radius on screen (clamped to the viewport)
  // px kept between the rim cards and the viewport edge when the radius is
  // clamped. The vertical inset also keeps the globe clear of the caption.
  radiusInsetX: 24,
  radiusInsetY: 72,
  planeSize: 60, // px — resting card size (longest edge) before the lens
  mobilePlaneSize: 46,
  // centre lens: card through the middle = (1 + lensBoost)×, tapering to 1× at
  // lensReach × radius from the centre. Only front-hemisphere cards get it.
  lensBoost: 1.0,
  lensReach: 1.0,
  // pointer lens: a card under the cursor is (1 + cursorBoost)x, tapering to
  // 1x at cursorReach px away, so cards swell as the pointer nears them. It
  // eases towards the pointer at cursorEase per frame rather than snapping,
  // and parks back at the sphere's centre when the pointer leaves.
  cursorBoost: 0,
  cursorReach: 220, // px
  cursorEase: 0.09, // how fast the lens follows the pointer
  cursorRise: 0.07, // how fast a card takes up (and lets go of) the boost
  // depth cue: back-hemisphere cards shrink and fade
  depthScaleBack: 0.5,
  depthFadeBack: 0.55,
  // haze: cards behind the sphere's centre plane blend towards the page
  // colour with distance (renderer fog — no extra draw cost). fogDepth is how
  // far past the centre, in radii, a card is fully the page colour; 0 = off.
  fogDepth: 0,
  fogColor: 0xffffff,
  randomness: 0, // 0 = perfect Fibonacci sphere, 1 = hashed random points
  dragSpeed: 0.0022, // rad per px of pointer travel — the drag is 1:1 with it
  // how quickly the release speed catches up to the hand's per-frame pace
  // while dragging (0-1 lerp); lower = a flick reads the longer gesture
  flickBlend: 0.35,
  wheelSpeed: 0.0002, // 0 = the wheel is left alone entirely (no listener)
  friction: 0.94, // velocity multiplier per frame (momentum decay)
  smoothing: 0.15, // lerp towards target rotation each frame
  autoSpeed: 0.001, // rad per frame while idle
  autoStopsOnInteract: true,
  // after a drag/scroll the momentum decays down to this speed instead of to
  // zero, so the sphere keeps drifting the way it was last pushed. 0 = the
  // sphere coasts to a stop.
  driftSpeed: 0.001, // rad per frame
  // The idle heading doesn't hold forever: every wanderMin..wanderMax seconds
  // it eases round to a new one, up to wanderTurn degrees away. All of it runs
  // off the frame loop already in flight — no timers, no allocation, a couple
  // of trig calls a frame.
  idleWander: false, // true: this replaces the tilted auto-spin as the idle
  wanderMin: 5, // s — soonest the heading changes
  wanderMax: 13, // s — latest
  wanderTurn: 100, // deg — the widest single swing
  wanderRate: 0.012, // per frame lerp onto the new heading (~2s to settle)
  spinTilt: 23, // degrees — idle spin axis tilt off vertical
  spinTiltDir: 0,
  // focus state — the first click brings one card forward on its own with its
  // details alongside; the board only forms on the second click
  focusHeightVh: 52, // card height, % of the viewport
  focusMarginX: 48, // px from the left edge to the card
  focusGap: 36, // px between the card and the details column
  focusDetailsW: 280, // px reserved for the details column
  focusCenterY: 0.5, // card centre as a fraction of the viewport height
  focusDetailsMinW: 200, // px — the column shrinks to this before stacking
  // below this much room for the card the details stack under it instead
  focusMinCardW: 260,
  focusStackDetailsH: 132, // px the stacked details take, for centring
  // while a card is focused a frosted sheet is laid over the canvas: the
  // sphere behind it blurs and washes towards white so the details read.
  // The open card is mirrored into the DOM above the sheet to stay sharp.
  focusVeil: 0.3, // white tint of the sheet, 0-1 — this is what does the work
  focusVeilBlur: 2, // px — just enough to soften, not to defocus
  // open state
  expandHeightVh: 58,
  expandCenterY: 0.56, // open card centre as a fraction of the viewport height
  expandDuration: 0.8,
  // the site's drawer curve (the one Search.js opens on): a soft start, then
  // a long confident settle — power4 puts the whole journey in the first fifth
  expandEase: OPEN_EASE,
  turnDuration: 1.45, // s — a commanded turn to put one card front and centre
  // masonry columns flanking the open card (same scheme as the /bento board:
  // equal-width columns, every tile at its own aspect ratio, balanced stacks)
  gridMaxCol: 128, // px — column width ceiling; shrinks until every card fits
  gridGap: 16, // px — minimum gap between tiles (matches /models gap-4)
  gridInset: 24, // px — clearance kept around the open card
  gridTopScale: 0.62, // tiles above/below the open card are this much smaller
  gridMarginX: 20, // px — page padding (matches /models px-5)
  gridMarginTop: 56, // px — room for the title
  gridMarginBottom: 72, // px — room for the caption
  // scatter: columns are spread across the whole side and each column is
  // stretched to the full height, then loosened with these
  gridMaxStretchGap: 3.5, // cap on the stretched gap, in multiples of gridGap
  gridColumnDrift: 0.45, // per-column vertical offset, fraction of a tile
  gridJitter: 0.18, // per-tile x/y wobble, fraction of the tile width
  gridOpacity: 0.55,
  // open state with fixed slots: a slot counts as on screen once this much of
  // it is inside the viewport. Only those decide what the board looks like, so
  // it is those the cards are drawn for.
  slotMinVisible: 0.15,
  // open state with fixed slots: pointer near an edge eases the whole board
  // that way (px of pan per px the pointer is from the centre) to peek at the
  // cards parked off-screen. 0 = off.
  hoverPan: 0,
  hoverPanSmoothing: 0.06,
  introDuration: 0.9,
  introStagger: 0.035,
};

function fibonacciPoint(i, n) {
  const step = 2 / n;
  const y = i * step - 1 + step / 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const t = Math.PI * (3 - Math.sqrt(5)) * i; // golden angle
  return new THREE.Vector3(Math.cos(t) * r, y, Math.sin(t) * r);
}

function hashedPoint(i) {
  const a = 43758.5453 * Math.sin(12.9898 * i);
  const b = 43758.5453 * Math.sin(78.233 * i);
  const u = a - Math.floor(a);
  const v = b - Math.floor(b);
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  return new THREE.Vector3(
    Math.sin(phi) * Math.cos(theta),
    Math.sin(phi) * Math.sin(theta),
    Math.cos(phi)
  );
}

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const smoothstep = (t) => t * t * (3 - 2 * t);

export default function CreativeSphere({
  items = [],
  config = {},
  title = "Creative Space",
  onSelect,
  // fired as (open, stage, item) — stage is "focus" while a single card is
  // forward, "board" once the cards are out, null when back on the sphere
  onOpenChange,
  // filled with { show(index) }: turns the globe until that card faces front
  // and brings it forward. Populated once the scene is up.
  apiRef,
  className = "",
  // Optional fixed layout for the open state: ({ W, H }) => [{ px, py, w, h }]
  // in screen px (px/py = tile centre). When given, the other cards fly into
  // these slots (cover-cropped, like the hero's object-cover boxes) instead of
  // the masonry columns. Pass one slot per card minus the open one.
  openSlots,
}) {
  const containerRef = useRef(null);
  // React never fills this: the effect appends the frosted sheet and the open
  // card's DOM twin here, so they layer above the canvas and below the text
  const overlayRef = useRef(null);
  const [hovered, setHovered] = useState(null);
  const [expanded, setExpanded] = useState(null);
  // set while one card is forward on its own — carries the details column's
  // box so it can sit right beside the card
  const [focus, setFocus] = useState(null);
  const [interacted, setInteracted] = useState(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const openSlotsRef = useRef(openSlots);
  openSlotsRef.current = openSlots;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || items.length === 0) return;

    const cfg = { ...DEFAULTS, ...config };
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      // no perpetual motion either — the drift never stops on its own
      cfg.autoSpeed = 0;
      cfg.driftSpeed = 0;
      cfg.idleWander = false;
    }

    // ---------- scene ----------
    let disposed = false;
    let W = container.clientWidth || 1;
    let H = container.clientHeight || 1;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 1, 5000);
    camera.position.z = 1000;
    if (cfg.fogDepth > 0) scene.fog = new THREE.Fog(cfg.fogColor, 1, 2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H, false);
    const canvas = renderer.domElement;
    Object.assign(canvas.style, {
      width: "100%",
      height: "100%",
      display: "block",
      touchAction: "none",
    });
    container.appendChild(canvas);

    const group = new THREE.Group();
    scene.add(group);

    // The frosted sheet sits over the canvas and the open card is mirrored
    // into a DOM <img> above it, so the sphere blurs while the card stays
    // sharp — one canvas can't be both, and backdrop-filter only sees what is
    // painted behind the element.
    const veilEl = document.createElement("div");
    Object.assign(veilEl.style, {
      position: "absolute",
      inset: "0",
      display: "none",
    });
    const cardEl = document.createElement("img");
    Object.assign(cardEl.style, {
      position: "absolute",
      left: "0",
      top: "0",
      display: "none",
      objectFit: "cover",
      transformOrigin: "0 0",
      willChange: "transform, width, height",
    });
    cardEl.alt = "";
    const overlay = overlayRef.current;
    overlay?.append(veilEl, cardEl);
    let twinCard = null; // the card currently drawn as cardEl instead of a mesh
    // the <img> only takes over once it has actually decoded — the texture is
    // already in the browser cache, but not necessarily on this same frame
    const twinReady = () => !!twinCard && cardEl.complete && cardEl.naturalWidth > 0;
    const hideTwin = () => {
      twinCard = null;
      cardEl.style.display = "none";
      cardEl.removeAttribute("src");
    };

    // px on screen (at z = 0) <-> world units
    const worldHeight = () =>
      2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360);
    const pxToWorld = (px) => (px * worldHeight()) / H;
    const isMobile = () => W <= 640;
    const planeSizePx = () => (isMobile() ? cfg.mobilePlaneSize : cfg.planeSize);
    const radiusPx = () => {
      // keep rim cards inside the viewport, leaving room for title / caption
      const available = Math.min(
        W / 2 - cfg.radiusInsetX,
        H / 2 - cfg.radiusInsetY
      );
      const maxR = available - planeSizePx() / 2;
      return Math.max(80, Math.min(cfg.radius, maxR));
    };

    // ---------- cards ----------
    const loader = new THREE.TextureLoader();
    const geometry = new THREE.PlaneGeometry(1, 1);
    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    const cards = items.map((item, i) => {
      const material = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        color: 0xffffff,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      group.add(mesh);

      const card = {
        index: i,
        item,
        mesh,
        material,
        cursorT: 0, // eased 0-1 share of the pointer lens
        orderly: fibonacciPoint(i, items.length),
        random: hashedPoint(i),
        basePos: new THREE.Vector3(),
        baseScale: new THREE.Vector2(1, 1),
        aspect: 1,
        expand: 0, // 0..1 — this card is the open one
        grid: 0, // 0..1 — this card sits in the side columns
        intro: 0,
        loaded: false,
      };

      loader.load(item.src, (tex) => {
        if (disposed) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = maxAniso;
        material.map = tex;
        material.needsUpdate = true;
        card.aspect = tex.image.width / tex.image.height || 1;
        card.loaded = true;
        layoutCard(card);
        mesh.visible = true;
        gsap.to(card, {
          intro: 1,
          duration: cfg.introDuration,
          ease: "power3.out",
          delay: i * cfg.introStagger,
          overwrite: "auto",
        });
      });

      return card;
    });
    const meshes = cards.map((c) => c.mesh);

    const layoutCard = (c) => {
      const s = pxToWorld(planeSizePx());
      const a = c.aspect || 1;
      c.baseScale.set(a >= 1 ? s : s * a, a >= 1 ? s / a : s);
    };
    const dir = new THREE.Vector3();
    const layoutAll = () => {
      const R = pxToWorld(radiusPx());
      if (scene.fog) {
        // starts at the centre plane so the front half (and the open-state
        // board at z = 0) stays clean; only the inside recedes into the haze
        scene.fog.near = camera.position.z;
        scene.fog.far = camera.position.z + R * cfg.fogDepth;
      }
      for (const c of cards) {
        dir.lerpVectors(c.orderly, c.random, cfg.randomness).normalize();
        c.basePos.copy(dir).multiplyScalar(R);
        layoutCard(c);
      }
    };
    layoutAll();

    // ---------- rotation state ----------
    const q = new THREE.Quaternion();
    const invQ = new THREE.Quaternion();
    const tmpQ = new THREE.Quaternion();
    const AXIS_Y = new THREE.Vector3(0, 1, 0);
    const AXIS_X = new THREE.Vector3(1, 0, 0);
    const autoAxis = new THREE.Vector3();
    {
      const e = (cfg.spinTilt * Math.PI) / 180;
      const t = (cfg.spinTiltDir * Math.PI) / 180;
      const r = Math.sin(e);
      autoAxis.set(r * Math.cos(t), Math.cos(e), r * Math.sin(t)).normalize();
    }

    let velYaw = 0,
      velPitch = 0; // rad/frame, decays by friction
    let hasDrift = false; // a gesture (or idleWander) has set a heading
    // the idle heading, in screen space: atan2(pitch, yaw)
    let driftAngle = Math.random() * Math.PI * 2;
    let driftTarget = driftAngle;
    const wanderDelay = () =>
      (cfg.wanderMin + Math.random() * (cfg.wanderMax - cfg.wanderMin)) * 1000;
    let wanderAt = performance.now() + wanderDelay();
    if (cfg.idleWander && cfg.driftSpeed) hasDrift = true;
    let dragDX = 0,
      dragDY = 0; // pointer travel banked since the last frame
    let targetYaw = 0,
      targetPitch = 0; // accumulated
    let curYaw = 0,
      curPitch = 0; // smoothed
    let prevYaw = 0,
      prevPitch = 0;
    let hasInteracted = false;
    // a commanded turn: the globe slerps from where it was to a pose that puts
    // one card dead front, instead of accumulating yaw/pitch like a drag
    const FRONT = new THREE.Vector3(0, 0, 1);
    const turnFrom = new THREE.Quaternion();
    const turnTo = new THREE.Quaternion();
    const turnAxis = new THREE.Vector3();
    const turn = { t: 1, on: false };

    // ---------- interaction ----------
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const pick = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(meshes, false);
      for (const h of hits) {
        const c = cards[meshes.indexOf(h.object)];
        if (c && c.loaded) return c;
      }
      return null;
    };
    const insideSphere = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const dx = clientX - (rect.left + rect.width / 2);
      const dy = clientY - (rect.top + rect.height / 2);
      return Math.hypot(dx, dy) <= radiusPx() + planeSizePx() / 2;
    };

    let dragging = false;
    let lastX = 0,
      lastY = 0,
      downX = 0,
      downY = 0,
      travel = 0;
    let hoveredCard = null;
    // where the pointer lens is, in screen px, and where it is heading
    let lensX = 0,
      lensY = 0,
      lensTargetX = null,
      lensTargetY = null;
    let expandedCard = null;
    let boardOpen = false; // the cards are out on the board
    // the sphere is no longer the thing on screen: no spin, no drag, no grab
    const isOpen = () => !!expandedCard || boardOpen;
    // board: 0 = focus layout (card centred, details beside it), 1 = board
    // layout (card in the channel with the tiles around it)
    // focus: how far the sphere behind the focused card has faded out
    const view = { board: 0, focus: 0 };
    let panX = 0,
      panY = 0; // board offset (screen px), eased towards panTargetX/Y
    let panTargetX = 0,
      panTargetY = 0;
    const setPanTarget = (clientX, clientY) => {
      if (!cfg.hoverPan || !isOpen()) {
        panTargetX = panTargetY = 0;
        return;
      }
      const rect = canvas.getBoundingClientRect();
      panTargetX = -(clientX - (rect.left + rect.width / 2)) * cfg.hoverPan;
      panTargetY = -(clientY - (rect.top + rect.height / 2)) * cfg.hoverPan;
    };
    const pointers = new Map();
    let pinchDist = 0;

    const setHover = (c) => {
      if (c === hoveredCard) return;
      hoveredCard = c;
      setHovered(c ? c.item : null);
    };

    const markInteracted = () => {
      if (hasInteracted) return;
      hasInteracted = true;
      setInteracted(true);
    };

    const setCursor = (clientX, clientY) => {
      if (dragging) {
        canvas.style.cursor = "grabbing";
      } else if (hoveredCard) {
        canvas.style.cursor = "pointer";
      } else if (isOpen()) {
        canvas.style.cursor = "default";
      } else {
        canvas.style.cursor = insideSphere(clientX, clientY) ? "grab" : "default";
      }
    };

    const tween = (c, vars) => {
      // kill by property, not by target: the board's lead-in delays these, and
      // a queued tween would otherwise wake up after a close and drag its card
      // back out. The intro animates `intro`, so it survives untouched.
      gsap.killTweensOf(c, "expand,grid,board,focus");
      return gsap.to(c, {
        duration: cfg.expandDuration,
        ease: cfg.expandEase,
        overwrite: "auto",
        ...vars,
      });
    };

    const restore = (o) => () => {
      o.mesh.renderOrder = 0;
      o.material.depthTest = true;
      if (twinCard === o) hideTwin(); // it is back on the sphere, let the mesh draw it
    };

    // publish the focus layout to React so the details column can sit beside
    // the card; null whenever the board is out or nothing is open
    const publishFocus = () => {
      const c = expandedCard;
      if (!c || boardOpen) {
        setFocus(null);
        return;
      }
      setFocus({
        item: c.item,
        index: c.index,
        total: cards.length,
        panel: focusLayout(c).panel,
      });
    };

    const openCard = (c) => {
      const prev = expandedCard;
      expandedCard = c;
      c.mesh.renderOrder = 10;
      c.material.depthTest = false;
      // the board only re-forms if it was already out; a first click just
      // brings this card forward and leaves the sphere as it is
      if (boardOpen) computeGrid();
      twinCard = c;
      if (cardEl.getAttribute("src") !== c.item.src) cardEl.src = c.item.src;
      tween(view, { focus: boardOpen ? 0 : 1 });
      tween(c, { expand: 1, grid: 0 });
      for (const o of cards) {
        if (o === c) continue;
        const g = boardOpen ? 1 : 0;
        if (o === prev) tween(o, { expand: 0, grid: g, onComplete: restore(o) });
        else if (o.grid !== g) tween(o, { grid: g });
      }
      setExpanded(c.item);
      publishFocus();
      onOpenChangeRef.current?.(true, boardOpen ? "board" : "focus", c.item);
    };

    // tip the cards out onto the board — from a second click on the open card,
    // or from a click into the orb that missed every card (nothing centred)
    const openBoard = () => {
      if (boardOpen) return;
      boardOpen = true;
      computeGrid(); // assign cells from where cards are right now
      tween(view, { board: 1, focus: 0 });
      for (const o of cards) {
        if (o !== expandedCard) tween(o, { grid: 1 });
      }
      publishFocus();
      onOpenChangeRef.current?.(true, "board", expandedCard?.item ?? null);
    };

    const closeAll = () => {
      const prev = expandedCard;
      expandedCard = null;
      boardOpen = false;
      panTargetX = panTargetY = 0;
      setHover(null);
      tween(view, { board: 0, focus: 0 });
      for (const o of cards) {
        tween(o, {
          expand: 0,
          grid: 0,
          onComplete: o === prev ? restore(o) : undefined,
        });
      }
      setExpanded(null);
      setFocus(null);
      onOpenChangeRef.current?.(false, null, null);
    };

    const onPointerDown = (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        dragging = false;
        const [a, b] = [...pointers.values()];
        pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
        return;
      }
      dragging = true;
      markInteracted();
      lastX = downX = e.clientX;
      lastY = downY = e.clientY;
      travel = 0;
      dragDX = dragDY = 0; // don't let a stale flick leak into this drag
      if (!isOpen()) canvas.style.cursor = "grabbing";
    };

    const onPointerMove = (e) => {
      if (pointers.has(e.pointerId)) {
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }
      if (pointers.size >= 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const delta = pinchDist - d;
        pinchDist = d;
        if (!isOpen()) {
          velYaw += delta * cfg.wheelSpeed;
          hasDrift = true;
        }
        return;
      }
      if (dragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        travel += Math.hypot(dx, dy);
        if (!isOpen() && (dx || dy)) {
          // the drag moves the target itself, so the sphere tracks the hand
          // 1:1 instead of building up speed the way the momentum path does
          targetYaw += dx * cfg.dragSpeed;
          targetPitch += dy * cfg.dragSpeed;
          dragDX += dx;
          dragDY += dy;
          hasDrift = true;
        }
        return;
      }
      if (e.pointerType === "touch") return;
      if (cfg.cursorBoost) {
        const rect = canvas.getBoundingClientRect();
        lensTargetX = e.clientX - rect.left;
        lensTargetY = e.clientY - rect.top;
      }
      setPanTarget(e.clientX, e.clientY);
      setHover(pick(e.clientX, e.clientY));
      setCursor(e.clientX, e.clientY);
    };

    const onPointerUp = (e) => {
      pointers.delete(e.pointerId);
      if (pointers.size === 1) {
        const [p] = [...pointers.values()];
        lastX = p.x;
        lastY = p.y;
      }
      const wasDragging = dragging;
      dragging = false;

      const isClick =
        wasDragging &&
        Math.hypot(e.clientX - downX, e.clientY - downY) < 6 &&
        travel < 10;
      if (isClick) {
        const c = pick(e.clientX, e.clientY);
        if (c) {
          if (c !== expandedCard) openCard(c);
          // first click brought it forward; this one opens the board, and
          // once the board is out the same click selects
          else if (!boardOpen) openBoard();
          else {
            onSelectRef.current?.(c.item, c.index);
            closeAll();
          }
        } else if (isOpen()) {
          closeAll();
        } else if (insideSphere(e.clientX, e.clientY)) {
          // a click into the orb that misses every card tips the whole set
          // straight out onto the board, with nothing centred
          openBoard();
        }
      }
      setCursor(e.clientX, e.clientY);
    };

    const onPointerLeave = () => {
      if (!dragging) setHover(null);
      lensTargetX = lensTargetY = null; // ease back to the middle
    };

    const onWheel = (e) => {
      e.preventDefault();
      if (isOpen()) return;
      markInteracted();
      velYaw += e.deltaY * cfg.wheelSpeed;
      if (e.deltaY) hasDrift = true;
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape" && isOpen()) closeAll();
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerleave", onPointerLeave);
    if (cfg.wheelSpeed) canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("keydown", onKeyDown);

    // Turn the globe until card `index` faces the camera, then bring it
    // forward. setFromUnitVectors gives the shortest rotation taking that
    // card's direction onto the camera axis, and slerping to it holds a
    // constant angular speed however far round the card started.
    const showCard = (index) => {
      const c = cards[index];
      if (!c) return;
      markInteracted();
      hasDrift = false; // the wander would only pull it back off centre
      turnFrom.copy(q);
      turnAxis.copy(c.basePos).normalize();
      turnTo.setFromUnitVectors(turnAxis, FRONT);
      turn.t = 0;
      turn.on = true;
      gsap.killTweensOf(turn);
      gsap.to(turn, {
        t: 1,
        duration: cfg.turnDuration,
        ease: cfg.expandEase,
        onComplete: () => {
          turn.on = false;
        },
      });
      openCard(c);
    };
    if (apiRef) apiRef.current = { show: showCard };

    // ---------- resize ----------
    const resize = () => {
      W = container.clientWidth || 1;
      H = container.clientHeight || 1;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H, false);
      layoutAll();
      if (expandedCard) {
        if (boardOpen) computeGrid();
        publishFocus();
      }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // ---------- masonry columns (screen px -> world at z = 0) ----------
    // Two masonry boards flank the open card, built the way the /bento page
    // lays its tiles out: equal-width columns, each tile at its natural aspect
    // ratio, stacked shortest-column-first so the columns stay balanced. The
    // column width is solved from the card count, their aspect ratios and the
    // free height, so every card always fits.
    //
    // Assignment is computed once when a card opens (and on resize). Cards on
    // the left half of the screen go to the left board and vice versa, and
    // each board is filled top→bottom in the cards' current screen order, so
    // nobody crosses anyone else on the way.
    let gridAssign = new Map(); // card -> { px, py, w, h }
    // The focus layout: the card opens dead centre with its details column to
    // the right of it. The card's width is capped so that column always clears
    // the right margin — the same clearance is mirrored on the left to keep
    // the card centred. Too narrow for a side column and the details drop
    // underneath the card instead.
    const focusLayout = (c) => {
      const a = c.aspect || 1;
      const m = cfg.focusMarginX;
      const maxH = (cfg.focusHeightVh / 100) * H;
      // the column gives up width before the layout gives up on the column
      const detailsW = Math.max(
        cfg.focusDetailsMinW,
        Math.min(
          cfg.focusDetailsW,
          (W - 2 * m - 2 * cfg.focusGap - cfg.focusMinCardW) / 2
        )
      );
      const room = W - 2 * m - 2 * (cfg.focusGap + detailsW);

      if (room < cfg.focusMinCardW) {
        let w = W - 2 * m;
        let h = w / a;
        if (h > maxH) {
          h = maxH;
          w = h * a;
        }
        const block = h + cfg.focusGap + cfg.focusStackDetailsH;
        const top = Math.max(m, cfg.focusCenterY * H - block / 2);
        return {
          card: { x: W / 2, y: top + h / 2, w, h },
          panel: { left: m, top: top + h + cfg.focusGap, width: W - 2 * m },
        };
      }

      let h = maxH;
      let w = h * a;
      if (w > room) {
        w = room;
        h = w / a;
      }
      const card = { x: W / 2, y: cfg.focusCenterY * H, w, h };
      return {
        card,
        panel: {
          left: card.x + w / 2 + cfg.focusGap,
          top: card.y - h / 2,
          width: detailsW,
          height: h,
        },
      };
    };
    // the board layout: centred, the size the slots are laid out around
    const boardRectPx = (c) => {
      const a = c.aspect || 1;
      let h = (cfg.expandHeightVh / 100) * H;
      let w = h * a;
      const maxW = W - 2 * cfg.gridMarginX;
      if (w > maxW) {
        w = maxW;
        h = w / a;
      }
      return { x: W / 2, y: cfg.expandCenterY * H, w, h };
    };
    const expandedRectPx = (c) => {
      const f = focusLayout(c).card;
      const b = boardRectPx(c);
      const t = view.board;
      return {
        x: lerp(f.x, b.x, t),
        y: lerp(f.y, b.y, t),
        w: lerp(f.w, b.w, t),
        h: lerp(f.h, b.h, t),
      };
    };
    const openRectPx = () => {
      const ex = expandedCard;
      const cy = H * cfg.expandCenterY;
      if (!ex) return { w: 0, h: 0, cy };
      let h = (cfg.expandHeightVh / 100) * H;
      let w = h * ex.aspect;
      if (w > W - 2 * cfg.gridMarginX) {
        w = W - 2 * cfg.gridMarginX;
        h = w / ex.aspect;
      }
      return { w, h, cy };
    };
    const screenOf = (c, out) => {
      out.copy(c.mesh.position).applyQuaternion(q).project(camera);
      return { x: (out.x + 1) * 0.5 * W, y: (1 - out.y) * 0.5 * H };
    };
    const projV = new THREE.Vector3();

    const fract = (v) => v - Math.floor(v);
    const hash = (i, k) => fract(43758.5453 * Math.sin(12.9898 * i + 78.233 * k));

    const computeGrid = () => {
      gridAssign = new Map();
      const others = cards.filter((c) => c !== expandedCard);
      if (others.length === 0) return;

      // Fixed slots (hero layout). Within a group every card goes to the free
      // slot nearest to where it already is, so the top of the sphere lands on
      // the top of the board and nothing crosses on the way. Extra cards stay
      // in the sphere; if there are more slots than cards, the ones nearest
      // the centre are filled first.
      //
      // The pattern tiles far past every edge, so only a handful of its slots
      // are ever on screen — and filling them purely by proximity puts the
      // same faces there every time, since the orb barely moves between two
      // openings. So the cards are cut into two groups first: a fresh random
      // draw takes the on-screen slots, the rest take the ones off the edges.
      const fixed = openSlotsRef.current?.({ W, H });
      if (fixed) {
        // shortest-first greedy matching: score every card/slot pair, walk
        // them nearest-first and keep the ones where both sides are still
        // free. Cheap at these counts and it keeps the travel short, which is
        // what stops the paths from tangling.
        const assign = (group, slots) => {
          const pairs = [];
          for (let i = 0; i < group.length; i++) {
            for (let j = 0; j < slots.length; j++) {
              const dx = group[i].x - slots[j].px;
              const dy = group[i].y - slots[j].py;
              pairs.push({ i, j, d: dx * dx + dy * dy });
            }
          }
          pairs.sort((a, b) => a.d - b.d);
          const cardTaken = new Set();
          const slotTaken = new Set();
          const need = Math.min(group.length, slots.length);
          for (const pr of pairs) {
            if (cardTaken.size === need) break;
            if (cardTaken.has(pr.i) || slotTaken.has(pr.j)) continue;
            cardTaken.add(pr.i);
            slotTaken.add(pr.j);
            const sl = slots[pr.j];
            gridAssign.set(group[pr.i].c, {
              px: sl.px,
              py: sl.py,
              w: sl.w,
              h: sl.h,
            });
          }
        };

        const onScreen = (s) => {
          const ox = Math.max(
            0,
            Math.min(W, s.px + s.w / 2) - Math.max(0, s.px - s.w / 2)
          );
          const oy = Math.max(
            0,
            Math.min(H, s.py + s.h / 2) - Math.max(0, s.py - s.h / 2)
          );
          return (ox * oy) / Math.max(1, s.w * s.h);
        };

        const deck = others.slice();
        for (let i = deck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        const placed = deck.map((c) => ({ c, ...screenOf(c, projV) }));
        const pool = [...fixed]
          .sort(
            (a, b) =>
              Math.hypot(a.px - W / 2, a.py - H / 2) -
              Math.hypot(b.px - W / 2, b.py - H / 2)
          )
          .slice(0, placed.length);

        const seen = pool.filter((s) => onScreen(s) >= cfg.slotMinVisible);
        const hidden = pool.filter((s) => onScreen(s) < cfg.slotMinVisible);
        assign(placed.slice(0, seen.length), seen);
        assign(placed.slice(seen.length), hidden);
        return;
      }

      const { w: expW, h: expH, cy: expCy } = openRectPx();
      const gap = cfg.gridGap;
      const inset = cfg.gridInset;
      const x0 = cfg.gridMarginX;
      const x1 = W - cfg.gridMarginX;
      const y0 = cfg.gridMarginTop;
      const y1 = H - cfg.gridMarginBottom;
      const availW = Math.max(1, x1 - x0);
      // open-card exclusion rect
      const ex0 = W / 2 - expW / 2 - inset;
      const ex1 = W / 2 + expW / 2 + inset;
      const ey0 = expCy - expH / 2 - inset;
      const ey1 = expCy + expH / 2 + inset;

      // cards ordered by where they are on screen right now, left → right
      const placed = others
        .map((c) => ({ c, ...screenOf(c, projV) }))
        .sort((a, b) => a.x - b.x);
      const tileH = (p, w) => w / (p.c.aspect || 1);

      // shortest-stack-first fill of a group of regions; returns what didn't fit
      const fill = (group, list) => {
        const stacks = group.map((r) => ({ region: r, items: [], h: 0 }));
        const leftover = [];
        for (const p of list) {
          let best = stacks[0];
          for (const st of stacks) if (st.h < best.h - 0.5) best = st;
          const nh = best.h + tileH(p, best.region.colW) + (best.items.length ? gap : 0);
          if (nh > best.region.bottom - best.region.top) {
            leftover.push(p);
            continue;
          }
          best.items.push(p);
          best.h = nh;
        }
        return { stacks, leftover };
      };

      // One full-width masonry board. Columns that pass behind the open card
      // become strips above / below it, holding smaller tiles in two
      // sub-columns. Solve for the widest column at which everything fits.
      let best = null;
      const maxColW = Math.max(20, Math.floor(Math.min(cfg.gridMaxCol, availW)));
      for (let colW = maxColW; colW >= 20; colW -= 1) {
        const cols = Math.max(1, Math.floor((availW + gap) / (colW + gap)));
        const pitch = cols > 1 ? (availW - colW) / (cols - 1) : 0;
        const sideWobble =
          cols > 1
            ? Math.min(colW * cfg.gridJitter, Math.max(0, (pitch - colW) / 2 - 2))
            : colW * cfg.gridJitter;

        // regions per column: { above: [...], below: [...] } or { side: [...] }
        const columns = [];
        for (let col = 0; col < cols; col++) {
          const cx = x0 + colW / 2 + col * pitch;
          const behind = cx + colW / 2 > ex0 && cx - colW / 2 < ex1;
          if (!behind) {
            columns.push({
              side: [{ cx, top: y0, bottom: y1, colW, wobble: sideWobble }],
            });
            continue;
          }
          const sw = colW * cfg.gridTopScale;
          const two = pitch >= 2 * sw + gap;
          const subs = two ? [cx - (sw + gap) / 2, cx + (sw + gap) / 2] : [cx];
          const wobble = two ? Math.max(0, (pitch - 2 * sw - gap) / 4) : sideWobble;
          const mk = (top, bottom) =>
            subs.map((scx) => ({ cx: scx, top, bottom, colW: sw, wobble }));
          const above = ey0 - y0 >= sw * 0.6 ? mk(y0, ey0) : [];
          const below = y1 - ey1 >= sw * 0.6 ? mk(ey1, y1) : [];
          if (above.length || below.length) columns.push({ above, below });
        }

        // capacity in full-size tile heights, so strips with smaller tiles
        // take proportionally more cards
        const capOf = (c) =>
          (c.side || [...c.above, ...c.below]).reduce(
            (sum, r) => sum + ((r.bottom - r.top) * colW) / r.colW,
            0
          );
        const totalCap = columns.reduce((sum, c) => sum + capOf(c), 0);

        const assigned = [];
        let ok = true;
        let idx = 0;
        let cum = 0;
        columns.forEach((c, k) => {
          const last = k === columns.length - 1;
          cum += (placed.length * capOf(c)) / totalCap;
          const take = last ? placed.length - idx : Math.max(0, Math.round(cum) - idx);
          const mine = placed.slice(idx, idx + take).sort((a, b) => a.y - b.y);
          idx += take;
          if (!mine.length) return;
          if (c.side) {
            const { stacks, leftover } = fill(c.side, mine);
            if (leftover.length) ok = false;
            assigned.push(...stacks);
            return;
          }
          let rest = mine;
          if (c.above.length) {
            const { stacks, leftover } = fill(c.above, rest);
            assigned.push(...stacks);
            rest = leftover;
          }
          if (c.below.length) {
            const { stacks, leftover } = fill(c.below, rest);
            assigned.push(...stacks);
            rest = leftover;
          }
          if (rest.length) ok = false;
        });
        best = assigned;
        if (ok) break;
      }

      // place: stretch each stack over its region (capped), drift the column,
      // wobble each tile — organised, but loose
      const maxGap = gap * cfg.gridMaxStretchGap;
      best.forEach((st, ai) => {
        const { region, items } = st;
        if (!items.length) return;
        const w = region.colW;
        const regionH = region.bottom - region.top;
        const sumH = items.reduce((sum, p) => sum + tileH(p, w), 0);
        const n = items.length;
        const g =
          n > 1 ? Math.min(maxGap, Math.max(gap, (regionH - sumH) / (n - 1))) : 0;
        const colH = sumH + g * (n - 1);
        const drift = (hash(ai, 5) * 2 - 1) * w * cfg.gridColumnDrift;
        let y = region.top + (regionH - colH) / 2 + drift;
        y = Math.min(Math.max(y, region.top), region.top + Math.max(0, regionH - colH));
        for (const p of items) {
          const h = tileH(p, w);
          const jx = (hash(p.c.index, 1) * 2 - 1) * region.wobble;
          const jy = (hash(p.c.index, 2) * 2 - 1) * Math.min(w * cfg.gridJitter, g / 2);
          gridAssign.set(p.c, { px: region.cx + jx, py: y + h / 2 + jy, w, h });
          y += h + g;
        }
      });
    };

    // per-frame: screen px -> world units at z = 0
    const gridSlots = () => {
      const slots = new Map();
      for (const [c, a] of gridAssign) {
        slots.set(c, {
          x: pxToWorld(a.px + panX - W / 2),
          y: pxToWorld(H / 2 - (a.py + panY)),
          w: pxToWorld(a.w),
          h: pxToWorld(a.h),
          aspect: a.w / a.h,
        });
      }
      return slots;
    };

    // ---------- frame loop ----------
    const frontLocal = new THREE.Vector3();
    const slotLocal = new THREE.Vector3();
    const worldPos = new THREE.Vector3();
    const screenV = new THREE.Vector3();
    const twinPos = new THREE.Vector3();
    const twinEdge = new THREE.Vector3();
    let raf = 0;

    const tick = () => {
      if (disposed) return;
      raf = requestAnimationFrame(tick);
      const now = performance.now();

      // momentum + smoothing
      if (turn.on) {
        // the commanded turn owns the pose; keep the drag accumulators level
        // with it so releasing back to a drag starts from a standstill
        q.slerpQuaternions(turnFrom, turnTo, turn.t);
        targetYaw = curYaw = prevYaw = 0;
        targetPitch = curPitch = prevPitch = 0;
        velYaw = velPitch = 0;
      } else if (dragging) {
        // the pointer already moved the target; all this has to do is follow
        // the hand's per-frame pace so a release carries on at that speed
        velYaw = lerp(velYaw, dragDX * cfg.dragSpeed, cfg.flickBlend);
        velPitch = lerp(velPitch, dragDY * cfg.dragSpeed, cfg.flickBlend);
        dragDX = dragDY = 0;
      } else {
        targetYaw += velYaw;
        targetPitch += velPitch;
        velYaw *= cfg.friction;
        velPitch *= cfg.friction;
        // The momentum decays to a floor, not to zero: once a gesture has
        // given the sphere a heading it keeps easing that way. While a real
        // flick is still running it owns the heading; once it has decayed to
        // the floor the wander takes over and re-aims it now and then.
        if (cfg.driftSpeed && hasDrift && !isOpen()) {
          const mag = Math.hypot(velYaw, velPitch);
          if (mag > cfg.driftSpeed) {
            driftAngle = Math.atan2(velPitch, velYaw);
            driftTarget = driftAngle;
            wanderAt = now + wanderDelay(); // the clock starts once it settles
          } else {
            if (cfg.idleWander && now >= wanderAt) {
              const turn = (cfg.wanderTurn * Math.PI) / 180;
              driftTarget = driftAngle + (Math.random() * 2 - 1) * turn;
              wanderAt = now + wanderDelay();
            }
            // target and angle only ever differ by the offset above, so a
            // plain lerp turns the short way without any wrapping
            driftAngle += (driftTarget - driftAngle) * cfg.wanderRate;
            velYaw = Math.cos(driftAngle) * cfg.driftSpeed;
            velPitch = Math.sin(driftAngle) * cfg.driftSpeed;
          }
        }
      }
      if (!turn.on) {
        curYaw += (targetYaw - curYaw) * cfg.smoothing;
        curPitch += (targetPitch - curPitch) * cfg.smoothing;
        const dYaw = curYaw - prevYaw;
        const dPitch = curPitch - prevPitch;
        prevYaw = curYaw;
        prevPitch = curPitch;

        // screen-space (trackball) rotation: premultiply so the axes stay
        // camera-relative
        tmpQ.setFromAxisAngle(AXIS_Y, dYaw);
        q.premultiply(tmpQ);
        tmpQ.setFromAxisAngle(AXIS_X, dPitch);
        q.premultiply(tmpQ);
      }

      // the tilted idle spin runs until the first interaction; from there the
      // drift above carries the sphere in whatever direction it was pushed
      const autoOn =
        cfg.autoSpeed &&
        !cfg.idleWander &&
        !(cfg.autoStopsOnInteract && hasInteracted) &&
        !isOpen() &&
        !turn.on;
      if (autoOn) {
        tmpQ.setFromAxisAngle(autoAxis, cfg.autoSpeed);
        q.premultiply(tmpQ);
      }
      q.normalize();
      group.quaternion.copy(q);
      invQ.copy(q).invert();

      // open-card geometry (world units). The open card sits on a plane in
      // front of the sphere, so everything on it is divided by the perspective
      // gain at that depth to come out the requested size on screen.
      const Rpx = radiusPx();
      const R = pxToWorld(Rpx);
      const frontZ = R * 1.15;
      const depthGain = camera.position.z / (camera.position.z - frontZ);

      panX += (panTargetX - panX) * cfg.hoverPanSmoothing;
      panY += (panTargetY - panY) * cfg.hoverPanSmoothing;

      let anyGrid = false;
      for (const c of cards) if (c.grid > 0.0005) anyGrid = true;
      const slots = anyGrid ? gridSlots() : null;

      const cx = W / 2;
      const cy = H / 2;
      // the lens trails the pointer instead of snapping to it, and rests at
      // the centre whenever the pointer is away
      lensX += ((lensTargetX == null ? cx : lensTargetX) - lensX) * cfg.cursorEase;
      lensY += ((lensTargetY == null ? cy : lensTargetY) - lensY) * cfg.cursorEase;
      const twinOn = twinReady();
      let twinOpacity = 1;

      for (const c of cards) {
        if (!c.loaded) continue;
        c.mesh.quaternion.copy(invQ); // billboard

        const introS = 0.6 + 0.4 * c.intro;

        // --- sphere state: depth + centre lens ---
        worldPos.copy(c.basePos).applyQuaternion(q);
        const depth = clamp01((worldPos.z / R + 1) / 2); // 0 back .. 1 front
        const front = clamp01((depth - 0.5) * 2); // front hemisphere only
        screenV.copy(worldPos).project(camera);
        const sx = (screenV.x + 1) * 0.5 * W;
        const sy = (1 - screenV.y) * 0.5 * H;
        const u = Math.hypot(sx - cx, sy - cy) / (Rpx * cfg.lensReach);
        const lensT = smoothstep(clamp01(1 - u)) * front;
        // the pointer lens rides on top of the centre one: distance from the
        // eased cursor, on the same smoothstep falloff, front hemisphere only.
        // Each card then eases onto its own share rather than tracking the
        // distance frame by frame, so the swell grows in and lets go softly
        // instead of the whole neighbourhood popping together.
        if (cfg.cursorBoost) {
          const v = Math.hypot(sx - lensX, sy - lensY) / cfg.cursorReach;
          const target = smoothstep(clamp01(1 - v)) * front;
          c.cursorT += (target - c.cursorT) * cfg.cursorRise;
        }
        const ds =
          lerp(cfg.depthScaleBack, 1, depth) *
          (1 + cfg.lensBoost * lensT + cfg.cursorBoost * c.cursorT);
        const dOpacity = lerp(cfg.depthFadeBack, 1, depth);

        const sphereSx = c.baseScale.x * introS * ds;
        const sphereSy = c.baseScale.y * introS * ds;
        const sphereOp = c.intro * dOpacity;

        // --- open state ---
        const n = c.expand;
        let w = 0,
          h = 0;
        if (n > 0.0005) {
          // the rect eases from the focus layout to the board layout; this is
          // where its centre lands in the group's own frame
          const r = expandedRectPx(c);
          w = pxToWorld(r.w) / depthGain;
          h = pxToWorld(r.h) / depthGain;
          frontLocal
            .set(
              pxToWorld(r.x - W / 2) / depthGain,
              pxToWorld(H / 2 - r.y) / depthGain,
              frontZ
            )
            .applyQuaternion(invQ);
        }

        // --- grid state ---
        const g = c.grid;
        let gSx = 0,
          gSy = 0;
        if (g > 0 && slots) {
          const s = slots.get(c);
          if (s) {
            gSx = s.w;
            gSy = s.h;
            slotLocal.set(s.x, s.y, 0).applyQuaternion(invQ);
          } else {
            slotLocal.copy(c.basePos);
            gSx = sphereSx;
            gSy = sphereSy;
          }
        }

        // blend: sphere * (1 - n - g) + open * n + grid * g
        const b = Math.max(0, 1 - n - g);
        const scaleX = sphereSx * b + w * n + gSx * g;
        const scaleY = sphereSy * b + h * n + gSy * g;
        c.mesh.scale.set(scaleX, scaleY, 1);

        // object-fit: cover, resolved against the frame's shape *this* frame
        // rather than eased along the tween. The card changes proportion the
        // whole way to its slot; a crop that only catches up at the end
        // stretches the picture for the entire flight. Where the frame
        // already matches the image (sphere, open card, masonry slots) this
        // comes out at 1 and costs nothing.
        let cropX = 1,
          cropY = 1; // texture repeat (1 = whole image)
        if (scaleX > 0 && scaleY > 0) {
          const a = c.aspect || 1;
          const frame = scaleX / scaleY;
          if (a > frame) cropX = frame / a;
          else cropY = a / frame;
        }
        c.mesh.position.set(
          c.basePos.x * b + frontLocal.x * n + slotLocal.x * g,
          c.basePos.y * b + frontLocal.y * n + slotLocal.y * g,
          c.basePos.z * b + frontLocal.z * n + slotLocal.z * g
        );
        // the twin is drawn in the DOM above the frosted sheet, so its mesh
        // stays in the scene (it still takes clicks) but paints nothing — the
        // opacity it would have had goes to the <img> instead
        const op = sphereOp * b + c.intro * n + c.intro * cfg.gridOpacity * g;
        const isTwin = twinOn && c === twinCard;
        if (isTwin) twinOpacity = op;
        c.material.opacity = isTwin ? 0 : op;

        const map = c.material.map;
        if (map && (map.repeat.x !== cropX || map.repeat.y !== cropY)) {
          map.repeat.set(cropX, cropY);
          map.offset.set((1 - cropX) / 2, (1 - cropY) / 2);
        }
      }

      // the sheet follows the focus tween; the twin tracks its mesh exactly,
      // so the card keeps the flight the renderer is already animating
      if (view.focus > 0.001) {
        // Ramp the blur radius and the tint together rather than fading a
        // finished sheet in. Fading it leaves the sharp backdrop showing
        // through underneath, so the tint reads long before the blur does.
        const f = view.focus;
        const blur = `blur(${(cfg.focusVeilBlur * f).toFixed(2)}px)`;
        veilEl.style.display = "block";
        veilEl.style.backgroundColor = `rgba(255,255,255,${cfg.focusVeil * f})`;
        veilEl.style.setProperty("backdrop-filter", blur);
        veilEl.style.setProperty("-webkit-backdrop-filter", blur);
      } else if (veilEl.style.display !== "none") {
        // an idle backdrop-filter still costs a compositing pass — take the
        // whole layer out while nothing is focused
        veilEl.style.display = "none";
      }
      if (!twinOn) {
        if (cardEl.style.display !== "none") cardEl.style.display = "none";
      } else {
        cardEl.style.display = "block";
        cardEl.style.opacity = String(twinOpacity);
        twinPos.copy(twinCard.mesh.position).applyQuaternion(q);
        twinEdge
          .set(
            twinPos.x + twinCard.mesh.scale.x / 2,
            twinPos.y + twinCard.mesh.scale.y / 2,
            twinPos.z
          )
          .project(camera);
        twinPos.project(camera);
        const tx = (twinPos.x + 1) * 0.5 * W;
        const ty = (1 - twinPos.y) * 0.5 * H;
        const hw = Math.abs((twinEdge.x + 1) * 0.5 * W - tx);
        const hh = Math.abs((1 - twinEdge.y) * 0.5 * H - ty);
        cardEl.style.transform = `translate(${tx - hw}px, ${ty - hh}px)`;
        cardEl.style.width = `${2 * hw}px`;
        cardEl.style.height = `${2 * hh}px`;
      }

      renderer.render(scene, camera);
    };
    tick();

    // ---------- cleanup ----------
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      if (cfg.wheelSpeed) canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
      gsap.killTweensOf(cards);
      for (const c of cards) {
        c.material.map?.dispose();
        c.material.dispose();
      }
      geometry.dispose();
      renderer.dispose();
      if (apiRef?.current) apiRef.current = null;
      veilEl.remove();
      cardEl.remove();
      if (canvas.parentNode === container) container.removeChild(canvas);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // while the details column is up it already names the open card, so the
  // bottom caption only reports what the pointer is over
  const caption = focus
    ? hovered === focus.item
      ? null
      : hovered
    : expanded ?? hovered;

  return (
    <div className={`relative h-full w-full select-none ${className}`}>
      <style>{`@keyframes candor-focus-in {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: none; }
      }`}</style>
      <div ref={containerRef} className="absolute inset-0" />
      <div ref={overlayRef} className="pointer-events-none absolute inset-0" />

      {title && (
        <div className="pointer-events-none absolute left-0 top-6 flex w-full justify-center text-[13px] tracking-[0.02em] text-black">
          {title}
        </div>
      )}

      <div
        className="pointer-events-none absolute bottom-8 left-0 flex w-full flex-col items-center gap-1 text-black transition-opacity duration-500"
        style={{ opacity: caption ? 1 : 0 }}
        aria-live="polite"
      >
        <span className="text-[15px] leading-none">{caption?.label}</span>
        {caption?.meta && (
          <span className="text-[11px] leading-none text-black/50">
            {caption.meta}
          </span>
        )}
      </div>

      <div
        className="pointer-events-none absolute bottom-8 left-0 flex w-full justify-center text-[11px] uppercase tracking-[0.18em] text-black/40 transition-opacity duration-700"
        style={{ opacity: interacted || caption ? 0 : 1 }}
      >
        Drag to explore
      </div>
    </div>
  );
}

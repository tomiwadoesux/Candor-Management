"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * DarkroomPrint — the /about hero. A portrait from the board develops on
 * screen the way a photographic print does in the tray.
 *
 * Each print runs one cycle:
 *
 *   safelight   the room is lit only by a dim red lamp; the sheet is blank
 *   develop     density comes up out of the paper, SHADOWS FIRST — the darkest
 *               parts of the picture appear, then the mid-tones, then the
 *               faintest highlights, unevenly, the way developer reaches a
 *               sheet. Silver grain shimmers in the mid-tones while it works.
 *   lights on   the safelight gives way to white light: the finished black-
 *               and-white print, held for a few seconds
 *   pull        the lights go down again and the sheet is lifted out; the next
 *               one goes in
 *
 * The tray is liquid. A slow slosh moves across it all the time, and the
 * pointer drops rings into it — the surface refracts the print underneath and
 * catches the light at its crests. Nothing is ever drawn AT the cursor; it only
 * disturbs the surface, the same rule the carousel's melt/wake follows.
 *
 * Everything is one fragment pass over a full-screen quad: the surface height
 * is evaluated at three points for its slope, the slope bends the lookup into
 * the photograph, and the development, the grain, the light and the vignette
 * all happen per pixel from there. No render targets.
 *
 * Gated like the site's other WebGL: the frame loop only runs while the hero
 * is on screen and the tab is visible, and the cycle's clock stops with it, so
 * a print never finishes developing while nobody is looking. Reduced motion
 * gets one finished print, lights on, still. No WebGL gets a plain greyscale
 * image.
 */

// Ripples are uniforms, not a simulation: each is a ring with a birth time,
// travelling out and dying away. Twelve is plenty for a quick sweep of the
// pointer; the oldest is overwritten first.
const MAX_DROPS = 12;

// Seconds. One print's life, start to finish.
const CYCLE = {
  fadeIn: 0.6, // fresh sheet appears under the safelight
  developFrom: 0.3,
  developFor: 4.6,
  lightsFrom: 4.1,
  lightsFor: 1.9,
  lightsDownAt: 11.0,
  lightsDownFor: 1.0,
  pullAt: 11.6,
  pullFor: 1.0,
  length: 12.6,
};

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  #define MAX_DROPS ${MAX_DROPS}

  uniform vec2  uRes;        // canvas size in CSS px
  uniform float uDpr;        // device px per CSS px, to read gl_FragCoord in CSS px
  uniform float uTime;       // seconds, stops while hidden

  uniform sampler2D uImage;
  uniform float uImgAspect;  // width / height of the photograph
  uniform vec2  uFocus;      // the face, 0..1 from the TOP left — kept in frame

  uniform float uDev;        // development 0 (blank sheet) .. 1 (fully up)
  uniform float uLight;      // 0 safelight .. 1 white light
  uniform float uExposure;   // whole-frame level, for the sheet going in and out
  uniform float uMotion;     // 1 normally, 0 under reduced motion

  // xy = centre in CSS px from the bottom left, z = birth time, w = strength
  uniform vec4  uDrops[MAX_DROPS];

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  // --- the tray ------------------------------------------------------------
  // Height of the developer's surface at p, in arbitrary units. The slosh is
  // two long, slow standing waves at odd angles so it never visibly repeats;
  // each drop is a single ring — a gaussian band riding outwards on a sine —
  // that widens and fades as it goes.
  float surface(vec2 p) {
    float t = uTime;
    float h = 0.9 * sin(p.x * 0.0042 + t * 0.55) * sin(p.y * 0.0051 - t * 0.43)
            + 0.5 * sin((p.x + p.y) * 0.0067 - t * 0.8);
    h *= uMotion;

    for (int i = 0; i < MAX_DROPS; i++) {
      vec4 d = uDrops[i];
      float age = t - d.z;
      if (d.w <= 0.0 || age < 0.0 || age > 3.2) continue;
      float r = length(p - d.xy);
      float x = r - age * 240.0;           // distance behind the ring's front
      float w = 22.0 + age * 26.0;         // the ring broadens as it travels
      float env = exp(-(x * x) / (2.0 * w * w)) * exp(-age * 1.35) * d.w;
      h += sin(x * 0.075) * env * 6.0;
    }
    return h;
  }

  void main() {
    vec2 p = gl_FragCoord.xy / uDpr;

    // Slope of the surface by finite differences. It bends the lookup into
    // the photograph (refraction) and tilts the normal for the glints.
    float e = 2.0;
    float h0 = surface(p);
    vec2 g = vec2(surface(p + vec2(e, 0.0)) - h0, surface(p + vec2(0.0, e)) - h0) / e;
    vec2 q = p - g * 9.0;

    // Cover the canvas with the photograph, sliding the crop window toward
    // the face as far as the spare image allows. The texture is flipped on
    // upload, so the focus is flipped to match.
    vec2 uv = q / uRes;
    float scr = uRes.x / uRes.y;
    vec2 s = scr > uImgAspect ? vec2(1.0, uImgAspect / scr) : vec2(scr / uImgAspect, 1.0);
    vec2 focus = vec2(uFocus.x, 1.0 - uFocus.y);
    vec2 c = clamp(focus, s * 0.5, 1.0 - s * 0.5);
    vec2 iuv = clamp((uv - 0.5) * s + c, 0.0, 1.0);

    vec3 src = texture2D(uImage, iuv).rgb;
    float lum = dot(src, vec3(0.299, 0.587, 0.114));
    lum = smoothstep(0.03, 0.97, lum);     // a grade-3 paper: firm blacks
    float target = 1.0 - lum;              // the density this pixel ends at

    // --- development -------------------------------------------------------
    // Each pixel starts darkening at a moment set by how dark it will end up:
    // the deepest shadows at once, the palest highlights last. A coarse noise
    // staggers that start so the image comes up unevenly, like developer
    // washing across a sheet rather than a fade.
    float coarse = vnoise(p * 0.012 + 3.1);
    float start = (1.0 - target) * 0.6 + (coarse - 0.5) * 0.14;
    float density = target * smoothstep(start, start + 0.36, uDev);

    // Silver grain, strongest in the mid-tones where real grain shows. It
    // flickers at 12fps while motion is allowed and holds still when it isn't.
    float mid = 4.0 * density * (1.0 - density);
    float grain = mix(hash(p * 1.37), hash(floor(p) + floor(uTime * 12.0)), uMotion);
    density = clamp(density + (grain - 0.5) * 0.11 * mid, 0.0, 1.0);

    vec3 paper  = vec3(0.93, 0.915, 0.88);   // warm fibre base
    vec3 silver = vec3(0.035, 0.034, 0.033);
    vec3 col = mix(paper, silver, pow(density, 0.92));

    // --- light -------------------------------------------------------------
    // The safelight is dim and deep red, so the room reads as dark even with a
    // blank white sheet in the tray. White light is held a little warm and a
    // little low, so a pale photograph never glares off a black page.
    vec3 safelight = vec3(0.62, 0.13, 0.06);
    vec3 lamp = vec3(0.86, 0.85, 0.82);
    col *= mix(safelight, lamp, uLight);

    // Glints where a ripple's crest tilts the lamp into view. Flat liquid
    // reflects nothing toward the viewer, so the still tray stays matte.
    vec3 n = normalize(vec3(-g * 3.0, 1.0));
    vec3 L = normalize(vec3(-0.35, 0.55, 0.76));
    float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 80.0);
    col += spec * mix(vec3(0.5, 0.1, 0.05), vec3(0.55), uLight) * 0.6;

    // The tray's edges fall into shadow, and the bottom of the frame darkens
    // under the headline so it reads on any print.
    vec2 vu = p / uRes;
    float vig = smoothstep(1.15, 0.35, length((vu - vec2(0.5, 0.55)) * vec2(1.0, 1.15)));
    float scrim = smoothstep(0.0, 0.46, vu.y);
    col *= mix(0.35, 1.0, vig) * mix(0.26, 1.0, scrim);

    gl_FragColor = vec4(col * uExposure, 1.0);
  }
`;

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const ramp = (c, from, span) => easeInOut(Math.min(Math.max((c - from) / span, 0), 1));

// Where a print stands at `c` seconds into its cycle.
function cycleState(c) {
  const C = CYCLE;
  const develop = ramp(c, C.developFrom, C.developFor);
  const light = c < C.lightsDownAt
    ? ramp(c, C.lightsFrom, C.lightsFor)
    : 1 - ramp(c, C.lightsDownAt, C.lightsDownFor);
  const exposure = Math.min(ramp(c, 0, C.fadeIn), 1 - ramp(c, C.pullAt, C.pullFor));
  return { develop, light, exposure };
}

export default function DarkroomPrint({ prints, className = "" }) {
  const hostRef = useRef(null);
  const [fallback, setFallback] = useState(false);
  const [shown, setShown] = useState(0);
  // Under reduced motion one print is shown and never changes, so the
  // "Print 01 / 04" counter would promise a sequence that isn't coming.
  const [still, setStill] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !prints?.length) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    setStill(Boolean(reduce));

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      setFallback(true);
      return;
    }

    // A full-screen fragment pass is paid per pixel; 1.5x is indistinguishable
    // from 2x through grain and ripples, and a third cheaper on a retina panel.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x0c0c0c, 1);
    const canvas = renderer.domElement;
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
    // First child, not last: the caption React renders in this box has to
    // paint over the canvas, and later siblings paint on top.
    host.prepend(canvas);

    const drops = Array.from({ length: MAX_DROPS }, () => new THREE.Vector4(0, 0, -100, 0));
    const uniforms = {
      uRes: { value: new THREE.Vector2(1, 1) },
      uDpr: { value: dpr },
      uTime: { value: 0 },
      uImage: { value: null },
      uImgAspect: { value: 0.8 },
      uFocus: { value: new THREE.Vector2(0.5, 0.4) },
      uDev: { value: reduce ? 1 : 0 },
      uLight: { value: reduce ? 1 : 0 },
      uExposure: { value: reduce ? 1 : 0 },
      uMotion: { value: reduce ? 0 : 1 },
      uDrops: { value: drops },
    };

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
    scene.add(new THREE.Mesh(geometry, material));

    // --- textures ----------------------------------------------------------
    // Loaded one ahead: while a print develops, the next is fetched, so the
    // swap in the dark between them never waits on the network.
    const loader = new THREE.TextureLoader();
    const textures = new Map();
    let disposed = false;
    const load = (i) => {
      if (!textures.has(i)) {
        textures.set(
          i,
          new Promise((resolve) => {
            loader.load(
              prints[i].src,
              (t) => {
                t.minFilter = THREE.LinearFilter;
                t.generateMipmaps = false;
                t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
                resolve(t);
              },
              undefined,
              () => resolve(null)
            );
          })
        );
      }
      return textures.get(i);
    };

    let index = 0;
    let ready = false;
    const wear = async (i, tries = 0) => {
      const tex = await load(i);
      if (disposed) return;
      if (!tex) {
        // A missing photograph skips to the next rather than stalling the
        // loop on a blank sheet. Give up only once every one has failed.
        if (tries + 1 < prints.length) {
          index = (i + 1) % prints.length;
          return wear(index, tries + 1);
        }
        if (!ready) setFallback(true);
        return;
      }
      uniforms.uImage.value = tex;
      uniforms.uImgAspect.value = tex.image.width / tex.image.height;
      const f = prints[i].focus || [0.5, 0.4];
      uniforms.uFocus.value.set(f[0], f[1]);
      ready = true;
      setShown(i);
      if (!reduce && prints.length > 1) load((i + 1) % prints.length);
    };

    // --- size --------------------------------------------------------------
    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      uniforms.uRes.value.set(width, height);
      if (reduce) draw();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // --- pointer -----------------------------------------------------------
    // A ring is dropped every ~28px of travel, stronger the faster the pointer
    // moves, so a slow drift leaves a gentle trail and a flick leaves a wake.
    let lastDrop = null;
    let nextDrop = 0;
    const onPointer = (e) => {
      if (reduce) return;
      const r = host.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = r.bottom - e.clientY;
      if (x < 0 || y < 0 || x > r.width || y > r.height) return;
      const now = uniforms.uTime.value;
      if (lastDrop) {
        const dist = Math.hypot(x - lastDrop.x, y - lastDrop.y);
        if (dist < 28) return;
        const speed = dist / Math.max(now - lastDrop.t, 0.016);
        drops[nextDrop].set(x, y, now, Math.min(Math.max(speed / 1400, 0.25), 1));
      } else {
        drops[nextDrop].set(x, y, now, 0.35);
      }
      nextDrop = (nextDrop + 1) % MAX_DROPS;
      lastDrop = { x, y, t: now };
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    // --- visibility --------------------------------------------------------
    let onScreen = true;
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
    });
    io.observe(host);

    // --- loop --------------------------------------------------------------
    let raf = 0;
    let last = performance.now();
    let cycle = 0;
    let swapping = false;

    function draw() {
      renderer.render(scene, camera);
    }

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (!onScreen || document.hidden || !ready) return;

      uniforms.uTime.value += dt;

      if (!swapping) cycle += dt;
      if (cycle >= CYCLE.length && !swapping) {
        // In the dark between prints: swap, then start the next cycle once its
        // photograph is on the GPU.
        swapping = true;
        index = (index + 1) % prints.length;
        wear(index).then(() => {
          cycle = 0;
          swapping = false;
        });
      }

      const s = cycleState(swapping ? CYCLE.length : cycle);
      uniforms.uDev.value = s.develop;
      uniforms.uLight.value = s.light;
      uniforms.uExposure.value = s.exposure;
      draw();
    };

    wear(0).then(() => {
      if (disposed) return;
      resize();
      if (reduce) draw();
      else raf = requestAnimationFrame(frame);
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      for (const p of textures.values()) p.then((t) => t?.dispose());
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      // Let the browser reclaim the context now rather than whenever it gets
      // round to it — client-side navigation away and back would otherwise
      // stack contexts until the oldest is killed.
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, [prints]);

  return (
    <div ref={hostRef} className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {fallback && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={prints[0].src}
          alt=""
          className="h-full w-full object-cover opacity-60 grayscale"
        />
      )}
      {/* Which print is in the tray. Set in the page's caption type, top
          right under the nav, out of the headline's way. */}
      {prints.length > 1 && !fallback && !still && (
        // Colour set inline: styles/agency.css is unlayered, so .ag-label's
        // own colour would beat a Tailwind text utility here.
        <span
          className="ag-label ag-num absolute right-4 top-[72px]"
          style={{ color: "var(--ag-faint)" }}
        >
          Print {String(shown + 1).padStart(2, "0")} / {String(prints.length).padStart(2, "0")}
        </span>
      )}
    </div>
  );
}

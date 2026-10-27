"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";

// One picture window on the model board: a canvas driven by boardGL, over a
// plain <Image> that holds the frame until the renderer has its first
// texture (and stays, if WebGL is unavailable, so the board still works).
//
// The renderer is created the first time the frame nears the viewport and
// draws only while something is moving — a transition, the lens easing in
// or out, the cursor drifting — so an idle board costs nothing per frame.
// `src` is the only prop that animates; the rest are read when a step begins.

const DURATION = { develop: 1.8, gate: 1.2, iris: 1.3 };
const EASE = { develop: "power1.inOut", gate: "none", iris: "power3.inOut" };

export default function PrintFrame({
  src,
  alt,
  mode = "develop",
  mono = 0,
  paper = "#ffffff",
  grain = 0.03,
  lens = true,
  dir = 1,
  origin = null,
  delay = 0,
  sizes,
  priority = false,
  className = "",
  children,
}) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const engine = useRef(null); // { gl, wake, tween, reduced } once the first picture is up
  const wanted = useRef(src); // the latest src asked for
  const drawn = useRef(null); // the src the canvas is showing or heading to
  const step = useRef({ dir, origin, delay });
  step.current = { dir, origin, delay };
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const glass = { value: 0 };
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    let gl = null, frame = 0, visible = false, started = false, disposed = false;
    let moving = 0; // tweens in flight
    let resizer = null;

    const tick = (now) => {
      frame = 0;
      if (disposed || !gl) return;
      mouse.x += (mouse.tx - mouse.x) * 0.12;
      mouse.y += (mouse.ty - mouse.y) * 0.12;
      gl.uniforms.uMouse.value.set(mouse.x, mouse.y);
      gl.uniforms.uLens.value = glass.value;
      gl.render(now / 1000);
      const drifting = glass.value > 0.001 && (Math.abs(mouse.tx - mouse.x) > 0.0005 || Math.abs(mouse.ty - mouse.y) > 0.0005);
      if (visible && (moving > 0 || drifting)) frame = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!frame && visible && gl) frame = requestAnimationFrame(tick);
    };
    const tween = (target, vars) => {
      moving += 1;
      gsap.to(target, {
        ...vars,
        onStart: wake,
        onUpdate: wake,
        onComplete: () => { moving -= 1; wake(); },
        onInterrupt: () => { moving = Math.max(0, moving - 1); },
      });
    };

    const start = () => {
      started = true;
      import("./boardGL").then(async ({ createBoardRenderer }) => {
        if (disposed) return;
        try {
          gl = createBoardRenderer(canvasRef.current, { mode, mono, paper, grain });
        } catch {
          return;
        }
        const size = () => {
          const rect = root.getBoundingClientRect();
          gl.resize(Math.max(1, rect.width), Math.max(1, rect.height));
          // Resizing clears the canvas; redraw now rather than next frame so
          // it never shows a blank between the two.
          if (engine.current) gl.render(performance.now() / 1000);
        };
        resizer = new ResizeObserver(size);
        resizer.observe(root);
        size();
        const first = wanted.current;
        const entry = await gl.load(first);
        if (disposed) return;
        gl.show(entry);
        // Drawn before it is revealed: an opaque canvas is black until then.
        gl.render(performance.now() / 1000);
        drawn.current = first;
        engine.current = { gl, wake, tween, reduced };
        // Re-runs the step effect below, which catches up to any step taken
        // while the first texture was loading.
        setReady(true);
        wake();
      }).catch(() => {});
    };

    const watcher = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !started) start();
      if (visible) wake();
    }, { rootMargin: "50% 0px" });
    watcher.observe(root);

    const move = (event) => {
      const rect = root.getBoundingClientRect();
      mouse.tx = (event.clientX - rect.left) / rect.width;
      mouse.ty = 1 - (event.clientY - rect.top) / rect.height;
      wake();
    };
    const enter = (event) => {
      if (!lens || event.pointerType !== "mouse") return;
      move(event);
      mouse.x = mouse.tx;
      mouse.y = mouse.ty;
      tween(glass, { value: 1, duration: 0.6, ease: "power2.out", overwrite: true });
    };
    const leave = () => lens && tween(glass, { value: 0, duration: 0.8, ease: "power2.out", overwrite: true });
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerenter", enter);
    root.addEventListener("pointerleave", leave);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      watcher.disconnect();
      resizer?.disconnect();
      gsap.killTweensOf(glass);
      if (gl) gsap.killTweensOf(gl.uniforms.uProgress);
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerenter", enter);
      root.removeEventListener("pointerleave", leave);
      gl?.dispose();
      engine.current = null;
    };
    // The renderer's look is fixed for the life of the frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    wanted.current = src;
    const live = engine.current;
    if (!live || src === drawn.current) return;
    drawn.current = src;
    const { gl, tween, wake, reduced } = live;
    const { dir: way, origin: from, delay: wait } = step.current;
    gl.load(src).then((entry) => {
      // Dropped if a newer step arrived while this texture was loading.
      if (wanted.current !== src || engine.current !== live) return;
      gsap.killTweensOf(gl.uniforms.uProgress);
      gl.begin(entry, { dir: way, origin: from });
      if (reduced) {
        gl.uniforms.uProgress.value = 1;
        wake();
        return;
      }
      tween(gl.uniforms.uProgress, { value: 1, duration: DURATION[mode], delay: wait / 1000, ease: EASE[mode] });
    });
  }, [src, mode, ready]);

  return (
    <div
      ref={rootRef}
      className={`mb-print ${className}`}
      data-ready={ready || undefined}
      style={{ background: paper }}
      role={ready ? "img" : undefined}
      aria-label={ready ? alt : undefined}
    >
      {!ready && <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="mb-print__still" />}
      <canvas ref={canvasRef} className="mb-print__canvas" aria-hidden="true" />
      {children}
    </div>
  );
}

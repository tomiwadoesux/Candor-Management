const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const smooth = (value) => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// The scroll the change from Look to the showreel is played over, in screen
// heights, on top of the one screen the pinned stage itself takes.
export const REEL_TRAVEL = 1.5;
// Hold the completed reel in place for one more screen before it releases.
export const REEL_HOLD = 1;

// How far down the photo the film's frame is centred, as an object-position
// percentage. The portraits are tall and the film is wide, so centred they
// would show a torso; this keeps the face in the frame.
export const REEL_FOCUS = 22;

// When each part of the change happens, as fractions of the travel. Every
// part finishes before 1, so the finished showreel holds for a moment before
// the page moves on.
export const REEL_TIMELINE = {
  // Look's arrows go first, so nothing is left sitting on the opening frame.
  arrows: [0.03, 0.12],
  // The right-hand photo leaves...
  aside: [0.05, 0.45],
  // ...while the left-hand one opens out to fill the screen.
  grow: [0.06, 0.58],
  // Empty film frames appear before the text travels into their captions.
  preview: [0.42, 0.58],
  // Reduced motion: nothing travels, Look simply gives way to the film.
  fadeOut: [0.2, 0.45],
  fadeIn: [0.3, 0.55],
};

// Start the handoff as soon as the portrait has opened to fill the frame.
// Upward scrolling unwinds it over more distance, starting from the live frame.
export const REEL_HANDOFF = { trigger: 0.62, reverseEnd: 0.4, duration: 240 };
export const REEL_CHROME = {
  film: [0, 0.22],
  shade: [0.08, 0.3],
  ctrls: [0.7, 0.9],
  chapters: [0.8, 1],
};

export function advanceHandoff(previous, progress, now) {
  const p = clamp(progress, 0, 1);
  if (!previous || p === 0 || p === 1) {
    return { p, value: p >= REEL_HANDOFF.trigger ? 1 : 0, direction: 0, startedAt: null, running: false };
  }
  const state = { ...previous, p };
  const delta = p - previous.p;
  if (delta < 0) {
    if (previous.direction !== -1) {
      state.reverseAnchor = previous.p;
      state.reverseValue = previous.value;
    }
    state.direction = -1;
    state.startedAt = null;
    state.running = false;
    state.value = state.reverseValue * phase(p, [REEL_HANDOFF.reverseEnd, state.reverseAnchor]);
  } else {
    if (delta > 0) state.direction = 1;
    if (state.direction === 1 && p >= REEL_HANDOFF.trigger && state.value < 1 && state.startedAt === null) {
      state.startedAt = now;
      state.startValue = state.value;
    }
    if (state.startedAt !== null) {
      const elapsed = clamp((now - state.startedAt) / REEL_HANDOFF.duration, 0, 1);
      state.value = lerp(state.startValue, 1, elapsed);
      state.running = elapsed < 1;
      if (!state.running) state.startedAt = null;
    }
  }
  return state;
}

// How far through the scene the page is: 0 until the stage pins, 1 once it
// has played out and is about to release.
export function reelProgress(top, height, vh) {
  return clamp(-top / Math.max(1, height - vh), 0, 1);
}

// Where p sits inside one part's window, straight and eased.
export function phase(p, [start, end]) {
  return clamp((p - start) / Math.max(1e-6, end - start), 0, 1);
}

export function eased(p, span) {
  return smooth(phase(p, span));
}

export function lerpRect(from, to, t) {
  return {
    left: lerp(from.left, to.left, t),
    top: lerp(from.top, to.top, t),
    width: lerp(from.width, to.width, t),
    height: lerp(from.height, to.height, t),
  };
}

export const START_TIME = 1;
export const END_TIME = 11.8;
const ORIGINAL_SCENE_LENGTH = 19;

// Start after the title screen and stop before the expanded ledger sequence.
// Keeping one viewport of travel per scene unit preserves the original pace.
export const RUNWAY_VH = (END_TIME - START_TIME + 1) * 100;
export function sceneProgress(progress) {
  const bounded = Math.max(0, Math.min(1, progress));
  return (START_TIME + bounded * (END_TIME - START_TIME)) / ORIGINAL_SCENE_LENGTH;
}

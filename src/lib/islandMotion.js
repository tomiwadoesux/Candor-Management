// Search and navigation share the same drawer motion.
export const ISLAND_EASE = [0.32, 0.72, 0, 1];
export const ISLAND_OPEN = { horizontal: 0.55, vertical: 0.5, verticalDelay: 0.1 };
export const ISLAND_CLOSE = { horizontal: 0.4, vertical: 0.38, verticalDelay: 0.08 };
export const ISLAND_BUTTON = { enter: 0.45, exit: 0.55, exitDelay: 0.3 };

export const getSearchPanelWidth = (viewportWidth) => Math.min(viewportWidth * 0.94, 820);

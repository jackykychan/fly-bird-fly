import {
  GAP_MIN,
  GAP_START,
  PORTRAIT_SPACING_MAX,
  RAMP_SCORE,
  REFERENCE_WIDTH,
  SCROLL_SPEED_MAX,
  SCROLL_SPEED_START,
  SPAWN_INTERVAL_MIN,
  SPAWN_INTERVAL_START,
  WORLD_HEIGHT,
} from "./constants";

// The world's aspect ratio at the reference (landscape/desktop) width. Spacing
// is stretched relative to this as the screen gets narrower than it.
const REFERENCE_ASPECT = REFERENCE_WIDTH / WORLD_HEIGHT;

// Normalized difficulty in [0, 1] derived from the current score.
export function difficultyFactor(score: number): number {
  return Math.min(1, Math.max(0, score / RAMP_SCORE));
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

export function scrollSpeed(score: number): number {
  return lerp(SCROLL_SPEED_START, SCROLL_SPEED_MAX, difficultyFactor(score));
}

// Scroll speed scaled to the current world width so obstacles take the same
// wall-clock time to reach the bird on a narrow phone as on a wide desktop.
export function scrollSpeedFor(score: number, worldWidth: number): number {
  return scrollSpeed(score) * (worldWidth / REFERENCE_WIDTH);
}

export function spawnInterval(score: number): number {
  return lerp(SPAWN_INTERVAL_START, SPAWN_INTERVAL_MIN, difficultyFactor(score));
}

// How much to stretch obstacle spacing for the current world width: 1x on
// landscape/desktop, growing up to PORTRAIT_SPACING_MAX as the screen narrows
// into portrait, so obstacles don't bunch together on phones.
export function spacingMultiplier(worldWidth: number): number {
  const aspect = worldWidth / WORLD_HEIGHT;
  const factor = REFERENCE_ASPECT / aspect;
  return Math.min(PORTRAIT_SPACING_MAX, Math.max(1, factor));
}

// Time until the next spawn, accounting for both difficulty and the extra
// spacing applied on narrow screens.
export function spawnIntervalFor(score: number, worldWidth: number): number {
  return spawnInterval(score) * spacingMultiplier(worldWidth);
}

export function gapSize(score: number): number {
  return lerp(GAP_START, GAP_MIN, difficultyFactor(score));
}

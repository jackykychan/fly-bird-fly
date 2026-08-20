import { BIRD_COLORS, DEFAULT_BIRD_COLOR, type BirdColorName } from "./game/constants";

const HIGH_SCORE_KEY = "bird-dash-high-score";
const BIRD_COLOR_KEY = "bird-dash-color";

export function loadHighScore(): number {
  try {
    const raw = localStorage.getItem(HIGH_SCORE_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function saveHighScore(score: number): void {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(score));
  } catch {
    // Ignore storage errors (private mode, quota, etc.).
  }
}

export function loadBirdColor(): BirdColorName {
  try {
    const raw = localStorage.getItem(BIRD_COLOR_KEY);
    if (raw && raw in BIRD_COLORS) return raw as BirdColorName;
  } catch {
    // Ignore and fall through to the default.
  }
  return DEFAULT_BIRD_COLOR;
}

export function saveBirdColor(name: BirdColorName): void {
  try {
    localStorage.setItem(BIRD_COLOR_KEY, name);
  } catch {
    // Ignore storage errors.
  }
}

import { POINTER_DEADZONE } from "./constants";
import type { View } from "./render";
import type { Intent } from "./state";

// Turn an active touch position into a vertical intent, relative to the bird:
// a finger above the bird moves it up, below moves it down, and level with it
// (within POINTER_DEADZONE world px) holds. `canvasClientTop` is the canvas's
// offset from the top of the viewport so the touch's client Y can be mapped
// into world space.
export function pointerIntent(
  pointerClientY: number,
  canvasClientTop: number,
  view: View,
  birdWorldY: number,
): Intent {
  const targetWorldY =
    (pointerClientY - canvasClientTop - view.offsetY) / view.scale;
  const dy = targetWorldY - birdWorldY;
  if (Math.abs(dy) < POINTER_DEADZONE) return 0;
  return dy < 0 ? -1 : 1;
}

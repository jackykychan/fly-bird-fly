import {
  BIRD_RADIUS,
  BIRD_VERTICAL_SPEED,
  PLAY_BOTTOM,
  PLAY_TOP,
} from "./constants";
import type { Bird, Intent } from "./state";

// Direct vertical control: the bird moves at a constant speed in the intent
// direction and holds position when there is no input. Clamped to the play
// area so the top/bottom edges act as safe walls (only obstacles are lethal).
// The wing flaps (flapPhase advances) only while the bird is actually moving.
export function updateBird(bird: Bird, intent: Intent, dt: number): void {
  bird.moving = intent !== 0;
  bird.vy = intent * BIRD_VERTICAL_SPEED;
  if (bird.moving) bird.flapPhase += dt;

  bird.y += bird.vy * dt;

  const min = PLAY_TOP + BIRD_RADIUS;
  const max = PLAY_BOTTOM - BIRD_RADIUS;
  if (bird.y < min) bird.y = min;
  if (bird.y > max) bird.y = max;
}

import {
  BIRD_RADIUS,
  FLY_GRAVITY,
  FLY_MAX_FALL,
  FLY_MAX_RISE,
  FLY_THRUST,
  PLAY_BOTTOM,
  PLAY_TOP,
} from "./constants";
import type { Bird } from "./state";

// Hold-to-fly control: gravity always pulls the bird down; while `thrust` is
// held, a stronger upward force lifts it. Velocity is clamped, and the bird
// rests against the top/bottom edges (safe walls — only obstacles are lethal).
// The wing flaps while thrusting.
export function updateBird(bird: Bird, thrust: boolean, dt: number): void {
  bird.moving = thrust;
  if (thrust) bird.flapPhase += dt;

  bird.vy += FLY_GRAVITY * dt;
  if (thrust) bird.vy -= FLY_THRUST * dt;
  bird.vy = Math.max(-FLY_MAX_RISE, Math.min(FLY_MAX_FALL, bird.vy));

  bird.y += bird.vy * dt;

  const min = PLAY_TOP + BIRD_RADIUS;
  const max = PLAY_BOTTOM - BIRD_RADIUS;
  if (bird.y < min) {
    bird.y = min;
    bird.vy = 0;
  } else if (bird.y > max) {
    bird.y = max;
    bird.vy = 0;
  }
}

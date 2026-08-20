import { BIRD_RADIUS, PLAY_BOTTOM, PLAY_TOP } from "./constants";
import type { Bird, Obstacle } from "./state";

// The solid rectangle occupied by an obstacle bar, in world coordinates.
export function obstacleRect(o: Obstacle): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  if (o.anchor === "top") {
    return { x: o.x, y: PLAY_TOP, w: o.width, h: o.length };
  }
  return { x: o.x, y: PLAY_BOTTOM - o.length, w: o.width, h: o.length };
}

// Circle (bird) vs axis-aligned rectangle (obstacle) intersection.
export function circleHitsRect(
  cx: number,
  cy: number,
  r: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
): boolean {
  const nearestX = Math.max(rx, Math.min(cx, rx + rw));
  const nearestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < r * r;
}

export function birdHitsObstacle(bird: Bird, o: Obstacle): boolean {
  const rect = obstacleRect(o);
  return circleHitsRect(
    bird.x,
    bird.y,
    BIRD_RADIUS,
    rect.x,
    rect.y,
    rect.w,
    rect.h,
  );
}

export function birdHitsAny(bird: Bird, obstacles: Obstacle[]): boolean {
  for (const o of obstacles) {
    // Cheap horizontal reject before the full test.
    if (o.x > bird.x + BIRD_RADIUS || o.x + o.width < bird.x - BIRD_RADIUS) {
      continue;
    }
    if (birdHitsObstacle(bird, o)) return true;
  }
  return false;
}

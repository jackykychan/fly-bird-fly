import {
  OBSTACLE_MAX_WIDTH,
  OBSTACLE_MIN_WIDTH,
  PLAY_BOTTOM,
  PLAY_TOP,
} from "./constants";
import { gapSize } from "./difficulty";
import type { GameState, Obstacle } from "./state";

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// Create a new obstacle pair-as-gap just off the right edge. We model a single
// passable vertical gap; the space above the gap is a top-anchored bar and the
// space below is a bottom-anchored bar. Their lengths therefore vary naturally,
// giving obstacles of different lengths at the top and bottom of the screen.
export function spawnObstacle(score: number, worldWidth: number): Obstacle {
  const width = randRange(OBSTACLE_MIN_WIDTH, OBSTACLE_MAX_WIDTH);
  const gap = gapSize(score);

  // Keep the gap fully inside the play area with a small margin.
  const margin = 24;
  const gapTop = randRange(
    PLAY_TOP + margin,
    PLAY_BOTTOM - margin - gap,
  );
  const gapBottom = gapTop + gap;

  // Returns the TOP bar (ceiling → gapTop); the bottom bar is derived in
  // spawnPair below so a single gap becomes two solid bars sharing an x.
  return {
    x: worldWidth + width,
    width,
    length: gapTop - PLAY_TOP,
    anchor: "top",
    gapTop,
    gapBottom,
    scored: false,
  };
}

// Returns the top and bottom bars for one gap, spawned just off the right edge.
export function spawnPair(
  score: number,
  worldWidth: number,
): [Obstacle, Obstacle] {
  const top = spawnObstacle(score, worldWidth);
  const bottom: Obstacle = {
    x: top.x,
    width: top.width,
    length: PLAY_BOTTOM - top.gapBottom,
    anchor: "bottom",
    gapTop: top.gapTop,
    gapBottom: top.gapBottom,
    scored: false,
  };
  return [top, bottom];
}

// Move obstacles left and drop those fully off the left edge.
export function updateObstacles(
  state: GameState,
  scrollSpeedPx: number,
  dt: number,
): void {
  for (const o of state.obstacles) {
    o.x -= scrollSpeedPx * dt;
  }
  state.obstacles = state.obstacles.filter((o) => o.x + o.width > 0);
}

import { BIRD_X_FRACTION, REFERENCE_WIDTH, WORLD_HEIGHT } from "./constants";

// A single obstacle bar anchored to either the top or bottom edge. It spans from
// the screen edge to the passable gap (see `obstacleRect`).
export interface Obstacle {
  x: number;
  width: number;
  anchor: "top" | "bottom";
  gapTop: number; // y of the top of the passable gap
  gapBottom: number; // y of the bottom of the passable gap
  scored: boolean; // whether the bird has passed it (reserved for pass-based scoring)
}

export interface Bird {
  x: number;
  y: number;
  vy: number; // vertical velocity — 0 in normal play, grows under gravity while dying
  flapPhase: number; // accumulates while moving, drives the wing animation
  moving: boolean; // whether the wing should flap this frame
}

// A single feather particle in the crash burst.
export interface Feather {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number; // current rotation (radians)
  vrot: number; // angular velocity (radians/s)
  life: number; // remaining life (seconds); fades out as it drops
}

// Run status: alive (playing), dying (crash animation), dead (finished).
export type Status = "alive" | "dying" | "dead";

export interface GameState {
  bird: Bird;
  obstacles: Obstacle[];
  feathers: Feather[];
  worldWidth: number; // current logical width (varies with the viewport)
  score: number;
  scoringStarted: boolean; // true once the bird has passed its first obstacle
  elapsed: number; // seconds since run start
  timeToNextSpawn: number; // seconds
  status: Status;
}

export function createInitialState(worldWidth = REFERENCE_WIDTH): GameState {
  return {
    bird: {
      x: worldWidth * BIRD_X_FRACTION,
      y: WORLD_HEIGHT / 2,
      vy: 0,
      flapPhase: 0,
      moving: false,
    },
    obstacles: [],
    feathers: [],
    worldWidth,
    score: 0,
    scoringStarted: false,
    elapsed: 0,
    timeToNextSpawn: 0.6, // brief grace before the first obstacle
    status: "alive",
  };
}

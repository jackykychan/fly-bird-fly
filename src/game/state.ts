import { BIRD_X_FRACTION, REFERENCE_WIDTH, WORLD_HEIGHT } from "./constants";

// A single obstacle bar anchored to either the top or bottom edge.
// `x` is the left edge, `length` is how far it protrudes from its anchor.
export interface Obstacle {
  x: number;
  width: number;
  length: number;
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

// Input intent: -1 = move up, +1 = move down, 0 = hold.
export type Intent = -1 | 0 | 1;

// Run status: alive (playing), dying (crash animation), dead (finished).
export type Status = "alive" | "dying" | "dead";

export interface GameState {
  bird: Bird;
  obstacles: Obstacle[];
  feathers: Feather[];
  worldWidth: number; // current logical width (varies with the viewport)
  score: number;
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
    elapsed: 0,
    timeToNextSpawn: 0.6, // brief grace before the first obstacle
    status: "alive",
  };
}

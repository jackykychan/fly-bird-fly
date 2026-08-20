import { updateBird } from "./bird";
import { birdHitsAny } from "./collision";
import {
  BIRD_RADIUS,
  DEATH_GRAVITY,
  DEATH_POP_VELOCITY,
  FEATHER_COUNT,
  FEATHER_GRAVITY,
  FEATHER_LIFE,
  PLAY_BOTTOM,
  PLAY_TOP,
  SCORE_PER_SECOND,
  WORLD_HEIGHT,
} from "./constants";
import { scrollSpeedFor, spawnIntervalFor } from "./difficulty";
import { spawnPair, updateObstacles } from "./obstacles";
import type { Feather, GameState } from "./state";

// Advance the game one fixed timestep. `thrust` is whether the fly control is
// held this step. Pure with respect to `state` (mutated in place) apart from
// Math.random, so both the live Engine and headless tests share identical rules.
export function simulateStep(
  state: GameState,
  thrust: boolean,
  dt: number,
): void {
  if (state.status === "dead") return;
  if (state.status === "dying") {
    updateDeath(state, dt);
    return;
  }

  const speed = scrollSpeedFor(state.score, state.worldWidth);

  state.elapsed += dt;

  updateBird(state.bird, thrust, dt);
  updateObstacles(state, speed, dt);

  state.timeToNextSpawn -= dt;
  if (state.timeToNextSpawn <= 0) {
    const [top, bottom] = spawnPair(state.score, state.worldWidth);
    state.obstacles.push(top, bottom);
    state.timeToNextSpawn += spawnIntervalFor(state.score, state.worldWidth);
  }

  // Scoring only begins once the bird has passed its first obstacle (the
  // obstacle's right edge is left of the bird), then accrues over time.
  for (const o of state.obstacles) {
    if (!o.scored && o.x + o.width < state.bird.x) {
      o.scored = true;
      state.scoringStarted = true;
    }
  }
  if (state.scoringStarted) state.score += SCORE_PER_SECOND * dt;

  // Hitting an obstacle OR the top/bottom edge of the screen ends the run.
  const hitEdge =
    state.bird.y <= PLAY_TOP + BIRD_RADIUS ||
    state.bird.y >= PLAY_BOTTOM - BIRD_RADIUS;
  if (hitEdge || birdHitsAny(state.bird, state.obstacles)) {
    startDeath(state);
  }
}

// Begin the crash animation: hop the bird, then let gravity take over, and
// burst feathers from its position.
function startDeath(state: GameState): void {
  state.status = "dying";
  state.bird.vy = DEATH_POP_VELOCITY;
  state.bird.moving = true;
  state.feathers.push(...spawnFeathers(state.bird.x, state.bird.y));
}

function spawnFeathers(x: number, y: number): Feather[] {
  const feathers: Feather[] = [];
  for (let i = 0; i < FEATHER_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 160;
    feathers.push({
      x: x + (Math.random() - 0.5) * BIRD_RADIUS,
      y: y + (Math.random() - 0.5) * BIRD_RADIUS,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 60, // bias upward on the initial burst
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 8,
      life: FEATHER_LIFE * (0.7 + Math.random() * 0.3),
    });
  }
  return feathers;
}

// While dying: the world freezes, the bird falls off-screen under gravity, and
// the feathers scatter and fade. Once the bird is fully below the screen the
// run is over.
function updateDeath(state: GameState, dt: number): void {
  const bird = state.bird;
  bird.vy += DEATH_GRAVITY * dt;
  bird.y += bird.vy * dt;
  bird.moving = true;
  bird.flapPhase += dt;

  updateFeathers(state, dt);

  if (bird.y - BIRD_RADIUS > WORLD_HEIGHT) {
    state.status = "dead";
  }
}

function updateFeathers(state: GameState, dt: number): void {
  for (const f of state.feathers) {
    f.vy += FEATHER_GRAVITY * dt;
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    f.rot += f.vrot * dt;
    f.life -= dt;
  }
  state.feathers = state.feathers.filter((f) => f.life > 0);
}

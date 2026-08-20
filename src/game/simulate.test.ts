import { describe, expect, it } from "vitest";
import { simulateStep } from "./simulate";
import { createInitialState } from "./state";
import { obstacleRect } from "./collision";
import {
  BIRD_RADIUS,
  FIXED_DT,
  PLAY_BOTTOM,
  PLAY_TOP,
  REFERENCE_WIDTH,
  WORLD_HEIGHT,
} from "./constants";

// Run the sim for `seconds`. `thrust` is a constant or a function of time.
// `safeBird` parks the bird off-screen (in x) AND pins it to mid-height each
// step so it never hits an obstacle or the (now lethal) edges — for obstacle
// tests that just need the world to advance.
function run(
  thrust: boolean | ((t: number) => boolean),
  seconds: number,
  { safeBird = false }: { safeBird?: boolean } = {},
) {
  const state = createInitialState();
  if (safeBird) state.bird.x = -10000;
  let t = 0;
  while (t < seconds && state.status !== "dead") {
    const held = typeof thrust === "function" ? thrust(t) : thrust;
    simulateStep(state, held, FIXED_DT);
    if (safeBird) {
      state.bird.y = WORLD_HEIGHT / 2;
      state.bird.vy = 0;
    }
    t += FIXED_DT;
  }
  return { state, t };
}

// Advance an alive state until the bird is inside a solid cactus (mid-screen,
// away from the lethal edges), triggering a crash, and return the state.
function crash() {
  const state = createInitialState();
  while (state.obstacles.length === 0) {
    simulateStep(state, false, FIXED_DT);
    state.bird.y = WORLD_HEIGHT / 2; // keep alive until an obstacle spawns
    state.bird.vy = 0;
  }
  const top = state.obstacles.find((o) => o.anchor === "top")!;
  const rect = obstacleRect(top);
  state.bird.x = rect.x + rect.w / 2;
  // Inside the solid bar but clear of the top edge.
  state.bird.y = Math.max(PLAY_TOP + BIRD_RADIUS + 4, rect.h - 6);
  simulateStep(state, false, FIXED_DT);
  return state;
}

describe("simulation", () => {
  it("spawns obstacles that scroll leftward over time", () => {
    const { state } = run(false, 5, { safeBird: true });
    expect(state.obstacles.length).toBeGreaterThan(0);
    for (const o of state.obstacles) {
      expect(o.x).toBeLessThanOrEqual(REFERENCE_WIDTH + o.width + 1);
    }
    expect(state.obstacles.some((o) => o.x < REFERENCE_WIDTH * 0.8)).toBe(true);
  });

  it("does not score until the first obstacle is passed", () => {
    const state = createInitialState();
    // Keep the bird alive and mid-screen; no obstacle has passed it yet.
    for (let i = 0; i < 30; i++) {
      simulateStep(state, false, FIXED_DT);
      state.bird.y = WORLD_HEIGHT / 2;
      state.bird.vy = 0;
    }
    expect(state.scoringStarted).toBe(false);
    expect(state.score).toBe(0);
  });

  it("accumulates score after passing the first obstacle", () => {
    const state = createInitialState();
    // Drop in an obstacle already behind the bird (its right edge is to the
    // left of the bird), well clear of the bird so it isn't a collision.
    state.obstacles.push({
      x: state.bird.x - 100,
      width: 40,
      anchor: "top",
      gapTop: 100,
      gapBottom: 250,
      scored: false,
    });
    for (let i = 0; i < 10; i++) {
      simulateStep(state, false, FIXED_DT);
      state.bird.y = WORLD_HEIGHT / 2;
      state.bird.vy = 0;
    }
    expect(state.scoringStarted).toBe(true);
    expect(state.score).toBeGreaterThan(0);
  });

  it("every spawned gap is passable and inside the play area", () => {
    const { state } = run(false, 5, { safeBird: true });
    for (const o of state.obstacles) {
      expect(o.gapTop).toBeGreaterThanOrEqual(PLAY_TOP);
      expect(o.gapBottom).toBeLessThanOrEqual(PLAY_BOTTOM);
      expect(o.gapBottom - o.gapTop).toBeGreaterThan(BIRD_RADIUS * 2);
    }
  });
});

describe("flight physics (hold-to-fly)", () => {
  it("falls under gravity when not thrusting, rises when thrusting", () => {
    const state = createInitialState();
    const start = state.bird.y;
    for (let i = 0; i < 20; i++) simulateStep(state, false, FIXED_DT);
    expect(state.bird.y).toBeGreaterThan(start); // fell

    const afterFall = state.bird.y;
    for (let i = 0; i < 40; i++) simulateStep(state, true, FIXED_DT);
    expect(state.bird.y).toBeLessThan(afterFall); // thrust lifted it
  });

  it("ends the run when the bird falls into the ground (bottom edge)", () => {
    const state = createInitialState();
    state.bird.x = -10000; // avoid cacti; die purely from the edge
    for (let i = 0; i < 400 && state.status === "alive"; i++) {
      simulateStep(state, false, FIXED_DT);
    }
    expect(state.status).not.toBe("alive");
  });

  it("ends the run when the bird hits the ceiling (top edge)", () => {
    const state = createInitialState();
    state.bird.x = -10000; // avoid cacti; die purely from the edge
    for (let i = 0; i < 400 && state.status === "alive"; i++) {
      simulateStep(state, true, FIXED_DT); // hold thrust → rises into the ceiling
    }
    expect(state.status).not.toBe("alive");
    expect(state.bird.y).toBeLessThan(WORLD_HEIGHT / 2);
  });
});

describe("death sequence", () => {
  it("starts the death animation and bursts feathers on a crash", () => {
    const state = crash();
    expect(state.status).toBe("dying");
    expect(state.feathers.length).toBeGreaterThan(0);
  });

  it("freezes obstacles and makes the bird fall while dying", () => {
    const state = crash();
    const obstacleXs = state.obstacles.map((o) => o.x);
    const obstacleCount = state.obstacles.length;
    const yBefore = state.bird.y;
    for (let i = 0; i < 90; i++) simulateStep(state, false, FIXED_DT);
    expect(state.bird.y).toBeGreaterThan(yBefore);
    expect(state.obstacles.length).toBe(obstacleCount);
    expect(state.obstacles.map((o) => o.x)).toEqual(obstacleXs);
  });

  it("ends the run once the bird falls off the bottom", () => {
    const state = crash();
    for (let i = 0; i < 600 && state.status !== "dead"; i++) {
      simulateStep(state, false, FIXED_DT);
    }
    expect(state.status).toBe("dead");
    expect(state.bird.y - BIRD_RADIUS).toBeGreaterThan(WORLD_HEIGHT);
  });
});

describe("wing flap", () => {
  it("flaps only while thrusting", () => {
    const state = createInitialState();
    simulateStep(state, false, FIXED_DT);
    expect(state.bird.moving).toBe(false);
    const restPhase = state.bird.flapPhase;
    simulateStep(state, false, FIXED_DT);
    expect(state.bird.flapPhase).toBe(restPhase);

    simulateStep(state, true, FIXED_DT);
    expect(state.bird.moving).toBe(true);
    expect(state.bird.flapPhase).toBeGreaterThan(restPhase);
  });
});

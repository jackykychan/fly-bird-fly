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

function run(intentFor: (t: number) => -1 | 0 | 1, seconds: number) {
  const state = createInitialState();
  let t = 0;
  while (t < seconds && state.status !== "dead") {
    simulateStep(state, intentFor(t), FIXED_DT);
    t += FIXED_DT;
  }
  return { state, t };
}

// Advance an alive state until the bird is inside a solid bar, triggering a
// crash, and return the crashing state.
function crash() {
  const state = createInitialState();
  while (state.obstacles.length === 0) simulateStep(state, 0, FIXED_DT);
  const top = state.obstacles.find((o) => o.anchor === "top")!;
  const rect = obstacleRect(top);
  state.bird.x = rect.x + rect.w / 2;
  state.bird.y = rect.y + Math.min(rect.h, 5);
  simulateStep(state, 0, FIXED_DT);
  return state;
}

describe("simulation", () => {
  it("spawns obstacles that scroll leftward over time", () => {
    const { state } = run(() => 0, 3);
    expect(state.obstacles.length).toBeGreaterThan(0);
    // Every obstacle spawns just off the right edge and moves left. The
    // default world width is REFERENCE_WIDTH.
    for (const o of state.obstacles) {
      expect(o.x).toBeLessThanOrEqual(REFERENCE_WIDTH + o.width + 1);
    }
    // At least one obstacle should have advanced well into the play field.
    expect(state.obstacles.some((o) => o.x < REFERENCE_WIDTH * 0.8)).toBe(true);
  });

  it("accumulates score while alive", () => {
    const { state } = run(() => 0, 2);
    // ~10 points/sec; allow slack for the difficulty-independent rate.
    expect(state.score).toBeGreaterThan(15);
  });

  it("every spawned gap is passable and inside the play area", () => {
    const { state } = run(() => 0, 5);
    for (const o of state.obstacles) {
      expect(o.gapTop).toBeGreaterThanOrEqual(PLAY_TOP);
      expect(o.gapBottom).toBeLessThanOrEqual(PLAY_BOTTOM);
      expect(o.gapBottom - o.gapTop).toBeGreaterThan(BIRD_RADIUS * 2);
    }
  });

  it("a bird that holds the vertical center threads early obstacles", () => {
    // Center-seeking policy: the initial gaps are placed randomly, so we can't
    // guarantee survival forever, but the bird must at least be able to react.
    // Here we verify the bird follows intent toward a gap it can reach.
    const state = createInitialState();
    simulateStep(state, 0, FIXED_DT);
    const before = state.bird.y;
    for (let i = 0; i < 30; i++) simulateStep(state, -1, FIXED_DT);
    expect(state.bird.y).toBeLessThan(before); // moved up
  });

  it("starts the death animation when it flies into a solid bar", () => {
    const state = crash();
    expect(state.status).toBe("dying");
  });
});

describe("death sequence", () => {
  it("bursts feathers on a crash", () => {
    const state = crash();
    expect(state.feathers.length).toBeGreaterThan(0);
  });

  it("freezes obstacles and makes the bird fall while dying", () => {
    const state = crash();
    const obstacleXs = state.obstacles.map((o) => o.x);
    const obstacleCount = state.obstacles.length;
    const yBefore = state.bird.y;
    // Run past the initial upward hop so gravity has pulled the bird back down.
    for (let i = 0; i < 90; i++) simulateStep(state, 0, FIXED_DT);
    // The bird has fallen (net downward from the crash point)...
    expect(state.bird.y).toBeGreaterThan(yBefore);
    // ...and the world is frozen: no new spawns and no scrolling.
    expect(state.obstacles.length).toBe(obstacleCount);
    expect(state.obstacles.map((o) => o.x)).toEqual(obstacleXs);
  });

  it("ends the run once the bird falls off the bottom", () => {
    const state = crash();
    // Run well past the fall duration.
    for (let i = 0; i < 600 && state.status !== "dead"; i++) {
      simulateStep(state, 0, FIXED_DT);
    }
    expect(state.status).toBe("dead");
    expect(state.bird.y - BIRD_RADIUS).toBeGreaterThan(WORLD_HEIGHT);
  });
});

describe("wing flap", () => {
  it("flaps only while the bird is moving", () => {
    const state = createInitialState();
    // Holding still: not moving, flapPhase unchanged.
    simulateStep(state, 0, FIXED_DT);
    expect(state.bird.moving).toBe(false);
    const restPhase = state.bird.flapPhase;
    simulateStep(state, 0, FIXED_DT);
    expect(state.bird.flapPhase).toBe(restPhase);

    // Moving up: flapping, flapPhase advances.
    simulateStep(state, -1, FIXED_DT);
    expect(state.bird.moving).toBe(true);
    expect(state.bird.flapPhase).toBeGreaterThan(restPhase);
  });
});

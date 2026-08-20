import { describe, expect, it } from "vitest";
import { circleHitsRect, obstacleRect } from "./collision";
import {
  gapSize,
  scrollSpeed,
  spawnInterval,
  difficultyFactor,
} from "./difficulty";
import {
  GAP_MIN,
  GAP_START,
  SCROLL_SPEED_MAX,
  SCROLL_SPEED_START,
  WORLD_HEIGHT,
} from "./constants";
import type { Obstacle } from "./state";

describe("collision", () => {
  it("detects a circle overlapping a rectangle", () => {
    expect(circleHitsRect(10, 10, 5, 8, 8, 4, 4)).toBe(true);
  });

  it("misses a circle clear of the rectangle", () => {
    expect(circleHitsRect(0, 0, 5, 20, 20, 4, 4)).toBe(false);
  });

  it("just touches at the corner within radius", () => {
    // Nearest corner at (10,10); circle center (7,7) r=5 → dist ~4.24 < 5
    expect(circleHitsRect(7, 7, 5, 10, 10, 4, 4)).toBe(true);
  });

  it("maps a top-anchored obstacle from the ceiling edge to the gap", () => {
    const o: Obstacle = {
      x: 100,
      width: 40,
      anchor: "top",
      gapTop: 68,
      gapBottom: 218,
      scored: false,
    };
    const r = obstacleRect(o);
    // Spans the true top edge (y=0) down to the gap top.
    expect(r).toEqual({ x: 100, y: 0, w: 40, h: 68 });
  });

  it("maps a bottom-anchored obstacle from the gap to the floor edge", () => {
    const o: Obstacle = {
      x: 100,
      width: 40,
      anchor: "bottom",
      gapTop: 200,
      gapBottom: 300,
      scored: false,
    };
    const r = obstacleRect(o);
    // Spans the gap bottom down to the true bottom edge (WORLD_HEIGHT).
    expect(r).toEqual({ x: 100, y: 300, w: 40, h: WORLD_HEIGHT - 300 });
  });
});

describe("difficulty", () => {
  it("clamps the difficulty factor to [0,1]", () => {
    expect(difficultyFactor(-100)).toBe(0);
    expect(difficultyFactor(0)).toBe(0);
    expect(difficultyFactor(1e9)).toBe(1);
  });

  it("scroll speed rises from start to max", () => {
    expect(scrollSpeed(0)).toBeCloseTo(SCROLL_SPEED_START);
    expect(scrollSpeed(1e9)).toBeCloseTo(SCROLL_SPEED_MAX);
    expect(scrollSpeed(500)).toBeGreaterThan(SCROLL_SPEED_START);
  });

  it("gap shrinks from start to min", () => {
    expect(gapSize(0)).toBeCloseTo(GAP_START);
    expect(gapSize(1e9)).toBeCloseTo(GAP_MIN);
  });

  it("spawn interval only decreases with score", () => {
    expect(spawnInterval(0)).toBeGreaterThan(spawnInterval(500));
    expect(spawnInterval(500)).toBeGreaterThanOrEqual(spawnInterval(1e9));
  });
});

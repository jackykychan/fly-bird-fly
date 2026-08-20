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
  PLAY_BOTTOM,
  PLAY_TOP,
  SCROLL_SPEED_MAX,
  SCROLL_SPEED_START,
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

  it("maps a top-anchored obstacle to a rect at the ceiling", () => {
    const o: Obstacle = {
      x: 100,
      width: 40,
      length: 60,
      anchor: "top",
      gapTop: PLAY_TOP + 60,
      gapBottom: PLAY_TOP + 60 + 150,
      scored: false,
    };
    const r = obstacleRect(o);
    expect(r).toEqual({ x: 100, y: PLAY_TOP, w: 40, h: 60 });
  });

  it("maps a bottom-anchored obstacle to a rect at the floor", () => {
    const o: Obstacle = {
      x: 100,
      width: 40,
      length: 60,
      anchor: "bottom",
      gapTop: 0,
      gapBottom: 0,
      scored: false,
    };
    const r = obstacleRect(o);
    expect(r).toEqual({ x: 100, y: PLAY_BOTTOM - 60, w: 40, h: 60 });
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

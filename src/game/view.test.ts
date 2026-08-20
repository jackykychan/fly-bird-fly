import { describe, expect, it } from "vitest";
import { computeView } from "./render";
import {
  scrollSpeedFor,
  scrollSpeed,
  spacingMultiplier,
  spawnIntervalFor,
  spawnInterval,
} from "./difficulty";
import {
  PORTRAIT_SPACING_MAX,
  REFERENCE_WIDTH,
  WORLD_HEIGHT,
} from "./constants";

describe("computeView (fill the screen)", () => {
  it("maps the world height to the full canvas height with no letterbox", () => {
    const v = computeView(1280, 800);
    expect(v.offsetX).toBe(0);
    expect(v.offsetY).toBe(0);
    expect(v.scale).toBeCloseTo(800 / WORLD_HEIGHT);
  });

  it("derives a world width that exactly fills the canvas width", () => {
    for (const [w, h] of [
      [1280, 800],
      [375, 812], // portrait phone
      [812, 375], // landscape phone
    ] as const) {
      const v = computeView(w, h);
      // worldWidth * scale === cssWidth (fills horizontally)
      expect(v.worldWidth * v.scale).toBeCloseTo(w);
      // uniform scale keeps the world height filling too
      expect(WORLD_HEIGHT * v.scale).toBeCloseTo(h);
    }
  });

  it("gives a narrow world on portrait and a wide one on landscape", () => {
    const portrait = computeView(375, 812).worldWidth;
    const landscape = computeView(812, 375).worldWidth;
    expect(portrait).toBeLessThan(landscape);
  });
});

describe("scrollSpeedFor (aspect-independent approach time)", () => {
  it("matches the reference speed at the reference width", () => {
    expect(scrollSpeedFor(200, REFERENCE_WIDTH)).toBeCloseTo(scrollSpeed(200));
  });

  it("scales linearly with world width", () => {
    const full = scrollSpeedFor(200, REFERENCE_WIDTH);
    const half = scrollSpeedFor(200, REFERENCE_WIDTH / 2);
    expect(half).toBeCloseTo(full / 2);
  });
});

describe("obstacle spacing (further apart on mobile)", () => {
  const portraitWidth = computeView(375, 812).worldWidth;
  const landscapeWidth = computeView(812, 375).worldWidth;

  it("does not stretch spacing on landscape/desktop", () => {
    expect(spacingMultiplier(REFERENCE_WIDTH)).toBeCloseTo(1);
    expect(spacingMultiplier(landscapeWidth)).toBeCloseTo(1);
    expect(spawnIntervalFor(0, REFERENCE_WIDTH)).toBeCloseTo(spawnInterval(0));
  });

  it("stretches spacing on a narrow portrait screen", () => {
    expect(spacingMultiplier(portraitWidth)).toBeGreaterThan(1.5);
    expect(spawnIntervalFor(0, portraitWidth)).toBeGreaterThan(spawnInterval(0));
  });

  it("never stretches beyond the configured maximum", () => {
    expect(spacingMultiplier(1)).toBeCloseTo(PORTRAIT_SPACING_MAX);
    expect(spacingMultiplier(portraitWidth)).toBeLessThanOrEqual(
      PORTRAIT_SPACING_MAX,
    );
  });
});

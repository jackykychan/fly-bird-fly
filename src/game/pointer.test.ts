import { describe, expect, it } from "vitest";
import { pointerIntent } from "./pointer";
import { computeView } from "./render";
import { POINTER_DEADZONE, WORLD_HEIGHT } from "./constants";

// A portrait phone view; canvas pinned to the top of the viewport.
const view = computeView(375, 812);
const canvasTop = 0;
const scale = view.scale;

// Convert a world Y to the client Y a finger would touch to point at it.
const clientYForWorld = (worldY: number) => canvasTop + view.offsetY + worldY * scale;

describe("pointerIntent (touch relative to the bird)", () => {
  const birdWorldY = WORLD_HEIGHT / 2;

  it("moves up when the finger is clearly above the bird", () => {
    const y = clientYForWorld(birdWorldY - 100);
    expect(pointerIntent(y, canvasTop, view, birdWorldY)).toBe(-1);
  });

  it("moves down when the finger is clearly below the bird", () => {
    const y = clientYForWorld(birdWorldY + 100);
    expect(pointerIntent(y, canvasTop, view, birdWorldY)).toBe(1);
  });

  it("holds when the finger is level with the bird", () => {
    const y = clientYForWorld(birdWorldY);
    expect(pointerIntent(y, canvasTop, view, birdWorldY)).toBe(0);
  });

  it("holds within the deadzone and reacts just outside it", () => {
    const insideWorld = birdWorldY + (POINTER_DEADZONE - 1);
    const outsideWorld = birdWorldY + (POINTER_DEADZONE + 1);
    expect(
      pointerIntent(clientYForWorld(insideWorld), canvasTop, view, birdWorldY),
    ).toBe(0);
    expect(
      pointerIntent(clientYForWorld(outsideWorld), canvasTop, view, birdWorldY),
    ).toBe(1);
  });

  it("accounts for the canvas offset from the top of the viewport", () => {
    // With the canvas pushed down 40px, the same finger position is now
    // relatively higher above the bird.
    const y = clientYForWorld(birdWorldY); // level when canvasTop = 0
    expect(pointerIntent(y, 40, view, birdWorldY)).toBe(-1);
  });
});

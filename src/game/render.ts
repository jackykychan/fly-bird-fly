import {
  BIRD_RADIUS,
  FEATHER_LIFE,
  FLAP_FREQUENCY,
  MAX_FALL_TILT,
  WING_FLAP_AMPLITUDE,
  WORLD_HEIGHT,
  WORLD_PER_PIXEL,
} from "./constants";
import { obstacleRect } from "./collision";
import type { GameState } from "./state";

// The view maps world coordinates into the (already DPR-scaled) canvas.
export interface View {
  scale: number;
  offsetX: number;
  offsetY: number;
  worldWidth: number; // logical width that exactly fills the canvas
  cssWidth: number;
  cssHeight: number;
}

// Fill the whole canvas: the fixed world HEIGHT maps to the full CSS height
// (uniform scale, no distortion) and the world WIDTH is whatever fills the CSS
// width at that scale. No letterboxing on any screen size or aspect ratio.
export function computeView(cssWidth: number, cssHeight: number): View {
  const scale = cssHeight / WORLD_HEIGHT;
  const worldWidth = cssWidth / scale;
  return { scale, offsetX: 0, offsetY: 0, worldWidth, cssWidth, cssHeight };
}

// Daytime-desert palette.
const SKY = ["#4aa6e0", "#5fb4e6", "#79c4ec", "#a5daf2"];
const SAND = ["#e9cf92", "#e0c079", "#d3ad63"];
const DUNE = "#cdaa5f";
const DUNE_HI = "#e3c583";
const SUN = "#ffe9a8";
const SUN_CORE = "#fff6d8";
const SUN_GLOW = "rgba(255,233,168,0.30)";
const CLOUD = "#f6fbff";
const CLOUD_SHADE = "#d7e8f2";
const SAND_SPECK = "rgba(120,90,40,0.22)";
const HORIZON_FRAC = 0.62;

// Cactus palette.
const CACTUS = "#4a9e3f";
const CACTUS_HI = "#6cc257";
const CACTUS_SHADE = "#2f7a2c";
const CACTUS_DARK = "#1f5c22";

// Bird: a plain body color (chosen by the player) with white wings.
const BIRD_WING = "#ffffff";
const BIRD_WING_SHADE = "#d7dde6";
const BIRD_BEAK = "#ff9e3d";
const BIRD_EYE = "#141018";

// Render the scene into a low-resolution offscreen buffer (in world coordinates)
// then upscale it to the main canvas with nearest-neighbor sampling, giving a
// crisp pixel-art look. `off`/`offCtx` are owned and sized by the Engine.
export function render(
  ctx: CanvasRenderingContext2D,
  off: HTMLCanvasElement,
  offCtx: CanvasRenderingContext2D,
  state: GameState,
  view: View,
  scrollOffset: number,
  birdColor: string,
): void {
  const { worldWidth, cssWidth, cssHeight } = view;
  const bufW = off.width;
  const bufH = off.height;

  offCtx.setTransform(bufW / worldWidth, 0, 0, bufH / WORLD_HEIGHT, 0, 0);
  drawBackground(offCtx, scrollOffset, worldWidth);
  drawCacti(offCtx, state);
  drawFeathers(offCtx, state, birdColor);
  drawBird(offCtx, state, birdColor);

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, 0, 0, bufW, bufH, 0, 0, cssWidth, cssHeight);
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  scrollOffset: number,
  worldWidth: number,
): void {
  const horizon = WORLD_HEIGHT * HORIZON_FRAC;

  // Sky bands (top) and sand bands (bottom).
  const skyH = horizon / SKY.length;
  for (let i = 0; i < SKY.length; i++) {
    ctx.fillStyle = SKY[i];
    ctx.fillRect(0, i * skyH, worldWidth, skyH + 1);
  }
  const sandH = (WORLD_HEIGHT - horizon) / SAND.length;
  for (let i = 0; i < SAND.length; i++) {
    ctx.fillStyle = SAND[i];
    ctx.fillRect(0, horizon + i * sandH, worldWidth, sandH + 1);
  }

  drawSun(ctx, worldWidth * 0.8, WORLD_HEIGHT * 0.22, 30);
  drawClouds(ctx, worldWidth, scrollOffset);
  drawDunes(ctx, worldWidth, horizon, scrollOffset);

  // Sand grain: sparse speckles on the pixel grid, drifting.
  ctx.fillStyle = SAND_SPECK;
  const px = WORLD_PER_PIXEL;
  const drift = scrollOffset * 0.5;
  const spacing = 70;
  const off = drift % spacing;
  for (let x = -off; x < worldWidth; x += spacing) {
    for (let y = horizon + 16; y < WORLD_HEIGHT; y += 46) {
      ctx.fillRect(Math.round(x / px) * px, Math.round(y / px) * px, px, px);
    }
  }
}

function drawSun(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
): void {
  ctx.fillStyle = SUN_GLOW;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = SUN;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = SUN_CORE;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawClouds(
  ctx: CanvasRenderingContext2D,
  worldWidth: number,
  scrollOffset: number,
): void {
  const drift = scrollOffset * 0.15;
  const period = worldWidth + 220;
  const clouds = [
    { base: 40, y: WORLD_HEIGHT * 0.14, s: 1.1 },
    { base: 300, y: WORLD_HEIGHT * 0.3, s: 0.85 },
    { base: 560, y: WORLD_HEIGHT * 0.2, s: 1.0 },
  ];
  for (const c of clouds) {
    let x = (((c.base - drift) % period) + period) % period - 110;
    drawCloud(ctx, x, c.y, c.s);
  }
}

function drawCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
): void {
  const w = 26 * s;
  const h = 12 * s;
  ctx.fillStyle = CLOUD_SHADE;
  ctx.fillRect(x - 2, y + h - 3, w * 2.4 + 4, 4);
  ctx.fillStyle = CLOUD;
  ctx.fillRect(x, y + h * 0.4, w * 2.4, h);
  ctx.fillRect(x + w * 0.5, y, w, h);
  ctx.fillRect(x + w * 1.3, y + h * 0.2, w * 0.9, h * 0.9);
}

function drawDunes(
  ctx: CanvasRenderingContext2D,
  worldWidth: number,
  horizon: number,
  scrollOffset: number,
): void {
  const drift = scrollOffset * 0.25;
  const period = worldWidth + 300;
  const humps = [
    { base: 120, w: 150, h: 34 },
    { base: 420, w: 190, h: 46 },
    { base: 700, w: 130, h: 28 },
  ];
  for (const hmp of humps) {
    const cx = (((hmp.base - drift) % period) + period) % period - 150;
    ctx.fillStyle = DUNE;
    ctx.beginPath();
    ctx.ellipse(cx, horizon, hmp.w, hmp.h, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = DUNE_HI;
    ctx.fillRect(cx - hmp.w * 0.5, horizon - hmp.h + 2, hmp.w, 3);
  }
}

function drawCacti(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const o of state.obstacles) {
    drawCactus(ctx, obstacleRect(o), o.anchor);
  }
}

function drawCactus(
  ctx: CanvasRenderingContext2D,
  r: { x: number; y: number; w: number; h: number },
  anchor: "top" | "bottom",
): void {
  // Cactus grows from its anchored edge toward the gap (the "tip").
  const tipUp = anchor === "bottom";
  const baseY = tipUp ? r.y + r.h : r.y;
  const tipY = tipUp ? r.y : r.y + r.h;
  const yAt = (t: number) => baseY + (tipY - baseY) * t;

  const stemW = Math.max(12, Math.round(r.w * 0.5));
  const stemX = Math.round(r.x + (r.w - stemW) / 2);
  const armThk = Math.max(8, Math.round(r.w * 0.26));
  const armLen = r.h * 0.24;

  // Green base shapes: stem + two arms (kept within the collision rect).
  ctx.fillStyle = CACTUS;
  ctx.fillRect(stemX, r.y, stemW, r.h);

  // Right arm.
  const ry = yAt(0.42);
  ctx.fillRect(stemX + stemW - 2, ry - armThk / 2, r.x + r.w - (stemX + stemW) + 2, armThk);
  ctx.fillRect(
    r.x + r.w - armThk,
    tipUp ? ry - armThk / 2 - armLen : ry - armThk / 2,
    armThk,
    armLen + armThk,
  );

  // Left arm.
  const ly = yAt(0.62);
  ctx.fillRect(r.x, ly - armThk / 2, stemX + 2 - r.x, armThk);
  ctx.fillRect(
    r.x,
    tipUp ? ly - armThk / 2 - armLen : ly - armThk / 2,
    armThk,
    armLen + armThk,
  );

  // Stem shading: highlight column left, shadow column right, dark outlines.
  ctx.fillStyle = CACTUS_HI;
  ctx.fillRect(stemX + 2, r.y, Math.max(2, Math.round(stemW * 0.22)), r.h);
  ctx.fillStyle = CACTUS_SHADE;
  const shW = Math.max(2, Math.round(stemW * 0.28));
  ctx.fillRect(stemX + stemW - shW, r.y, shW, r.h);
  ctx.fillStyle = CACTUS_DARK;
  ctx.fillRect(stemX, r.y, 2, r.h);
  ctx.fillRect(stemX + stemW - 2, r.y, 2, r.h);

  // Lit cap at the tip end.
  ctx.fillStyle = CACTUS_HI;
  const capY = tipUp ? r.y : r.y + r.h - 3;
  ctx.fillRect(stemX, capY, stemW, 3);
}

function drawFeathers(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  birdColor: string,
): void {
  const s = WORLD_PER_PIXEL * 2;
  for (const f of state.feathers) {
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.rot);
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life / FEATHER_LIFE));
    // Alternate body-color and white feathers to match the bird.
    ctx.fillStyle = f.rot > 0 ? birdColor : BIRD_WING;
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawBird(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  birdColor: string,
): void {
  const { x, y, vy, flapPhase, moving } = state.bird;
  const R = BIRD_RADIUS;

  ctx.save();
  ctx.translate(x, y);

  // Nose down as the bird falls during the death animation (vy > 0).
  const tilt = Math.max(-MAX_FALL_TILT, Math.min(MAX_FALL_TILT, vy / 900));
  ctx.rotate(tilt);

  // Plain body block in the chosen color.
  ctx.fillStyle = birdColor;
  ctx.fillRect(-R, -R, R * 2, R * 2);

  // Wing: a white rectangle that swings (flaps) while the bird is moving.
  const flap = moving
    ? Math.sin(flapPhase * FLAP_FREQUENCY * Math.PI * 2) * WING_FLAP_AMPLITUDE
    : 0;
  ctx.save();
  ctx.translate(-2, -1);
  ctx.rotate(flap);
  ctx.fillStyle = BIRD_WING;
  ctx.fillRect(-R * 0.7, -R * 0.28, R * 0.95, R * 0.62);
  ctx.fillStyle = BIRD_WING_SHADE;
  ctx.fillRect(-R * 0.7, R * 0.2, R * 0.95, R * 0.14);
  ctx.restore();

  // Beak (stepped blocks for a pixel wedge).
  ctx.fillStyle = BIRD_BEAK;
  ctx.fillRect(R - 2, -4, 6, 8);
  ctx.fillRect(R + 4, -2, 4, 4);

  // Eye
  ctx.fillStyle = BIRD_EYE;
  ctx.fillRect(R * 0.4, -R * 0.5, 4, 4);

  ctx.restore();
}

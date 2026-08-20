import {
  BIRD_RADIUS,
  FEATHER_LIFE,
  FLAP_FREQUENCY,
  MAX_FALL_TILT,
  PLAY_BOTTOM,
  PLAY_TOP,
  WING_FLAP_AMPLITUDE,
  WORLD_HEIGHT,
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

export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: View,
  scrollOffset: number,
): void {
  const { scale, offsetX, offsetY, worldWidth, cssWidth, cssHeight } = view;

  // Clear the full canvas.
  ctx.fillStyle = "#0b1020";
  ctx.fillRect(0, 0, cssWidth, cssHeight);

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  drawBackground(ctx, scrollOffset, worldWidth);
  drawObstacles(ctx, state);
  drawFeathers(ctx, state);
  drawBird(ctx, state);

  ctx.restore();
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  scrollOffset: number,
  worldWidth: number,
): void {
  const sky = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
  sky.addColorStop(0, "#1b2a4a");
  sky.addColorStop(1, "#0f1626");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, worldWidth, WORLD_HEIGHT);

  // Parallax star/dot field for a sense of motion.
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  const spacing = 90;
  const drift = scrollOffset * 0.3;
  for (let layer = 0; layer < 2; layer++) {
    const size = layer === 0 ? 2 : 1.4;
    const off = (drift * (layer === 0 ? 1 : 0.6)) % spacing;
    for (let x = -off; x < worldWidth; x += spacing) {
      for (let y = 30 + layer * 24; y < WORLD_HEIGHT; y += spacing) {
        ctx.fillRect(x, y, size, size);
      }
    }
  }
}

function drawObstacles(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const o of state.obstacles) {
    const r = obstacleRect(o);
    const grad = ctx.createLinearGradient(r.x, 0, r.x + r.w, 0);
    grad.addColorStop(0, "#3ddc84");
    grad.addColorStop(1, "#2bb673");
    ctx.fillStyle = grad;
    roundRect(ctx, r.x, r.y, r.w, r.h, 6);
    ctx.fill();

    // Cap the open end of the bar for a "pipe" look.
    ctx.fillStyle = "#1f8f5a";
    const capH = 10;
    if (o.anchor === "top") {
      roundRect(ctx, r.x - 3, r.y + r.h - capH, r.w + 6, capH, 4);
    } else {
      roundRect(ctx, r.x - 3, r.y, r.w + 6, capH, 4);
    }
    ctx.fill();
  }
  void PLAY_TOP;
  void PLAY_BOTTOM;
}

function drawFeathers(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const f of state.feathers) {
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.rot);
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life / FEATHER_LIFE));
    // A small teardrop feather in the bird's palette.
    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.ellipse(0, 0, 5.5, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f4a63b";
    ctx.beginPath();
    ctx.ellipse(-1.5, 0, 2.6, 1.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawBird(ctx: CanvasRenderingContext2D, state: GameState): void {
  const { x, y, vy, flapPhase, moving } = state.bird;

  ctx.save();
  ctx.translate(x, y);

  // Nose down as the bird falls during the death animation (vy > 0). During
  // normal play vy is small so the tilt is negligible.
  const tilt = Math.max(-MAX_FALL_TILT, Math.min(MAX_FALL_TILT, vy / 900));
  ctx.rotate(tilt);

  // Wing: flaps (swings up and down) while the bird is moving; rests otherwise.
  const flap = moving
    ? Math.sin(flapPhase * FLAP_FREQUENCY * Math.PI * 2) * WING_FLAP_AMPLITUDE
    : 0;

  // Body
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // Wing (rotated about the bird's back to swing like a flap)
  ctx.save();
  ctx.translate(-3, 1);
  ctx.rotate(flap);
  ctx.fillStyle = "#f4a63b";
  ctx.beginPath();
  ctx.ellipse(-2, 0, BIRD_RADIUS * 0.62, BIRD_RADIUS * 0.4, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Beak
  ctx.fillStyle = "#ef8354";
  ctx.beginPath();
  ctx.moveTo(BIRD_RADIUS - 2, -3);
  ctx.lineTo(BIRD_RADIUS + 8, 0);
  ctx.lineTo(BIRD_RADIUS - 2, 3);
  ctx.closePath();
  ctx.fill();

  // Eye
  ctx.fillStyle = "#20242e";
  ctx.beginPath();
  ctx.arc(BIRD_RADIUS * 0.35, -BIRD_RADIUS * 0.35, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

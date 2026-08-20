import {
  BIRD_X_FRACTION,
  DEFAULT_BIRD_COLOR,
  BIRD_COLORS,
  FIXED_DT,
  WORLD_HEIGHT,
  WORLD_PER_PIXEL,
} from "./constants";
import { scrollSpeedFor } from "./difficulty";
import { computeView, render, type View } from "./render";
import { simulateStep } from "./simulate";
import { createInitialState, type GameState } from "./state";

export interface EngineCallbacks {
  onScore: (score: number) => void;
  onGameOver: (score: number) => void;
}

// The engine reads input as a single "thrust" boolean: held = fly up, released
// = fall under gravity.
export interface InputSource {
  thrust: () => boolean;
}

// Drives the simulation with a fixed-timestep accumulator so gameplay is
// frame-rate independent, and renders each animation frame.
export class Engine {
  private ctx: CanvasRenderingContext2D;
  // Low-resolution offscreen buffer for the pixel-art upscale.
  private off: HTMLCanvasElement;
  private offCtx: CanvasRenderingContext2D;
  private state: GameState;
  private view: View;
  private rafId = 0;
  private running = false;
  private lastTime = 0;
  private accumulator = 0;
  private scrollOffset = 0;
  private reportedScore = -1;
  private birdColor: string = BIRD_COLORS[DEFAULT_BIRD_COLOR];

  constructor(
    private canvas: HTMLCanvasElement,
    private input: InputSource,
    private callbacks: EngineCallbacks,
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    this.ctx = ctx;
    this.off = document.createElement("canvas");
    const offCtx = this.off.getContext("2d");
    if (!offCtx) throw new Error("2D offscreen context unavailable");
    this.offCtx = offCtx;
    this.state = createInitialState();
    this.view = computeView(1, 1);
    this.resize();
  }

  // Match the canvas backing store to its CSS size and the device pixel ratio,
  // and refresh the derived world width so the game keeps filling the screen.
  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = Math.max(1, rect.width);
    const cssH = Math.max(1, rect.height);
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.view = computeView(cssW, cssH);
    // Size the low-res buffer: fixed ~150px tall, width follows the aspect.
    this.off.width = Math.max(1, Math.round(this.view.worldWidth / WORLD_PER_PIXEL));
    this.off.height = Math.max(1, Math.round(WORLD_HEIGHT / WORLD_PER_PIXEL));
    // Keep the world width and the bird's fixed x in sync with the new size.
    this.state.worldWidth = this.view.worldWidth;
    this.state.bird.x = this.view.worldWidth * BIRD_X_FRACTION;
    // Redraw immediately so a resize while paused still looks correct.
    render(this.ctx, this.off, this.offCtx, this.state, this.view, this.scrollOffset, this.birdColor);
  }

  start(): void {
    this.state = createInitialState(this.view.worldWidth);
    this.scrollOffset = 0;
    this.accumulator = 0;
    this.reportedScore = -1;
    this.lastTime = performance.now();
    this.running = true;
    this.callbacks.onScore(0);
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  // Set the bird's plain body color (hex). Redraws immediately when idle so the
  // menu preview updates.
  setBirdColor(color: string): void {
    this.birdColor = color;
    if (!this.running) {
      render(this.ctx, this.off, this.offCtx, this.state, this.view, this.scrollOffset, this.birdColor);
    }
  }

  private frame = (now: number): void => {
    if (!this.running) return;

    let delta = (now - this.lastTime) / 1000;
    this.lastTime = now;
    // Guard against huge jumps (tab switch, breakpoints).
    if (delta > 0.25) delta = 0.25;
    this.accumulator += delta;

    while (this.accumulator >= FIXED_DT) {
      this.step(FIXED_DT);
      this.accumulator -= FIXED_DT;
      // The crash animation (status "dying") keeps running; stop only once the
      // run is fully over.
      if (this.state.status === "dead") break;
    }

    render(this.ctx, this.off, this.offCtx, this.state, this.view, this.scrollOffset, this.birdColor);

    const shownScore = Math.floor(this.state.score);
    if (shownScore !== this.reportedScore) {
      this.reportedScore = shownScore;
      this.callbacks.onScore(shownScore);
    }

    if (this.state.status === "dead") {
      this.running = false;
      this.callbacks.onGameOver(Math.floor(this.state.score));
      return;
    }

    this.rafId = requestAnimationFrame(this.frame);
  };

  private step(dt: number): void {
    const s = this.state;
    // Advance the parallax backdrop with the world, but freeze it once the bird
    // is no longer alive so the death scene holds still.
    if (s.status === "alive") {
      this.scrollOffset += scrollSpeedFor(s.score, s.worldWidth) * dt;
    }
    simulateStep(s, this.input.thrust(), dt);
  }
}

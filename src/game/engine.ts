import { BIRD_X_FRACTION, FIXED_DT } from "./constants";
import { scrollSpeedFor } from "./difficulty";
import { pointerIntent } from "./pointer";
import { computeView, render, type View } from "./render";
import { simulateStep } from "./simulate";
import { createInitialState, type GameState, type Intent } from "./state";

export interface EngineCallbacks {
  onScore: (score: number) => void;
  onGameOver: (score: number) => void;
}

// The engine reads input abstractly: a keyboard intent, plus an optional active
// touch position (client Y) that steers the bird toward the finger.
export interface InputSource {
  keyboardIntent: () => Intent;
  pointerClientY: () => number | null;
}

// Drives the simulation with a fixed-timestep accumulator so gameplay is
// frame-rate independent, and renders each animation frame.
export class Engine {
  private ctx: CanvasRenderingContext2D;
  private state: GameState;
  private view: View;
  private rafId = 0;
  private running = false;
  private lastTime = 0;
  private accumulator = 0;
  private scrollOffset = 0;
  private reportedScore = -1;
  private canvasClientTop = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private input: InputSource,
    private callbacks: EngineCallbacks,
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    this.ctx = ctx;
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
    this.canvasClientTop = rect.top;
    this.view = computeView(cssW, cssH);
    // Keep the world width and the bird's fixed x in sync with the new size.
    this.state.worldWidth = this.view.worldWidth;
    this.state.bird.x = this.view.worldWidth * BIRD_X_FRACTION;
    // Redraw immediately so a resize while paused still looks correct.
    render(this.ctx, this.state, this.view, this.scrollOffset);
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

    render(this.ctx, this.state, this.view, this.scrollOffset);

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
    simulateStep(s, this.resolveIntent(), dt);
  }

  // Keyboard takes priority when a key is held; otherwise an active touch
  // steers the bird toward the finger: above the bird → up, below → down,
  // level with it (within a deadzone) → hold.
  private resolveIntent(): Intent {
    const kb = this.input.keyboardIntent();
    if (kb !== 0) return kb;

    const pointerY = this.input.pointerClientY();
    if (pointerY === null) return 0;

    return pointerIntent(
      pointerY,
      this.canvasClientTop,
      this.view,
      this.state.bird.y,
    );
  }
}

import { useEffect, useRef } from "react";
import { Engine } from "../game/engine";
import { useInput } from "../input/useInput";

interface GameCanvasProps {
  running: boolean;
  onScore: (score: number) => void;
  onGameOver: (score: number) => void;
}

// Owns the <canvas>, the game Engine, and the input wiring. The engine runs
// while `running` is true; it stops itself on game over (via onGameOver).
export function GameCanvas({ running, onScore, onGameOver }: GameCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);

  const input = useInput(wrapRef, running);

  // Keep the latest callbacks without recreating the engine.
  const onScoreRef = useRef(onScore);
  const onGameOverRef = useRef(onGameOver);
  onScoreRef.current = onScore;
  onGameOverRef.current = onGameOver;

  // Create the engine once and keep it sized to the container.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const engine = new Engine(canvas, input, {
      onScore: (s) => onScoreRef.current(s),
      onGameOver: (s) => onGameOverRef.current(s),
    });
    engineRef.current = engine;

    const ro = new ResizeObserver(() => engine.resize());
    ro.observe(wrap);

    return () => {
      ro.disconnect();
      engine.stop();
      engineRef.current = null;
    };
  }, [input]);

  // Start/stop the run in response to the `running` flag.
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (running) {
      engine.start();
    } else {
      engine.stop();
    }
  }, [running]);

  return (
    <div ref={wrapRef} className="canvas-wrap">
      <canvas ref={canvasRef} className="game-canvas" />
    </div>
  );
}

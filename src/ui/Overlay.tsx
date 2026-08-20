import { useState } from "react";
import { BIRD_COLORS, type BirdColorName } from "../game/constants";

type Phase = "menu" | "playing" | "gameover";

interface OverlayProps {
  phase: Phase;
  score: number;
  highScore: number;
  isNewBest: boolean;
  birdColor: BirdColorName;
  onSelectColor: (name: BirdColorName) => void;
  onStart: () => void;
}

const COLOR_NAMES = Object.keys(BIRD_COLORS) as BirdColorName[];

// True when the primary input is touch (phones/tablets), so we can show the
// matching control instructions.
function detectTouch(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia?.("(hover: none) and (pointer: coarse)");
  if (mq && mq.matches) return true;
  return (navigator.maxTouchPoints ?? 0) > 0;
}

// A small pixel bird preview in the given body color (matches the in-game bird:
// plain body, white wing, orange beak, dark eye).
function BirdIcon({ color }: { color: string }) {
  return (
    <svg
      className="bird-icon"
      viewBox="0 0 24 24"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect x="4" y="5" width="13" height="13" fill={color} />
      <rect x="5" y="12" width="8" height="4" fill="#ffffff" />
      <rect x="17" y="9" width="4" height="3" fill="#ff9e3d" />
      <rect x="12" y="8" width="2.5" height="2.5" fill="#141018" />
    </svg>
  );
}

export function Overlay({
  phase,
  score,
  highScore,
  isNewBest,
  birdColor,
  onSelectColor,
  onStart,
}: OverlayProps) {
  const [isTouch] = useState(detectTouch);

  if (phase === "playing") return null;

  return (
    <div className="overlay">
      <div className="panel">
        <h1 className="title">Fly Bird Fly!</h1>

        {phase === "gameover" ? (
          <>
            <p className="result">
              {isNewBest ? "New best!" : "Nice run!"}
            </p>
            <div className="scoreline">
              <span>Score</span>
              <strong>{score}</strong>
            </div>
            <div className="scoreline">
              <span>Best</span>
              <strong>{highScore}</strong>
            </div>
          </>
        ) : (
          <p className="tagline">
            Hold to fly up, release to fall. Don't hit the cacti or the edges!
          </p>
        )}

        <div className="color-picker">
          <span className="color-picker-label">Bird color</span>
          <div className="color-swatches">
            {COLOR_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                className={
                  "swatch" + (name === birdColor ? " swatch--active" : "")
                }
                aria-label={name}
                aria-pressed={name === birdColor}
                onClick={() => onSelectColor(name)}
              >
                <BirdIcon color={BIRD_COLORS[name]} />
              </button>
            ))}
          </div>
        </div>

        <button className="play-btn" onClick={onStart}>
          {phase === "gameover" ? "Play again" : "Start"}
        </button>

        <div className="controls">
          {isTouch ? (
            <p>Tap &amp; hold the screen to fly up. Let go to fall.</p>
          ) : (
            <p>
              Hold <kbd>Space</kbd> or the mouse button to fly up. Let go to
              fall.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

type Phase = "menu" | "playing" | "gameover";

interface OverlayProps {
  phase: Phase;
  score: number;
  highScore: number;
  isNewBest: boolean;
  onStart: () => void;
}

export function Overlay({
  phase,
  score,
  highScore,
  isNewBest,
  onStart,
}: OverlayProps) {
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
            Thread the bird through the gaps. It never stops.
          </p>
        )}

        <button className="play-btn" onClick={onStart}>
          {phase === "gameover" ? "Play again" : "Start"}
        </button>

        <div className="controls">
          <p>
            <strong>Desktop:</strong> hold <kbd>↑</kbd> / <kbd>↓</kbd> arrows
          </p>
          <p>
            <strong>Mobile:</strong> hold above the bird to rise, below to dive
          </p>
        </div>
      </div>
    </div>
  );
}

interface HudProps {
  score: number;
  highScore: number;
}

export function Hud({ score, highScore }: HudProps) {
  return (
    <div className="hud" aria-hidden="true">
      <div className="hud-item">
        <span className="hud-label">SCORE</span>
        <span className="hud-value">{score}</span>
      </div>
      <div className="hud-item hud-item--right">
        <span className="hud-label">BEST</span>
        <span className="hud-value">{highScore}</span>
      </div>
    </div>
  );
}

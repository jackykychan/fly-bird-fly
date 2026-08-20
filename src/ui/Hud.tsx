interface HudProps {
  score: number;
  highScore: number;
}

export function Hud({ score, highScore }: HudProps) {
  // Once the live score passes a real previous best, celebrate with a pulse.
  const isRecord = highScore > 0 && score > highScore;

  return (
    <div className="hud" aria-hidden="true">
      <div className="hud-item">
        <span className="hud-label">SCORE</span>
        <span
          className={"hud-value" + (isRecord ? " hud-value--record" : "")}
        >
          {score}
        </span>
      </div>
      <div className="hud-item hud-item--right">
        <span className="hud-label">BEST</span>
        <span className="hud-value">{highScore}</span>
      </div>
    </div>
  );
}

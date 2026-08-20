import { useCallback, useState } from "react";
import { GameCanvas } from "./ui/GameCanvas";
import { Hud } from "./ui/Hud";
import { Overlay } from "./ui/Overlay";
import { loadHighScore, saveHighScore } from "./storage";

type Phase = "menu" | "playing" | "gameover";

export default function App() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => loadHighScore());
  const [isNewBest, setIsNewBest] = useState(false);

  const handleStart = useCallback(() => {
    setScore(0);
    setIsNewBest(false);
    setPhase("playing");
  }, []);

  const handleGameOver = useCallback(
    (finalScore: number) => {
      setScore(finalScore);
      setHighScore((prev) => {
        if (finalScore > prev) {
          saveHighScore(finalScore);
          setIsNewBest(true);
          return finalScore;
        }
        return prev;
      });
      setPhase("gameover");
    },
    [],
  );

  return (
    <div className="app">
      <GameCanvas
        running={phase === "playing"}
        onScore={setScore}
        onGameOver={handleGameOver}
      />
      <Hud score={score} highScore={highScore} />
      <Overlay
        phase={phase}
        score={score}
        highScore={highScore}
        isNewBest={isNewBest}
        onStart={handleStart}
      />
    </div>
  );
}

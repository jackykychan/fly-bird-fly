import { useEffect, useRef } from "react";
import type { InputSource } from "../game/engine";
import type { Intent } from "../game/state";

// Wires up keyboard (↑/↓, W/S) and touch input and exposes a stable
// InputSource for the engine. Touch reports the active finger's client Y; the
// engine turns that into "move toward the finger" relative to the bird. Holding
// above the bird moves it up, below moves it down, level with it does nothing.
// `enabled` gates whether input is read (only during active play).
export function useInput(
  target: React.RefObject<HTMLElement>,
  enabled: boolean,
): InputSource {
  const keyboardIntentRef = useRef<Intent>(0);
  const keysRef = useRef({ up: false, down: false });
  const pointerYRef = useRef<number | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  // A stable source object so consumers (the engine effect) don't re-run and
  // recreate the engine on every render.
  const sourceRef = useRef<InputSource>();
  if (!sourceRef.current) {
    sourceRef.current = {
      keyboardIntent: () => keyboardIntentRef.current,
      pointerClientY: () => pointerYRef.current,
    };
  }

  // Reset any latched input whenever play is (dis)enabled.
  useEffect(() => {
    keyboardIntentRef.current = 0;
    keysRef.current = { up: false, down: false };
    pointerYRef.current = null;
  }, [enabled]);

  useEffect(() => {
    const el = target.current;
    if (!el) return;

    const recompute = () => {
      const { up, down } = keysRef.current;
      keyboardIntentRef.current = up === down ? 0 : up ? -1 : 1;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!enabledRef.current) return;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        keysRef.current.up = true;
        e.preventDefault();
        recompute();
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        keysRef.current.down = true;
        e.preventDefault();
        recompute();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        keysRef.current.up = false;
        recompute();
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        keysRef.current.down = false;
        recompute();
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (!enabledRef.current) return;
      pointerYRef.current = e.touches[0].clientY;
      e.preventDefault();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!enabledRef.current) return;
      pointerYRef.current = e.touches[0].clientY;
      e.preventDefault();
    };

    const onTouchEnd = (e: TouchEvent) => {
      pointerYRef.current = null;
      e.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: false });
    el.addEventListener("touchcancel", onTouchEnd, { passive: false });

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [target]);

  return sourceRef.current;
}

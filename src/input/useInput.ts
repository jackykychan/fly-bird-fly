import { useEffect, useRef } from "react";
import type { InputSource } from "../game/engine";

// Hold-to-fly input. The bird thrusts up while any control is held and falls
// under gravity otherwise:
//   - Desktop: hold Space (or ↑ / W), or hold the mouse button on the play area.
//   - Mobile: touch and hold anywhere on the play area.
// Exposes a stable InputSource so the engine effect doesn't re-run each render.
// `enabled` gates input to active play only.
export function useInput(
  target: React.RefObject<HTMLElement>,
  enabled: boolean,
): InputSource {
  const keyRef = useRef(false);
  const mouseRef = useRef(false);
  const touchRef = useRef(false);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  // Stable source object so the engine isn't recreated on every render.
  const sourceRef = useRef<InputSource>();
  if (!sourceRef.current) {
    sourceRef.current = {
      thrust: () => keyRef.current || mouseRef.current || touchRef.current,
    };
  }

  // Release any held input whenever play is (dis)enabled.
  useEffect(() => {
    keyRef.current = false;
    mouseRef.current = false;
    touchRef.current = false;
  }, [enabled]);

  useEffect(() => {
    const el = target.current;
    if (!el) return;

    const isThrustKey = (e: KeyboardEvent) =>
      e.key === " " ||
      e.key === "Spacebar" ||
      e.key === "ArrowUp" ||
      e.key === "w" ||
      e.key === "W";

    const onKeyDown = (e: KeyboardEvent) => {
      if (!enabledRef.current || !isThrustKey(e)) return;
      keyRef.current = true;
      e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (!isThrustKey(e)) return;
      keyRef.current = false;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (!enabledRef.current || e.button !== 0) return;
      mouseRef.current = true;
      e.preventDefault();
    };
    const onMouseUp = () => {
      mouseRef.current = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (!enabledRef.current) return;
      touchRef.current = true;
      e.preventDefault();
    };
    const onTouchEnd = (e: TouchEvent) => {
      touchRef.current = false;
      e.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: false });
    el.addEventListener("touchcancel", onTouchEnd, { passive: false });

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [target]);

  return sourceRef.current;
}

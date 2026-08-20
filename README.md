# Fly Bird Fly!

A small browser game in the spirit of the Chrome offline dino runner, reskinned
as a bird. The bird holds a fixed spot in the middle of the screen while the
world scrolls right-to-left; you move it **up/down** to thread through gaps
between obstacles that jut from the top and bottom edges. It never stops, and it
speeds up the longer you survive. The bird flaps as it moves, and on a crash it
sheds feathers and tumbles off the screen before the game-over screen appears.

Built with **React + TypeScript + Vite**. The game loop and physics live in a
framework-agnostic TypeScript core (`src/game/`) rendered to a `<canvas>`;
React owns only the shell (menu, HUD, game-over screen).

## Controls

- **Desktop:** hold the **↑ / ↓** arrow keys (or **W / S**). The bird moves
  while a key is held and holds position otherwise — direct control, no gravity.
- **Mobile:** touch and hold **above** the bird to rise or **below** it to
  dive — the bird moves toward your finger and holds when level with it. The
  game fills the whole screen at any size or aspect ratio.

## Scoring

- Score climbs the longer you survive (~10 points/second).
- Your best score is saved in `localStorage` and shown as **BEST**.
- Difficulty ramps with your score: faster scrolling, tighter gaps, and more
  frequent obstacles.

## Develop

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run test     # run the headless gameplay/unit tests (Vitest)
npm run build    # type-check + production build to dist/
npm run preview  # serve the production build
```

## Deploy

Live at **https://jackykychan.github.io/simple-bird-game/**. Every push to
`main` triggers the GitHub Actions workflow in `.github/workflows/deploy.yml`,
which builds and publishes `dist/` to GitHub Pages. The Vite `base` is set to
`/simple-bird-game/` for production builds (see [vite.config.ts](vite.config.ts)).

## Layout

```
src/
  main.tsx            React entry
  App.tsx             screen state machine: menu → playing → gameover
  game/
    constants.ts      tunable gameplay values
    state.ts          GameState + initial state
    bird.ts           direct vertical control + clamping
    obstacles.ts      spawn / scroll / recycle obstacle pairs
    collision.ts      circle-vs-rect collision
    difficulty.ts     speed / gap / spawn-rate as f(score)
    simulate.ts       one fixed-timestep update (shared by engine + tests)
    engine.ts         rAF loop, fixed-timestep accumulator, canvas sizing
    render.ts         draw background, obstacles, bird
    *.test.ts         Vitest coverage incl. a full headless run
  input/useInput.ts   keyboard + touch → intent (-1 / 0 / +1)
  ui/                 GameCanvas, Hud, Overlay
  storage.ts          high-score persistence
```

## Tuning

All gameplay feel — speeds, gap sizes, obstacle dimensions, difficulty ramp — is
concentrated in [`src/game/constants.ts`](src/game/constants.ts).

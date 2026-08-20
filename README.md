# Fly Bird Fly!

A small browser game in the spirit of the Chrome offline dino runner, reskinned
as a bird flying across a pixel-art desert. The bird holds a fixed spot on the
left while the world scrolls right-to-left; **hold to fly up, release to fall**
and thread the gaps between cacti. It never stops, and it speeds up the longer
you survive. The bird flaps as it climbs, and on a crash it sheds feathers and
tumbles off the screen before the game-over screen appears.

Built with **React + TypeScript + Vite**. The game loop and physics live in a
framework-agnostic TypeScript core (`src/game/`) rendered to a `<canvas>`;
React owns only the shell (menu, HUD, game-over screen).

## How to play

- **Hold to fly up, release to fall.** Gravity pulls the bird down by default.
  - **Desktop:** hold **Space** (or **↑ / W**), or hold the **mouse button**.
  - **Mobile:** **tap and hold** anywhere on the screen.
- Avoid the **cacti** and don't hit the **top or bottom edge** — either ends the
  run.
- Pick your **bird color** (yellow / blue / green / red) on the menu; the choice
  is remembered.
- The game fills the whole screen at any size or aspect ratio, and the
  on-screen instructions adapt to touch vs. desktop devices.

## Scoring

- Scoring starts **after you pass your first cactus**, then climbs the longer
  you survive.
- The current score shows plain white while it's at or below your best, and
  turns **gold and larger** once it beats your best.
- Your best score is saved in `localStorage` and shown as **BEST**.
- Difficulty ramps with your score: faster scrolling, tighter gaps, and more
  frequent cacti (spacing is widened on narrow/portrait screens).

## Look & feel

The whole scene is rendered into a small low-resolution offscreen buffer and
upscaled with nearest-neighbor sampling for a crisp **pixel-art** look — the
daytime desert (sky bands, sun, clouds, dunes, sand), the cacti, the bird, and
the feather burst are all drawn as blocks. The menu/HUD chrome uses a matching
retro style while keeping text legible.

## Develop

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run test     # run the headless gameplay/unit tests (Vitest)
npm run build    # type-check + production build to dist/
npm run preview  # serve the production build
```

## Deploy

Live at **https://jackykychan.github.io/fly-bird-fly/**. Every push to
`main` triggers the GitHub Actions workflow in `.github/workflows/deploy.yml`,
which builds and publishes `dist/` to GitHub Pages. The Vite `base` is set to
`/fly-bird-fly/` for production builds to match the Pages repo path (see
[vite.config.ts](vite.config.ts)).

## Layout

```
src/
  main.tsx            React entry
  App.tsx             screen state machine: menu → playing → gameover; bird color
  game/
    constants.ts      tunable gameplay values + bird colors
    state.ts          GameState + initial state
    bird.ts           hold-to-fly physics (gravity + thrust)
    obstacles.ts      spawn / scroll / recycle cactus pairs
    collision.ts      circle-vs-rect collision; edge-to-gap obstacle rects
    difficulty.ts     speed / gap / spawn-rate as f(score), aspect-aware
    simulate.ts       one fixed-timestep update (shared by engine + tests)
    engine.ts         rAF loop, fixed-timestep accumulator, canvas sizing, buffer
    render.ts         pixel-art draw: desert, cacti, bird, feathers
    *.test.ts         Vitest coverage incl. headless physics/scoring runs
  input/useInput.ts   keyboard + mouse + touch → thrust (hold-to-fly)
  ui/                 GameCanvas, Hud, Overlay (color picker, device hints)
  storage.ts          high-score + bird-color persistence
```

## Tuning

All gameplay feel — flight physics, scroll speeds, gap sizes, cactus
dimensions, difficulty ramp, and the pixel size — is concentrated in
[`src/game/constants.ts`](src/game/constants.ts).

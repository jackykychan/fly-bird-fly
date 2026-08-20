// All tunable gameplay values live here. Units are in "world" pixels, which are
// mapped to the actual canvas size at render time so the game scales to any
// viewport while keeping consistent physics.

// The world has a fixed logical HEIGHT (so vertical difficulty — gap sizes,
// bird speed — is identical on every device) and a WIDTH derived from the
// viewport at runtime, so the game always fills the whole screen with no
// letterboxing. REFERENCE_WIDTH is only used to keep scroll speed (and thus how
// long obstacles take to reach the bird) consistent across aspect ratios.
export const WORLD_HEIGHT = 450;
export const REFERENCE_WIDTH = 800;

// Bird
export const BIRD_X_FRACTION = 0.28; // horizontal position as a fraction of width
export const BIRD_RADIUS = 14;
export const BIRD_VERTICAL_SPEED = 340; // px/sec while holding up/down
// Vertical deadzone (world px) around a touch target within which the bird
// holds — a tap level with the bird does nothing.
export const POINTER_DEADZONE = 10;

// Play-area vertical margins (bird clamps inside these; also the ceiling/floor)
export const PLAY_TOP = 8;
export const PLAY_BOTTOM = WORLD_HEIGHT - 8;

// Obstacles
export const OBSTACLE_MIN_WIDTH = 34;
export const OBSTACLE_MAX_WIDTH = 64;
// Vertical gap the bird must pass through (shrinks with difficulty).
export const GAP_START = 190;
export const GAP_MIN = 120;
// Horizontal spacing between obstacle spawns (shrinks with difficulty).
export const SPAWN_INTERVAL_START = 1.55; // seconds
export const SPAWN_INTERVAL_MIN = 0.85;
// On narrow (portrait) screens obstacles would otherwise bunch together, so the
// spacing between them is stretched by up to this factor as the screen narrows.
export const PORTRAIT_SPACING_MAX = 2.2;

// Scrolling
export const SCROLL_SPEED_START = 190; // px/sec
export const SCROLL_SPEED_MAX = 430;

// Difficulty ramp: how quickly things get harder as score climbs.
// Score is measured in points where ~10 points ≈ 1 second at start speed.
export const RAMP_SCORE = 900; // score at which difficulty is near its max

// Wing flapping (visual). The wing oscillates while the bird is moving.
export const FLAP_FREQUENCY = 9; // flaps per second
export const WING_FLAP_AMPLITUDE = 0.9; // radians of wing swing

// Death sequence: on a crash the bird hops, then falls off-screen under gravity
// while feathers burst outward.
export const DEATH_POP_VELOCITY = -170; // small upward hop (world px/s)
export const DEATH_GRAVITY = 1000; // world px/s^2 pulling the bird down
export const MAX_FALL_TILT = 1.1; // radians the bird noses down while falling

export const FEATHER_COUNT = 11;
export const FEATHER_GRAVITY = 430; // world px/s^2
export const FEATHER_LIFE = 2.2; // seconds before a feather fully fades

// Scoring
export const SCORE_PER_SECOND = 10;

// Fixed-timestep simulation step (seconds).
export const FIXED_DT = 1 / 120;

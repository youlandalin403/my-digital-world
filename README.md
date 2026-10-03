# My Digital World — Entrance, World Map & Shared Projects

A procedural, guided forest-to-sanctuary entrance followed by an interactive Public World Map. Built with Vite, React, Three.js, React Three Fiber, and drei. Observatory Daily adds Supabase authentication and persistent daily records; project content remains Markdown-based.

## Run

```sh
npm install
npm run dev
```

Open the URL printed by Vite. `npm run build` produces `dist/`; `npm run preview` serves that production build. Refresh to replay the journey.

## Experience

Loading → forest approach → visual pause → Welcome / ENTER → approach and fade → Public World Map. Timing follows the current values in `src/config/worldConfig.js`.

Choose a destination using the top navigation, a map label, or the building itself. The camera focuses that place. Gallery and Laboratory ENTER open their project views; Observatory ENTER opens Daily. Other public areas retain their placeholders. Locked/protected areas show their access status. MAP or Escape restores the overview. Run content, map, date and database-policy tests with `npm test`.

Observatory requires the environment variables and one-time SQL migration documented in [OBSERVATORY_SETUP.md](OBSERVATORY_SETUP.md). The migration is supplied but has not been applied to the remote project. Open `/observatory` directly for the minimal Daily interface. `npm run test:browser` runs its mocked-API browser checks.

All public project content lives in `content/projects/*.md`, with assets in `public/projects/<slug>/`. `idea` appears in Idea Garden's public preview, `now` in Laboratory, and `completed` in Gallery. Change the stage in the same file to move an item between views. `/projects/:slug` is the stable detail URL; old `/gallery/:slug` links remain compatible. Keep real private ideas outside this public application: all imported Markdown is bundled, and the garden's map lock is not access control. See `content/PROJECT_AUTHORING.md` and `CREATION_LIFECYCLE_REPORT.md`. Direct production URLs require an SPA fallback to `index.html`.

The camera follows paired Catmull–Rom curves for position and look direction. Repeated trees, leaves, ferns, ivy, grass, and rocks use seeded generation and instancing. The landmark is an approximately 22-metre-tall ivory portal, with recessed columns, seven shallow steps, open side colonnades, and trailing vegetation. The trees seen through the arch are a backdrop, not an implemented interior.

Reduced-motion preferences skip the moving approach and disable plant sway. Keyboard users can tab through navigation and ENTER. Rendering stops behind map placeholders. The scene reports a useful fallback if rendering fails or its WebGL context is lost.

## Structure

```text
src/
  App.jsx                   entrance state and accessibility preference
  config/worldConfig.js     main visual controls
  world/
    Experience.jsx          canvas, readiness, composition
    CameraRig.jsx           guided journey and entry transition
    Building.jsx            architectural massing and arch
    Environment.jsx         daylight, shadows, ground, haze
    Forest.jsx              tree positions, branching, canopy
    GroundVegetation.jsx    grass, ferns, step growth, trailing ivy
    Instances.jsx           shared instanced rendering
    procedural.js           seeded random, geometry, textures, wind
    Diagnostics.jsx         development-only render measurements
  ui/                       loading, welcome, error fallback
  styles.css                restrained HTML overlay
```

## Main adjustments

Edit `src/config/worldConfig.js`:

- `camera.duration`, `pause`, `enterDuration`: pacing in seconds.
- `camera.path`, `targets`: matching position and look-at spline landmarks.
- `camera.fov`: desktop framing.
- `building.scale`: whole landmark and attached planting scale.
- `building.entranceWidth`: central opening width.
- `vegetation.trees`, `leavesPerTree`, `grass`: density budgets.
- `vegetation.seed`: reproducible tree placement; changes require a reload.
- `vegetation.wind`: small leaf and grass movement.
- `lighting.sun`, `intensity`, `ambient`: light direction and balance.
- `fog.near`, `far`: depth and haze.
- `colors`: ivory stone, subdued foliage, soil, sky.
- `performance.dpr`, `shadowSize`: resolution/cost tradeoff.

Geometry-level proportions and local plant composition live with the relevant components. Camera endpoints do not automatically reframe when building scale changes; review both together.

## Scope

The completed Entrance, Public World Map, and shared project content layer. Gallery and Laboratory derive their lists from one collection and use one Markdown detail renderer. Observatory adds only Daily records, tasks, reflection, date navigation, visibility, owner login and persistence. No Monthly, Yearly, Birthday, analytics, streaks, AI summaries, building interiors, invitations, CMS, or final Observatory visual design.

See `IMPLEMENTATION_REPORT.md` for the historical entrance handoff, and `WORLD_MAP_REPORT.md` for the current map stage.

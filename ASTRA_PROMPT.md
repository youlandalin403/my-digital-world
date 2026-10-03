# My Digital World — Astra Handoff Prompt

You are working on a project called **My Digital World**.

Your task is **not** to build the entire website.

Your task is to implement and refine **MVP 0.1: Entrance Prototype** only.

Before writing any code, read the following project documents carefully:

1. `PROJECT_BRIEF.md`
2. `VISUAL_DIRECTION.md`
3. `MVP_01_SPEC.md`

Treat these documents as the source of truth.

If there is any conflict between them, use the priority order:

**MVP_01_SPEC.md > VISUAL_DIRECTION.md > PROJECT_BRIEF.md**

The MVP specification defines the current implementation scope.

---

# 1. Understand the Project First

Before implementation, summarize internally:

- what My Digital World is
- what emotional experience the entrance should create
- what must be included in MVP 0.1
- what must explicitly NOT be built yet
- which visual qualities matter most
- which technical constraints matter most

Do not immediately start generating a full website.

---

# 2. Reference Research

Before implementation, inspect the reference projects described in the project documents when useful.

Important references include:

## The Growing Valley

Use it primarily as an experiential reference for:

- pacing
- restraint
- nature-first presentation
- entrance ritual
- gradual reveal

Do not reproduce its exact:

- scene
- layout
- text
- vegetation
- camera path
- visual assets

---

## Kage

Study it for:

- procedural Three.js architecture
- cinematic camera movement
- environmental storytelling
- restrained atmosphere
- HTML + WebGL layering
- AI-assisted scene construction patterns

Do not copy code that is not licensed for reuse.

Study architecture and ideas only.

---

## Procedural React Three Fiber Portfolio / Village

Study it for:

- React Three Fiber project organization
- spline-driven camera movement
- procedural vegetation
- centralized configuration
- fog / environment configuration
- component separation

---

## Sublevel Studio

Study it for:

- interaction between immersive 3D and ordinary HTML content

Do not implement the later HTML content system yet.

---

# 3. Technology

Use:

- Vite
- React
- Three.js
- React Three Fiber
- `@react-three/drei`

Use additional dependencies only when they clearly reduce complexity.

Do not introduce a large framework or library unless necessary.

MVP 0.1 should remain understandable and maintainable.

---

# 4. Asset Strategy

Default to:

**code-first procedural 3D**

Do not require Blender.

Do not search for large collections of downloaded 3D assets simply to make the scene appear finished.

The visual strength should first come from:

- composition
- scale
- camera
- lighting
- vegetation placement
- atmosphere

Simple geometry is acceptable.

A strong composition made of simple geometry is better than a weak composition filled with detailed assets.

---

# 5. Build Order

Work in this order.

## Phase A — Project Setup

Create or verify a clean React + React Three Fiber project.

Confirm:

- dev server starts correctly
- Canvas renders
- resize works
- no major console errors

---

## Phase B — Greybox

Build only:

- ground
- camera path
- simple forest blockers
- simple white building massing

At this stage:

- no detailed plants
- no particles
- no fancy shaders
- no polish

Focus only on:

- composition
- building scale
- sight lines
- reveal timing

The building must not be fully visible at the beginning.

---

## Phase C — Camera Choreography

Implement a guided cinematic camera path.

Preferred approach:

- centralized spline / CatmullRomCurve3
- parameterized camera progress
- separate look-at targets when useful

The camera journey should roughly follow:

**forestStart → firstGlimpse → partialOcclusion → clearing → fullReveal**

Do not use:

- WASD
- FPS movement
- OrbitControls
- free exploration

for MVP 0.1.

---

## Phase D — Architecture Refinement

Refine the white building using simple procedural geometry.

Target qualities:

- monumental
- minimal
- sanctuary-like
- greenhouse-like
- slightly ruined
- partially reclaimed by vegetation

Focus on silhouette and scale.

Useful elements may include:

- tall columns
- huge entrance
- platforms
- steps
- large openings
- partial walls
- architectural voids

Do not over-detail.

---

## Phase E — Lighting and Atmosphere

Add:

- daylight
- directional sunlight
- restrained ambient light
- meaningful shadows
- subtle fog

Target:

**quiet cinematic daylight**

Avoid trying to solve the scene with post-processing.

---

## Phase F — Vegetation

Replace greybox vegetation gradually.

Add:

- trees
- ground vegetation
- foreground foliage
- grass
- architecture-adjacent vegetation

Optional:

- vines
- moss
- small flowers

Use instancing where appropriate.

Vegetation should not be uniformly scattered.

Use density changes to control composition.

Plants must interact spatially with the architecture.

Examples:

- growth beside columns
- grass through steps
- branches partially obscuring architecture
- vines crossing white surfaces

---

## Phase G — Subtle Motion

Add restrained motion:

- light grass sway
- small leaf movement
- minimal floating particles if helpful

Motion should make the environment feel alive without drawing attention to itself.

---

## Phase H — Interface

Only after the scene works visually, add:

**Welcome to Yunhan Lin's Digital World.**

and:

**ENTER**

Use an HTML overlay.

Keep typography and layout minimal.

Do not add navigation.

---

## Phase I — ENTER Interaction

When ENTER is clicked:

preferred behavior:

- camera begins moving gently toward the entrance
- scene fades out
- show a simple temporary ending state

For example:

**The world continues from here.**

Do not build the actual interior yet.

---

# 6. Visual Priority

When something looks wrong, debug in this order:

1. composition
2. camera
3. scale
4. lighting
5. vegetation
6. atmosphere
7. motion
8. effects

Do not compensate for poor composition by adding:

- bloom
- particles
- shaders
- glow
- lens effects

---

# 7. Centralized Configuration

Create a centralized configuration layer for frequently adjusted visual parameters.

Prefer something conceptually similar to:

```js
WORLD_CONFIG = {
  camera: {},
  fog: {},
  lighting: {},
  building: {},
  vegetation: {},
  colors: {},
  atmosphere: {},
}
```

Important visual values should not be scattered across many components.

I expect frequent iterative requests such as:

- make the forest denser
- slow the camera
- increase building scale
- reduce fog
- make vegetation less saturated
- delay the reveal
- enlarge the entrance

These should be easy to adjust.

---

# 8. Code Quality

Structure the world into reusable components.

Avoid one giant scene file.

A possible structure:

```text
src/
  world/
    Experience
    CameraRig
    Lighting
    Environment
    Forest
    Trees
    GroundVegetation
    Building
    Atmosphere

  ui/
    LoadingScreen
    WelcomeOverlay

  config/
    worldConfig
```

You may improve the exact structure if you have a good reason.

Keep:

- scene logic understandable
- visual parameters easy to find
- components reasonably isolated

---

# 9. Performance

Consider performance from the beginning.

Prefer:

- instancing for repeated geometry
- simple geometry
- limited shadow casters
- limited particle counts
- reasonable DPR handling
- restrained draw calls

Desktop experience is the priority for MVP 0.1.

However, avoid architecture that makes future mobile fallback unnecessarily difficult.

---

# 10. Do Not Build These

Even if they appear in `PROJECT_BRIEF.md`, do NOT implement:

- Gallery
- Laboratory
- Observatory
- Idea Garden
- Memory Archive
- Constellation
- Guestbook
- My Room
- Diary
- Authentication
- invitations
- database
- CMS
- admin dashboard
- project detail pages
- full building interior

Do not anticipate future features unless required for clean architecture.

---

# 11. Avoid Generic AI Design

If your output starts looking like a generic AI-generated portfolio, correct it.

Do not default to:

- purple gradients
- glassmorphism
- glowing buttons
- neon UI
- futuristic HUDs
- random floating cards
- excessive text overlays
- sci-fi styling

This project should feel like:

**a place**

not:

**a technology demo**

---

# 12. Iteration Behavior

Do not treat the first rendered version as finished.

Once the first version runs:

1. inspect it visually
2. identify the three largest weaknesses
3. improve them
4. run the site again
5. inspect again

Prefer several focused visual iterations over adding more features.

If browser or computer tools are available, actively use them to inspect the running scene instead of reasoning only from source code.

---

# 13. Self-Review

Before considering MVP 0.1 complete, review the scene against the following questions.

## Composition

- Is there a clear foreground, midground, and background?
- Does the image work as a still frame?
- Is the building the clear focal destination?

## Reveal

- Is the building initially hidden enough?
- Does the first glimpse create curiosity?
- Does the full reveal feel earned?

## Scale

- Does the architecture feel monumental?
- Does the viewer feel small relative to it?

## Vegetation

- Does nature feel integrated with architecture?
- Or does it look like trees were placed beside a building?

## Lighting

- Does sunlight reveal form and depth?
- Is the white architecture visually readable?

## Atmosphere

- Does the space feel like it contains air?
- Is the mood quiet rather than theatrical?

## Identity

- Does this feel like the beginning of My Digital World?
- Or could it belong to any generic Three.js portfolio?

---

# 14. Definition of Done

MVP 0.1 is complete only when:

- the scene runs reliably
- camera movement works
- forest-to-building reveal works
- building scale feels convincing
- architecture and vegetation visually belong together
- lighting supports the scene
- atmosphere is restrained
- Welcome UI appears at the correct moment
- ENTER works
- no major console errors remain
- key parameters are easy to modify

Most importantly:

> The full building reveal should produce at least one frame that feels worth saving as an image.

If that is not true yet:

continue refining MVP 0.1.

Do not proceed to v0.2.

---

# 15. Final Handoff

When you stop, provide a concise implementation report containing:

- what was implemented
- current project structure
- important design decisions
- key adjustable parameters
- known weaknesses
- performance considerations
- what should be visually reviewed by Yunhan
- what was deliberately NOT implemented

Do not begin the next development phase automatically.

Stop after MVP 0.1 and wait for visual feedback.

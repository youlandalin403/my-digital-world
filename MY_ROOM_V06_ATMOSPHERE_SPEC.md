# MY_ROOM_V06_ATMOSPHERE_SPEC.md

## My Digital World — My Room v0.6 Atmosphere Pass

Status: first visual atmosphere pass, not final art direction.

Goal: make the furnished room feel warm, quiet, personal, and connected to the visual language of My Digital World without adding new functionality.

## 1. Visual Direction

Target mood:

```text
warm
quiet
soft daylight
ivory / warm white
natural wood
muted botanical green
lived-in, but uncluttered
```

The public world can feel larger, whiter, and more monumental.
My Room should feel smaller, warmer, and more human.

Avoid:

```text
cyberpunk neon
RGB gamer lighting
dark horror mood
high-saturation colors
luxury showroom look
heavy realism
overly cute/cartoon styling
```

## 2. Color Language

Use a restrained palette.

Recommended material families:

```text
Walls / ceiling:
warm ivory / off-white

Floor:
warm natural wood or warm neutral flooring

Furniture:
wood + soft neutral materials

Plants:
muted botanical greens

Small accents:
paper beige, ceramic cream, muted green
```

Do not hard-code many unrelated colors across individual meshes.

Prefer a small shared palette.

## 3. Lighting

Use a simple, web-friendly lighting setup.

Recommended structure:

```text
soft ambient / hemisphere contribution
+
one directional "sun" light from the window
+
optional subtle local warm light if already useful
```

Requirements:

- daylight should visually come from the window direction
- shadows should be soft enough to ground furniture
- room corners should not become black
- avoid dramatic contrast
- avoid excessive light count
- keep performance stable

Do not add cinematic post-processing in this pass.

## 4. Window

The window should become the main atmosphere source.

For v0.6, use a simple exterior treatment such as:

```text
pale sky
soft blue-grey distance
subtle greenery silhouette
```

It does not need to be a complete 3D exterior world.

The exterior should support the room, not compete with it.

Do not build a full outdoor environment yet.

## 5. Materials

Keep imported low-poly assets visually coherent.

Allowed:

- modest roughness adjustments
- subtle base-color normalization
- reduce overly saturated imported materials
- make wood tones feel related
- make white/cream objects share a family

Do not:

- replace every material with custom shaders
- add heavy texture stacks
- pursue photorealism
- modify third-party source files destructively unless necessary

Prefer runtime material adjustment where reasonable.

## 6. Shadows

Enable only useful shadows.

Prioritize:

```text
desk
chair
larger furniture
plant
important props
```

Tiny decorative objects do not all need expensive dynamic shadows.

If shadow performance becomes a problem, reduce caster count before reducing the entire room experience.

## 7. Tea / Diary / Guestbook Readability

Interactive objects must remain visually discoverable without looking like game UI props.

Requirements:

- tea remains easy to recognize on the desk
- Diary remains visually distinct enough to locate
- Guestbook board remains readable as an intentional wall object
- interaction prompt remains the primary explicit affordance

Do not add glowing outlines or neon interaction effects unless needed for accessibility.

## 8. Composition Preservation

Preserve the accepted v0.5 furnishing layout unless a small visual adjustment is needed.

Do not substantially rearrange furniture during this pass.

This stage is atmosphere, not another furnishing pass.

## 9. Performance

Keep the room lightweight.

Do not add:

- expensive SSR
- heavy bloom
- depth-of-field
- motion blur
- volumetric lighting
- large HDR environment files
- high-resolution texture packs

If using tone mapping, use a simple existing Three.js/R3F-compatible approach and keep exposure modest.

## 10. Existing Systems Must Remain Unchanged

Preserve:

- first-person controls
- movement speed / camera feel
- interaction manager
- Tea full / half / empty behavior
- Guestbook overlay
- Diary overlay
- Diary Supabase persistence
- Diary RLS
- collision behavior
- overlay return-to-room behavior

No new database schema.

No Guest Pass yet.

## 11. Reference Principles

Use existing successful 3D room portfolio techniques as guidance:

- a small number of meaningful interactive objects
- coherent low-poly material language
- constrained lighting rather than many real-time lights
- prioritize room readability and atmosphere over realism

Do not copy another project's visual identity directly.

## 12. Acceptance Checklist

The pass is successful when:

1. room still loads reliably
2. furniture remains correctly scaled
3. room feels warmer and less like a greybox
4. daylight direction is visually understandable
5. room remains readable in corners
6. wood / wall / plant colors feel coherent
7. window contributes atmosphere
8. Tea / Diary / Guestbook remain easy to find
9. no interaction behavior changes
10. no collision regressions
11. existing tests pass
12. no major frame-rate regression

## 13. Codex Handoff

Implement `MY_ROOM_V06_ATMOSPHERE_SPEC.md`.

This is a visual atmosphere pass only.

Target:
- warm ivory room
- natural wood
- muted green plants
- soft daylight from the window
- calm, quiet, lived-in feeling

Preserve the v0.5 furnishing layout and all existing functionality.

Do not add new features.
Do not add Guest Pass.
Do not create new Supabase schema.
Do not add heavy post-processing or expensive effects.

Prefer a small shared palette and a simple lighting architecture.

At completion report:

- files changed
- palette/material changes
- light setup and shadow settings
- window/exterior treatment
- any runtime material normalization
- performance considerations
- tests run and results
- screenshots or review images if available

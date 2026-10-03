# MY_ROOM_V05_FURNISHING_PASS.md

## My Digital World — My Room v0.5 Furnishing Pass

Goal: use the downloaded low-poly furniture asset pack to turn the existing greybox room into a believable furnished room, while preserving all current interaction systems.

## Asset source

Use only local GLB/GLTF assets already copied into the project.

Recommended library location:

```text
public/models/my-room/library/
```

Codex may scan the available models in this folder and choose a coherent subset.

Do not download remote assets automatically.

## Preserve existing systems

Do not break or redesign:

- first-person movement
- mouse look / pointer lock
- room collision
- interaction manager
- Guestbook board interaction
- Tea interaction
- Diary interaction
- Diary RLS / Supabase behavior
- overlay behavior
- current route structure

`roomConfig.js` remains the source of truth for interaction anchors and collision behavior.

## Furnishing goal

Create a warm, quiet, low-poly private room.

The room should feel lived-in but not crowded.

Prefer a coherent composition over using every model.

Codex may choose among available assets such as:

```text
desk
chair
bookcase
closet
night stand
sofa
stool
table
bed
door
plant
window
mug
decor
```

Do NOT place every available asset.

Keep clear walking paths.

## Layout freedom

Codex may make moderate layout changes if needed for a better room composition, but must preserve:

```text
Guestbook → wall interaction
Tea → reachable on desk/table
Diary → reachable on desk/table
Entrance → visually open
Window → unobstructed
```

Do not make major architectural changes to the room shell.

## Asset architecture

Create or maintain a centralized asset registry, for example:

```text
src/my-room/roomAssets.js
```

Each placed asset should be configurable with:

```text
url
position
rotation
scale
```

Do not scatter model paths and transforms throughout multiple components.

## Model handling

For each chosen asset:

1. load the GLB/GLTF locally
2. normalize scale to the existing room
3. correct orientation
4. place it intentionally
5. verify it does not block player movement
6. keep interaction anchors independent from the visual mesh

If an asset origin is inconvenient, compensate through transforms rather than rewriting the world coordinate system.

## Tea

The visual mug may be replaced.

Keep the existing full / half / empty Tea state logic.

The liquid surface may remain a generated/simple mesh fitted to the replacement mug.

## Current generated assets

Do not permanently delete the existing generated room assets.

Move or retain them under a backup/original directory if necessary.

## README / licensing

Update the room asset README.

For each third-party pack or model used, record:

```text
asset/model
source/creator
license
```

Do not claim all assets are original after third-party assets are introduced.

## Visual scope

Allowed in this pass:

- low-poly furniture
- simple material consistency adjustments
- basic warm room palette
- existing lighting adjustments only if needed to make models readable

Do not add yet:

- advanced post-processing
- complex shaders
- heavy texture work
- cinematic lighting
- particle effects
- external integrations
- new application features
- Guest Pass

## Acceptance checks

- room loads without missing assets
- movement still feels correct
- player cannot become trapped by furniture
- entrance remains open
- Guestbook interaction still works
- Tea interaction still works
- Diary interaction still works
- overlays still return to the same room state
- no interaction can be triggered from unreasonable distance
- no model is obviously mis-scaled
- no severe z-fighting / floating furniture
- existing tests still pass

## Codex task

Scan the available local room asset library and perform a first complete furnishing pass.

Use your judgment to select a coherent subset of models.

Do not use every asset.

Prioritize:
1. believable room composition
2. clear walking space
3. warm low-poly visual coherence
4. preservation of existing interactions

At completion, report:

- assets chosen and their source files
- assets intentionally not used
- layout changes
- transforms / scale normalization decisions
- files changed
- tests run and results
- known visual or collision issues

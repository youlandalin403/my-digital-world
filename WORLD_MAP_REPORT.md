# Public World Map — implementation handoff

## Scope

Implemented `WORLD_MAP_SPEC.md` after the completed entrance. The entrance still uses the same 16-second camera path, final framing, forest, sanctuary, lighting, welcome overlay, and ENTER push/fade. The previous ending sentence is replaced by a lazy-loaded map. No interiors or content systems were added.

All existing files under `src/world/`, `src/ui/`, and `src/config/` were compared against the SHA-256 baseline in `review/entrance-preservation.json` and remain unchanged. The entrance stylesheet is unchanged. Integration is confined to `src/App.jsx`; map styles are scoped under their own classes.

## Geography

- A broad ancient tree and circular courtyard form the central landmark.
- Gallery and Laboratory flank the courtyard and connect through broken cloisters.
- Observatory occupies an elevated rear platform, with an open sky access marker for Constellation.
- Idea Garden is a planted greenhouse beside the courtyard path.
- Memory Archive sits in a genuine terrain cutout with descending stairs, retaining walls, and a recessed entrance.
- Guestbook is a small letter pavilion on the rear/exit path.
- My Room sits apart on a planted rise, connected by a quieter uphill path.

The overview uses a fixed elevated camera. Paths establish connections before labels are read. Architecture remains ivory, with subdued vegetation and daylight matching the entrance.

## Navigation

Top navigation, labels, and building raycasts dispatch to the same reducer. Selecting a place smoothly centers its landmark, highlights its label/navigation item, slightly dims other architecture, and shows one line of meaning. MAP, Back to map, and Escape restore the overview.

Public destinations provide ENTER, a short closer movement/fade, and a named placeholder with Return to map. Idea Garden, Memory Archive, and My Room can be focused but have no ENTER action. Their feedback is respectively “Still growing.”, “Access restricted.”, and “Invitation required.” No browser alerts are used.

Keyboard buttons have visible focus. Placeholder states focus their return control and make background controls inert. Reduced motion disables camera interpolation and foliage sway. Rendering pauses behind completed placeholders. A WebGL context-loss fallback is included.

## Structure and tuning

`src/world-map/`:

- `mapConfig.js`: place locations, label anchors, access rules, descriptions, camera, lighting, vegetation budget, navigation order, selection reducer.
- `WorldMap.jsx`: map lifecycle, canvas, navigation, focus captions, transition and placeholder states.
- `MapCamera.jsx`: bounded overview/focus/approach camera interpolation.
- `MapBuildings.jsx`: independently defined landmark components.
- `CentralCourtyard.jsx`: courtyard and connecting cloisters.
- `MapTerrain.jsx`: ground cutout and connected spline paths.
- `MapVegetation.jsx`: old tree, forest edge, planting, and gentle leaf motion.
- `MapLabels.jsx`: screen-projected HTML labels within the main React root.
- `MapPrimitives.jsx`: instanced architectural boxes and shared geometry helpers.
- `worldMap.css`: map-only typography, navigation, labels, and responsive layout.
- `mapState.test.js`: public transitions, locked/protected guards, reset/cancellation, invalid destinations.

Each place’s location and focus height can be adjusted in `PLACES`. When moving a place, adjust its label anchor and connecting road in `MapTerrain.jsx` together. Building proportions are local to their individual components.

## Validation and iterations

- Started with a live greybox to inspect region spacing and hierarchy.
- Replaced the placeholder tree, added irregular forest boundaries, and integrated planting with landmarks.
- Improved ground texture scale, archive floor contrast, and Constellation label placement.
- Replaced nested HTML roots used by the initial label implementation after browser testing exposed React cleanup warnings. Labels now use ordinary HTML buttons projected by the map camera.
- Verified entrance → fade → map, every public navigation state, map label selection, direct building raycast selection, public placeholder/return, and locked-region feedback.
- State tests pass with Node’s built-in test runner: `node --test src/world-map/mapState.test.js`.
- Production build passes. The shared Three.js bundle still produces Vite’s existing large-chunk advisory.
- Final production preview verified entrance → ENTER → map with no new browser warnings or errors; Escape correctly restores the overview after selection.
- Checked a 390 × 844 portrait viewport, corrected navigation wrapping and label bounds, and confirmed no horizontal overflow. Saved `review/world-map-portrait.png` and `review/world-map-overview.png`.
- Final preservation check confirmed all 13 baseline entrance files are unchanged. All four state tests pass.

## Performance and limits

No new dependencies, remote assets, models, or fonts were added. Landmark boxes are instanced per region; all tree branches, leaves, and grass use shared batches. Live renderer samples reported roughly 22 draw calls and 489,000 triangles, lower than the entrance’s scene cost. These observations are not cross-device benchmarks.

The map loads at ENTER and reuses the existing rendering libraries. DPR stays capped at 1.5 with one 2048² shadow map. Fine building detail and more realistic vegetation are intentionally secondary to readable geography. Actual mobile hardware and all browser/GPU combinations remain untested.

No Gallery content, Laboratory projects, Observatory records, force graph, garden/archive content, guestbook backend, authentication, invitations, Room interior, Diary, database, or CMS was implemented.

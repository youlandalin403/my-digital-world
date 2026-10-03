# My Room assets

The room combines retained project-generated models with third-party local library models. It is not an all-original asset collection.

## Active third-party models

| Local pack | Used models | Source / creator | License |
|---|---|---|---|
| Furniture Pack-glb | Desk, Chair, Bed Twin, Bookcase with Books, Closet, Night Stand | User-provided local library; original source URL and creator not supplied | Not supplied / unverified |
| Ultimate House Interior Pack-glb | Houseplant, Table Lamp, Round Rug | User-provided local library; original source URL and creator not supplied | Not supplied / unverified |

All models above are .glb files under library/<pack>/. Their embedded metadata only identifies FBX2glTF v0.9.7 as converter, not a creator or license. No license or attribution sidecars were present. Pack names alone do not establish authorship or licensing. No CC0 or other license is assumed.

Food Kit-glb and all other library models are unused. The exhaustive used/skipped list and transform table are in ../../../review/MY_ROOM_V05_REPORT.md; machine-readable bounds for every model are in ../../../review/my-room-library-inventory.json.

## Original models retained

original/ contains desk.glb, chair.glb, plant.glb, window.glb, mug.glb and tea.glb, generated for this project by scripts/build-room-assets.mjs. The window, mug and liquid remain active, with unchanged Tea levels. Original desk/chair/plant are retained as backups. See original/README.md for the historical v0.4 notes.

## Placement

Edit src/my-room/roomAssets.js for URLs, positions, rotations (radians), scales and model-local pivot offsets. Pivot translation centers horizontal bounds and puts the lowest model point on its support plane before scale/rotation. No binary model was modified. roomConfig.js remains authoritative for interactions and collision; update its footprints with any layout change. Furniture dimensions are deliberately normalized to the existing six-by-five-metre shell.

Run node scripts/scan-room-library.mjs to refresh the scan and node --test scripts/room-furnishing.test.mjs to check geometry and routes.

## v0.6 atmosphere

Materials are adjusted on runtime clones using the shared roomAtmosphere.js palette. Source GLBs, v0.5 transforms and collision footprints are unchanged. See ../../../review/MY_ROOM_V06_REPORT.md for colors, lighting, shadows and the generated window view.

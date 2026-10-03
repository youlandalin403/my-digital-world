# My Room v0.4 — Asset Pass 1

Original low-poly assets authored for this project; no third-party models,
textures, attribution requirements, or remote asset requests.

Files: desk.glb, chair.glb, plant.glb, mug.glb, tea.glb, window.glb.
All files are self-contained glTF 2.0 binaries with rough PBR materials.
Rebuild with `node scripts/build-room-assets.mjs` from the project root.

Edit `src/my-room/roomAssets.js` to change model URLs, positions, rotations
(radians), and scales. Furniture origins are at floor level. Window origin is
the frame center. Mug and tea transforms are relative to the existing tea
interaction anchor; the tea surface inherits the mug transform and uses the
configured full/half heights. Replacement mugs should use a centered origin.

Transforms affect visuals only. Existing interaction anchors, distances and
collision footprints remain in `roomConfig.js`; model swaps should fit these
footprints. Guestbook, Diary, movement, lighting, and room shell are unchanged.

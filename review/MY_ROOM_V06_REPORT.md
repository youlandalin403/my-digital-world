# My Room v0.6 — atmosphere pass

The accepted v0.5 asset transforms, collision footprints, interaction anchors and application behavior are unchanged.

## Palette and materials

Shared palette in `src/my-room/roomAtmosphere.js`:

| Family | Color |
|---|---|
| Ivory walls / ceiling | #eee6d7 / #f4eee2 |
| Natural neutral wood floor | #b89a73 |
| Furniture wood / shaded wood | #a17a51 / #826142 |
| Cream / paper beige | #e8dfcc / #d8cbb0 |
| Botanical green / sage | #72836a / #99a68b |
| Diary green | #536c55 |

Imported material names map to shared families. Plum bedding and burgundy rug become muted green; upholstery, lamp shade and plant pot become cream. Book covers retain subdued variation. Wood/fabric no longer inherit the converter's 0.4 metallic factor: nonmetal surfaces use 0; hardware uses 0.2. Most materials have roughness 0.86, ceramic 0.55, tea 0.38. Shell roughness is 0.9. Material clones are shared within each loaded model and disposed on unmount; cached loader materials and all source GLBs remain untouched.

## Lighting and shadows

- Hemisphere fill: pale sky #d8e5e8, warm bounce #e1d5c0, intensity 2.6.
- One directional daylight at [-1, 4, -3], aimed at the origin from the window side, color #fff0d7, intensity 1.6.
- One 1024 × 1024 PCF shadow map, radius 3; orthographic bounds ±4 m, near 0.1 / far 12, bias -0.0003, normal bias 0.025.
- Desk, chair, bed, bookcase, closet, nightstand and plant cast shadows. Floor, walls and furnishings receive them. Tiny props, rug, window and shell do not cast shadows. This is stylized daylight, not an aperture-accurate indoor light simulation.
- Static shadow caching: model mounts/unmounts invalidate the map; camera movement and Tea changes do not require animated furniture shadows.
- Existing R3F tone mapping/exposure and DPR cap of 1.5 are retained. No extra local lights, HDR environment or post-processing.

## Window

A single plane sits between the retained window backing and its frame, with a generated 256 × 192 canvas texture: pale sky gradient, blue-grey distant hills and muted green silhouette. It uses an unlit, non-tone-mapped material so the view stays readable. No external requests, outdoor geometry, added interactions or changes to the window opening.

## Checks

- `npm test`: all 50 existing unit/service/SQL/RLS tests passed.
- `node --test scripts/room-furnishing.test.mjs`: both model bounds/support and walking-route checks passed.
- `npx playwright test tests/my-room.spec.js tests/my-room-atmosphere.spec.js --config playwright.atmosphere.config.js`: all five cases passed with clean exit. Movement, pointer lock, interaction distances/focus, Tea states, Guestbook, Diary persistence/error handling and overlay continuity covered. The atmosphere smoke test also passed after the final lighting adjustment.
- Manual Node material-isolation check: all 12 source scenes retain their original materials and values after runtime normalization.
- `npm run build`: passed; existing large shared Three.js bundle warning remains.
- Reviewed entry, desk and storage screenshots in `review/my-room-v06-*.png`; no obvious missing assets, clipping, z-fighting or dark unreadable corners.

## Performance and limits

The only added view geometry is one two-triangle window plane. Its RGBA texture is about 192 KiB before mipmaps. Models, model downloads and triangle counts remain otherwise unchanged. There is one shadow render on asset settling rather than on every frame, but receivers still pay the per-frame shadow sampling cost. A 1024-square shadow target and cloned material instances add GPU memory; no new high-resolution texture packs or rendering passes are used.

`review/my-room-v06-frame-timing.json` records 120 requestAnimationFrame intervals in headless Edge. This is a local smoke sample, not a comparative GPU benchmark; no claim is made about low-end/mobile performance or a measured v0.5 FPS delta. Shadows are deliberately approximate; the painted exterior has no parallax and the floor stays a flat warm wood-toned material.

## Changed / added files

- `src/my-room/roomAtmosphere.js` — shared palette and non-destructive material normalization.
- `src/my-room/WindowView.jsx` — small generated exterior image.
- `src/my-room/RoomAsset.jsx` — normalized material clones, selective shadows and cleanup.
- `src/my-room/RoomGeometry.jsx` — shared shell/interaction colors and window view.
- `src/my-room/RoomExperience.jsx` — hemisphere/daylight and cached shadow setup.
- `tests/my-room-atmosphere.spec.js` — load/error checks, verified camera views, screenshots and frame timing.
- `playwright.atmosphere.config.js` — tests against separately managed port 4196, avoiding the previous Windows webServer teardown stall.
- `public/models/my-room/README.md` — atmosphere documentation reference.
- `review/MY_ROOM_V06_REPORT.md`, `review/my-room-v06-*.png`, `review/my-room-v06-frame-timing.json` — report and review evidence.
- `dist/` regenerated; unchanged interaction tests also refresh their historical v03 review screenshots.

No changes to roomAssets.js, roomConfig.js, movement, camera controls, interaction manager, overlays, Supabase services or database schema.

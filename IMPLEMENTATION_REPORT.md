# MVP 0.1 handoff

## Implemented

The complete entrance-only flow: initial loading, a guided forest journey, an ivory sanctuary reveal, a quiet pause, the specified welcome sentence, ENTER, a short forward movement, and the temporary ending. Geometry, vegetation, and textures are generated locally. There are no remote asset dependencies.

## Visual iterations

1. Ran a greybox with ground, forest blockers, building masses, and paired camera splines. Browser inspection exposed a regular tree avenue, flat building mass, and empty ground.
2. Replaced the blockers with instanced branching trees and individual leaves. Added an arched opening, recessed piers, colonnades, stairs, grass, ferns, and ivy touching the architecture.
3. Pulled back the reveal framing, softened leaf geometry, increased ground density, varied trailing growth, and replaced the opaque door-like backdrop with a view of a tree through the arch.
4. Added and tested the HTML interface. Adjusted portrait framing, corrected step planting heights, corrected reduced-motion readiness, and made camera timing robust to visible-preview frame throttling.

## Structure and controls

`src/world/` contains separate camera, building, environment, forest, ground planting, instancing, and procedural helpers. `src/ui/` contains loading, welcome, and failure states. `src/App.jsx` owns the entrance states. `src/config/worldConfig.js` centralizes camera timing and splines, building scale and opening width, plant density, palette, sunlight, fog, DPR, and shadow resolution. See `README.md` for the complete file map and run instructions.

## Design decisions

- The building is a landmark and architectural shell, not an explorable interior.
- A large arch, slender recessed piers, and low wings establish scale with simple geometry.
- Forest density compresses the early view; the clearing opens the final view.
- A rear tree visible through the arch and ivy crossing the facade make nature part of the destination.
- One sun, hemisphere light, shadows, distance fog, and subtle vertex wind provide atmosphere without postprocessing.
- The welcome remains low in the frame to leave the architecture readable.
- The user’s documents override generic site-building conventions: no navigation or additional content was introduced.

## Verification

- Installed dependencies successfully; npm reported zero vulnerabilities at installation.
- Production build succeeds. Vite reports a size advisory for the 3D chunk, not a compilation failure.
- Inspected multiple live desktop renders, including the initial forest, full reveal, welcome, and ending.
- Inspected at 1280 × 720 and 390 × 844; portrait content fits without horizontal overflow. Restored the browser’s normal viewport after testing.
- Verified ENTER by pointer and keyboard and inspected the resulting ending state.
- Verified reduced-motion startup with a temporary local test override, then removed the override. OS preference handling remains the production input.
- Browser console checks found no application errors or warnings.

## Performance and limits

- Repeated vegetation uses six instanced batches rather than thousands of React meshes.
- Renderer samples around the reveal reported approximately 70 draw calls and 1.1 million triangles. These are renderer observations, not a cross-device benchmark; active preview samples were fast, while the browser separately throttled unattended frames.
- DPR is capped at 1.5 and the single shadow map is 2048². Only architecture and trees cast shadows. Rendering stops after the ending.
- Loading UI is delivered separately from the lazy 3D chunk. Combined JavaScript is approximately 313 KB gzip; the 3D chunk is approximately 242 KB gzip.
- The foliage is deliberately stylized, with visible repeated procedural forms. Terrain is mostly flat, and material weathering is subtle. Physical mobile-device performance and WebGL-loss recovery are not comprehensively tested.
- No audio, particles, bloom, depth of field, or downloaded models were needed.

## Yunhan’s visual review

Review the 16-second pace, the strength of the initial occlusion, the sense of architectural scale, the amount of ivy, and the balance between stylized foliage and the intended atmosphere. The saved reveal is `review/mvp-01-reveal.png`. Refresh the preview to replay the entrance.

## Deliberately excluded

All later spaces and systems: Gallery, Laboratory, Observatory, Idea Garden, Memory Archive, Constellation, Guestbook, My Room, Diary, full interior, authentication, invitations, database, CMS, administration, blog, and project pages. Work stops at MVP 0.1.

## Reference research

Read the project’s three source documents in their stated priority. Consulted [Kage’s project overview](https://github.com/MengTo/kage/blob/main/README.md) for procedural architecture and camera/HTML layering, and the official [Three.js CatmullRomCurve3 documentation](https://threejs.org/docs/pages/CatmullRomCurve3.html) and [R3F Canvas documentation](https://r3f.docs.pmnd.rs/api/canvas). No reference code or assets were copied. The Growing Valley, unnamed village portfolio, and Sublevel references were not confidently identified from the supplied names; their experiential guidance in the project documents informed the design.

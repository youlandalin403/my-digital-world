# My Room v0.2 — greybox and interaction handoff

Implemented `MY_ROOM_V02_GREYBOX_INTERACTION_SPEC.md` at `/my-room`. The scene remains plain primitive geometry using the existing room colors and simple lighting. No visual redesign, Guest Pass, imported models, external integrations, animation system, or database/schema changes.

## Files changed

Modified:
- `src/my-room/MyRoom.jsx` — preserves owner authentication and tea state; coordinates modal Guestbook/Diary views while the room stays mounted.
- `src/my-room/myRoom.css` — reticle, E prompt, entry control, and scoped modal layout using existing styling.
- `src/guestbook/GuestbookPage.jsx` — optional `onClose` prop supplies “Return to room” inside the modal; standalone Guestbook behavior remains unchanged.
- `tests/my-room.spec.js` — replaces v0.1 orbit/remote-button tests with first-person interaction tests and retains Diary persistence/error/privacy regression coverage.
- `package.json` — registers the new room unit tests.

Added:
- `src/my-room/roomConfig.js` — dimensions, movement constants, object definitions, furniture footprints.
- `src/my-room/movement.js` — pure yaw-relative movement, collision sliding, normalized diagonal speed, and clamped mouse look.
- `src/my-room/FirstPersonController.jsx` — WASD and mouse event handling, grounded camera motion, input cleanup.
- `src/my-room/interaction.js` — nearest-hit, distance and occlusion rules.
- `src/my-room/InteractionManager.jsx` — declarative registration, center ray detection, E input and current prompt.
- `src/my-room/RoomGeometry.jsx` — floor, four walls, ceiling, one window, desk, chair, plant and the three interactive objects.
- `src/my-room/RoomExperience.jsx` — persistent Canvas, pointer-lock lifecycle, entry/re-entry, reticle and prompt.
- `src/my-room/RoomOverlay.jsx` — native modal dialog with focus containment and guarded close behavior.
- `src/my-room/room.test.js` — movement and actual Three.js raycasting unit tests.
- `MY_ROOM_V02_IMPLEMENTATION_REPORT.md` — this report.

Generated artifacts:
- `review/my-room-v02-tea.png`
- `review/my-room-v02-guestbook.png`
- `review/my-room-v02-diary.png`
- `dist/` rebuilt; `test-results/` and existing Constellation/Guestbook/Observatory regression screenshots regenerated.

The temporary `playwright.local-verification.config.js` used for verification was removed afterward. No permanent Playwright configuration changes. This workspace has no Git repository, so this is an explicit file inventory rather than a Git diff.

## Interaction architecture

`MyRoom` retains authentication and session-local tea state. `RoomExperience` owns one persistent Canvas, pointer-lock state and HUD. `FirstPersonController` updates the camera before interaction detection. Geometry is isolated in `RoomGeometry`.

Each `Interactable` registers `{ id, label, interactionDistance, target, onInteract }` declaratively with `InteractionManager`. A center-camera ray finds the nearest physical surface. That surface must belong to a registered object, and the camera-to-hit distance must be within its limit. Walls, furniture and other foreground geometry occlude objects. The prompt appears only for a valid target while controls are active. E repeats are ignored, and eligibility is recalculated on E rather than trusting a stale prompt. No remote action buttons or mesh-click bypass remain.

Entry explicitly requests pointer lock from a user click. Esc releases control. Lock loss, window blur, hidden tabs and overlays clear movement keys; overlays suspend mouse look and E handling as well. Returning from a modal requires clicking Enter Room again, preserving browser user-gesture requirements instead of forcibly recapturing the mouse.

Guestbook and Diary use their existing components, service layers and authentication. Native `dialog.showModal()` traps focus and makes the underlying room inert. The scene does not unmount or reload on opening/closing overlays: position, yaw, pitch and tea remain intact. Esc on a Diary modal uses the editor's existing Return-to-room button, retaining unsaved-draft confirmation and save-in-flight protection.

Development-only Canvas data attributes expose read-only position/look diagnostics for automated checks. They contain no Diary data, setters, authentication overrides or interaction bypass; they are omitted from production.

## Dimensions and constants

One world unit is one metre. North is negative Z.

| Setting | Value |
| --- | --- |
| Interior room | 6 m wide × 5 m deep × 2.8 m high |
| Wall/floor/ceiling thickness | 0.15 m |
| Window opening | 1.4 m wide × 1.1 m high, sill at 1.0 m |
| Desk | 1.8 × 0.8 m top; top surface at 0.79 m |
| Chair seat | 0.45 × 0.45 m; top surface at 0.49 m |
| Eye height | 1.65 m |
| Spawn | (0, 1.65, 1.55), facing negative Z |
| Walking speed | 1.6 m/s, including diagonals |
| Player clearance | 0.22 m |
| Camera FOV | 65° fixed |
| Mouse sensitivity | 0.002 radians per reported movement pixel |
| Vertical look | ±80°; roll fixed at zero |
| Frame delta cap | 0.05 s |
| Collision substep | At most 0.04 m per step |
| Walkable wall limits | X: [-2.78, 2.78], Z: [-2.28, 2.28] |
| Tea range | 1.5 m |
| Diary range | 1.5 m |
| Guestbook range | 2.0 m |

Movement uses room clamping and conservative expanded 2D AABBs for the desk, chair and plant. Axis-separated movement allows edge sliding. No gravity simulation, sprint, jumping, bobbing, acceleration curve, or physics engine.

## Tests and results

- `npm test`: **50 passed, 0 failed**. Includes all existing lifecycle/map/date/Constellation/Guestbook/Diary tests, existing isolated PostgreSQL RLS checks, plus movement normalization/frame-rate checks, yaw-relative motion, pitch limits, wall/furniture collision, large-delta clamping, actual Three.js raycasting, range boundaries, occlusion and deregistration.
- Browser suite: **12 passed, 0 failed**, clean exit, using installed Microsoft Edge headless and a mocked Supabase HTTP boundary. Command: `npx playwright test --config=playwright.local-verification.config.js --workers=1`. The temporary config imported the existing Playwright config and disabled its managed webServer; Vite ran separately on 127.0.0.1:4188 with the same existing test-only Supabase environment. This avoided the previously observed Windows managed-server teardown hang.
- Browser coverage: native pointer-lock acquisition; real mouse movement; deterministic aim via mouse movement events; WASD navigation; no interaction at a distance or while looking away; E repeat suppression; full → half → empty tea; Esc release; wall bounds; no movement while unlocked; lock-denial error/retry state; Guestbook modal and mouse/keyboard use; exact position/look continuity; owner Diary save/reload/date navigation; empty dates; failed read/write handling; draft protection on date changes and Esc; logout; visitor Diary denial; existing external-page regression tests.
- Deterministic aiming dispatches ordinary mouse movement events only. Tests never set the camera, invoke object callbacks, or bypass distance/security checks.
- `npm run build`: **passed**. Vite continues to warn about the large shared Three.js bundle.
- Screenshots of tea interaction and both overlays were inspected. No live Supabase requests, migrations or acceptance testing were performed.

## Known limitations

- Desktop keyboard and pointer-lock-capable browser required for first-person movement. Touch/mobile movement and alternate controls are intentionally not implemented at this desktop-first stage.
- Pointer lock requires a user gesture and may be denied by browser settings, embedded-frame policy or browser restrictions. The room reports denial and offers retry. Browsers may require a short pause before recapture after Esc.
- Collision is conservative room/furniture AABB clamping, not mesh physics. Sliding can feel boxy near chair corners. The window is decorative and not traversable.
- Cup/notebook targeting is an exact center ray against simple physical geometry; no aim assist, expanded invisible hit zones, animation or final interaction polish.
- Movement delta is capped after stalls to avoid teleporting; very low frame rates can slow movement rather than catching up.
- No automated cross-browser coverage beyond installed Edge. The standard managed-server test command still has the prior Windows teardown limitation; the external-server run above completed cleanly.
- Diary persistence and RLS remain as implemented in v0.1. Real Supabase functionality still depends on the previously generated Diary migration being applied with user authorization. No claim is made that the migration has been applied or that live acceptance passed.

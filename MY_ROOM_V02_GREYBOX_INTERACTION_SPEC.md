# MY_ROOM_V02_GREYBOX_INTERACTION_SPEC.md

## My Digital World — My Room v0.2

Status: **Greybox & Interaction Feel**

Goal: make the room feel good to enter, move through, look around, and interact with before any serious art polish.

The room should remain visually simple in this stage.

---

# 1. Scope

Build a small greybox 3D room containing:

- floor
- four walls
- ceiling
- one window
- one desk
- one chair
- one plant
- wall Guestbook board
- tea on desk
- Diary / notebook on desk

Use simple primitive geometry where possible:

```text
BoxGeometry
PlaneGeometry
CylinderGeometry
```

Do not spend time on production-quality models.

---

# 2. Core Control Model

Desktop-first controls:

```text
Enter Room
↓
pointer lock / first-person control

WASD
→ move

Mouse
→ look

E
→ interact with focused nearby object

Esc
→ release pointer lock
```

Use a small center reticle while in first-person mode.

Keep movement calm and comfortable, not fast like an FPS.

---

# 3. Interaction Rules

An object is interactable only when both are true:

```text
player is close enough
AND
player is looking at the object
```

Each interactable should define:

```text
id
position / target
interactionDistance
label
onInteract
```

Suggested initial values:

```text
tea        1.5m   "Drink tea"
diary      1.5m   "Open diary"
guestbook  2.0m   "Read guestbook"
```

Do not allow interaction from across the room.

---

# 4. Interaction Prompt

When an interactable is focused and in range:

```text
[E] Drink tea
[E] Open diary
[E] Read guestbook
```

When no valid target is focused, hide the prompt.

The prompt should be subtle and readable.

---

# 5. Guestbook Interaction

The Guestbook board should reuse the existing Guestbook component.

Preferred behavior:

```text
look at board
↓
[E] Read guestbook
↓
open Guestbook as a 2D overlay over the room
↓
close overlay
↓
return to the exact room state
```

Do not duplicate Guestbook data or create another Guestbook implementation.

---

# 6. Diary Interaction

Preferred behavior:

```text
look at Diary
↓
[E] Open diary
↓
open existing owner-only Diary editor as a 2D overlay
↓
close overlay
↓
return to the room
```

Preserve the current Diary Supabase persistence and RLS.

Opening the Diary must not weaken owner-only security.

---

# 7. Tea Interaction

Tea is the primary interaction-feel test.

State:

```text
full
→ half
→ empty
```

Example messages:

```text
The tea is still warm.
Half a cup left.
The cup is empty.
```

Optional simple animation:

```text
cup lifts slightly
→ moves toward camera
→ pauses briefly
→ returns to table
```

No physics simulation required.

No persistence required.

Refresh may restore a full cup.

---

# 8. Movement Feel

Prioritize comfort.

Requirements:

- moderate walking speed
- no sprint in v0.2
- no jumping in v0.2
- no head bob required
- no acceleration complexity unless already easy to support
- prevent walking through walls
- prevent leaving room bounds

If collision implementation becomes disproportionately complex, use simple room-bound clamping first.

---

# 9. Camera Feel

Requirements:

- natural standing eye height
- vertical look should be clamped enough to avoid uncomfortable flipping
- mouse sensitivity should be moderate
- no camera roll
- no dramatic FOV effects

Keep the experience calm.

---

# 10. Overlay Behavior

When Guestbook or Diary overlay is open:

- pause room movement input
- release or suspend pointer lock as needed
- overlay must be fully usable with mouse/keyboard
- closing overlay returns to the same room state
- do not reload the entire route

---

# 11. Interaction Architecture

Create a reusable interaction system.

Conceptually:

```text
InteractionManager
├── detects nearby/focused interactable
├── exposes current prompt
├── listens for E
└── calls selected object's onInteract
```

Objects should register declaratively.

Example conceptual shape:

```js
{
  id: "tea",
  label: "Drink tea",
  interactionDistance: 1.5,
  target: teaObject,
  onInteract: drinkTea
}
```

Do not hard-code all interaction logic into one giant room component.

---

# 12. Visual Scope

Keep this stage intentionally plain.

Allowed:

- neutral materials
- simple lighting
- basic shadows if already inexpensive
- minimal interaction highlight

Do not add yet:

- PBR material work
- detailed textures
- final furniture
- advanced post-processing
- complex atmospheric effects
- final vegetation
- elaborate animation
- final color palette
- art-direction polish

---

# 13. Acceptance Tests

1. Room loads reliably.
2. Player can enter first-person mode.
3. WASD movement works.
4. Mouse look works.
5. Esc releases control.
6. Player cannot walk through room boundaries.
7. Tea cannot be interacted with from across the room.
8. Looking at nearby tea shows `[E] Drink tea`.
9. Tea progresses full → half → empty.
10. Guestbook board opens existing Guestbook overlay.
11. Closing Guestbook returns to the same room.
12. Diary opens the existing owner-only Diary editor.
13. Closing Diary returns to the same room.
14. Opening overlays disables room movement.
15. Existing Diary persistence and RLS tests still pass.
16. Existing Guestbook tests still pass.
17. Existing systems outside My Room remain unaffected.

---

# 14. Explicitly Out of Scope

Do not implement:

- final room art
- imported furniture packs
- Blender workflow
- complex physics
- jumping
- sprinting
- crouching
- inventory
- avatar body
- multiplayer
- one-time Guest Pass
- external app integrations
- room decoration editor
- achievements
- audio system
- advanced post-processing

---

# 15. Codex Handoff

Implement `MY_ROOM_V02_GREYBOX_INTERACTION_SPEC.md`.

Preserve all existing My Digital World functionality.

Priorities, in order:

1. comfortable room scale
2. stable first-person movement/look
3. reusable interaction detection
4. clear `[E]` prompts
5. Tea interaction
6. Guestbook overlay integration
7. Diary overlay integration
8. regression tests

Keep the scene greybox/simple.

Do not redesign visual style.

Do not implement Guest Pass yet.

Do not add new Supabase schema unless a genuine requirement appears. The existing Guestbook and Diary systems should be reused.

At completion, report:

- files changed
- interaction architecture
- room dimensions / movement constants chosen
- tests run and results
- any known interaction or browser limitations

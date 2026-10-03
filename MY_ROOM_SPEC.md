# MY_ROOM_SPEC.md

## My Digital World — My Room v0.1

Status: **Functional specification frozen for v0.1**

My Room is first and foremost a small interactive 3D room, not a dashboard.

## 1. Core

```text
My Room
├── Guestbook board → opens existing Guestbook
├── Tea on desk → temporary playful interaction
└── Diary / notebook → owner-only private Diary
```

Other furniture may exist as decoration only.

## 2. Room Interaction

For v0.1:
- basic camera / room navigation
- hover or interaction hint
- click / interact
- return to room

Do not implement complex game mechanics or final visual polish.

## 3. Guestbook Board

A visible board on the wall opens the already implemented Guestbook.

Do not create a second Guestbook database.

## 4. Tea

Example temporary state:

```text
full cup
→ drink
→ half cup
→ drink
→ empty cup
```

Optional feedback:

```text
The tea is still warm.
Half a cup left.
The cup is empty.
```

Rules:
- no database persistence
- refresh may reset the tea
- no analytics, inventory, achievements, or gamification

## 5. Diary

Diary is separate from Observatory.

Observatory = structured time reflection: plan, tasks, daily reflection.

Diary = free-form private writing.

Recommended v0.1 fields:

```text
date
optional title
body
```

No mood scores, productivity metrics, tags, or task structure.

## 6. Diary Storage

Use Supabase.

Recommended table:

```text
diary_entries

id
owner_id
date
title
body_markdown
created_at
updated_at
```

Use a browser editor as the primary writing interface.

Store Markdown text in `body_markdown`.

Do not require local `.md` file editing for everyday writing.

## 7. Diary Security

Diary is owner-only and must be protected by database-level RLS.

```text
Visitor / temporary guest
SELECT ❌
INSERT ❌
UPDATE ❌
DELETE ❌

Owner
SELECT ✅
INSERT ✅
UPDATE ✅
DELETE ✅
```

Reuse existing Supabase owner authentication.

Do not expose service-role, secret keys, or database passwords.

## 8. Diary Interaction

```text
enter My Room
→ click Diary / notebook
→ open Diary editor
→ choose/view date
→ write
→ Save
```

Recommended controls:
- date
- previous day
- next day
- Today
- optional title
- Markdown textarea
- Save

Required states:
- loading
- ready
- saving
- saved
- error

No silent save failures.

## 9. Service Architecture

```text
Diary UI
↓
diaryService
↓
Supabase adapter
↓
Supabase
```

Suggested operations:

```text
getDiaryEntry(date)
saveDiaryEntry(date, title, bodyMarkdown)
deleteDiaryEntry(date)
```

Do not scatter direct Supabase calls through the 3D room code.

## 10. Room Access for v0.1

Do **not** implement the one-time invitation system yet.

For v0.1:
- owner can access My Room
- local/dev preview can expose the room for testing
- visitor-facing room can remain locked

One-time Guest Pass comes later.

## 11. Out of Scope

Do not implement yet:
- one-time invitation system
- friend accounts / permanent allowlist
- shared passwords
- WeRead / Procreate / WeChat integrations
- photo wall or bookshelf backend
- inventory
- decoration editor
- complex physics
- multiplayer
- chat
- achievements / gamification
- final lighting/art direction
- full furniture set
- complex animations

## 12. Acceptance Tests

1. My Room route opens.
2. Basic navigation works.
3. Interactive objects show a clear interaction hint.
4. Guestbook board opens existing Guestbook.
5. Tea interaction changes temporary state.
6. Refresh can reset tea safely.
7. Owner opens Diary.
8. Owner saves a Diary entry.
9. Refresh preserves Diary content.
10. Date navigation loads correct entries.
11. Empty dates are handled safely.
12. Logged-out visitors cannot read Diary data.
13. Unauthorized direct Supabase reads/writes are rejected by RLS.

## 13. Codex Handoff

Implement `MY_ROOM_SPEC.md` as the next functional stage of My Digital World.

Preserve all existing systems:
- Entrance
- World Map
- Idea Garden
- Laboratory
- Gallery
- Observatory
- Constellation
- Guestbook
- idea → now → completed lifecycle
- existing Supabase owner authentication
- existing RLS-secured systems

Requirements:
1. Implement only My Room v0.1 described here.
2. Build a simple functional 3D room first; no final visual polish.
3. Add exactly three meaningful interactions:
   - Guestbook board → existing Guestbook
   - Tea → temporary local interaction
   - Diary / notebook → owner-only Diary
4. Reuse the existing Guestbook.
5. Store Diary content in Supabase as Markdown text.
6. Enforce owner-only Diary access with database-level RLS.
7. Keep Diary database access behind a service/adapter layer.
8. Do not implement the one-time invitation system yet.
9. Do not add external app integrations.
10. Do not add out-of-scope features.
11. Add appropriate unit/database/browser tests.
12. Generate the Supabase migration SQL for Diary.
13. **Do not apply the external Supabase migration yourself.**
14. Stop at the migration boundary and report:
   - files changed
   - tests run and results
   - migration file path
   - what the migration creates
   - what remains blocked until migration is applied

Wait for migration review and user confirmation before live Supabase acceptance testing.

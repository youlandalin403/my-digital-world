# GUESTBOOK_SPEC.md

## My Digital World — Guestbook v0.1

Status: **Functional specification frozen for v0.1**

Guestbook is a simple public message book for visitors.

Its purpose is:

> Visitors can leave a short public note without creating an account.  
> If they want to say something privately, they should use email instead.

Guestbook is intentionally small and should not become a social network.

---

# 1. Core Concept

Two communication paths:

```text
Public
Visitor
→ leave a guestbook message
→ stored in Supabase
→ shown publicly

Private
Visitor
→ Send me an email
→ opens mail client
→ not stored in Guestbook
```

Guestbook messages are public by default.

Private communication belongs to email, not to the Guestbook database.

---

# 2. Data Model

Use one table:

```text
guestbook_entries
```

Recommended fields:

```text
id
name
message
is_hidden
created_at
```

## id

UUID primary key.

## name

Optional visitor name.

Recommended limit:

```text
<= 80 characters
```

Empty names are allowed.

The UI may display a fallback such as:

```text
Anonymous
```

if no name is provided.

## message

Required public message.

Rules:

```text
trimmed message must not be empty
<= 2000 characters
```

## is_hidden

Boolean.

Default:

```text
false
```

Purpose:

Owner can hide an inappropriate or unwanted message without immediately deleting it.

Visitors must never be able to choose or modify this field.

## created_at

Server/database-generated timestamp.

Visitors must not control it.

---

# 3. Public Guestbook Page

The public page should contain:

```text
Guestbook

Name
[ optional ]

Message
[ required textarea ]

[ Leave a message ]

----------------

Recent messages
```

Each visible message should show:

```text
name / Anonymous
message
created date/time
```

Keep presentation minimal in v0.1.

Do not implement final visual styling yet.

---

# 4. Submission Flow

Visitor:

```text
enter optional name
↓
enter message
↓
Leave a message
↓
validate locally
↓
insert through Supabase
↓
show success state
↓
reload/update message list
```

Required UI states:

```text
idle
submitting
success
error
```

The submit button should be disabled while a submission is in progress.

Do not silently fail.

---

# 5. Public Read Rules

Public visitors should only read entries where:

```text
is_hidden = false
```

Hidden entries must not be returned to normal public reads.

Default ordering:

```text
newest first
```

A simple first-page limit is acceptable if needed, but advanced pagination is out of scope.

---

# 6. Owner Controls

Reuse the existing Supabase owner authentication already used by Observatory and Constellation.

When the owner is logged in:

- all entries may be visible to the owner
- hidden entries should be clearly marked
- owner can `Hide`
- owner can `Unhide`
- owner can `Delete`

Do not add message editing.

Owner controls may be simple functional buttons in v0.1.

---

# 7. Permissions / RLS

Authorization must be enforced in Supabase/PostgreSQL.

Do not rely on frontend hiding.

## Visitor / anon

Allowed:

```text
SELECT visible entries ✅
INSERT new entry ✅
UPDATE ❌
DELETE ❌
```

Visitors must not be able to:

```text
set is_hidden
change created_at
edit an existing row
delete an existing row
```

## Owner

Allowed:

```text
SELECT all entries ✅
INSERT ✅
UPDATE ✅
DELETE ✅
```

Owner identity should reuse:

```text
Supabase Auth
auth.uid()
existing owner UUID/configuration
```

Do not expose:

```text
service_role
secret key
database password
```

to frontend code.

---

# 8. Safe Visitor Insert

Public insert is the most security-sensitive part of Guestbook.

The database should ensure that visitor inserts cannot spoof moderation fields.

Preferred behavior:

```text
visitor supplies:
name
message

database supplies:
id
is_hidden = false
created_at = now()
```

If direct table INSERT grants make column control awkward, prefer a narrow RPC/function such as:

```text
submit_guestbook_entry(name, message)
```

with carefully limited behavior.

The function must only create a normal visible message and must not allow arbitrary SQL or owner privileges.

Do not use a broad SECURITY DEFINER function unless necessary and carefully constrained.

---

# 9. Anti-Spam v0.1

Keep anti-spam lightweight.

Required:

```text
name length validation
message length validation
trimmed non-empty message
frontend submission cooldown
honeypot field
```

## Honeypot

Include an input that normal users do not interact with.

If it is filled:

```text
reject / silently ignore submission
```

Do not make it accessible as a normal visible field.

## Cooldown

Prevent repeated rapid submissions from the same page session.

This is convenience protection only, not strong security.

Do not pretend frontend cooldown is authoritative server-side rate limiting.

## Not in v0.1

Do not add CAPTCHA / Cloudflare Turnstile unless spam becomes a real problem.

---

# 10. Private Email Link

Guestbook must include a separate private-contact affordance:

```text
Want to say something privately?
Send me an email.
```

Use:

```text
mailto:
```

for v0.1.

This should open the visitor's mail client.

Private email messages are not stored in Supabase Guestbook.

Do not build a private-message database.

Recommendation:

Use a dedicated public contact email rather than exposing the user's most important personal inbox.

---

# 11. Service Architecture

Keep Supabase/database access outside presentation components.

Recommended:

```text
Guestbook UI
↓
guestbookService
↓
Supabase adapter
↓
Supabase
```

Suggested service operations:

```text
getVisibleEntries()
getOwnerEntries()
submitEntry(name, message)
hideEntry(id)
unhideEntry(id)
deleteEntry(id)
```

The UI should not scatter `.from(...)` calls across components.

---

# 12. v0.1 Must Implement

## Public

- read visible entries
- newest-first ordering
- optional name
- required message
- submit message
- loading/submitting/success/error states
- honeypot
- simple frontend cooldown
- private email link via `mailto:`

## Owner

- reuse existing owner login
- see hidden entries
- hide entry
- unhide entry
- delete entry

## Backend

- `guestbook_entries`
- database validation
- RLS
- safe public submission path
- owner moderation permissions
- migration SQL
- tests

---

# 13. Explicitly Out of Scope

Do **not** implement:

```text
account registration
visitor login
avatars
likes
reactions
replies
threads
nested comments
private messaging
approval queue
pending moderation state
email notifications
real-time chat
presence
friend system
social graph
rich text
Markdown authoring
image uploads
attachments
advanced pagination
full-text search
CAPTCHA / Turnstile
complex spam scoring
AI moderation
analytics
gamification
```

Guestbook should remain a guestbook.

---

# 14. Acceptance Tests

## Test 1 — public read

Logged out visitor opens Guestbook.

Expected:

visible entries load.

## Test 2 — anonymous submit

Visitor leaves:

```text
name = empty
message = Hello
```

Expected:

submission succeeds and appears as Anonymous.

## Test 3 — named submit

Visitor leaves a name and message.

Expected:

submission succeeds and persists after refresh.

## Test 4 — invalid message

Visitor submits empty/whitespace message.

Expected:

rejected.

## Test 5 — length limits

Overlong name/message.

Expected:

rejected by UI and database.

## Test 6 — visitor cannot moderate

Logged out visitor attempts:

```text
UPDATE
DELETE
set is_hidden
```

Expected:

rejected by database permissions/RLS.

## Test 7 — owner hide

Owner hides a message.

Expected:

- owner can still see it as hidden
- logged out visitor no longer sees it

## Test 8 — owner unhide

Owner unhides the same entry.

Expected:

public visitor sees it again.

## Test 9 — owner delete

Owner deletes a message.

Expected:

it is permanently removed.

## Test 10 — persistence

Refresh/reopen page.

Expected:

stored entries remain.

## Test 11 — email

Click private email link.

Expected:

browser attempts to open configured mail client via `mailto:`.

---

# 15. Codex Handoff

Implement `GUESTBOOK_SPEC.md` as the next functional stage of My Digital World.

Preserve all existing functionality:

```text
Entrance
World Map
Idea Garden
Laboratory
Gallery
Observatory
Constellation
idea → now → completed lifecycle
existing Supabase owner authentication
existing RLS-secured systems
```

Requirements:

1. Implement only Guestbook v0.1 defined in this spec.
2. Keep visual styling minimal and functional.
3. Reuse the existing Supabase project and owner authentication.
4. Implement one public guestbook data model with public visible reads and safe anonymous submission.
5. Visitors must not be able to update/delete existing messages or control moderation fields.
6. Owner can hide, unhide, and delete.
7. Use database-level RLS/permissions.
8. Keep Supabase access behind a Guestbook service/adapter layer.
9. Add lightweight honeypot + frontend cooldown only.
10. Use a simple `mailto:` private contact link; do not build private messaging.
11. Do not add any features listed as out of scope.
12. Add appropriate unit/database/browser tests.
13. Generate the Supabase migration SQL.
14. **Do not apply the external Supabase migration yourself and do not assume it has been applied.**
15. Stop at the migration boundary and report exactly:
   - files changed
   - tests run and results
   - migration file path
   - what the migration creates
   - what remains blocked until migration is applied
16. Do not expose service-role keys, secret keys, or database passwords in frontend code.

After implementation, wait for migration review and user confirmation before continuing with live Supabase acceptance testing.

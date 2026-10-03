# MY_ROOM_V07_GUEST_PASS_SPEC.md

## My Digital World — My Room v0.7 One-Time Guest Pass

Status: **security/flow specification for review before migration or deployment**

Goal: allow the owner to create a single-use invitation for My Room.

A friend may redeem the invitation once, enter My Room for one temporary visit, refresh safely during that visit, and lose access when the temporary visit expires or is explicitly ended.

This is an **experience/access gate**, not DRM. Truly private data (especially Diary) remains protected independently by Supabase Auth + database RLS.

---

## 1. Product Behavior

```text
Owner
→ Generate invitation
→ Receive one shareable invitation link
→ Send link to one friend

Friend
→ Open invitation page
→ Explicitly choose "Enter My Room"
→ Server atomically redeems invitation
→ Invitation becomes permanently used
→ Friend receives a temporary Room Session
→ Friend enters My Room

During visit
→ refresh ✅
→ Tea ✅
→ Guestbook ✅
→ Diary ❌ owner-only

End visit / session expiry
→ Room Session invalid
→ old invitation cannot be redeemed again
```

One invitation must never create two independent visits.

---

## 2. Important Link-Preview Rule

Do **not** consume the invitation merely because the URL page was opened.

Messaging apps and social platforms may fetch links automatically for previews.

Use an invitation URL whose secret token lives in the URL fragment, for example:

```text
https://example.com/room/invite#<raw-token>
```

The fragment is read by the browser SPA and is not sent as part of the normal HTTP request for the page.

The invite page must show an explicit action:

```text
You have been invited to My Room.

[ Enter My Room ]
```

Only pressing that button sends the token to the redemption Edge Function.

After successful redemption:
- remove the raw invitation token from the visible URL/history as soon as practical
- never persist the raw invitation token in localStorage
- never log the raw invitation token

---

## 3. Invitation Lifetime

For v0.7:

```text
Invitation validity before redemption: 7 days
Temporary visit after redemption: max 4 hours
```

Invitation expiry can become configurable later.

An invitation may also be manually revoked by the owner before use.

---

## 4. Browser Visit Semantics

Store the temporary **Room Session token** in `sessionStorage`, not `localStorage`.

Expected behavior:

```text
same tab + refresh
→ session remains

close the tab
→ browser sessionStorage normally disappears

open old invitation again
→ invitation already used → denied

session older than 4 hours
→ denied
```

Important limitation:

A web server cannot reliably observe the exact moment a browser tab is closed.

Therefore:
- "close tab = visit ends" is primarily a browser `sessionStorage` behavior
- server-side expiry is the authoritative fallback
- an intentionally copied session token could remain usable until server expiry unless explicitly revoked

Add an explicit `Leave Room` action that revokes the current Room Session server-side and clears `sessionStorage`.

---

## 5. Database Model

Create two tables.

### `room_invitations`

```text
id uuid primary key
token_hash text unique not null
created_by uuid not null
created_at timestamptz not null
expires_at timestamptz not null
used_at timestamptz null
revoked_at timestamptz null
```

Rules:
- `created_by` must be the existing Owner UUID
- raw invitation token is NEVER stored
- only a cryptographic hash of the token is stored
- one row represents one invitation
- `used_at != null` means permanently redeemed
- `revoked_at != null` means owner cancelled it

### `room_visit_sessions`

```text
id uuid primary key
invitation_id uuid not null
session_hash text unique not null
created_at timestamptz not null
expires_at timestamptz not null
revoked_at timestamptz null
```

Rules:
- raw Room Session token is NEVER stored
- one invitation may produce at most one Room Session
- enforce uniqueness on `invitation_id`
- session expiry must be server-controlled

---

## 6. Token Requirements

Use cryptographically secure random tokens.

Recommended:

```text
32 random bytes (256 bits)
→ base64url encoded for transport
```

For both invitation token and room session token.

Store only SHA-256 (or equivalent cryptographic) hashes in the database.

Raw tokens exist only:
- invitation: Edge Function → owner once → shared link
- room session: Edge Function → guest browser sessionStorage

Do not place secret/service-role keys in frontend code.

---

## 7. Atomic Redemption — Critical

Invitation redemption must be atomic.

Two simultaneous redemption requests must NOT both succeed.

Implement a database function/transaction that conceptually does:

```text
lock matching invitation row
↓
verify:
  exists
  unused
  unrevoked
  unexpired
↓
mark used_at = now()
↓
insert exactly one room_visit_session
↓
commit
```

Use row locking (`FOR UPDATE`) or another correct Postgres atomic pattern.

Do not implement:

```text
SELECT invitation
→ client checks used_at
→ separate UPDATE
```

The database redemption function must not be callable directly by ordinary `anon` or `authenticated` Data API users.

Only trusted server-side execution should invoke it.

---

## 8. RLS / Grants

Both Guest Pass tables contain access-control state.

Default posture:

```text
anon
→ no direct table access

authenticated ordinary users
→ no direct table access

owner frontend
→ use owner-authenticated Edge Function endpoints

Edge Function trusted backend
→ accesses required data server-side
```

Enable RLS on both tables.

Revoke unnecessary grants from:
- public
- anon
- authenticated

If database helper functions are exposed through the Data API:
- revoke execute from `public`
- revoke execute from `anon`
- revoke execute from `authenticated`
- allow only the trusted server role required by the Edge Function

Diary RLS must remain unchanged.

---

## 9. Edge Functions

Conceptual actions:

```text
create-invitation
redeem-invitation
validate-room-session
revoke-room-session
revoke-invitation
list-invitations
```

### `create-invitation`

Requires:
- valid Supabase Auth user
- current user is exactly Owner

Does:
- generate invitation raw token
- hash token
- insert `room_invitations`
- `expires_at = now() + 7 days`
- return shareable link once

Do not return existing raw tokens later; they are not stored.

### `redeem-invitation`

Public endpoint, but requires raw invitation token in POST body.

Does:
- hash received token
- generate a fresh raw Room Session token
- hash Room Session token
- call atomic database redemption function
- set Room Session expiry to max 4 hours
- return raw Room Session token only if redemption succeeds

Return a safe status for:
- invalid
- expired
- revoked
- already used

Never log the raw token.

### `validate-room-session`

Receives raw Room Session token.

Does:
- hash it
- verify matching session exists
- verify not revoked
- verify not expired

Returns only minimal validity state.

### `revoke-room-session`

Receives active Room Session token.

Does:
- hash it
- mark corresponding session `revoked_at = now()`
- browser clears sessionStorage

Used by explicit `Leave Room`.

### Owner-only actions

`create-invitation`, `revoke-invitation`, and `list-invitations` must verify the existing Owner Auth identity server-side.

Do not trust a frontend `isOwner` boolean.

---

## 10. Edge Function Secrets

Trusted database credentials / secret keys stay only inside Supabase Edge Function environment/secrets.

Never put these in:
- `VITE_*`
- frontend source
- `public/`
- browser storage
- Git

Frontend may continue using only the publishable/anon key for normal RLS-protected Supabase features.

---

## 11. Frontend Routes

Recommended:

```text
/room
/room/invite
```

The invitation secret is supplied in the fragment:

```text
/room/invite#<token>
```

### `/room/invite`

States:

```text
Invitation available locally
→ show invitation presentation
→ [Enter My Room]

redeeming
→ disable button
→ show neutral loading state

success
→ store Room Session token in sessionStorage
→ clear invitation secret from URL/history
→ navigate to /room

failure
→ show:
   already used / expired / unavailable
```

Do not auto-redeem on page mount.

---

## 12. `/room` Access Gate

```text
existing Owner Auth?
→ allow

else valid Room Session in sessionStorage?
→ validate with Edge Function
→ allow if valid

else
→ locked room state
```

Do not consider presence of a sessionStorage string sufficient by itself.

The server validates it.

---

## 13. Guest Permissions Inside My Room

Guest Session:

```text
walk around ✅
Tea ✅
Guestbook view ✅
Guestbook leave message ✅
Diary ❌
Owner controls ❌
generate invitations ❌
```

Diary:

```text
Owner Auth + existing RLS → accessible
Guest Pass → never grants Diary database access
```

The Diary object may appear locked for guests or have no interaction prompt.

Do not send Diary content to the guest browser and merely hide it with CSS.

---

## 14. Owner Invitation UI

Keep v0.7 simple.

Owner-only interface may provide:

```text
Generate Invitation

Active invitations:
- created time
- expires time
- status: unused / used / expired / revoked
- Revoke
```

After generation, show the raw invitation URL once with a copy action.

Because raw invitation tokens are not stored, the exact link cannot be reconstructed later.

If the owner loses it, generate a new invitation.

---

## 15. Room Assets Are Not Secret

Most current My Room geometry/models are static frontend assets under `public/`.

The Guest Pass therefore controls the **intended interactive entrance**, not cryptographic secrecy of public GLB files or shipped JavaScript.

Do not claim that Guest Pass makes public static assets confidential.

Sensitive content must remain protected separately at the data/API layer.

Diary already satisfies this via owner-only Supabase RLS.

---

## 16. Security Logging

Do not log:
- raw invitation token
- raw Room Session token
- full invitation URL containing token fragment
- secret/service-role credentials

Safe logs may include:
- invitation id
- session id
- status
- timestamp
- generic error category

---

## 17. Abuse / Rate-Limit Scope

Token entropy makes brute-force guessing impractical, but public redemption/validation endpoints can still receive spam traffic.

For v0.7:
- validate input length/format early
- use generic error responses where practical
- keep DB queries indexed
- do not add CAPTCHA unless abuse becomes real
- note rate limiting as a production-hardening follow-up

Do not weaken token length to make URLs prettier.

---

## 18. Database Indexes / Constraints

At minimum consider:

```text
unique(token_hash)
unique(session_hash)
unique(invitation_id on room_visit_sessions)
index expires_at where useful
foreign key room_visit_sessions.invitation_id → room_invitations.id
```

Use database constraints instead of relying only on frontend assumptions.

---

## 19. Tests

### Database

1. invitation cannot be read directly by anon
2. invitation cannot be inserted/updated/deleted directly by anon
3. ordinary authenticated non-owner cannot access tables
4. first redemption succeeds
5. second redemption of same invitation fails
6. two concurrent redemptions cannot both succeed
7. expired invitation fails
8. revoked invitation fails
9. one invitation produces at most one session
10. expired session fails validation
11. revoked session fails validation

### Edge Functions

12. non-owner cannot generate invite
13. owner can generate invite
14. raw token is never stored in DB
15. explicit redeem is required
16. successful redeem returns a Room Session token
17. invalid token does not create rows
18. Leave Room revokes session

### Frontend

19. invite page does not auto-redeem on load
20. clicking Enter redeems once
21. refresh during valid visit preserves access
22. valid guest can use Tea
23. valid guest can use Guestbook
24. valid guest cannot open Diary
25. logged-out user without Guest Pass cannot enter Room
26. Owner can always enter via existing Auth
27. invalidating Room Session returns user to locked state
28. old used invitation cannot start another visit

Run existing Diary, Guestbook, room interaction, and site regression tests too.

---

## 20. Explicitly Out of Scope

Do not add:
- friend accounts
- permanent room membership
- shared password
- multi-use invitations
- multiple simultaneous visits per invitation
- social profiles
- chat
- multiplayer avatars
- guest-to-owner private messaging
- external app integrations
- Diary sharing
- complex analytics
- CAPTCHA unless abuse is observed
- final invite-card visual polish

---

## 21. Migration / Deployment Boundary

Codex may generate:
- Supabase migration SQL
- database tests
- Edge Function source
- frontend integration
- unit/browser tests

But for the first implementation pass:

**DO NOT:**
- apply the remote migration
- deploy Edge Functions to production
- set production secrets
- mutate the live Supabase project

Stop before external Supabase changes.

Report everything for review first.

---

## 22. Codex Handoff

Implement `MY_ROOM_V07_GUEST_PASS_SPEC.md`.

Preserve:
- My Room v0.6 visuals
- first-person movement
- Tea interaction
- Guestbook
- owner-only Diary
- Diary RLS
- existing Supabase systems

Critical requirements:

1. Do not auto-redeem invitations when the invite page loads.
2. Put the invitation secret in the URL fragment, not a normal query parameter/path token.
3. Store only cryptographic token hashes in the database.
4. Redemption must be atomic at the database level.
5. One invitation may create at most one Room Session.
6. Room Session lasts no longer than 4 hours.
7. Store guest Room Session token in `sessionStorage`, not `localStorage`.
8. Validate Room Session server-side before allowing guest Room access.
9. Guest Pass must never grant Diary data access.
10. Owner-only actions must verify Owner identity server-side.
11. Keep trusted Supabase secret/service credentials only in Edge Functions.
12. Do not log raw invitation/session tokens.
13. Add an explicit `Leave Room` flow that revokes the server-side session.
14. Reuse existing room systems; do not redesign v0.6 visuals.
15. Do not apply migrations or deploy Edge Functions remotely yet.

At completion, report:
- files changed
- migration path
- tables/functions/constraints created by migration
- RLS/grant design
- Edge Functions created
- token generation + hashing design
- atomic redemption design
- frontend routes/state flow
- tests run and results
- any limitations
- exact manual Supabase steps required AFTER review

Stop and wait for migration + Edge Function security review before any remote deployment.

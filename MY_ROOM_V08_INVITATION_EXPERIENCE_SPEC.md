# MY_ROOM_V08_INVITATION_EXPERIENCE_SPEC.md

## My Digital World — My Room v0.8 Invitation Experience

Status: **experience/UI pass only**

Goal: make the existing one-time Guest Pass feel like receiving and using a real invitation, without changing any security logic.

The Guest Pass backend, token rules, session lifetime, database schema, Edge Functions, Diary RLS, and room access rules must remain unchanged.

## 1. Experience Flow

```text
Friend opens invitation link
↓
Invitation card appears
↓
Friend explicitly chooses Enter My Room
↓
short transition
↓
My Room
↓
friend explores / drinks tea / leaves message
↓
Leave Room
↓
short farewell state
```

The experience should feel quiet, personal, and intentional.

Do not make it feel like a login page, admin panel, or game lobby.

## 2. Invitation Page

Route remains:

```text
/room/invite#<token>
```

Do not change token transport.

Do not auto-redeem on page load.

Suggested structure:

```text
You are invited

to visit Yunhan's Room

One visit only.

[ Enter My Room ]
```

Optional secondary text:

```text
This invitation can only be used once.
```

Do not show technical terms such as `token`, `session`, or `Edge Function` to the guest.

## 3. Visual Direction

Target:

```text
warm ivory
paper / card feeling
subtle botanical detail
soft shadow
quiet typography
minimal motion
```

Avoid cyberpunk UI, neon glow, dashboard cards, heavy glassmorphism, confetti, or game-achievement styling.

## 4. Invitation Card Behavior

States:

```text
ready
redeeming
success transition
already used
expired / unavailable
error
```

Ready:
- show invitation
- Enter button enabled

Redeeming:
- disable Enter immediately
- show a small loading state
- prevent duplicate submission

Success:
1. store Room Session using existing v0.7 flow
2. remove raw invitation token from URL/history
3. show a short transition
4. navigate into My Room

Used / expired / unavailable:
- show a quiet final state
- do not offer meaningless retry for permanently used invitations

## 5. Enter Transition

Recommended:

```text
invitation card fades
↓
screen briefly softens / darkens
↓
room appears
```

Target duration: about 500–900 ms.

Respect `prefers-reduced-motion`.

Do not add expensive post-processing.

## 6. Room Arrival

Preserve:
- existing first-person spawn position
- movement/camera controls
- room layout and lighting
- existing Tea / Guestbook behavior
- locked Diary for guests

Optional one-time subtle arrival text:

```text
Welcome. Stay a while.
```

It must not block controls.

## 7. Leave Room Experience

Keep the existing server-side revocation behavior.

Recommended:

```text
Leave Room
↓
existing revoke flow
↓
clear local access/session
↓
farewell state
```

Suggested copy:

```text
Thanks for visiting.
```

Optional secondary line:

```text
The invitation has been used.
```

Provide a return link/button to the public world.

Do not offer "Enter again".

## 8. Owner Experience

Do not redesign the Owner Guest Pass manager in this pass.

Keep:
- Generate Invitation
- Refresh invitations
- Revoke
- status list

Focus on the guest-facing flow.

## 9. Canonical Site Origin

Current public origin:

```text
https://www.yunhanlin.me
```

Generated invitation links should continue to use backend-configured `ROOM_SITE_ORIGIN`.

Do not hard-code the domain in frontend UI if backend already returns the invitation URL.

## 10. Security Invariants — Must Not Change

Preserve:

```text
single-use invitation
explicit Enter required
raw invite token not stored in DB
session token stored in sessionStorage
max 4-hour visit
server-side session validation
Leave Room revokes session
Guest cannot access Diary
Owner-only actions remain server-verified
```

Do not modify:
- `room_invitations`
- `room_visit_sessions`
- Guest Pass RPCs
- Edge Function auth logic
- Diary RLS
- Guestbook RLS

No migration should be necessary.

## 11. Accessibility

Requirements:
- Enter uses a real button
- visible focus styles
- keyboard activation
- accessible status changes
- sufficient contrast
- reduced-motion support

## 12. Mobile / Small Screen

Invitation page should work well on phones:
- no horizontal scrolling
- card fits narrow screens
- Enter button easy to tap
- readable copy

The 3D room may remain desktop-first.

## 13. Acceptance Tests

1. Opening invite link does not redeem invitation.
2. Ready invitation page renders correctly.
3. Enter redeems only once.
4. Double click/repeated tap cannot create duplicate redemption.
5. Raw token disappears from URL after success.
6. Successful redeem transitions into My Room.
7. Guest can use Tea.
8. Guest can use Guestbook.
9. Guest cannot open Diary.
10. Refresh during valid visit still works.
11. Leave Room still revokes visit.
12. Farewell state appears after leaving.
13. Used invite shows final unavailable state.
14. Expired/revoked invite shows final unavailable state.
15. Owner Guest Pass controls still work.
16. Existing Guest Pass backend/security tests still pass.
17. Existing room/Diary/Guestbook regressions still pass.
18. Invitation page works at narrow/mobile widths.
19. Reduced-motion mode avoids unnecessary transition animation.

## 14. Explicitly Out of Scope

Do not add:
- new database tables
- new Edge Functions
- new authentication
- multi-use invites
- friend profiles
- chat
- guest avatars
- email sending
- QR invitation system
- music/audio
- complex 3D door animation
- new Room furniture
- Room art redesign

## 15. Codex Handoff

Implement `MY_ROOM_V08_INVITATION_EXPERIENCE_SPEC.md`.

This is an experience/UI pass only.

Preserve all v0.7 Guest Pass security and backend behavior exactly.

Focus on:
1. invitation card presentation
2. clear one-time-use language
3. lightweight enter transition
4. calm guest arrival
5. farewell state after Leave Room
6. mobile-friendly invitation page
7. accessibility and reduced-motion behavior

Do not create a migration.
Do not change Guest Pass SQL/RPCs.
Do not change Edge Function authorization.
Do not change Diary RLS.
Do not redesign My Room visuals.

At completion, report:
- files changed
- invitation page states
- transition behavior
- farewell behavior
- mobile/accessibility changes
- tests run and results
- confirmation that no backend/security logic changed

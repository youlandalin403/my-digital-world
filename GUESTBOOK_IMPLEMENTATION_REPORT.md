# Guestbook v0.1 migration handoff

Stopped at the external Supabase migration boundary. **The migration has not been applied externally.** No live Supabase acceptance testing or deployment was performed.

## Files changed

Modified:

- `src/App.jsx` — lazy Guestbook route, including trailing slash.
- `src/world-map/WorldMap.jsx` — existing Guestbook destination now enters `/guestbook`.
- `package.json` — include Guestbook unit and SQL tests.
- `playwright.config.js` — fake public contact email for isolated browser tests.

Added:

- `src/guestbook/GuestbookPage.jsx`
- `src/guestbook/guestbook.css`
- `src/services/guestbook/service.js`
- `src/services/guestbook/index.js`
- `src/services/guestbook/service.test.js`
- `supabase/migrations/202609280003_guestbook.sql`
- `supabase/tests/guestbook.test.js`
- `tests/guestbook.spec.js`
- `GUESTBOOK_IMPLEMENTATION_REPORT.md`

Generated screenshots:

- `review/guestbook-desktop.png`
- `review/guestbook-mobile.png`

Existing regression tests regenerated `review/observatory-desktop.png`, `review/observatory-mobile.png`, `review/constellation-desktop.png`, `review/constellation-mobile.png`, and `review/constellation-editor.png`. Build output in `dist/` and test output in `test-results/` are generated tooling artifacts. This workspace has no Git repository; this is the implementation write inventory, not a Git diff.

## Implemented behavior

Public visitors see the newest 100 visible messages, ordered by database timestamp descending with an ID tie-breaker. They can post plain-text messages with an optional name (Anonymous fallback). The page has loading, idle, submitting, success and error states; failed submissions retain the draft. A successful post triggers a list refresh; a failed refresh is reported separately so it does not encourage duplicate submission.

Local validation enforces name/message limits and trimmed nonempty messages. A visually hidden, accessibility-hidden, non-tabbable honeypot rejects filled submissions. The shared frontend service prevents overlapping submissions and applies a 30-second cooldown after successful submission. This is page-session convenience protection only, not authoritative rate limiting; refreshing or making direct requests bypasses it, as expected for v0.1.

Owner login/session/logout reuse Observatory's existing authentication and configuration. The owner can view hidden messages and hide, unhide, or confirm permanent deletion. No message editing is offered. An auth identity change remounts the workspace so hidden owner data is removed on logout. Supabase access is confined to the adapter, with service-level owner checks and independent database permissions/RLS.

No new dependencies, private-message table, Markdown, replies, social features, CAPTCHA or external email delivery were added. Existing lifecycle logic, Entrance, project views, Observatory and Constellation implementation files are unchanged except for the additive app/map routing.

## Email configuration

Set the public configuration variable `VITE_GUESTBOOK_CONTACT_EMAIL` to the owner's chosen public contact address in the existing Vite environment, then rebuild/restart. This value is intentionally public. The UI creates a `mailto:` link and sends/stores no email itself.

No public contact address was present in the inspected project, and the requested address has not yet been supplied. Until it is configured, the UI honestly displays that private email contact is not configured. Browser tests use `contact@example.test` only; it is not a production fallback. Selecting a real address remains a configuration dependency separate from the migration.

Existing `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_OBSERVATORY_OWNER_ID` are reused without changes. No service-role key, database password or secret key is introduced.

## Tests run

- `npm test`: **43 passed, 0 failed**. Includes previous lifecycle, map, Observatory and Constellation tests. New tests cover field validation, Unicode whitespace, raw length limits, honeypot, concurrent submission protection, cooldown, failed-request retry, owner service authorization, safe contact-link configuration, and actual SQL permissions/RLS.
- `npm run test:browser`: **8 passed, 0 failed**, exit 0. Three new Guestbook tests cover public reads, anonymous/named posting, reload persistence, ordering, literal HTML display, validation, cooldown, email href, hide/unhide/delete, logout privacy, honeypot, and missing-migration/write failure handling. Five existing Observatory/Constellation tests also pass. The entire backend boundary is intercepted at a fake test hostname.
- `npm run build`: **passed**, exit 0. Existing shared 3D bundle size warning remains.
- Desktop and mobile Guestbook screenshots inspected; no horizontal overflow at 375px. No final art treatment was attempted.

SQL tests apply the generated migration only to disposable local PGlite PostgreSQL with Auth scaffolding. They do not contact or establish behavior in external Supabase. Browser email checks verify the `mailto:` target; launching a real local email client is not automated.

## Migration file and contents

**`supabase/migrations/202609280003_guestbook.sql`**

Review and run the complete transaction manually in the intended Supabase project. It reuses the existing owner UUID `4dde6af0-2fd6-4520-86a7-8241acb9c180`. It does not depend on Constellation being applied and does not modify any existing table, policy or function.

The migration creates:

- `public.guestbook_entries`: database-generated UUID and timestamp, optional empty name, required message, and `is_hidden = false` by default.
- Length/nonempty constraints and an insert trigger that trims JavaScript-compatible whitespace and checks raw lengths.
- A newest-first timestamp/ID index.
- Public SELECT restricted to visible entries; owner SELECT includes hidden entries.
- Narrow INSERT column grants for `name` and `message` only, plus an insert policy requiring visible entries. Visitors cannot supply even a false `is_hidden`, arbitrary ID or timestamp.
- Owner-only moderation/deletion RLS. Authenticated UPDATE grants cover only `is_hidden`, so even the owner cannot rewrite content or timestamps through the application roles.
- Explicit privilege reset to remove broad project-default grants, including TRUNCATE.

The safe insert path is direct table INSERT with column-level grants; no SECURITY DEFINER RPC is necessary. No seed messages or private-contact records are created.

## Blocked pending review/application

- Real Guestbook loading and anonymous submissions.
- Real owner hide/unhide/delete and deployed permission checks.
- Live persistence and acceptance testing against external Supabase.

Additionally, the real private-contact link awaits `VITE_GUESTBOOK_CONTACT_EMAIL` configuration. No external migration will be applied or live Supabase acceptance testing continued until the user confirms migration review and application.

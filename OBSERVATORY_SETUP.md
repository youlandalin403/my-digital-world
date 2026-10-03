# Observatory Daily: Database Handoff

The frontend and migration are implemented. The migration has NOT been applied to your Supabase project. No remote database writes were made during implementation.

## SQL to Run

Open your configured Supabase project, choose SQL Editor, create a new query, and run the **entire contents** of:

`supabase/migrations/202609280001_observatory_daily.sql`

Run it as the SQL Editor's `postgres` role, once. It is one transaction, from `begin;` through `commit;`. It intentionally fails if these tables already exist instead of replacing existing data or policies. No substitutions are needed for this project: the owner constraint already uses `4dde6af0-2fd6-4520-86a7-8241acb9c180`, matching `.env.local`.

The migration creates:

- `daily_records`: unique `(owner_id, date)`, DATE key, private default, reflection, timestamps, owner account constraint.
- `daily_tasks`: parent foreign key with cascading deletion, task text, checked state, persisted position and timestamps.
- RLS SELECT/INSERT/UPDATE/DELETE policies on both tables, plus explicit table grants. Anonymous and other signed-in users read public records and their tasks only. Only the configured owner can create or modify records and tasks.
- Timestamp triggers and an invoker-security function for atomic task reordering. The function retains RLS and rejects incomplete, duplicated or unrelated task IDs.

The owner UUID in Vite is a query/UI setting, not the security boundary. PostgreSQL checks the authenticated identity independently. A different account cannot gain write access by changing browser variables.

## After Running SQL

Keep email/password authentication enabled and public sign-ups disabled. The existing owner account's Auth user ID must match the UUID above. No password belongs in `.env.local`; sign in through the page.

Start `npm run dev` and open `/observatory`, or enter Observatory from World Map. Restart Vite after changing environment variables. The browser uses only the publishable key and the signed-in user's session. Daily content is stored in PostgreSQL, not Markdown or localStorage; the Supabase SDK persists the authentication session locally.

Until the migration is applied, a database error is expected. The page reports it rather than claiming an empty day or a successful save. After applying SQL, use Retry loading or refresh.

## Live Acceptance Checks Still Required

1. Sign in as owner. Add three tasks today, check one, write reflection and Save reflection.
2. Refresh. Confirm all three tasks, checked state and reflection remain.
3. Edit a task, move it up/down and delete a task. Refresh and confirm those changes remain.
4. Open yesterday and save different content. Return to Today; today's content must be unchanged.
5. Leave today Private and sign out. Its reflection and tasks must not be returned by direct anonymous REST queries, even when querying known IDs.
6. Sign in, set today Public and sign out. Content must be readable, with no editing controls. Direct anonymous writes must fail; another authenticated account must also be unable to modify it.
7. Set today Private again as owner. Anonymous record and task queries must return no rows.

Use the browser Network panel to inspect `/rest/v1/daily_records` and `/rest/v1/daily_tasks`. RLS can legitimately return an empty array for an unauthorized update/delete; verify no row changed, rather than expecting every denied operation to return HTTP 403.

## Local Verification

- `npm test`: existing project lifecycle/map tests, local-calendar date tests, and actual migration execution in PGlite PostgreSQL. Auth identities/roles are simulated; the migration's schema, grants, policies and functions are not mocked.
- `npm run test:browser`: Edge/Playwright workflow tests against an intercepted, in-memory Supabase HTTP fixture. This checks UI behavior and refresh/session handling, not remote persistence. Install Edge or change the Playwright browser channel on other systems.
- `npm run build`: production build.

These local checks do not replace live Supabase acceptance testing after migration. Concurrent editing is last-write-wins for individual fields; real-time collaboration and conflict merging are outside this stage.

The implementation follows Supabase's RLS guidance: https://supabase.com/docs/guides/database/postgres/row-level-security

# Constellation v0.1 handoff

Implementation is complete up to the external database migration boundary. **The external Supabase migration has NOT been applied.** No live Supabase reads, writes, or owner login were used for validation. Do not proceed with live validation until the user confirms review and application.

## Files changed

Modified application/configuration files:

- `src/App.jsx` — lazy `/constellation` route, including trailing slash.
- `src/world-map/WorldMap.jsx` — enter Constellation from the existing map destination.
- `src/world-map/mapConfig.js` — interest-tree destination description.
- `package.json` — D3 hierarchy dependency and expanded local test command.
- `package-lock.json` — dependency lock update.

Added implementation and test files:

- `src/constellation/ConstellationPage.jsx` — public SVG map, navigation, selection/breadcrumb, existing owner login, recursive editor.
- `src/constellation/constellation.css` — minimal functional styling.
- `src/constellation/tree.js` — normalized hierarchy, deterministic radial D3 tidy-tree layout, ancestry and mutation validation.
- `src/constellation/tree.test.js` — hierarchy/layout/service tests.
- `src/services/constellation/service.js` — owner-gated domain operations with injected persistence adapter.
- `src/services/constellation/index.js` — Supabase adapter using the existing configured client and auth service.
- `supabase/migrations/202609280002_constellation.sql` — reviewable migration and canonical seed.
- `supabase/tests/constellation.test.js` — actual migration tested in isolated PGlite PostgreSQL with Auth scaffolding.
- `tests/constellation.spec.js` — public/editor browser acceptance tests against an intercepted fake Supabase HTTP boundary.
- `tests/fixtures/constellation.json` — canonical 60-node test fixture; not used as a frontend fallback.
- `CONSTELLATION_IMPLEMENTATION_REPORT.md` — this handoff.

Generated review images:

- `review/constellation-desktop.png`
- `review/constellation-mobile.png`
- `review/constellation-editor.png`

The existing Observatory browser regression test also regenerated:

- `review/observatory-desktop.png`
- `review/observatory-mobile.png`

Local generated dependencies, npm cache, build output in `dist/`, and Playwright output in `test-results/` are tooling artifacts, not application source changes. This workspace has no Git repository, so this inventory records files written during implementation rather than a Git diff.

## Behavior

The public view initially displays MY INTERESTS and its ten direct children. Clicking or keyboard activation selects a node and expands/collapses its children. Collapsing clears descendant expansion state. The view supports background pan, wheel/button zoom, home/reset, hover, selected state, quiet parent-child lines, and path-to-root emphasis. Layout uses sorted hierarchy data and D3 tree with radial projection; no coordinates are persisted.

The owner editor reuses Observatory's session, login, logout, publishable key and owner ID. It supports recursive expand/collapse, adding children, editing name/description/status, subtree moves, sibling up/down reordering and confirmed leaf deletion. Root moves/deletion and descendant moves are blocked; parent deletion explains that children must first be moved/deleted. Every successful edit is persisted and reloaded from the service. Failed writes preserve the current form draft.

Existing Entrance, project pages and idea → now → completed logic are unchanged. Existing Observatory auth/client implementation and migration are unchanged. No out-of-scope graph, art, classification, tracking or search functionality was added.

## Tests run and results

- `npm test`: **34 passed, 0 failed**. Includes existing project lifecycle, map state, date and Observatory RLS regressions, plus tree validation, 100 extra nested levels, deterministic layout, progressive visibility, service permissions, and real SQL migration/integrity/RLS tests.
- `npm run test:browser`: **5 passed, 0 failed**, final run exited 0. Three Constellation tests cover progressive expansion/collapse, keyboard selection, root paths, pan/zoom/reset, stable reload, owner add/edit/move/reorder/delete, persistence over reload, invalid-parent choices, deletion rejection/confirmation, failed writes, logout and missing-migration recovery. Two existing Observatory tests pass unchanged. All backend traffic is intercepted at the fake test host.
- `npm run build`: **passed**, exit 0. Vite reports a large-chunk warning for the existing shared 3D bundle.
- Desktop/mobile public screenshots and editor screenshot inspected. Styling is intentionally basic; advanced mobile gestures are not part of v0.1.

Earlier browser runs exposed ambiguous select/textarea labels, fixed with explicit accessible names. Sandboxed Windows process cleanup hung after tests; the final browser run used approved process permissions and completed normally. The SQL tests are local only and do not establish deployed Supabase behavior. Multi-session contention was not exercised by the single-process PGlite tests.

## Migration to review and apply externally

**File: `supabase/migrations/202609280002_constellation.sql`**

Run the complete transaction manually in the intended project's Supabase SQL Editor after review. It expects the existing Observatory owner Auth user `4dde6af0-2fd6-4520-86a7-8241acb9c180`, matching `VITE_OBSERVATORY_OWNER_ID`. The UUID is public configuration, not a secret. This is a one-time migration, not a rerunnable seed script.

It creates:

- `public.constellation_nodes` with UUID identity, owner, parent, name, short description, four allowed statuses, integer sibling order and timestamps; no x/y columns.
- Owner-scoped parent FK, root uniqueness, sibling-order uniqueness, valid field constraints and parent index.
- Public SELECT and authenticated owner-only INSERT/UPDATE/DELETE RLS policies. Explicit privilege reset removes broad project-default grants, including TRUNCATE.
- Invoker-security integrity and write-lock triggers, preserving root identity and rejecting root deletion/moves, parent deletion, orphaning, identity changes and cycles even through direct writes.
- Invoker-security atomic `add_constellation_node`, `move_constellation_node`, and `reorder_constellation_nodes` functions. A transaction advisory lock serializes writes; stale-snapshot isolation is rejected. No SECURITY DEFINER bypass or frontend privileged credentials are used.
- Exactly **60 canonical nodes**, rooted at **MY INTERESTS** with the specified ten first-level interests, names, nesting and sibling order; default status `curious`.

## Blocked until migration is applied

- Loading the real persisted Constellation and canonical seed.
- All real owner editor writes.
- Live refresh-persistence and deployed RLS/integrity acceptance checks against Supabase.

The UI reports unavailable database/tree errors rather than displaying a pretend seeded tree. No external migration, deployment, or live acceptance step has been performed. Await the user's explicit confirmation that this SQL was reviewed and applied before continuing.

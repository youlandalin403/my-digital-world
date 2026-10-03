# Shared project system

Historical two-stage refactor report. The current three-stage implementation is documented in `CREATION_LIFECYCLE_REPORT.md`; current authoring instructions are in `content/PROJECT_AUTHORING.md`.

Implemented `PROJECT_CONTENT_SYSTEM.md` by refactoring the existing Gallery parser and Markdown detail renderer. There is one content source (`content/projects/*.md`), one Vite glob loader (`src/projects/loadProjects.js`), and one detail renderer (`src/projects/ProjectDetail.jsx`). No new dependencies were added.

## Migration and behavior

- All four existing Gallery records, including the user's `test.md`, moved into `content/projects/` as `stage: completed`, as required by the specification. Existing dates became `completed`, and categories became free-text `type`. The incomplete seed records retain their factual caveats.
- The existing screenshot asset moved to `public/projects/my-digital-world/`; cover and Markdown references were updated.
- Gallery retains its existing card styling, Featured Works, All Works, cover fallback, Markdown body, tags, and GitHub/demo rendering. Its input now contains only completed projects, sorted featured first and then completion date descending.
- Laboratory is a simple Now Board using the same collection, sorted by updated descending. It shows type, summary, current focus, update date, tags, and project links. Its initial empty state reflects that all existing Gallery records were deliberately preserved as completed.
- `/projects/:slug` is the canonical detail address for both stages. Existing `/gallery/:slug` URLs remain working aliases. The detail's return link follows the project's stage, and the body stays in its original Markdown file.
- Map Gallery and Laboratory ENTER both retain the existing transition and now open their respective views. Entrance and world geometry are unchanged.
- Removed the archive toggle and old status model. Only `now` and `completed` are valid. No project-management features, CMS, or database.

## Validation

Required fields: title, slug, stage, type, summary. Invalid files are isolated; duplicate slugs are checked globally. Stage-specific recommended metadata warns without excluding valid records. Invalid optional dates are omitted and sort last. Shared safe-link handling, cover fallback, Markdown rendering, and malformed-YAML handling are reused.

Twelve automated tests cover parsing, malformed/missing fields, strict stages, duplicate slugs across stages, recommended metadata, both sort orders, the content-only stage migration, safe URLs, canonical files/assets, and map state behavior. Build passes with the existing shared Three.js chunk-size advisory.

Browser acceptance used a separate temporary fixture (not the user's existing test project): it appeared only in Laboratory as `now`; changing only its stage and adding completion date made it appear only in Gallery. The exact canonical URL and Markdown body remained unchanged; the return link followed the new stage. No JSX changed during this acceptance test. The temporary fixture was then removed.

See `content/PROJECT_AUTHORING.md` for the new workflow. Production hosts still need an SPA fallback to `index.html` and a rebuild after content updates.

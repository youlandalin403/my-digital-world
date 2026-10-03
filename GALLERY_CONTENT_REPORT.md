# Gallery content system v0.1

Historical handoff: superseded by `PROJECT_SYSTEM_REPORT.md`. Current authoring uses `content/PROJECT_AUTHORING.md` and `content/projects/` with only `now` / `completed` stages.

Implemented `GALLERY_CONTENT_SPEC.md` as a local-file content layer. UI styling is intentionally basic; Entrance and map scene/geometry were not modified. Gallery ENTER retains the map's existing approach/fade and now navigates to `/gallery`. Other destinations retain their existing behavior.

## Structure

- `content/gallery/*.md`: three independent project records.
- `public/gallery/my-digital-world/cover.png`: actual existing map screenshot, reused as cover and Markdown image.
- `src/gallery/gallerySchema.js`: YAML/frontmatter parsing, validation, normalization, duplicate handling, sorting and view selection.
- `src/gallery/loadGalleryProjects.js`: Vite automatic content discovery.
- `src/gallery/GalleryPage.jsx`, `ProjectCard.jsx`, `ProjectDetail.jsx`: generic list, cover fallback, and Markdown detail rendering.
- `src/navigation.js`: small History API navigation layer, preserving ordinary anchor behavior for modified clicks/new tabs.
- `content/GALLERY_AUTHORING.md`: content schema, publishing instructions, assets and hosting requirements.

Two focused dependencies were added: `yaml` for YAML parsing and `react-markdown` for Markdown rendering without raw HTML execution. Gallery is lazy-loaded. No CMS, database, editor, backend, authentication, or interiors were added.

## Behavior

Featured Works and All Works derive from content. Featured projects precede newer dates, with deterministic slug ties. Archived records are hidden until explicitly included. Categories accept free text. Detail pages derive from `/gallery/:slug`; missing projects show a recovery link. Missing/failed covers use a neutral fallback; empty tags and links are omitted. Invalid required metadata skips only that record; development warnings identify the source file and problem. Duplicate slugs warn and skip the later filename.

Additional metadata is preserved without forcing authors to fill it. Standard Markdown is supported; raw HTML and MDX execution are disabled. GFM tables are outside this first version. Files are public build inputs, not protected storage. Production requires rebuilding after edits and an SPA fallback for direct URLs.

## Content limits

My Digital World describes the implemented site using verified local facts. AI Paper Assistant and Shampoo Analyzer are named by the specification, but no detailed project facts or URLs were provided. Their brief entries explicitly disclose the pending information; their `paused` status refers to unfinished catalog records, and dates refer to catalog creation. They should be updated with owner-confirmed project facts. No achievements, features, repositories, or demo URLs were invented.

## Verification

- Ten tests cover YAML structures, required fields, malformed files, dates/statuses, duplicate slugs, ordering, archived/featured selection, URL validation, seed content, and existing map state behavior.
- Production build passes; the existing shared 3D chunk advisory remains.
- Browser-verified production Gallery list, featured filtering, generated detail, Markdown body/image, direct detail refresh, map return, and map Gallery ENTER transition.
- Temporary content-only fixtures verified automatic discovery without component/route edits, arbitrary categories, archived opt-in, GitHub/demo controls, and broken-cover fallback.
- Browser diagnostics correctly reported a missing-fields file and a duplicate-slug file without crashing the Gallery. Fixtures were removed; the open deleted detail automatically became “Project not found”. Browser Back/Forward worked.
- Existing entrance baseline identifies a pre-existing timing change in `src/config/worldConfig.js` (3 / 0.5 / 1 seconds). This task leaves those settings intact.

Run `npm test` and `npm run build`. Preview `/gallery` directly or enter through the map.

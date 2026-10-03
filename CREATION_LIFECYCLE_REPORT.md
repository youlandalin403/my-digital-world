# Three-stage creation lifecycle

The shared system now accepts exactly `idea`, `now`, and `completed`. Existing owner edits placing Shampoo Analyzer and TEST PROJECT in `now` were retained. No existing project content was reclassified by this change.

## Implementation

- One unchanged Vite glob loader reads `content/projects/*.md`; the existing YAML parser, validation, error isolation, Markdown renderer, and canonical detail infrastructure are reused.
- Shared stage definitions supply names, list routes, date fields, and detail return links. `/projects/:slug` and the legacy `/gallery/:slug` alias work across all stages.
- Idea Garden lives at `/idea-garden`, selects only `idea`, and shows lightweight seed entries. Created dates sort descending with slug ties and missing dates last. Ideas require only the five common fields; `created` is recommended. No completion/work fields are required.
- Laboratory still selects `now`, sorts by updated date, and shows current focus. Gallery still selects `completed`, retains Featured/All Works, and sorts featured first then completion date. Existing cover and Markdown behavior is preserved.
- The world-map garden remains Locked. Its focused panel offers “View public seeds”, a public preview rather than a private-area ENTER. Memory Archive and My Room access behavior is unchanged.
- A minimal, explicitly non-sensitive `test-seed.md` is the only added content. No private idea content, extra workflow states, authentication, CMS, database, or project-management controls were added.

## Public content boundary

The garden preview is public. All Markdown matched by the existing eager glob is included in the client bundle; no claim is made that the map lock protects it. Real private ideas must stay outside the public application and its assets until a protected source is implemented. This release adds only a public test seed, and preserves the four existing public entries. Authoring instructions explicitly explain this boundary; hiding UI or adding metadata cannot make bundled content secret.

## Verification

Fifteen automated tests cover all three allowed stages, rejection of unsupported stages, minimal idea fields, all-stage exclusive selection, stable slug/body migration, date ordering, existing parsing/error handling, and map lock behavior. Production build passes; the existing shared Three.js size advisory remains.

Browser acceptance changed only `test-seed.md`: Idea Garden (1) → Laboratory (3) → Gallery (3). In each state the seed was absent from the other views. The same `/projects/test-seed` URL and body remained intact and its return link changed with the stage. The seed was restored to `idea` after verification, leaving the existing two Laboratory and two Gallery entries unchanged.

See `content/PROJECT_AUTHORING.md` for the content-only workflow and static hosting requirements.

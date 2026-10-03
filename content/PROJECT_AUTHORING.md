# Shared project content

The only public project source is `content/projects/*.md`. One file represents one item through `idea` → `now` → `completed`; all three views use the same loader and Markdown detail renderer. New files are automatically discovered by Vite. No imports, JSX edits, or route registrations are needed.

```yaml
---
title: Your project
slug: your-project
stage: idea
type: Project
summary: A short, factual description.
created: 2026-09-27
tags:
  - React
github: ""
demo: ""
---
```

Write Markdown after the closing delimiter. A seed can have only a few sentences. Standard Markdown supports headings, paragraphs, lists, links, images, blockquotes and fenced code. Raw HTML is ignored; content does not execute JavaScript. The existing Markdown renderer is shared across all stages.

Required fields: `title`, unique lowercase kebab-case `slug`, `stage`, free-text `type`, `summary`. Stage accepts exactly `idea`, `now`, or `completed`. Invalid required fields or malformed YAML skip only that record, with filename-specific development warnings. Duplicate slugs across the entire collection warn; the first valid filename in lexical order wins.

For `idea`, `created` is the only recommended extra field. Idea Garden lists seeds by created date descending, then slug, with undated seeds last. No cover, links, current focus, completion date, or case study is required. Change the same file to `stage: now` when starting work; its original body and slug remain intact.

For `now`, supply `updated` (`YYYY-MM-DD`) and `currentFocus`. Laboratory displays these with title, type, summary, and tags; newest updates appear first. Featured does not influence Laboratory ordering.

When finished, change the same file to `stage: completed`. Add `completed: YYYY-MM-DD`, optional `featured: true`, and `cover: /projects/your-project/cover.webp`. The project automatically leaves Laboratory and appears in Gallery. Keep or revise its existing Markdown body; there is no copying, migration button, or second record.

Gallery retains Featured Works and All Works. Both contain only completed projects, sorted by featured first, completion date descending, then slug for ties. Missing dates sort last within the featured group. Missing recommended fields warn without hiding a valid project. Missing or failed covers use the existing fallback; absent tags/links/focus/dates leave no empty UI.

Put assets under `public/projects/<slug>/` and reference them as `/projects/<slug>/filename`. GitHub/demo links accept HTTP(S) URLs. Other optional metadata is retained for future content use, but no extra workflow states are supported.

Canonical detail URLs are `/projects/:slug`, independent of stage. Existing `/gallery/:slug` URLs still render the same item, including after its stage changes. The return link follows its current stage: Idea Garden, Laboratory, or Gallery. The list routes are `/idea-garden`, `/laboratory`, and `/gallery`; `/map` returns to the world.

The earlier Gallery migration retained existing catalog dates and factual caveats. Later owner edits to stages are preserved. The sparse AI Paper Assistant and Shampoo Analyzer records still need owner-confirmed details. `test-seed.md` is a deliberately non-sensitive public demonstration, not a real private idea.

## Public content boundary

Every file matched by `content/projects/*.md` is imported into public JavaScript, regardless of its stage. Do not place real private ideas, private attachments, or credentials in this directory, `public/`, or any other client import. Keep private source material outside this public application until a protected data source is implemented. No private content store or permission system is introduced here.

The map's Idea Garden remains Locked and offers a clearly labeled public-seeds preview. The preview and `/projects/:slug` URLs are public. A lock icon, hidden card, or client-side filter provides no access control. Only non-sensitive/test Idea content should be added now; there is no supported `private` metadata switch that could make bundled Markdown secret.

Development automatically refreshes content changes. Production requires `npm run build` and redeployment. Configure the production host to serve `index.html` for unmatched application routes; Vite dev/preview already handles direct detail refresh. Only public content belongs in this folder.

Run `npm test` and `npm run build` before publishing. There is no database, CMS, admin, progress tracking, or project-management system.

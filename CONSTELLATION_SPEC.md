# CONSTELLATION_SPEC.md

## My Digital World — Constellation v0.1

Status: **Functional specification frozen for v0.1**

Constellation is the user's personal interest tree rendered as an explorable star map.

It is **not**:
- a world knowledge map,
- a general knowledge graph,
- a force-directed network,
- a productivity tracker,
- a project manager.

Its purpose is to answer:

> What worlds am I interested in, and how do those interests branch into more specific directions?

---

# 1. Core Concept

Constellation is one recursive rooted tree.

```text
MY INTERESTS
├── Computing
│   ├── Web & App Development
│   └── ...
├── AI
│   ├── LLM & NLP
│   └── ...
└── ...
```

Any node may have children. A child node may later become a parent simply by receiving children.

There are no cross-domain edges in v0.1.

Every non-root node has exactly one parent.

---

# 2. Tree Rules

## Root

There is exactly one root node:

```text
MY INTERESTS
```

Rules:
- `parent_id = null`
- cannot be deleted
- cannot be moved under another node
- its display name may be editable
- there must never be more than one root for the owner

## Ordinary nodes

Every ordinary node:
- has exactly one parent
- may have zero or more children
- may exist at any depth
- is uniquely identified by `id`, not by name

## No cycles

The tree must never contain cycles.

Moving a node under itself or any descendant must be rejected.

Validation should exist in both:
1. frontend/service layer
2. database-side move operation

## Moving nodes

Moving a node moves its entire subtree.

## Deleting nodes

Leaf nodes may be deleted.

Nodes with children may **not** be directly deleted in v0.1.

The UI should report that the children must first be moved or deleted.

Do not implement recursive branch deletion in v0.1.

## Ordering

Siblings have a deterministic `sort_order`.

The owner may reorder sibling nodes.

The order is used as an input to the automatic layout so that the map remains stable.

---

# 3. Node Data Model

Use one table:

```text
constellation_nodes
```

Recommended fields:

```text
id
owner_id
name
parent_id
description
status
sort_order
created_at
updated_at
```

## Field meanings

### id
Unique UUID for the node.

### owner_id
Supabase Auth user UUID for the owner.

Keep this even though v0.1 has only one owner.

### name
Visible node label. Required.

### parent_id
Nullable self-reference to `constellation_nodes.id`.

Only the root has `parent_id = null`.

### description
Optional short description.

Do not turn this into a full notes/wiki system in v0.1.

### status

Allowed values:

```text
curious
exploring
active
deep
```

Default:

```text
curious
```

Status represents the user's relationship to an interest, not progress.

It may later control visual intensity such as star brightness, size, or glow.

### sort_order
Integer ordering among siblings.

Used to make automatic layout deterministic.

### created_at / updated_at
Standard timestamps.

---

# 4. No Stored Coordinates

Do **not** store:

```text
x
y
```

in v0.1.

Constellation uses automatic deterministic layout.

The database stores the **structure**.

The frontend computes the **visual positions**.

Pipeline:

```text
Supabase nodes
    ↓
construct hierarchy
    ↓
sort children by sort_order
    ↓
radial tidy-tree layout
    ↓
computed x/y
    ↓
render star map
```

The same tree + same sibling order should produce a stable layout.

---

# 5. Layout

Use an automatic deterministic radial tree layout.

Recommended approach:

```text
D3 hierarchy
+
D3 tree / tidy tree
+
radial projection
```

Do not use a force-directed simulation in v0.1.

Desired structure:

```text
Depth 0
MY INTERESTS
→ center

Depth 1
major interests
→ first ring

Depth 2
directions
→ next ring

Depth 3+
more specific interests
→ progressively farther outward
```

Sibling branches should stay visually grouped.

The layout should be tidy and readable rather than physically simulated.

No manual coordinate dragging is required.

---

# 6. Public Constellation Interaction

## Default view

On first open, show:

```text
MY INTERESTS
+
all first-level interests
```

Deeper descendants remain collapsed.

## Expand / collapse

Click a node:
- collapsed node → show its direct children
- expanded node → hide its descendants

This is progressive disclosure.

Do not render the entire tree at once by default.

## Hover

Hovering a node should:
- emphasize the star
- show or strengthen its label
- subtly emphasize relevant parent/child connection(s)

## Selection

Selecting a node may:
- visually focus it
- emphasize the path back to `MY INTERESTS`
- show its short description
- show a lightweight breadcrumb

Example:

```text
MY INTERESTS / AI / LLM & NLP / RAG
```

## Navigation

Support:
- pan
- zoom
- reset/home view

Mobile advanced gesture polish is not required in v0.1.

## Parent-child lines

Parent-child edges exist automatically because of `parent_id`.

They should be visually quiet by default.

They may become more visible on hover/selection.

No manually created edges exist.

---

# 7. Owner Editor

Owner authentication must reuse the existing Supabase Auth system already used by Observatory.

Visitors do not see editing controls.

The editor is a recursive tree-management interface, not a star-position editor.

## Required operations

Owner can:

```text
Add child
Edit
Move
Reorder
Delete leaf
Expand/collapse editor tree
```

## Add child

From a selected node:

```text
+ Add child
```

Fields:

```text
name
description (optional)
status
```

Defaults:

```text
status = curious
sort_order = last sibling + 1
```

## Edit

Editable fields:

```text
name
description
status
```

Do not add progress percentages, priority, difficulty, tags, or learning metrics.

## Move

Owner may move a node to a new parent.

Move must:
- reject moving root
- reject moving under itself
- reject moving under a descendant
- preserve the entire subtree
- assign an appropriate new sibling order

Prefer a database-side atomic function for this operation.

## Reorder

Owner may reorder nodes among the same siblings.

This changes only `sort_order`.

Dragging within the editor list is acceptable.

This is **not** manual star-position dragging.

Prefer atomic reorder logic so partial order updates cannot persist.

## Delete

Leaf:

```text
Delete
→ confirm
→ delete
```

Parent with children:

```text
Delete
→ reject
→ tell owner to move/delete children first
```

The root cannot be deleted.

---

# 8. Supabase Permissions

Constellation is public-readable.

## Visitor

```text
SELECT ✅
INSERT ❌
UPDATE ❌
DELETE ❌
```

## Owner

```text
SELECT ✅
INSERT ✅
UPDATE ✅
DELETE ✅
```

Use:

```text
Supabase Auth
+
auth.uid()
+
Row Level Security
```

Authorization must be enforced in the database.

Do not rely on frontend hiding.

Do not expose:
- service_role
- secret key
- database password

to the frontend.

---

# 9. Database Integrity Requirements

The migration should enforce or safely support:
- one owner root only
- self-referencing parent FK
- owner-scoped rows
- valid status values only
- deterministic sibling ordering
- timestamps
- RLS
- visitor public read
- owner-only write
- no deleting a node that still has children
- no invalid move that creates a cycle

Prefer database functions for:

```text
move_constellation_node(...)
reorder_constellation_nodes(...)
```

if needed to keep multi-step operations atomic.

Security must remain invoker/owner-safe and must not accidentally bypass RLS.

---

# 10. Initial Seed Content

Seed the initial interest tree automatically.

Do not require the user to manually enter all initial nodes.

Canonical v0.1 seed:

```text
MY INTERESTS

├── Computing
│   ├── Web & App Development
│   ├── Computer Graphics / 3D
│   ├── Game Development
│   ├── Software Engineering
│   ├── Systems & Infrastructure
│   └── Human-Computer Interaction
│
├── AI
│   ├── Machine Learning / Deep Learning
│   ├── LLM & NLP
│   ├── Agents
│   ├── Multimodal & Generative AI
│   ├── World Models
│   ├── Embodied AI
│   └── AI Infra
│
├── English
│   ├── Speaking & Natural Expression
│   ├── Listening
│   ├── Reading in English
│   ├── Writing in English
│   └── Language & Culture
│
├── Finance
│   ├── Personal Finance
│   ├── Investing
│   ├── Financial Markets
│   ├── Economics
│   └── Quantitative Finance
│
├── Art & Making
│   ├── Digital Painting / 板绘
│   ├── Visual Design
│   └── Crafts / 手作
│       └── Crochet / 钩织
│
├── Writing
│   ├── Fiction
│   │   ├── Character
│   │   ├── Plot
│   │   └── Worldbuilding
│   ├── Essays / Non-fiction
│   └── Journaling
│
├── Reading
│   ├── Literature & Fiction
│   ├── Philosophy & Ideas
│   ├── History & Society
│   ├── Science & Technology
│   └── Essays / Biography / Non-fiction
│
├── Music
│   ├── Piano
│   ├── Classical Music
│   │   └── Music Appreciation
│   └── Music Theory
│
├── Film & Television
│   ├── Film
│   ├── Television
│   ├── Animation
│   └── Film Appreciation / Criticism
│
└── Games
    ├── Playing / Game Experiences
    ├── Game Design
    └── Game Art & Worlds
```

Notes:
- `Game Development` lives under `Computing` only.
- English reading/writing are named `Reading in English` / `Writing in English` to avoid ambiguity with the top-level `Reading` / `Writing`.
- More nodes may be added later through the editor.
- Do not pre-populate speculative interests that the user has not chosen.

---

# 11. v0.1 Must Implement

## Public view
- load nodes from Supabase
- construct recursive hierarchy
- deterministic sibling ordering
- automatic radial tidy-tree layout
- root + first-level nodes visible by default
- click to expand/collapse
- pan
- zoom
- reset/home
- hover state
- selected-node state
- subtle parent-child lines
- path-to-root highlighting
- stable layout across refreshes

## Owner editor
- owner-only access
- recursive tree display
- add child
- edit node
- change status
- move node
- reorder siblings
- delete leaf
- reject deletion of parent with children
- reject moving root
- reject cycle-producing moves
- persist every successful operation in Supabase

## Backend
- migration for `constellation_nodes`
- RLS policies
- integrity constraints
- atomic move/reorder support if needed
- initial seed data

---

# 12. Explicitly Out of Scope for v0.1

Do **not** implement:

```text
3D nebula systems
particle effects
final visual art direction
complex star animations
force-directed physics
manual star coordinate dragging
cross-domain links
AI-generated relationships
AI auto-classification
AI node suggestions
search
tags
favorites
learning progress
percentages
priority
difficulty
timeline/history
version history
node Markdown pages
node images/covers
multi-user editing
friend collaboration
invitation system
advanced mobile gesture polish
analytics
streaks
gamification
```

Do not turn Constellation into a knowledge-management application.

---

# 13. Acceptance Tests

1. Initial view: root + first-level interests visible; deep nodes collapsed.
2. Click AI: direct children expand.
3. Click AI again: descendants collapse.
4. Owner adds `AI → AI Safety`; refresh; node remains.
5. Move `AI Safety` to another parent; refresh; move persists.
6. Reorder AI children; layout updates deterministically and persists after refresh.
7. Delete a leaf node; succeeds.
8. Attempt to delete a node with children; rejected.
9. Attempt to move a node beneath its own descendant; rejected.
10. Log out; Constellation remains readable, editing is unavailable, direct writes are rejected by RLS.
11. Refresh the same tree repeatedly; nodes do not randomly reshuffle.

---

# 14. Implementation Architecture

Keep database access out of presentation components.

Recommended structure:

```text
UI
↓
constellationService
↓
Supabase adapter
↓
Supabase
```

Suggested service operations:

```text
getConstellationTree()
createNode(...)
updateNode(...)
moveNode(...)
reorderSiblings(...)
deleteNode(...)
```

Rendering should consume normalized tree data rather than issuing Supabase queries directly.

---

# 15. Codex Handoff

Implement `CONSTELLATION_SPEC.md` as the next functional stage of My Digital World.

Preserve all existing systems:

```text
Entrance
World Map
Idea Garden
Laboratory
Gallery
Observatory
idea → now → completed lifecycle
existing Supabase owner authentication
existing Observatory behavior
```

Requirements:

1. Implement only Constellation v0.1 described here.
2. Keep visual styling minimal and functional.
3. Use Supabase for persistent data.
4. Use database-level RLS and integrity protection.
5. Use a deterministic radial tidy-tree layout; do not use force-directed physics.
6. Seed the canonical interest tree from this spec.
7. Do not add features listed as out of scope.
8. Add local/unit/browser tests where appropriate.
9. Generate the database migration SQL.
10. **Do not assume or claim the migration has been applied.**
11. Stop before applying any external Supabase migration and tell the user exactly which SQL/migration must be run.
12. Do not expose service-role or secret keys in frontend code.

After implementation, report:

```text
files changed
tests run
migration file path
what remains blocked until migration is applied
```

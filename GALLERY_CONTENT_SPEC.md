# My Digital World — Gallery Content System Specification

## 1. Goal

构建一个 **content-driven Gallery system**。

核心原则：

> 新增一个 Gallery 作品，不应该需要修改 Gallery 页面组件代码。

Gallery UI 和 Gallery 内容必须解耦。

---

# 2. Content Source

Gallery 内容统一放在：

```text
content/gallery/
```

每个作品对应一个独立内容文件。

推荐：

```text
content/gallery/
├── ai-paper-assistant.md
├── shampoo-analyzer.md
├── my-digital-world.md
└── ...
```

---

# 3. Content Format

第一版优先使用：

**Markdown + frontmatter**

如果项目当前已有成熟的 MDX 方案，也可以使用 MDX。

默认优先保持简单。

---

# 4. Project Schema

每个作品至少包含以下 metadata：

```yaml
---
title:
slug:
date:
summary:
cover:
category:
status:
featured:
tags:
github:
demo:
---
```

建议完整 schema：

```yaml
---
title: My Digital World
slug: my-digital-world
date: 2026-09-27

summary: >
  A personal digital world built as an immersive spatial website.

cover: /gallery/my-digital-world/cover.webp

category: Web

status: active

featured: true

tags:
  - React
  - Three.js
  - React Three Fiber
  - Vibe Coding

github: ""
demo: ""
---
```

---

# 5. Required Fields

必须存在：

- `title`
- `slug`
- `date`
- `summary`
- `category`
- `status`

`cover` 建议存在，但允许在缺失时使用 fallback。

---

# 6. Optional Fields

允许：

- `featured`
- `tags`
- `github`
- `demo`
- `cover`
- `year`
- `role`
- `collaborators`
- `tech`
- `links`

不要为了“完整”强制用户填写太多 metadata。

第一版保持轻量。

---

# 7. Status Values

第一版统一使用：

```text
completed
active
paused
archived
```

Gallery 默认主要展示：

- completed
- active

不要默认展示 archived，除非用户主动切换。

---

# 8. Category

第一版 category 允许自由文本，但建议保持有限集合。

例如：

```text
AI
Web
Research
Art
Experiment
Other
```

不要在代码中把 category 写死成不可扩展枚举。

---

# 9. Gallery Loading

Gallery 页面应自动读取：

```text
content/gallery/*
```

新增文件后：

> Gallery 自动发现新项目。

不应该需要手动：

- import 新项目
- 修改数组
- 增加 `<ProjectCard />`
- 修改路由表

---

# 10. Vite Integration

优先使用 Vite 原生能力，例如：

```js
import.meta.glob(...)
```

自动发现 Gallery 内容。

不要为这个功能引入不必要的大型 CMS 或数据库。

---

# 11. Content Parsing

系统应解析：

1. frontmatter metadata
2. Markdown 正文

输出统一 project object。

概念结构：

```js
{
  title,
  slug,
  date,
  summary,
  cover,
  category,
  status,
  featured,
  tags,
  github,
  demo,
  content
}
```

---

# 12. Sorting

默认排序：

1. `featured: true`
2. date descending

如果 featured 相同：

> newer project first

---

# 13. Gallery Views

Gallery v0.1 至少支持：

### Featured Works

显示 `featured: true` 的项目。

### All Works

显示全部公开项目。

暂时不需要复杂 filter UI。

---

# 14. Project Detail

点击一个作品：

进入：

```text
/gallery/:slug
```

项目详情页从对应 Markdown 自动生成。

不要为每个项目手写页面组件。

---

# 15. Detail Page Content

Project Detail 至少支持：

- title
- date
- summary
- cover
- tags
- Markdown body
- GitHub link
- demo link

如果某字段不存在：

不要显示空按钮或空区域。

---

# 16. Assets

每个项目资源放在：

```text
public/gallery/<slug>/
```

例如：

```text
public/gallery/my-digital-world/
├── cover.webp
├── map.webp
├── entrance.webp
└── gallery.webp
```

Markdown 中直接引用这些资源。

---

# 17. Cover Fallback

如果项目没有 cover：

使用一个统一 fallback。

不要：

- 页面报错
- broken image
- 随机生成 AI 图

---

# 18. Validation

在开发模式下，如果内容文件缺少关键字段，应：

- console warning
- 指出具体文件
- 指出缺少字段

但不要直接导致整个网站崩溃。

---

# 19. Slug Rules

slug 应：

- unique
- lowercase
- kebab-case

例如：

```text
my-digital-world
ai-paper-assistant
shampoo-analyzer
```

如果 slug 重复，应给出开发警告。

---

# 20. Public / Private Consideration

Gallery 默认只处理公开内容。

未来如需更复杂 visibility，可以扩展：

```yaml
visibility: public
```

但 Gallery v0.1 不需要实现权限系统。

---

# 21. Separation of Concerns

建议拆成：

```text
gallery/
├── loadGalleryProjects
├── GalleryPage
├── ProjectCard
├── ProjectDetail
└── galleryTypes / schema
```

内容加载逻辑和 UI 不要混在一起。

---

# 22. Future CMS Compatibility

当前内容结构必须方便以后增加：

- Decap CMS
- custom admin UI
- Git-based editor

因此：

不要把 Gallery 内容存在组件代码里。

不要建立只能通过手改 JavaScript 才能更新的系统。

---

# 23. Future Admin Goal

未来理想体验：

```text
/admin
  ↓
New Project
  ↓
填写 metadata
  ↓
上传 cover
  ↓
写 Markdown
  ↓
Publish
  ↓
生成 content/gallery/*.md
  ↓
Gallery 自动更新
```

当前阶段不用实现 `/admin`。

只需要保证内容结构兼容未来 CMS。

---

# 24. Seed Content

第一版至少加入 3 个真实项目作为示例：

- My Digital World
- AI Paper Assistant
- Shampoo Analyzer

不要生成大量虚构项目。

内容可以先简短，但必须是真实项目。

---

# 25. What NOT to Build

此阶段不要实现：

- CMS
- admin dashboard
- database
- authentication
- rich text editor
- upload backend
- cloud image storage
- complex filter system
- search engine
- recommendation system

只做：

> content layer + automatic loading + project detail generation

---

# 26. Acceptance Criteria

Gallery Content System 完成，当：

- `content/gallery/` 存在
- 每个项目是独立内容文件
- frontmatter 能被正确解析
- Gallery 自动发现项目
- 新增项目不需要改 Gallery 组件
- Featured Works 自动生成
- All Works 自动生成
- `/gallery/:slug` 能显示详情
- cover 和 Markdown body 正常显示
- 缺字段时不会导致全站崩溃
- slug 重复有 warning
- 没有数据库依赖
- 没有 CMS 依赖
- 未来可以接 Git-based CMS

最重要的一项：

> Adding a project should feel like adding content, not programming a feature.

---

# 27. Definition of Done

Done 不代表：

> Gallery 已经视觉上非常漂亮。

Done 代表：

> Gallery 已经拥有一个可以长期生长的内容系统。

视觉设计在下一阶段进行。

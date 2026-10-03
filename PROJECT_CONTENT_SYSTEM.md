# My Digital World — Unified Creation Lifecycle

## 1. Core Lifecycle

统一内容系统现在只有三个阶段：

```text
idea
  ↓
now
  ↓
completed
```

对应三个空间：

```text
stage: idea
→ IDEA GARDEN
→ What might become something.

stage: now
→ LABORATORY
→ What I'm working on now.

stage: completed
→ GALLERY
→ What I've made.
```

不要加入：

```text
paused
archived
abandoned
draft
```

---

## 2. One Item, One Markdown File

每个创作对象只保存一份 Markdown：

```text
content/projects/<slug>.md
```

不要因为阶段变化复制文件。

阶段迁移只通过修改：

```yaml
stage:
```

完成。

---

## 3. Idea Stage

一个新灵感最开始可以非常轻量：

```yaml
---
title: Digital Aquarium
slug: digital-aquarium
stage: idea
type: Project
created: 2026-09-27

summary: >
  A digital aquarium where old thoughts sink and new thoughts float.

tags:
  - Web
  - Generative Art
---
```

正文可以只有几句话。

Idea 阶段不要求：

- cover
- github
- demo
- currentFocus
- completed date
- detailed case study

记录灵感应该尽可能低摩擦。

---

## 4. Idea Garden View

Idea Garden 自动读取：

```js
stage === 'idea'
```

它代表：

> seeds, unfinished possibilities, questions, fragments, and things that may become projects.

可以包含：

- 网站想法
- 游戏机制
- AI 项目
- 研究问题
- 论文方向
- 小说设定
- 绘画构想
- 其他创作种子

不要把 Idea Garden 做成项目管理器。

---

## 5. Move Idea → Laboratory

当一个灵感真的开始执行：

```yaml
stage: idea
```

改成：

```yaml
stage: now
updated: 2026-10-02

currentFocus: >
  Building the first prototype.
```

保存后：

```text
Idea Garden ❌
Laboratory ✅
```

同一个 Markdown 文件继续使用。

---

## 6. Laboratory

Laboratory 只显示：

```js
stage === 'now'
```

它表示：

> What is currently on Yunhan's desk.

内容包括：

- Research
- Competition
- Project
- Paper Replication
- Experiment

推荐字段：

```yaml
updated:
currentFocus:
```

不要实现：

- completed section
- paused section
- archived section
- progress management
- kanban

---

## 7. Move Laboratory → Gallery

项目完成后：

```yaml
stage: now
```

改成：

```yaml
stage: completed
completed: 2026-12-01
cover: /projects/example/cover.webp
featured: true
```

保存后：

```text
Laboratory ❌
Gallery ✅
```

---

## 8. Gallery

Gallery 只显示：

```js
stage === 'completed'
```

它表示：

> Finished work that is ready to be exhibited.

Gallery 可以要求或建议：

```yaml
completed:
cover:
featured:
```

原本在 Idea / Laboratory 阶段留下的 Markdown 正文继续保留。

---

## 9. Shared Loader

继续只使用一个：

```text
loadProjects()
```

读取：

```text
content/projects/*.md
```

然后：

```js
const ideaItems =
  projects.filter(item => item.stage === 'idea')

const laboratoryItems =
  projects.filter(item => item.stage === 'now')

const galleryItems =
  projects.filter(item => item.stage === 'completed')
```

不要分别创建三套 loader。

---

## 10. Stage Validation

`stage` 只允许：

```text
idea
now
completed
```

其他值产生开发 warning。

---

## 11. Required Fields

所有阶段共同需要：

```text
title
slug
stage
type
summary
```

Idea 阶段建议：

```text
created
```

Now 阶段建议：

```text
updated
currentFocus
```

Completed 阶段建议：

```text
completed
cover
```

缺失可选字段不应导致全站崩溃。

---

## 12. Canonical Route

继续使用统一详情地址：

```text
/projects/:slug
```

不要因为项目从 Garden → Lab → Gallery 改变 URL。

---

## 13. Lifecycle Example

```yaml
---
title: AI Vlog Generator
slug: ai-vlog-generator
stage: idea
type: Project
created: 2026-09-27

summary: >
  Automatically generate short character-driven AI vlogs.
---
```

开始制作：

```yaml
stage: now
updated: 2026-10-10

currentFocus: >
  Testing automatic scene generation and editing.
```

完成：

```yaml
stage: completed
completed: 2026-12-15

cover: /projects/ai-vlog-generator/cover.webp
featured: true
```

对应：

```text
IDEA GARDEN
      ↓
LABORATORY
      ↓
GALLERY
```

---

## 14. Privacy Warning for Idea Garden

Idea Garden 在世界设定中是 Locked。

当前项目仍然主要是静态前端。

因此：

> Do not put sensitive/private real ideas into the production static bundle yet.

隐藏 UI 或显示锁图标不等于真正的访问控制。

在 Authentication + Database 权限系统实现前：

- 可以使用非敏感 Idea
- 可以使用测试 Idea
- 可以实现迁移逻辑
- 不要把真正私密内容直接打包进公开构建产物

以后再把 Idea Garden 的真实私人内容迁移到受保护的数据源。

---

## 15. Acceptance Test

创建：

```text
content/projects/test-seed.md
```

内容：

```yaml
---
title: TEST SEED
slug: test-seed
stage: idea
type: Project
created: 2026-09-27

summary: >
  Testing the three-stage creation lifecycle.
---
```

第一次：

```text
Idea Garden ✅
Laboratory ❌
Gallery ❌
```

改：

```yaml
stage: now
updated: 2026-09-27
currentFocus: Testing the Laboratory stage.
```

预期：

```text
Idea Garden ❌
Laboratory ✅
Gallery ❌
```

再改：

```yaml
stage: completed
completed: 2026-09-27
```

预期：

```text
Idea Garden ❌
Laboratory ❌
Gallery ✅
```

整个过程中：

**不修改任何 React 页面组件。**

---

## 16. Definition of Done

最终系统应满足：

```text
one item
one Markdown file
one canonical URL
one stage field

idea
↓
Idea Garden

now
↓
Laboratory

completed
↓
Gallery
```

核心原则：

> Ideas grow into work.
> Work grows into finished things.

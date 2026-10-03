# My Digital World — MVP 0.1 Specification

## 1. Goal

MVP 0.1 只验证一件事：

> 能否仅通过浏览器中的程序化 3D 场景，让访问者产生“我正在进入一个真实存在的地方”的感觉？

这一阶段不是完整网站。

不是 Portfolio。

不是功能开发阶段。

它只是：

# Entrance Prototype

最终体验应为：

**Forest → Reveal → White Building → Welcome → ENTER**

---

# 2. Core Success Moment

整个 MVP 最重要的一刻是：

> 用户从较为密集的植物环境中缓慢向前移动，视野逐渐打开，一个被植物侵入的巨大白色建筑第一次完整出现。

此时镜头速度降低。

随后出现：

**Welcome to Yunhan Lin's Digital World.**

以及：

**ENTER**

如果这一刻没有足够的：

- 空间感
- 尺度感
- 安静感
- 神秘感
- 自然感
- 呼吸感

则 MVP 视为尚未完成。

不要通过增加更多功能掩盖视觉问题。

---

# 3. User Experience

## Stage 0 — Loading

用户打开网站。

屏幕进入简单 Loading 状态。

要求：

- 极简
- 不使用复杂 loading animation
- 不做科技感 loading HUD
- 不出现大量说明文字

加载完成后平滑进入场景。

---

# 4. Stage 1 — Forest

用户最初处于植物较密集的区域。

视觉特点：

- 前景存在叶片 / 枝条
- 中景存在树木与草
- 远处暂时无法完整看到建筑
- 光线透过植物
- 空气存在轻微雾感

目的：

> 压缩用户视野。

建筑不能一开始就完整暴露。

---

# 5. Stage 2 — Movement

镜头缓慢向前。

Camera movement 必须：

- smooth
- slow
- deliberate
- cinematic

不要：

- WASD
- FPS control
- OrbitControls
- rapid zoom
- sudden rotation
- camera shake

MVP 0.1 使用：

**guided camera path**

用户暂时不需要自由探索。

---

# 6. Stage 3 — First Glimpse

镜头移动过程中，建筑第一次短暂出现。

只能看到：

- 一部分墙面
- 柱子
- 入口
- 建筑轮廓

随后可以再次被：

- 树木
- 藤蔓
- 前景植物

部分遮挡。

这一阶段目的是制造：

**discovery**

而不是直接展示。

---

# 7. Stage 4 — Reveal

植物开始变稀。

视野突然打开。

建筑第一次完整成为画面主体。

场景构图：

```text
FOREGROUND
植物 / 草 / 枝条

MIDGROUND
路径 / 台阶 / 柱子 / 小型植物

BACKGROUND
巨大白色建筑
```

建筑必须明显大于正常住宅尺度。

应让访问者感觉：

> 自己相对于建筑非常小。

---

# 8. Stage 5 — Pause

建筑完整出现后：

镜头速度明显下降。

允许画面停留。

不要立即跳 UI。

先让用户看世界。

建议存在短暂的纯视觉阶段。

---

# 9. Stage 6 — Welcome

随后 HTML Overlay 淡入。

内容：

**Welcome to Yunhan Lin's Digital World.**

下方：

**ENTER**

UI 必须：

- minimal
- quiet
- readable
- unobtrusive

不要：

- navbar
- project cards
- social icons
- hamburger menu
- scroll indicator
- progress HUD
- extra introduction paragraph

MVP 0.1 此刻只需要一句 Welcome 和一个 ENTER。

---

# 10. ENTER Behavior

点击 ENTER 后：

MVP 0.1 不需要真正进入完整建筑。

允许以下任一临时行为：

### Preferred

镜头开始向入口缓慢推进。

随后 fade to black。

显示：

> The world continues from here.

### Acceptable

镜头停留，触发简单状态变化，证明 interaction 正常。

不要因此开始实现：

- Atrium
- Gallery
- Laboratory
- Observatory

这些属于后续版本。

---

# 11. Technical Stack

使用：

- Vite
- React
- Three.js
- React Three Fiber
- @react-three/drei

可以根据需要增加非常少量辅助依赖。

新增依赖前应确认是否真的必要。

---

# 12. 3D Asset Policy

MVP 0.1 默认：

**No Blender dependency.**

优先使用程序化 geometry。

可以使用：

- BoxGeometry
- PlaneGeometry
- CylinderGeometry
- SphereGeometry
- BufferGeometry
- Curve
- Instancing
- simple generated shapes

复杂模型不是本阶段目标。

如果某个效果必须依赖外部 asset，应先判断：

> 是否可以用简单 geometry 达到足够好的视觉效果？

---

# 13. Architecture Prototype

建筑不需要成为完整可进入建筑。

它首先是一个：

**cinematic background landmark**

需要具备：

- 巨大尺度
- 白色 / 暖白色材质
- 入口
- 柱子或大型垂直结构
- 台阶 / platform
- 大型 opening
- 明确 silhouette

可以使用简单 geometry 拼装。

---

# 14. Architecture Style

倾向：

- monumental
- minimal
- sanctuary-like
- greenhouse-like
- modern ruin
- slightly classical

不要：

- sci-fi spaceship
- cyberpunk city
- gothic horror castle
- ordinary modern house
- fantasy RPG castle
- overly detailed palace

---

# 15. Vegetation Prototype

植物主要承担：

1. 空间遮挡
2. 前中后景层次
3. 建筑与自然融合
4. 镜头运动参照物
5. 世界生命感

至少需要：

- trees
- grass / ground vegetation
- foreground foliage
- vegetation around architecture

可选：

- vines
- small flowers
- moss

---

# 16. Vegetation Rules

植物不能平均随机撒满整个场景。

必须存在：

**density variation**

例如：

```text
dense
 ↓
medium
 ↓
opening
 ↓
architecture
```

特别关注建筑与植物的接触关系。

植物应该：

- 沿墙生长
- 出现在台阶缝隙
- 靠近柱子
- 部分遮挡建筑结构

不要只是：

> 建筑一边，树木另一边。

---

# 17. Performance Strategy

MVP 必须从一开始考虑性能。

原则：

- 重复植物尽量使用 InstancedMesh
- 避免大量独立 draw calls
- 几何体保持简单
- 不使用高成本后期效果作为视觉核心
- 避免超高 polygon count
- 控制 particle count
- 控制 shadow caster 数量

Desktop 优先。

但代码结构不得完全堵死未来 mobile fallback 的可能性。

---

# 18. Lighting

目标：

**quiet cinematic daylight**

至少包含：

- 环境基础光
- 一个明确的 sunlight direction
- 有意义的阴影

光线需要帮助表现：

- 建筑体积
- 植物层次
- 空间深度

不要依赖 Bloom 把画面“变漂亮”。

---

# 19. Fog / Atmosphere

允许使用：

- subtle fog
- distant haze
- small number of floating particles

效果必须克制。

空气粒子应该满足：

> 不注意时几乎感觉不到，但去掉后世界会更死。

---

# 20. Motion

整个场景应持续存在非常轻微的生命感。

优先实现：

- grass sway
- leaf sway
- subtle particle movement

不要所有物体同时以相同频率运动。

不要做明显循环动画感。

---

# 21. Camera Path

优先使用：

- spline
- CatmullRomCurve3
- parameterized camera positions

Camera Path 必须集中定义。

不要把大量相机位置 hardcode 在多个组件中。

例如：

```text
cameraPath
├── forestStart
├── firstReveal
├── occlusion
├── clearing
└── buildingReveal
```

以后应该可以快速修改路径。

---

# 22. Parameterization

尽量将关键视觉参数集中管理。

例如：

```text
WORLD_CONFIG
├── fog
├── sunlight
├── cameraSpeed
├── plantDensity
├── buildingScale
├── colors
└── particleCount
```

目的：

方便快速视觉迭代。

用户可能会提出：

- “树再密一点”
- “建筑大 30%”
- “雾少一些”
- “镜头慢一点”
- “植物颜色不要这么鲜艳”

这些修改不应该需要重写整个场景。

---

# 23. Component Structure

建议结构：

```text
src/
├── App
├── world/
│   ├── Experience
│   ├── CameraRig
│   ├── Environment
│   ├── Lighting
│   ├── Forest
│   ├── Trees
│   ├── GroundVegetation
│   ├── Building
│   ├── Atmosphere
│   └── Entrance
│
├── ui/
│   ├── LoadingScreen
│   └── WelcomeOverlay
│
├── config/
│   └── worldConfig
│
└── styles/
```

具体文件结构可以根据实际情况调整。

核心原则：

> 不要把整个 3D 世界写在一个巨大组件里。

---

# 24. What NOT to Build

MVP 0.1 明确禁止主动开发：

- Gallery
- Laboratory
- Observatory
- Idea Garden
- Memory Archive
- Constellation
- Guestbook
- My Room
- Diary
- Authentication
- Invitation system
- Database
- CMS
- Admin dashboard
- Blog
- Project detail pages
- Mobile navigation
- Full building interior

即使这些功能已经存在于 PROJECT_BRIEF.md 中，也不要在 MVP 0.1 实现。

---

# 25. Effects NOT Needed Yet

除非存在明确视觉理由，否则不要主动增加：

- Bloom
- chromatic aberration
- lens flare
- depth of field
- motion blur
- film grain
- heavy SSAO
- complicated shader effects
- water simulation
- volumetric clouds

首先解决：

**geometry + composition + camera + lighting**

---

# 26. Visual Anti-Patterns

如果结果出现以下情况，应主动修改：

### Generic AI Portfolio

表现：

- 紫色渐变
- glowing text
- glass cards
- neon buttons

→ Remove.

---

### Three.js Demo Feeling

表现：

- 一些 random primitive
- 空旷背景
- 没有构图
- 没有空间关系

→ Improve composition.

---

### Game Feeling

表现：

- WASD
- HUD
- crosshair
- excessive controls

→ Remove.

---

### Asset Dump

表现：

- 很多树
- 很多石头
- 很多植物
- 但没有视觉重点

→ Reduce assets and rebuild composition.

---

### Overdesign

表现：

- 太多粒子
- 太多 shader
- 太多光
- 太多动画

→ Simplify.

---

# 27. Implementation Order

严格按照以下顺序推进：

## Step 1

创建干净的 React Three Fiber 项目。

确认：

- 页面运行
- Canvas 正常
- camera 正常
- resize 正常

---

## Step 2

只制作灰盒场景：

- ground
- simple forest blockers
- white building blocks
- camera path

不处理精细材质。

目标：

验证构图。

---

## Step 3

调整：

- camera
- scale
- distance
- building silhouette
- forest opening

直到 reveal 成立。

---

## Step 4

加入基础：

- daylight
- shadows
- fog

---

## Step 5

替换 placeholder vegetation。

逐渐加入：

- trees
- grass
- foreground leaves

---

## Step 6

加入轻微 motion。

---

## Step 7

加入：

- Loading Screen
- Welcome Overlay
- ENTER

---

## Step 8

Performance pass。

---

# 28. Iteration Rule

每一轮修改优先顺序：

1. Composition
2. Camera
3. Scale
4. Lighting
5. Vegetation
6. Atmosphere
7. Motion
8. Effects

不要反过来。

---

# 29. Review Checklist

第一次 Review 时回答以下问题：

### Space

- 建筑看起来够大吗？
- 我感觉自己在世界里，而不是看一张 3D 插画吗？
- 前景 / 中景 / 背景是否清楚？

### Camera

- 移动舒服吗？
- Reveal 是否太早？
- 建筑出现有没有“发现”的感觉？

### Nature

- 植物与建筑真正发生关系了吗？
- 还是只像摆在建筑旁边？

### Atmosphere

- 世界有空气感吗？
- 是否太暗？
- 是否过度 cinematic？
- 是否太像游戏？

### Identity

- 它有没有开始像 My Digital World？
- 还是任何人的 Three.js portfolio 都可以长这样？

---

# 30. Acceptance Criteria

MVP 0.1 可以结束的最低标准：

- 页面稳定运行
- 完成程序化 3D Entrance Scene
- 镜头拥有明确进入路径
- 建筑不会一开始就完全暴露
- 存在完整 reveal moment
- 建筑具备明显尺度感
- 白色建筑 + 绿色植物视觉关系成立
- 光影具备基本空间表现
- 存在克制的 atmosphere
- Welcome UI 正常出现
- ENTER 可以交互
- 不需要 Blender
- 不需要数据库
- 不存在明显控制台错误
- 代码已经组件化
- 关键视觉参数易于调整

最重要的一项：

> 当用户第一次看到建筑完整出现时，这一帧本身值得截图保存。

如果做不到这一点：

继续调整 MVP 0.1。

不要进入 v0.2。

---

# 31. Definition of Done

MVP 0.1 的 Done 不是：

> “功能都写好了。”

而是：

> “入口终于有感觉了。”

技术只是支持这个目标。

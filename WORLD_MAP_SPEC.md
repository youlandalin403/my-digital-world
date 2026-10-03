# My Digital World — Public World Map Specification

## 1. Goal

这一阶段的目标是：

> 在现有 Entrance Experience 之后，构建一个可交互的 Public World Map，作为 My Digital World 的主要导航层。

整体流程：

**Cinematic Entrance → ENTER → Fade → Public World Map**

World Map 不是普通 Sitemap。

它应该让用户感觉：

> 我现在看见了这个世界的结构，并且可以选择去哪里。

---

# 2. View Style

使用：

**semi-isometric / elevated 3D overview**

建议相机俯角：

约 35°–50°。

不要：

- 完全垂直俯视
- 第一人称视角
- FPS 导航
- 自由乱转 OrbitControls

目标是同时看见：

- 建筑平面布局
- 建筑高度
- 道路关系
- 植物
- 区域层级

参考 The Growing Valley 的“世界总览作为导航”思路，但不复制其具体场景或视觉风格。

---

# 3. Core Visual Identity

保持现有 My Digital World 世界观：

> monumental white architecture × nature reclamation

World Map 应继续使用：

- warm white architecture
- green vegetation
- pale sky
- restrained color palette
- quiet daylight
- atmospheric depth

避免变成：

- cute game map
- fantasy RPG village
- low-poly toy world
- dashboard visualization

它仍然应该属于同一个 Digital World。

---

# 4. Main Layout

Public World Map 第一版包含：

- Gallery
- Laboratory
- Observatory
- Constellation access point
- Idea Garden
- Memory Archive
- Guestbook
- My Room / Protected Area
- Central Courtyard

推荐空间关系：

```text
                       CONSTELLATION
                            ✦
                            │
                      OBSERVATORY
                            │
                  ┌─────────┴─────────┐
                  │   MAIN COMPLEX    │
                  │                   │
             GALLERY             LABORATORY
                  │                   │
                  └───────┬───────────┘
                          │
                  CENTRAL COURTYARD
                     ANCIENT TREE
                    /      |       \
                   /       |        \
         IDEA GARDEN   MAIN PATH   ARCHIVE
             🔒                       🔒
                   \               /
                    \             /
                      REAR PATH
                          │
                      GUESTBOOK
                          │
                         EXIT


                distant / quieter zone

                      MY ROOM 🔑
```

具体布局允许根据构图调整。

---

# 5. Central Courtyard

Central Courtyard 是 World Map 的视觉中心。

建议存在：

**Ancient Tree**

它承担：

- 地图视觉锚点
- 道路分流中心
- 世界观象征
- 自然与建筑关系的核心表达

古树不需要极度复杂。

第一版优先保证：

- silhouette
- scale
- position
- surrounding architecture relationship

---

# 6. Gallery

Gallery 应：

- 靠近主要公共区域
- 明亮
- 开放
- 容易识别
- 建筑轮廓相对整洁

代表：

> 已经完成并愿意展示的内容。

第一版只需要在地图层明确它的位置和可点击状态。

不要实现 Gallery 内部。

---

# 7. Laboratory

Laboratory 应：

- 和 Gallery 形成空间呼应
- 稍微更复杂
- 更具有实验感
- 可以看到小型结构 / 设备轮廓

代表：

> 正在发生的项目与研究。

不要在地图阶段加入大量实验室细节。

---

# 8. Observatory

Observatory 应位于：

**更高的位置。**

可以通过：

- tower
- elevated platform
- rooftop structure
- tall dome-like or open structure

体现高度。

它应从 World Map 第一眼就能辨认。

---

# 9. Constellation Access

Constellation 不应像普通建筑。

它更像：

- Observatory 上方的天空区域
- elevated platform
- star access point
- open circular platform

World Map 中只需要暗示：

> 这里通向更大的知识 / 思想网络。

暂时不要实现完整 force graph。

---

# 10. Idea Garden

Idea Garden：

- visible
- beautiful
- locked

建议形态：

- greenhouse
- enclosed garden
- overgrown glass structure

用户可以：

- focus
- hover
- click

但不能进入。

显示：

**IDEA GARDEN**

以及：

**LOCKED / STILL GROWING**

不要隐藏这个区域。

---

# 11. Memory Archive

Memory Archive 应具有：

**downward / underground visual language**

例如：

- descending stairs
- recessed entrance
- partially buried structure
- shadowed lower level

它代表：

> excavation of the past

同样：

可见，但 locked。

---

# 12. Guestbook

Guestbook 放在：

**rear path / exit area**

形式倾向：

- mailbox
- small pavilion
- letter station

在地图上不需要巨大。

它应该像一个安静的小细节。

---

# 13. My Room

My Room 属于 Protected Area。

建议不要放在主建筑群内部。

可以位于：

- distant garden
- separated path
- small hill
- across a bridge
- behind trees

视觉上：

- smaller
- warmer
- more intimate
- light visible from window

普通访问者可以看到它存在。

点击后显示：

**INVITATION REQUIRED**

不要实现 authentication yet。

---

# 14. Navigation Bar

World Map 顶部加入简洁导航：

```text
GALLERY
LABORATORY
OBSERVATORY
CONSTELLATION
MAP
GUESTBOOK
```

MAP 为当前状态时高亮。

不要：

- oversized UI
- cards
- dashboard panels
- heavy borders

导航应像世界的一部分，而不是盖在世界上的 SaaS navbar。

---

# 15. Navigation Interaction

点击顶部导航项：

例如：

**LABORATORY**

应发生：

1. camera smoothly moves
2. Laboratory becomes centered / emphasized
3. corresponding map label highlights
4. other regions slightly reduce prominence
5. optional short description appears

不要直接立即切页面。

---

# 16. Map Interaction

点击地图中的建筑也应触发同样逻辑。

例如点击 Gallery：

- camera focuses Gallery
- `GALLERY` navbar item highlights
- label highlights
- focus state appears

Navigation 和 map selection 必须双向同步。

---

# 17. Focus State

当某个区域被 focus：

建议显示：

- building name
- one-line meaning
- ENTER button

例如：

**LABORATORY**

> Things currently being tested, studied, and built.

**ENTER**

不要显示大量介绍文字。

---

# 18. ENTER Behavior

在 World Map 中点击某区域的 ENTER：

当前阶段可以：

- camera moves closer
- fade to black
- show temporary placeholder

例如：

> Laboratory begins here.

不要开始实现对应内部内容。

World Map 阶段只需要证明导航结构成立。

---

# 19. Locked Interaction

点击 locked 区域：

不进入。

显示简短反馈。

Idea Garden：

> Still growing.

Memory Archive：

> Access restricted.

My Room：

> Invitation required.

避免使用普通浏览器 alert。

反馈应保持世界感。

---

# 20. Labels

地图上允许显示简洁 label：

- GALLERY
- LABORATORY
- OBSERVATORY
- IDEA GARDEN
- MEMORY ARCHIVE
- GUESTBOOK

标签应：

- readable
- minimal
- visually integrated
- not permanently overwhelming

可以根据距离 / focus 状态调节透明度。

---

# 21. Camera

World Map camera 应：

- guided
- bounded
- smooth

不需要完全自由操作。

允许：

- focus transitions
- slight user-controlled pan if useful
- subtle parallax

不要：

- unrestricted orbit
- upside-down angles
- extreme zoom
- game-style movement

---

# 22. World Motion

地图需要轻微“活着”。

可以加入：

- tree sway
- grass movement
- subtle water motion
- cloud shadows
- small particles
- observatory slow rotation
- laboratory tiny light animation

所有 motion 必须克制。

---

# 23. Roads and Paths

道路承担视觉导航。

每个区域最好通过：

- stone path
- stair
- bridge
- corridor
- garden path

连接。

用户应仅通过构图就大致理解：

> 哪些空间彼此相连。

---

# 24. Visual Hierarchy

地图视觉优先级：

1. Central Courtyard / Ancient Tree
2. Main Complex
3. Gallery / Laboratory
4. Observatory
5. Idea Garden / Archive
6. Guestbook
7. My Room

不要让所有建筑视觉权重一样。

---

# 25. Scale

虽然采用俯视地图，但不要把建筑做成玩具尺寸感。

通过：

- realistic proportions
- shadow
- vegetation scale
- stairs
- columns
- camera focal length

保持：

> miniature overview without toy feeling.

---

# 26. Performance

继续遵守：

- procedural geometry
- instancing
- simple materials
- restrained shadows
- reasonable DPR
- limited draw calls

World Map 会包含更多区域，因此性能比 Entrance 更重要。

不要一次加载未来所有复杂内部内容。

---

# 27. State Model

建议建立清晰的 world selection state。

例如概念上：

```text
currentMode:
  entrance
  map
  focus
  transition

selectedPlace:
  null
  gallery
  laboratory
  observatory
  constellation
  garden
  archive
  guestbook
  room
```

不要把导航状态散落在大量组件里。

---

# 28. Components

建议结构可以类似：

```text
world-map/
├── WorldMap
├── MapCamera
├── MainComplex
├── CentralCourtyard
├── AncientTree
├── GalleryBuilding
├── LaboratoryBuilding
├── Observatory
├── IdeaGarden
├── MemoryArchive
├── Guestbook
├── ProtectedRoom
├── Paths
├── MapLabels
└── WorldMapUI
```

不强制具体文件名。

核心原则：

> each place should remain independently adjustable.

---

# 29. What NOT to Build Yet

此阶段不要实现：

- Gallery content
- Laboratory content
- Observatory daily records
- Constellation force graph
- Idea Garden content
- Memory Archive content
- Guestbook backend
- authentication
- invitation system
- Room interior
- Diary
- database
- CMS

只做：

**World Map + Navigation + Focus interactions**

---

# 30. Implementation Order

## Step 1

Preserve completed Entrance.

---

## Step 2

After ENTER fade, switch to basic World Map greybox.

---

## Step 3

Create map camera and general terrain.

---

## Step 4

Block out:

- Main Complex
- Gallery
- Laboratory
- Observatory
- Garden
- Archive
- Guestbook
- Room

using simple geometry.

---

## Step 5

Fix composition and map hierarchy before details.

---

## Step 6

Add roads and visual connections.

---

## Step 7

Add Ancient Tree and vegetation distribution.

---

## Step 8

Add navigation bar and labels.

---

## Step 9

Implement selection / focus camera behavior.

---

## Step 10

Implement locked states.

---

## Step 11

Add restrained environmental motion.

---

## Step 12

Performance review.

---

# 31. Review Checklist

## Map Readability

- Can I immediately understand that this is one world?
- Can I identify the major destinations?
- Is the central structure obvious?

## Navigation

- Does navbar → building focus work?
- Does building click → navbar highlight work?
- Is returning to MAP easy?

## Architecture

- Does the map still belong to the Entrance world?
- Or does it suddenly look like another game?

## Hierarchy

- Is there a clear visual center?
- Are secondary areas actually secondary?

## Locked Spaces

- Do locked areas feel intriguing rather than disabled?

## Identity

- Does this feel like Yunhan's Digital World?
- Or like a generic low-poly world map?

---

# 32. Acceptance Criteria

World Map stage is complete when:

- Entrance remains intact
- ENTER transitions cleanly into World Map
- semi-isometric world overview works
- major areas are visually identifiable
- Central Courtyard exists
- Ancient Tree acts as a visual anchor
- navbar works
- buildings can be clicked
- navigation and map selection stay synchronized
- camera focus transitions are smooth
- locked regions provide proper feedback
- content interiors are not yet implemented
- performance remains acceptable
- no major console errors

Most importantly:

> The user should understand the world by looking at it before reading instructions.

---

# 33. Definition of Done

Done does not mean:

> every building is detailed.

Done means:

> the world finally has a readable geography.

Stop here.

Do not automatically implement the interiors.

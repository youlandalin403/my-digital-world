# My Digital World — Observatory Daily Specification

## 1. Goal

Observatory 的意义是：

> **Observe the passage of my own time.**

v0.1 只实现 **Daily**。

一天对应一份 Daily Record：

```text
2026-09-27

PLAN
☑ Finish data structure notes
☐ Work on My Digital World
☐ Prepare group meeting

REFLECTION
Today...
```

核心验收：

> 今天写下的东西，刷新之后还在；几个月甚至几年后，仍然可以回来看这一天。

---

## 2. Scope

v0.1 只实现：

```text
Daily Record
├── Date
├── Plan / Tasks
│   ├── Add
│   ├── Edit
│   ├── Check / Uncheck
│   ├── Delete
│   └── Order
│
├── Reflection
│
├── Visibility
│   ├── private
│   └── public
│
└── Date Navigation
```

暂时不要实现：

```text
Monthly Review
Yearly Review
Birthday Review
Mood tracking
Habit tracking
Productivity score
Streaks
Analytics
AI summaries
Calendar heatmap
Notifications
```

---

## 3. Observatory Is Not a Todo App

不要把 Observatory 做成：

```text
Productivity Dashboard
```

它不是为了评价：

> 今天效率高不高？

而是为了留下：

> 今天我准备做什么？
> 今天发生了什么？

因此不要加入：

```text
82% PRODUCTIVITY
🔥 27 DAY STREAK
GOOD / BAD DAY
```

---

## 4. Storage

Observatory 不使用 Markdown 作为每日记录的存储方式。

使用：

```text
React
  ↓
Data service
  ↓
Supabase
  ↓
PostgreSQL
```

原因：

Daily 是高频编辑内容，需要：

- 实时新增
- 修改
- 勾选
- 删除
- 保存
- 跨设备读取

---

## 5. Database

第一版使用两张表。

### `daily_records`

```text
id
owner_id
date
reflection
visibility
created_at
updated_at
```

其中：

```text
visibility:
private
public
```

默认：

```text
private
```

并且：

```text
(owner_id, date)
```

必须唯一。

也就是说：

> 同一个用户、同一天，只存在一份 Daily Record。

---

### `daily_tasks`

```text
id
record_id
text
done
position
created_at
updated_at
```

一个 `daily_record` 可以拥有多个 task。

关系：

```text
daily_record
     │
     ├── task
     ├── task
     ├── task
     └── task
```

---

## 6. Date

Daily 的核心字段使用：

```text
DATE
```

例如：

```text
2026-09-27
```

不要用服务器 UTC 时间直接决定“今天是哪一天”。

前端根据**浏览器本地日期**生成 Daily key。

因为：

> Observatory 的一天，是用户生活中的一天，而不是服务器的一天。

`created_at` / `updated_at` 使用 timestamp。

---

## 7. Today Behavior

进入 Observatory：

```text
获取浏览器今天日期
        ↓
查询 daily_records
        ↓
有记录？
   ↙          ↘
 YES          NO
 ↓             ↓
读取          显示空白 Daily
```

不需要用户每天手动创建页面。

---

## 8. Tasks

用户可以：

```text
+ Add task
```

创建：

```text
□ Build Observatory
```

点击：

```text
□
```

变成：

```text
☑ Build Observatory
```

刷新页面后：

```text
☑ Build Observatory
```

仍然保持完成状态。

支持：

- add
- edit
- check
- uncheck
- delete

`position` 为以后拖拽排序预留。

v0.1 不要求 drag-and-drop。

---

## 9. Reflection

每一天包含一个自由文本 Reflection：

```text
Reflection

今天……
```

第一版普通 multiline textarea 即可。

不要先做 Rich Text Editor。

保存后必须写入数据库。

---

## 10. Saving

第一版优先：

```text
Reflection
→ explicit SAVE
```

任务的：

```text
add
check
edit
delete
```

可以直接持久化。

暂时不需要复杂实时协作。

以后如果体验需要，再把 Reflection 改成 debounce auto-save。

---

## 11. Date Navigation

至少支持：

```text
← Previous Day

September 27, 2026

Next Day →
```

也可以有：

```text
TODAY
```

用于立即回到今天。

点击过去：

```text
Sep 26
```

读取：

```text
Sep 26 record
```

而不是修改今天的数据。

---

## 12. Empty Day

如果某一天没有记录：

不要报错。

显示：

```text
September 25, 2026

No record for this day.

PLAN
+ Add

REFLECTION
...
```

只有真正产生内容时再创建数据库记录也可以。

不要提前给未来几十年生成空记录。

---

## 13. Privacy

默认所有 Daily：

```text
visibility: private
```

Owner 登录后：

```text
private + public
都能看
```

普通访客：

```text
public
才能看
```

这必须是数据库层权限，而不是单纯：

```js
if (!loggedIn) hideContent()
```

---

## 14. Owner Permissions

Owner：

```text
SELECT  ✅
INSERT  ✅
UPDATE  ✅
DELETE  ✅
```

自己的所有 records。

普通访客：

```text
private record

SELECT ❌
INSERT ❌
UPDATE ❌
DELETE ❌
```

对于：

```text
visibility = public
```

普通访客：

```text
SELECT ✅
INSERT ❌
UPDATE ❌
DELETE ❌
```

---

## 15. Task Permissions

Task 的读取权限跟随其所属 Daily Record。

例如：

```text
daily_record
visibility = private
        ↓
tasks
private
```

而：

```text
daily_record
visibility = public
        ↓
tasks
public read-only
```

普通访客永远不能修改你的 task。

---

## 16. Authentication

v0.1 可以只实现一个 Owner Account。

暂时不需要：

```text
public sign-up
friend accounts
invitation system
roles
admin management
```

只需要做到：

```text
Yunhan login
    ↓
recognized owner
    ↓
can edit Observatory
```

---

## 17. Security Rule

不要把管理员密钥放进 Vite 前端。

前端只能使用适合客户端使用的 Supabase key，并依靠 Auth + RLS 控制实际权限。

尤其不能把能够绕过 RLS 的高权限密钥放入浏览器代码。

---

## 18. Data Layer

不要让 React 页面到处直接写：

```js
supabase.from(...)
```

建立一层：

```text
src/
  services/
    observatory/
      dailyRecords.js
      dailyTasks.js
```

暴露概念接口，例如：

```js
getDailyRecord(date)

saveReflection(date, reflection)

addTask(date, text)

updateTask(taskId, changes)

deleteTask(taskId)

setVisibility(date, visibility)
```

页面只关心：

> 我要读取 / 保存什么。

而不是数据库具体怎么查。

---

## 19. UI State

页面至少区分：

```text
loading
ready
saving
error
```

不要让网络慢时看起来像内容消失。

例如：

```text
Saving...
```

完成后：

```text
Saved
```

即可。

不需要复杂 Toast 系统。

---

## 20. Failure Behavior

数据库请求失败时：

不要：

```text
静默失败
```

至少显示：

```text
Could not save.
Try again.
```

同时在开发环境输出具体错误。

尤其不能出现：

> 页面上看起来保存了，实际上数据库没写进去。

---

## 21. Public Observatory

v0.1 不需要重点制作访客版。

但数据层必须允许未来：

```text
visitor
↓
Observatory
↓
only public records
```

如果当天是 private：

普通访客不应得到正文数据。

---

## 22. Future Growth

Daily 跑通以后，未来可以加入：

```text
Observatory

Daily
│
├── Sep 27
├── Sep 28
└── ...

Monthly
│
├── September
└── October

Yearly
│
└── 2026

Birthday
│
└── 19
```

但是这些**不是当前 scope**。

---

## 23. Visual Scope

现在只要求：

```text
Readable
Usable
Stable
Responsive enough
```

不要花时间做：

```text
Observatory tower animation
star shaders
planet UI
fancy calendar
glass cards
complex transitions
```

美术阶段以后统一做。

---

## 24. Acceptance Test

必须实际完成下面这条链：

```text
登录
 ↓
打开今天
 ↓
添加三个 Task
 ↓
勾掉一个
 ↓
写 Reflection
 ↓
SAVE
 ↓
刷新浏览器
 ↓
所有内容仍然存在
```

然后：

```text
进入昨天
↓
写另一份内容
↓
返回今天
↓
今天的数据完全没有改变
```

然后退出登录：

```text
private daily record
↓
无法读取
```

再测试一条：

```text
visibility = public
↓
退出登录
↓
可以读取
↓
但不能修改
```

全部成立才算完成。

---

## 25. Definition of Done

Observatory Daily v0.1 的 Done 不是：

> 页面已经很好看。

而是：

> I can write down a day, leave, and come back to it later.

也就是：

```text
Time passes.

The record remains.
```

---

## Codex Handoff

Implement `OBSERVATORY_DAILY_SPEC.md` as the next functional stage.

Keep the visual layer deliberately minimal.

Use Supabase for persistent storage and authentication, and protect private records with database-level Row Level Security rather than frontend-only hiding.

Implement only:

- Daily records
- tasks
- reflection
- date navigation
- visibility
- owner authentication
- persistence

Do not implement:

- Monthly
- Yearly
- Birthday
- analytics
- streaks
- AI summaries
- final visual design

Preserve all existing Entrance, World Map, Idea Garden, Laboratory, Gallery, and unified `idea → now → completed` project lifecycle behavior.

If external Supabase setup or environment variables are required, stop and clearly report exactly what must be configured before continuing.

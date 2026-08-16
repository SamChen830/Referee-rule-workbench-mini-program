# 团队协作开发流程说明 · Referee Rule Workbench Mini Program

> 本文是团队协作的**唯一流程入口**：讲清楚分支怎么开、任务怎么分、进度怎么同步、怎么发版。
> 配套细节文档：路线图 [`docs/ROADMAP.md`](docs/ROADMAP.md)、Git/CI 详规 [`docs/GIT_WORKFLOW.md`](docs/GIT_WORKFLOW.md)、文档总索引 [`docs/INDEX.md`](docs/INDEX.md)。

---

## 0. 一句话原则

**所有进展以「合入 `master` 的 PR」为准；未合入不算完成；文档即进度。**

---

## 1. 项目与技术栈速览

- 原生微信小程序，**无构建步骤**，数据前端内置（`data/*.js`）。
- 4 个页面：`index`（工作台）/ `rule-detail`（规则）/ `mech-detail`（裁判法）/ `practice`（答题）。
- 工具链：`scripts/`（上传 / 清洗）、`check.js`（本地自检）、`.github/workflows/`（CI/CD）。
- 详细见 [`README.md`](README.md) 与目录结构。

---

## 2. 新成员第一次环境准备

```bash
git clone https://github.com/SamChen830/Referee-rule-workbench-mini-program.git
cd Referee-rule-workbench-mini-program
node check.js            # 校验数据完整性（需本机有 Node，版本见 README）
```

- 用「微信开发者工具」导入本项目目录；AppID 先用测试号，发布前由负责人替换为真实 AppID。
- 国内网络若 `git push` 连不上 GitHub（443 超时）：给 git 配代理（端口按你本机代理软件填，常见 v2rayN=`10808` / Clash=`7890`）：

  ```bash
  git config --global http.proxy http://127.0.0.1:10808
  git config --global https.proxy http://127.0.0.1:10808
  # 推完不想走代理时取消：
  # git config --global --unset http.proxy && git config --global --unset https.proxy
  ```

- 发布密钥（`WECHAT_UPLOAD_KEY`）**仅发布负责人**在 GitHub Secrets 配置，普通成员无需也不应持有。

---

## 3. 分支策略（GitFlow-lite）

| 分支 | 用途 | 合入目标 |
|---|---|---|
| `master` | 长期主干，始终可构建、可发布 | — |
| `develop`（推荐后续启用） | 集成分支，日常功能先合到这里 | `master` |
| `feature/<主题>` | 功能开发（短生命周期） | `master` / `develop` |
| `fix/<主题>` | Bug 修复 | `master` |
| `release/vX.Y.Z` | 发布准备（只改版本号 / 文档） | `master` + 打 tag |
| `hotfix/<主题>` | 线上紧急修复 | `master` + 补丁 tag |

**规则：**

- **禁止**直接向 `master` push 功能代码；一律走 **PR + Review + CI 绿**。
- 分支名小写中划线：`feature/quiz-grouping`、`fix/mech-digit-noise`。
- 当前仓库只有 `master`（已设为默认分支），前几轮可直接开 PR 合入 `master`；协作展开后建议新建 `develop` 做集成。

**日常开发：**

```bash
git switch -c feature/xxx master
# 开发 + 本地 node check.js 必须通过
git add -p && git commit -m "fix(mech): 修复裁判法数字误插"
git push -u origin feature/xxx        # → 到 GitHub 开 PR 到 master
```

---

## 4. 任务分配

以 **GitHub Issues** 作为最小任务单元：**一个 Issue = 一个可交付项**（功能 / 修复 / 文档 / 调研）。

**标签体系**（在 Issue 上打标签，便于筛选与统计）：

| 维度 | 标签 |
|---|---|
| 类型 | `type:feature` · `type:bug` · `type:docs` · `type:chore` · `type:research` |
| 领域 | `area:rules` · `area:mech` · `area:quiz` · `area:ui` · `area:data` · `area:ci` |
| 优先级 | `priority:high` · `priority:medium` · `priority:low` |

**版本与里程碑**：每个版本建一个 **Milestone**（如 `v1.1.0`），把本版本相关 Issue 挂上去。

**认领流程：**

1. 从 Backlog / 当前 Milestone 挑任务 → 在 Issue 里把 **Assignee** 设为自己（即认领）。
2. 把任务卡到看板「进行中」列。
3. 完成后开 PR 关联 Issue（`Closes #12`），合并即视为交付。

**看板（推荐）**：GitHub **Projects** 建一个 Kanban，列建议：`待办 / 进行中 / 评审中 / 已完成 / 已发布`。

**数据改动特别要求**：任何 `data/*.js` 改动必须走 PR + `node check.js` 全绿，禁止破坏结构；大改动拆成小 PR 便于 review。

---

## 5. 进度同步方式

- **单一事实源 = [`docs/ROADMAP.md`](docs/ROADMAP.md)**：每个版本的目标 / 已完成 / 待办在此维护。Issue 关闭后，维护人同步把对应勾选项打勾。
- **同步节奏：**
  - 每日：成员在自己认领的 Issue 下简短评论进展（或站会口头同步）。
  - 每次合并：PR 描述用 `Closes #12` 关联 Issue，合并即推进进度。
  - 每周 / 每版本末：维护人更新 `ROADMAP.md` 并做版本回顾。
- **代码即进度**：所有可见进展以「合入 `master` 的 PR」为准；本地分支、未合入的 PR 不计入「已完成」。
- **脉络与审计**：新人想了解来龙去脉，读 [`docs/claw-session-progress.md`](docs/claw-session-progress.md)；具体数据审计见 [`docs/step0~5-*`](docs/) 与 [`docs/clean-linebreaks-*`](docs/)。
- **文档导航**：全量文档与阅读时机见 [`docs/INDEX.md`](docs/INDEX.md)。

---

## 6. 提交规范（Conventional Commits）

格式：`type(scope): 简述`（type 用英文便于工具解析，简述中文化无妨）

| type | 含义 |
|---|---|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档 |
| `style` | 不影响逻辑的清洗 / 格式（如换行重排） |
| `refactor` | 重构 |
| `test` / `ci` / `chore` / `build` | 测试 / CI / 杂项 / 构建 |

示例：

```
feat(quiz): 新增错题按章节组卷
fix(mech): 修复 M2 术语表缩写错位
style(content): 重排清洗 data/rules.js 句中误换行 (v1.0.3)
docs: 新增团队协作流程说明 CONTRIBUTING
chore(release): 版本升至 v1.0.3
```

关联需求用 `Refs #12` / `Closes #12`。

---

## 7. 版本与发布

- 语义化版本 `MAJOR.MINOR.PATCH`；**版本单一可信源 = `config.js` 的 `APP_VERSION`**。
- 发版四步：
  1. 从 `master` 切 `release/vX.Y.Z`
  2. 改 `config.js` 的 `APP_VERSION` / `RELEASE_NAME` / `BUILD_TIME`
  3. `node check.js` + 微信开发者工具预览通过 → 合回 `master`
  4. `git tag vX.Y.Z && git push origin vX.Y.Z`
- ⚠️ 打 `v*` tag 会触发 `deploy.yml` 自动上传微信开发版，需先在仓库 **Settings → Secrets** 配 `WECHAT_UPLOAD_KEY`，且 `config.js` 的 `APP_VERSION` **必须等于** tag 版本号，否则 deploy 报错退出。
- 不想自动上传：先 `git push origin master`（不带 tag），Secret 就绪后再 `git push origin vX.Y.Z`；或到 Actions 手动 **Run workflow** 填版本号触发。

---

## 8. 协作红线

- 密钥 `scripts/private.key` / `*.key` 已被 `.gitignore` 忽略，**严禁提交**；仅发布负责人在 CI Secret 保管。
- 禁止直推 `master` 功能代码；必须 PR + Review + CI 绿。
- `data/*.js` 改动必带 `node check.js`。
- 合并冲突先在本地解决再 push。

---

## 9. 文档导航

- 本文（协作流程总入口）
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — 版本路线图与任务清单
- [`docs/GIT_WORKFLOW.md`](docs/GIT_WORKFLOW.md) — 分支 / 提交 / 发版 / CI 详规
- [`docs/INDEX.md`](docs/INDEX.md) — 全量文档索引与阅读时机

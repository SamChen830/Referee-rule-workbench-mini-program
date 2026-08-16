# Git 工作流与协作规范

> 适用仓库：`Referee-rule-workbench-mini-program`（原生微信小程序，无构建步骤）
> 目标：小团队协作清晰、可追溯；CI 自动校验；发布可控、密钥不入库。
> 配套文档：[ROADMAP.md](ROADMAP.md)（迭代与任务清单）。

---

## 1. 分支模型（GitFlow-lite）

| 分支 | 用途 | 来源 | 合入目标 |
|---|---|---|---|
| `master` | 长期主干，始终可构建、可发布 | — | — |
| `develop`（可选） | 集成分支，日常功能先合到这里 | `master` | `master` |
| `feature/<主题>` | 功能 / 修复分支（短生命周期） | `master` 或 `develop` | `master`/`develop` |
| `release/vX.Y.Z` | 发布准备（冻结功能，只改版本号/文档） | `master` | `master` + 打 tag |
| `hotfix/<主题>` | 线上紧急修复 | `master` | `master` + 补丁 tag |

约定：
- 当前仓库暂只有 `master`，前几轮可直接在 `master` 上以 **PR** 合入；后续建议新建 `develop`。
- 分支名小写中划线：`feature/linebreak-clean`、`fix/mech-digit-noise`。
- **禁止**直接向 `master` push 功能代码；一律走 PR + Review + CI 绿。

---

## 2. 提交规范（Conventional Commits）

格式：`type(scope): 简述`（type 用英文字段便于工具解析；简述中文化无妨）

| type | 含义 |
|---|---|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档 |
| `style` | 不影响逻辑的格式/内容清洗（如换行重排） |
| `refactor` | 重构 |
| `perf` | 性能 |
| `test` | 测试 |
| `build` | 构建/依赖 |
| `ci` | CI/CD |
| `chore` | 杂项/版本 |
| `revert` | 回滚 |

scope（可选）：`rules` / `mech` / `quiz` / `ui` / `ci` / `release` / `tools` / `docs` …

示例：
```
feat(quiz): 新增错题重练自动移出
fix(mech): 修复 M2 术语表缩写错位
style(content): 重排清洗 data/rules.js 句中误换行 (v1.0.3)
docs: 新增开发路线图 ROADMAP
chore(release): 版本升至 v1.0.3
```
正文可换行说明"为什么"；关联需求用 `Refs #12` / `Closes #12`。

---

## 3. 日常开发流程

1. `git switch -c feature/xxx master`
2. 开发 + 本地 **`node check.js` 必须通过**
3. 提交（遵循 CC 规范）
4. `git push -u origin feature/xxx` → GitHub 开 PR 到 `master`
5. ≥1 名协作者 Review；CI（`ci.yml`）绿
6. 合并（squash 或 merge，团队约定）→ 删除功能分支

---

## 4. 版本与发布

- 语义化版本 `MAJOR.MINOR.PATCH`；**版本单一可信源 = `config.js` 的 `APP_VERSION`**。
- 发布步骤：
  1. 从 `master` 切 `release/vX.Y.Z`
  2. 改 `config.js` 的 `APP_VERSION` / `RELEASE_NAME` / `BUILD_TIME`
  3. `node check.js` + 微信开发者工具预览通过 → 合回 `master`
  4. `git tag vX.Y.Z && git push origin vX.Y.Z`
- ⚠️ **打 tag 会触发 `deploy.yml` 自动上传微信开发版**（需仓库 Secret `WECHAT_UPLOAD_KEY`）。
  上传前必须确认：① 已在仓库 **Settings → Secrets** 配置 `WECHAT_UPLOAD_KEY`；② `config.js` 的 `APP_VERSION` **等于** tag 版本号，否则 deploy 报错退出。
- 不想自动上传时：先 `git push origin master`（不带 `--tags`）；等 Secret 就绪再 `git push origin vX.Y.Z`。
- 也可在 **Actions → Deploy · 上传至微信小程序 → Run workflow** 手动填版本号触发。

---

## 5. CI / CD（已内置，无需改动）

- `.github/workflows/ci.yml`：push 到 `main`/`master`/`develop` 及 PR 时，校验**全部 JS 语法** + `node check.js` + **页面文件齐全**。
- `.github/workflows/deploy.yml`：push `v*` tag 或手动触发，用 `miniprogram-ci` 上传开发版（密钥来自 Secret，用完即删）。

---

## 6. 协作注意事项

- 上传密钥 `scripts/private.key` / `*.key` 已被 `.gitignore` 忽略，**切勿提交**；由发布负责人保管并在 CI Secret 配置。
- `project.config.json` 含 `appid`（公开标识，可入库）；真实 AppID 与测试号切换由发布负责人管理。
- 根目录 `_*.py` / `_*.js` 为数据提取/临时脚本，已被 `.gitignore` 忽略，不入库；可复现清洗请用 `scripts/clean_linebreaks.py`。
- 大段数据（`data/*.js`）改动请走 PR + `check.js`，避免破坏结构。
- 合并冲突优先在本地解决后再 push。

---

## 7. 快速命令

```bash
# 开发
git switch -c feature/xxx master
node check.js
git add -p && git commit -m "fix(mech): 修复裁判法数字误插"
git push -u origin feature/xxx
# → 开 PR 到 master

# 发版
git tag -a v1.0.3 -m "v1.0.3 正文句中误换行修复"
git push origin master --tags
```

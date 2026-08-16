# 文档索引（docs/INDEX.md）

> 本仓库全部文档的导航。按「你想解决什么问题」选读。
> 协作流程总入口在仓库根 [`CONTRIBUTING.md`](../CONTRIBUTING.md)。

---

## 一、协作流程（新成员先读这三份）

| 文档 | 解决什么 | 何时读 |
|---|---|---|
| [`CONTRIBUTING.md`](../CONTRIBUTING.md)（仓库根） | 怎么开分支、怎么分任务、怎么同步进度、怎么发版 | 加入团队第一天 |
| [`docs/ROADMAP.md`](ROADMAP.md) | 按版本（v1.0.0→v1.1.0）组织的目标 / 已完成 / 待办 | 想知道在做什么、做到哪了 |
| [`docs/GIT_WORKFLOW.md`](GIT_WORKFLOW.md) | 分支模型、Conventional Commits、CI/CD、发版细节 | 要开 PR、要发版时 |

---

## 二、发布记录（每个版本留下了什么）

| 文档 | 内容 |
|---|---|
| [`docs/release-v1.0.0.md`](release-v1.0.0.md) | 首版生产冻结（规则 + 裁判法 + 答题） |
| [`docs/release-v1.0.1.md`](release-v1.0.1.md) | 规则排序异常 + OCR 噪声修复 |
| [`docs/release-v1.0.2.md`](release-v1.0.2.md) | 裁判法 OCR 深度清洗 |

---

## 三、数据清洗与审计（改数据前参考）

| 文档 | 内容 |
|---|---|
| [`docs/clean-linebreaks-process.md`](clean-linebreaks-process.md) | 字面换行重排清洗的方法与脚本说明 |
| [`docs/clean-linebreaks-review-rules.md`](clean-linebreaks-review-rules.md) | `rules.js` 逐处清洗审查稿（详细） |
| `docs/clean-linebreaks-review-mech.md` | `mechanics.js` 审查稿 —— ⚠️ **待补**，见 ROADMAP v1.0.3 待办 |
| [`docs/step0-数据源检测报告.md`](step0-数据源检测报告.md) | 数据源（2023 裁判手册 PDF）可行性检测 |
| [`docs/step1-规则数据审核.md`](step1-规则数据审核.md) | 规则数据审核 |
| [`docs/step2-裁判法数据审核.md`](step2-裁判法数据审核.md) | 裁判法数据审核 |
| [`docs/step3-UI改造审核.md`](step3-UI改造审核.md) | UI 改造审核 |
| [`docs/step4-题库与搜索审核.md`](step4-题库与搜索审核.md) | 题库与搜索审核 |
| [`docs/step5-清洗与校对记录.md`](step5-清洗与校对记录.md) | 清洗与校对记录 |

---

## 四、历史进度与背景

| 文档 | 内容 |
|---|---|
| [`docs/claw-session-progress.md`](claw-session-progress.md) | 项目进度会话汇编，快速了解来龙去脉 |
| [`docs/PLAN.md`](PLAN.md) | 早期开发计划 |
| [`docs/web-ui-design-proposal.md`](web-ui-design-proposal.md) | UI 设计提案 |

---

## 五、阅读建议

- **刚加入** → 先 `README.md` + `CONTRIBUTING.md` + `ROADMAP.md`。
- **要改数据** → 读对应 `step*` 审计 + `clean-linebreaks-*` 再动手，改完跑 `node check.js`。
- **要发版** → 读 `GIT_WORKFLOW.md` 第 4 节（发版流程）。
- **想了解历史** → `docs/claw-session-progress.md` + `docs/PLAN.md`。

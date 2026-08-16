# Claw 工作会话记录 · 进度与成果汇总

> 本文档由贾维斯基于 `D:\WorkBuddyProject\Claw` 本地工作区中的实际进度数据自动汇编而成，
> 用于在一处完整呈现「FIBA 篮球裁判员工作台」小程序的已完成事项、当前状态与关键产出。
> 数据来源：`docs/*` 审核文档、`.workbuddy/memory/*` 工作日志、`data/*` 数据集、`git` 提交历史、`node check.js` 自检结果。

---

## 一、会话背景与目标

**用户（Samwell）**：正在搭建一个 FIBA 篮球裁判员助手——规则速查 + 裁判法速查 + 晋升答题训练的原生微信小程序（无第三方依赖、无需构建）。

**核心诉求**：把裁判手册（2023 年 9 月版，472 页）里的规则、官方解释、执裁法、真题，整理成可在手机上快速查询与刷题的小程序，并保证阅读体验（不要出现"句中误换行""断词跨段"等 OCR 抽取缺陷）。

**当前形态**：4 页面工作台（规则 / 裁判法 / 答题三模式胶囊切换 + 左右滑动手势），FIBA 绿设计系统，本地存储错题本，无后端。

---

## 二、项目当前形态（已落地）

| 维度 | 状态 |
|---|---|
| 技术栈 | 原生微信小程序（微信基础库 3.4.10），`appid` 预置 `touristappid`（测试号） |
| 页面 | `index`(工作台) / `rule-detail` / `mech-detail` / `practice`，无 tabBar，沉浸式绿 |
| 数据 | `data/rules.js`(50 条+63 标签) · `data/interpretations.js`(379 条 OBRI) · `data/mechanics.js`(134 项 M1–M4) · `data/questions.js`+`questions-extra.js`(148 题) |
| 自检 | `node check.js` 全部通过 |
| 版本可信源 | `config.js` 的 `APP_VERSION`（当前 `1.0.2`） |
| 发布 | `scripts/upload-ci.js`(miniprogram-ci) + `project.config.json` 的 `packOptions.ignore` 瘦身 |

---

## 三、已完成事项（按阶段）

### 阶段 0 · 数据源检测（凌晨）
- 否决 2022 中英对照 PDF（"填空学习版"，关键词被挖空、不可修复）。
- 确认主力数据源：**2023 年 9 月裁判手册（全）.pdf（472 页）**，覆盖全部需求：规则 8 章 50 条、附录、规则解释、二人/三人执裁、术语表。
- 产出 `docs/step0-数据源检测报告.md`。

### 阶段 1 · 规则 + 官方解释数据
- `data/rules.js` 重写为 2022 规则（8 章 50 条，V1.2 译本），63 标签，标题按手册原文（第 29 条改名"进攻时间"）。
- `data/interpretations.js` 新增 OBRI V3.0 提取 **379 条**官方解释，覆盖 29 个条款（21 条官方本就无解释）。
- 产出 `docs/step1-规则数据审核.md`、`_parse_rules.py` / `_parse_manual.py` 提取脚本。

### 阶段 2 · 裁判法数据
- `data/mechanics.js` 新增：M1 个人执裁技术(18) / M2 术语表(64) / M3 三人基础(26) / M4 三人进阶(26)，共 **134 项 / 5.5 万字**。
- 修正竖排水印"2023 年审定"误插的数字（CANONICAL 标准名表修正 12 处）。
- 产出 `docs/step2-裁判法数据审核.md`。

### 阶段 3 · UI 改造（绿色工作台）
- 重写为单页三模式（规则/裁判法/答题），自定义导航，FIBA 绿 `#0F6E56` 设计系统。
- M1 3.2 官方手势节（7904 字）数据保留但 UI 隐藏（`hidden:true`）。
- 删除旧页 `rules/quiz/mine`；导出功能后续被用户要求删除（仅保留重置）。
- 产出 `docs/step3-UI改造审核.md`。

### 阶段 4 · 题库扩充 + 搜索优化 + 裁判法搜索
- `data/questions-extra.js` 新增 **98 题**（国家级 45 / 一级 30 / 二级 8 + 自编 14 混入），带 `source`(来源) + `rule`(依据条款号)。
- 真题来自 `D:\桌面\篮球规则` 三份考试文件（python-docx + olefile 提取），答案逐题用 rules/interpretations/mechanics 原文校验，弃用 4 道瑕疵题。
- 搜索优化：SYNONYMS 30+ 同义词表（走步→带球走、打手→非法用手…）、OBRI 379 条纳入检索、命中上下文摘要、热搜词 chips。
- 裁判法 `mechKeyword` 支持跨 M1–M4 全局搜索。
- 产出 `docs/step4-题库与搜索审核.md`；合并后题库共 **148 题 / 7 分类**。

### 阶段 5 · 真机调试 + 清洗 + 发布 v1.0.0
- 修复 `project.config.json` 几乎为空导致的 App/Page is not defined。
- OCR 纠错 rules.js 20 处 + mechanics.js 25 处（高置信度单词级）。
- 手势图来源措辞改为"整理自 FIBA 执裁手册 2023.9 版附录 A，个人学习笔记与训练参考"。
- 生产发布 **v1.0.0**：git 冻结 + `config.js` 版本标记 + 包体 1.5MB + 部署脚本；提交 `0abd9d4` + tag `v1.0.0`。
- 产出 `docs/release-v1.0.0.md`、`docs/step5-清洗与校对记录.md`。

### 版本修订
- **v1.0.1**（tag）：真机反馈规则文本排序异常（子条款编号被 OCR 误识）+ 残留噪声；仅改 `data/rules.js`（35+1 处），`APP_VERSION→1.0.1`，提交 `5c51f02` + tag `v1.0.1`。产出 `docs/release-v1.0.1.md`。
- **v1.0.2**（commit `d347fdb`，**未打 tag**）：mechanics.js OCR 深度清洗——`722%→72%`、`abbr` 纠错（前导 L / 追踪 T）、M4 轮转阶段 4→3、杂散字符与空括号清理。`APP_VERSION→1.0.2`。产出 `docs/release-v1.0.2.md`。
  - 待决架构事实：当时已知 `mech-detail.js:30` 用 `split('\n')` 分段，OCR 换行会把词拆断跨段显示，但未大规模重排（留作 1.0.3）。

### 阶段 6（本轮）· 正文"句中误换行"修复 —— v1.0.3 进行中
**根因**：PDF 抽取把每一物理行都写成字面 `\n`，而 `rule-detail.js:22` 与 `mech-detail.js:30` 用 `content.split('\n')` 当段落分隔 → 句中 `\n` 变成断裂段落（如 `25.1.1 …所述的⏎限制`）。

**已落地（未提交）**：
1. **`data/rules.js`**：50/50 条全部重排。仅保留"结构起始"换行（编号条款 `25.1`/`25.1.1`、`·`、`——`），续行并入上段。段落 `857→807`，结构异常 0。顺带清掉同源 PDF 伪影：句中连字符、`面0时→面时` 等。
   - 配套：`docs/clean-linebreaks-review-rules.md`（49KB 审查稿）、`scripts/clean_linebreaks.py`（干跑→审查→应用的正式流水线）、`docs/clean-linebreaks-process.md`（流程说明）。
2. **`data/mechanics.js`**：134 项中 **72 项**被重排（刚完成并落盘）。算法不同于规则——mechanics 是散文+并列列表，采用"仅当上一行以句中标点(。！？：)或`——短关键词`结尾时才另起"策略，避免把 `0 预测/理解/恰当` 糊成 blob。段落 **920**，结构异常 **0**。
   - 同源伪影清理：连字符(`控-制→控制`、`队-员→队员`、`侧-执→侧执`、`判-做→判做`、`转-第→转第`、`上-获→上获`、`最-要→最重要`、`一-次→一次`、`，-追→，追`)全部清除。
   - **关键判断（偏离原计划）**：原计划写"`示0号→示号`"的 0 清理——实测 `示0号` 是合法的 **0 号球衣手势**（2.24 条），删 0 会毁掉裁判含义，**已放弃 0 清理**，仅做连字符清理；`No.1-5`/`No.6-10` 数字范围保留。
   - 校验：`node --check` 通过；连字符残 0；`示0号` 仍 6 处；`No.x-x` 范围保留；幂等（二次跑 0 改动）；目视 M1-1.1 / 2.24 正常。

---

## 四、当前状态（截至 2026-08-16 14:06）

- **版本**：代码 `APP_VERSION = 1.0.2`；最新清洗（rules + mechanics 句中误换行）**尚未提交、尚未进入发布版本号**，属于待定的 **v1.0.3**。
- **校验**：`node check.js` → **全部检查通过 ✓**（页面 4 / 规则 50 / 解释 379 / 裁判法 134 / 题目 148）。
- **Git 工作区（未提交）**：
  - `M data/rules.js`（句中误换行清洗）
  - `M data/mechanics.js`（句中误换行清洗，本次新增）
  - `?? docs/clean-linebreaks-process.md`、`?? docs/clean-linebreaks-review-rules.md`
  - `?? scripts/clean_linebreaks.py`、`?? .github/`
- **渲染验证**：需在微信开发者工具重新编译预览（只动了数据文件，未改页面）。

---

## 五、关键产出清单

**数据（已交付，待提交）**
- `data/rules.js` — 50 条规则 + 63 标签（句中误换行已清洗）
- `data/interpretations.js` — 379 条 OBRI 官方解释
- `data/mechanics.js` — 134 项 M1–M4（句中误换行已清洗）
- `data/questions.js` / `data/questions-extra.js` — 148 题（7 分类）

**清洗工具**
- `scripts/clean_linebreaks.py` — 正式流水线：干跑生成 `.cleaned.js` + 审查 markdown → `--apply` 写回；幂等、只处理字面 `\n`。
- `_fix_linebreaks.js` / `_fix_mech_linebreaks.js` — Node 版等价清洗脚本（已分别应用于 rules / mechanics）。
- `docs/clean-linebreaks-process.md` — 清洗流程与协作说明。
- `docs/clean-linebreaks-review-rules.md` — rules.js 逐处"移除/保留"审查稿。

**审核 / 发布文档（`docs/`）**
- `step0-数据源检测报告.md` · `step1-规则数据审核.md` · `step2-裁判法数据审核.md` · `step3-UI改造审核.md` · `step4-题库与搜索审核.md` · `step5-清洗与校对记录.md`
- `release-v1.0.0.md` · `release-v1.0.1.md` · `release-v1.0.2.md`
- `web-ui-design-proposal.md` · `PLAN.md`

**提取 / 解析脚本（根目录 `_*.py` / `_*.js`）**
- `_parse_rules.py` · `_parse_manual.py` · `_parse_mechanics.py` · `_clean_rules.py` · `_diag_step0.py` · `_dump_exams.py` · `_scan_*.py` · `_verify2.js` 等（发布包经 `packOptions.ignore` 自动排除）。

**自检 / 发布**
- `check.js`（数据完整性自检，全绿）· `scripts/upload-ci.js` + `scripts/package.json`（miniprogram-ci 上传）。

---

## 六、遗留与下一步

1. **v1.0.3 收尾**：将 `data/rules.js` + `data/mechanics.js` 的清洗改动提交，并视情况打 tag / 升 `APP_VERSION`。建议单独 commit 便于回滚。
2. **mechanics 形式化审查稿**：当前 mechanics 清洗用的是 Node 脚本，建议补一份 `docs/clean-linebreaks-review-mech.md` 走与 rules 一致的审查流程（process.md 原标注 mechanics 为"待处理"，现已完成，需更新该标注）。
3. **其他 PDF 抽取噪音（未覆盖）**：2.24 条里 `图1.00`、`后场.记录台`、`中，央裁判` 等"数字/标点误插"类错误，属另一类缺陷，可单列一轮处理。
4. **人工校对项（正式公开前）**：`interpretations.js` 疑似残留、版权口径、架构解耦。
5. **真实 AppID**：发布前将 `project.config.json` 的 `touristappid` 替换为真实 AppID。

---

*本会话记录由本地进度数据自动汇编，覆盖从数据源检测到 v1.0.3 句中误换行修复的完整链路，未遗漏已知重要进度。*

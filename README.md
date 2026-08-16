# FIBA 篮球裁判员助手 - 微信小程序

规则速查 + 裁判法速查 + 晋升答题训练的原生微信小程序（无第三方依赖，无需构建）。

## 如何运行

1. 打开「微信开发者工具」→ 导入项目 → 选择本目录 `D:\WorkBuddyProject\Claw`
2. AppID 选择「测试号」（`project.config.json` 中已预置 `touristappid`，发布前请替换为你的真实 AppID）
3. 点击「编译」即可预览；点击「预览」生成二维码可在真机调试

> 真机调试/发布需要在 [mp.weixin.qq.com](https://mp.weixin.qq.com) 注册小程序账号，将真实 AppID 填入 `project.config.json`。

## 协作开发（团队）

- **团队协作流程总入口（先读）**：[CONTRIBUTING.md](CONTRIBUTING.md) — 分支策略 / 任务分配 / 进度同步 / 提交规范 / 发版
- 开发路线图（迭代 / 任务清单）：[docs/ROADMAP.md](docs/ROADMAP.md)
- Git 工作流与发布规范（分支 / 提交 / 发版 / CI）：[docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md)
- 文档总索引（全部文档与阅读时机）：[docs/INDEX.md](docs/INDEX.md)
- 本地校验：`node check.js`（数据完整性）；每次 push / PR 会由 `.github/workflows/ci.yml` 自动校验全部 JS 语法 + 页面文件齐全。
- 数据文件（`data/*.js`）改动请走 PR，勿直接 push `master`。

## 功能

| 页面 | 功能 |
|---|---|
| 首页（工作台） | 规则速查、裁判法、答题练习三模式胶囊切换；吸顶搜索 + 章节/标签筛选；左右滑动手势切换模式 |
| 规则详情 | 第 1–50 条规则正文、官方规则解释（OBRI）379 条折叠展示 |
| 裁判法详情 | M1–M4 小节原文；M1 3.2 官方裁判员手势图（取自 2023 裁判手册附录 A） |
| 答题练习 | 7 类题库共 148 题（真题·国家级/晋升一级/国家二级 + 规则/违例/犯规/裁判法），随机出题、即时判分、错题本、解析带规则依据跳转 |

- 答错的题自动进错题本；错题重练中答对会自动移出错题本
- 数据存储在本地（`wx.setStorageSync`），无需后端

## 目录结构

```
├── app.js / app.json / app.wxss    # 全局配置与样式（无 tabBar，首页沉浸式绿）
├── project.config.json             # 开发者工具项目配置（含 packOptions.ignore 发布包瘦身）
├── data/
│   ├── rules.js                    # 2022 FIBA 规则 8 章 50 条
│   ├── interpretations.js          # OBRI V3.0 官方解释 379 条
│   ├── mechanics.js                # 执裁手册 M1–M4 共 134 项
│   ├── questions.js                # 题库 148 题
│   └── questions-extra.js          # 扩充题库（真题 + 自编）
├── pages/
│   ├── index/                      # 工作台首页
│   ├── rule-detail/                # 规则详情
│   ├── mech-detail/                # 裁判法详情
│   └── practice/                   # 答题引擎（含错题重练）
├── images/gestures/                # 官方裁判员手势图 9 页
└── check.js                        # 数据完整性自检（node check.js）
```

## 发布包说明

`project.config.json` 中已配置 `packOptions.ignore`，上传时会自动排除：
- `docs/`、`README.md` — 审核文档与说明
- `.workbuddy/` — 会话记忆
- `check.js` — 本地自检脚本
- 根目录下所有以 `_` 开头的提取/解析脚本与中间产物（`_*.py`、`_*.txt`、`_*.json` 等）

## 扩充数据

- 加规则：编辑 `data/rules.js`，保持 `id` 唯一、`article` 1–50
- 加题目：编辑 `data/questions.js` 或 `data/questions-extra.js`，`answer` 为正确选项下标（0 起）
- 改完运行 `node check.js` 校验数据完整性

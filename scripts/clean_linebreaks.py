#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
clean_linebreaks.py — 字面 \\n（换行）重排清洗工具
=================================================

背景
----
data/*.js 中的字符串把换行存成字面两字符 `\\n`（反斜杠 + n），而不是真实换行。
渲染层（mech-detail.js / rule-detail.js）用 `split('\\n')` 把这些字面换行当成
段落分隔。OCR / 原始录入在句子中间也插入了大量 `\\n`，导致中文词被拆断跨段落显示，
阅读体验很差。

本工具只处理字面两字符 `\\n`，不触碰源文件的真实换行（源码换行是单字符 \\n，
与本工具的切分目标不同），因此不会破坏 JS 结构。

保留 / 移除判定（逐段边界）
---------------------------
把一个字符串按字面 `\\n` 切成若干 segment，对每段之间的边界判定：

  KEEP（保留为段落断点）当且仅当满足任一条：
    1. prev 段末字符是强标点（。！？；：）)”」』】’ 等）
    2. next 段（去前导空格后）以「带点的条款号」开头，如 1.1 / 25.1.1 / 2.3
       —— 注意：必须含小数点，纯数字（如「28 米」）不算条款号，避免误保留
    3. next 段以章节关键词开头：定义 / 解释 / 注 / 示例 / 条文 / 说明 / ——
    4. prev 段（去尾部空格后）以「带点的条款号」开头（即标题→正文断点）
    5. next 段为空（空白行 = 有意段落间距）

  其余一律 REMOVE（合并，去掉换行）——即句子中间的断词。

用法
----
  python clean_linebreaks.py <input.js> [--apply] [--review PATH] [--limit N]

  --apply   直接写回原文件（默认只生成 <input>.cleaned.js，不动原文件）
  --review  审查 markdown 输出路径（默认 docs/clean-linebreaks-review-<名>.md）
  --limit   审查文档中列出的样例条数上限（默认 150）

幂等性：对同一文件重复运行结果一致。
"""
import argparse
import os
import re

# 强标点：段末遇到这些，后面跟的换行是合理断点
SENT_END = set("。！？!?；;：:）)”」』】’")
# 带点的条款/标题号：必须含小数点（1.1 / 25.1.1 / 2.3），纯数字不算
NUMBERED = re.compile(r"^\d+(\.\d+)+")
# 章节关键词（段首）
HEADING_KW = ("定义", "解释", "注", "示例", "条文", "说明", "——")


def strip_wrapper(seg: str) -> str:
    """去掉段首/段尾的 JS 包装噪声（如 `    "content": "`、首尾引号、尾随逗号），
    使标题/条款号判定只看纯文本内容。仅影响字符串首段（被 `"key": "` 前缀污染的那段），
    中段不受影响（strip 不匹配即为原样）。"""
    s = seg
    s = re.sub(r'^\s*"[^"]*"\s*:\s*', "", s)   # 去掉行首 "key":
    s = re.sub(r"^['\"]", "", s)               # 去掉一个前导引号
    s = re.sub(r"['\"]?,?$", "", s)            # 去掉尾随引号/逗号
    return s


def is_heading(seg: str) -> bool:
    """判断一段是否为「短标题」（如 `2.3 后场` / `25.1 定义` / `1.2 球篮：对方/本方`）。

    仅当：以带点条款号开头、号后正文较短（<=20字）、且不含句末标点。
    用来区分「标题→正文」断点 与 「长条款中间的断词」（后者也以条款号开头但很长）。
    """
    s = seg.strip()
    m = NUMBERED.match(s)
    if not m:
        return False
    body = s[m.end():]
    if len(body) > 20:
        return False
    if any(p in seg for p in "。！？"):
        return False
    return True


# 段落末尾命中「短标题」：用于字符串首段（标题被 JS 包装前缀污染，
# 实际位于段尾）。要求段尾是「带点条款号 + 短标题（<=20字，无句末标点）」。
HEADING_TAIL = re.compile(r"\d+(\.\d+)+\s*[^\n。！？]{0,20}$")


def ends_with_heading(seg: str) -> bool:
    return bool(HEADING_TAIL.search(seg.rstrip()))


def classify(prev_seg: str, next_seg: str):
    """返回 (keep: bool, reason: str)。"""
    prev = strip_wrapper(prev_seg).rstrip()
    nxt = strip_wrapper(next_seg).lstrip()
    if prev and prev[-1] in SENT_END:
        return True, "prev-punct"
    if NUMBERED.match(nxt):
        return True, "next-numbered"
    if nxt.startswith(HEADING_KW):
        return True, "next-heading"
    if is_heading(prev) or ends_with_heading(prev_seg):
        return True, "prev-heading"
    if nxt.strip() == "":
        return True, "blank"
    return False, "remove"


def clean(text: str):
    parts = text.split("\\n")  # 仅按字面两字符 \\n 切分
    out = [parts[0]]
    removed = []  # (idx, prev_tail, next_head)
    kept = []     # (idx, reason, prev_tail, next_head)
    for i in range(len(parts) - 1):
        keep, reason = classify(parts[i], parts[i + 1])
        if keep:
            out.append("\\n")
            out.append(parts[i + 1])
            kept.append((i, reason, parts[i][-25:], parts[i + 1][:25]))
        else:
            out.append(parts[i + 1])
            removed.append((i, parts[i][-25:], parts[i + 1][:25]))
    rebuilt = "".join(out)
    # 多个连续换行折叠为最多一个空行（两个字面换行）
    rebuilt = re.sub(r"(\\n){3,}", "\\n\\n", rebuilt)
    return rebuilt, removed, kept


def build_review(src_path, dst_path, removed, kept, total, applied):
    name = os.path.basename(src_path)
    lines = []
    lines.append(f"# 字面 `\\n` 重排清洗审查 — {name}")
    lines.append("")
    lines.append(f"- 源文件：`{src_path}`")
    lines.append(f"- 输出文件：`{dst_path}`（{'已写回原文件' if applied else '生成 .cleaned.js，未改动原文件'}）")
    lines.append(f"- 字面 `\\n` 总数：**{total}**")
    lines.append(f"- 移除（合并断词）：**{len(removed)}** 处")
    lines.append(f"- 保留（结构断点）：**{len(kept)}** 处")
    lines.append("")
    lines.append("## 保留规则")
    lines.append("")
    lines.append("1. 上一段末是强标点（。！？；：）)” 等）→ 保留")
    lines.append("2. 下一段以带点条款号开头（`1.1` / `25.1.1` / `2.3`）→ 保留")
    lines.append("3. 下一段以章节关键词开头（定义/解释/注/示例/条文/说明/——）→ 保留")
    lines.append("4. 上一段是「短标题」（带点条款号+短标题，无句末标点，如 `2.3 后场`）→ 保留")
    lines.append("5. 下一段为空行（有意段落间距）→ 保留")
    lines.append("")
    lines.append("其余（句子中间的断词）一律移除合并。")
    lines.append("")
    lines.append("## 移除样例（before → after，含上下文）")
    lines.append("")
    lines.append("> 格式：`…[上段末25字]⟦移除的\\n⟧[下段首25字]…` → 合并后")
    lines.append("")
    limit = min(limit_arg, len(removed))
    for i, (idx, pt, nh) in enumerate(removed[:limit], 1):
        pt = pt.replace("\n", "⏎").replace("\\", "\\\\")
        nh = nh.replace("\n", "⏎").replace("\\", "\\\\")
        lines.append(f"{i}. `…{pt}⟦\\n⟧{nh}…` → `…{pt}{nh}…`")
    if len(removed) > limit:
        lines.append("")
        lines.append(f"_（仅展示前 {limit} 条，其余 {len(removed)-limit} 条均为同类断词合并，完整差异见 `git diff`。）_")
    lines.append("")
    lines.append("## 保留样例（结构断点）")
    lines.append("")
    for i, (idx, reason, pt, nh) in enumerate(kept[:60], 1):
        pt = pt.replace("\n", "⏎").replace("\\", "\\\\")
        nh = nh.replace("\n", "⏎").replace("\\", "\\\\")
        lines.append(f"{i}. `[{reason}] …{pt}⟦保留\\n⟧{nh}…`")
    lines.append("")
    return "\n".join(lines)


def main():
    global limit_arg
    ap = argparse.ArgumentParser(description="字面 \\n 重排清洗工具")
    ap.add_argument("input")
    ap.add_argument("--apply", action="store_true", help="写回原文件")
    ap.add_argument("--review", default=None)
    ap.add_argument("--limit", type=int, default=150)
    args = ap.parse_args()
    limit_arg = args.limit

    with open(args.input, encoding="utf-8") as f:
        text = f.read()
    total = text.count("\\n")
    rebuilt, removed, kept = clean(text)

    if args.apply:
        dst = args.input
        with open(dst, "w", encoding="utf-8") as f:
            f.write(rebuilt)
    else:
        dst = args.input + ".cleaned.js"
        with open(dst, "w", encoding="utf-8") as f:
            f.write(rebuilt)

    review_path = args.review or (
        "docs/clean-linebreaks-review-"
        + os.path.splitext(os.path.basename(args.input))[0]
        + ".md"
    )
    os.makedirs(os.path.dirname(review_path) or ".", exist_ok=True)
    md = build_review(args.input, dst, removed, kept, total, args.apply)
    with open(review_path, "w", encoding="utf-8") as f:
        f.write(md)

    print(f"total literal \\n : {total}")
    print(f"removed (merged)  : {len(removed)}")
    print(f"kept (structural) : {len(kept)}")
    print(f"output            : {dst}")
    print(f"review markdown   : {review_path}")


if __name__ == "__main__":
    main()

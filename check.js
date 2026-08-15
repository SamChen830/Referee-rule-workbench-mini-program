// 项目数据完整性自检脚本（Node 环境运行）
const fs = require('fs')
const path = require('path')

const root = __dirname
let errors = []

// 1. app.json 页面文件齐全
const appJson = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'))
appJson.pages.forEach(p => {
  for (const ext of ['js', 'wxml', 'json']) {
    const f = path.join(root, p + '.' + ext)
    if (!fs.existsSync(f)) errors.push('缺少文件: ' + p + '.' + ext)
  }
})

// 2. 无 tabBar（工作台单页设计），页面必须 4 个且无多余页面目录
if (appJson.tabBar) errors.push('不应存在 tabBar（已改为工作台单页设计）')
if (appJson.pages.length !== 4) errors.push('页面数应为4，实际 ' + appJson.pages.length)
const pageDirs = fs.readdirSync(path.join(root, 'pages')).filter(d => fs.existsSync(path.join(root, 'pages', d, d + '.js')))
pageDirs.forEach(d => {
  const registered = appJson.pages.some(p => p.startsWith('pages/' + d + '/'))
  if (!registered) errors.push('存在未注册的页面目录: pages/' + d)
})

// 2.1 裁判法数据检查
const { sections } = require(path.join(root, 'data/mechanics.js'))
const visible = sections.flatMap(s => s.items.filter(i => !i.hidden))
sections.forEach(s => {
  if (s.key !== 'M2') {
    s.items.filter(i => !i.hidden).forEach(i => {
      if (!i.no || !i.title || !i.content || i.content.length < 50) {
        errors.push('裁判法 ' + s.key + ' 小节异常: ' + (i.no || '?'))
      }
    })
  } else {
    s.items.forEach(i => {
      if (!i.term || !i.text) errors.push('术语表条目异常: ' + i.term)
    })
  }
})
const hiddenCount = sections.flatMap(s => s.items).length - visible.length

// 3. 规则数据检查（v2 结构：chapters / tags / rules）
const rules = require(path.join(root, 'data/rules.js'))
const chapKeys = rules.chapters.map(c => c.key)
const ruleIds = new Set()
rules.rules.forEach(r => {
  if (ruleIds.has(r.id)) errors.push('规则 ID 重复: ' + r.id)
  ruleIds.add(r.id)
  if (!chapKeys.includes(r.chapter)) errors.push('规则 ' + r.id + ' 章节不存在: ' + r.chapter)
  if (!r.title || !r.content) errors.push('规则 ' + r.id + ' 缺少标题或内容')
  if (r.article < 1 || r.article > 50) errors.push('规则 ' + r.id + ' 条号异常: ' + r.article)
  if (r.content.length < 30) errors.push('规则 ' + r.id + ' 正文过短')
})
// 3.1 八章50条齐全
if (rules.rules.length !== 50) errors.push('规则应为50条，实际 ' + rules.rules.length)
if (rules.chapters.length !== 8) errors.push('章节数应为8，实际 ' + rules.chapters.length)
const nums = rules.rules.map(r => r.article).sort((a, b) => a - b)
nums.forEach((n, i) => { if (n !== i + 1) errors.push('条号不连续或缺漏: 第' + n + '条') })
// 3.2 标签都存在于 tags
const tagSet = new Set(rules.tags)
rules.rules.forEach(r => r.tags.forEach(t => {
  if (!tagSet.has(t)) errors.push('规则 ' + r.id + ' 标签未注册: ' + t)
}))

// 3.3 规则解释数据检查
const { interpretations } = require(path.join(root, 'data/interpretations.js'))
let obriTotal = 0
Object.keys(interpretations).forEach(art => {
  if (+art < 1 || +art > 50) errors.push('解释归属条号异常: ' + art)
  interpretations[art].forEach(e => {
    if (!e.no.startsWith(art + '-')) errors.push('解释编号与归属不符: ' + art + ' 下的 ' + e.no)
    if (!e.text || e.text.length < 5) errors.push('解释 ' + e.no + ' 内容过短')
    obriTotal++
  })
})

// 4. 题库数据检查
const q = require(path.join(root, 'data/questions.js'))
const qCatKeys = q.categories.map(c => c.key)
const qIds = new Set()
const ruleArticles = new Set(rules.rules.map(r => r.article))
q.questions.forEach(item => {
  if (qIds.has(item.id)) errors.push('题目 ID 重复: ' + item.id)
  qIds.add(item.id)
  if (!qCatKeys.includes(item.cat)) errors.push('题目 ' + item.id + ' 分类不存在: ' + item.cat)
  if (!Array.isArray(item.options) || item.options.length < 2) errors.push('题目 ' + item.id + ' 选项不足')
  if (item.answer < 0 || item.answer >= item.options.length) errors.push('题目 ' + item.id + ' 答案索引越界')
  if (!item.explanation) errors.push('题目 ' + item.id + ' 缺少解析')
  // 扩充题（带 source 字段）：来源必填，rule 若存在必须是有效条号且能在规则库中找到
  if (item.source !== undefined) {
    if (!item.source) errors.push('扩充题 ' + item.id + ' 缺少来源 source')
    if (item.rule !== undefined) {
      if (!Number.isInteger(item.rule) || item.rule < 1 || item.rule > 50) {
        errors.push('扩充题 ' + item.id + ' 依据条号异常: ' + item.rule)
      } else if (!ruleArticles.has(item.rule)) {
        errors.push('扩充题 ' + item.id + ' 依据条款不存在: 第' + item.rule + '条')
      }
    }
  }
})

// 5. 每个分类至少有题
q.categories.forEach(c => {
  const n = q.questions.filter(x => x.cat === c.key).length
  if (n === 0) errors.push('分类 ' + c.key + ' 没有题目')
})

if (errors.length) {
  console.log('发现问题 ' + errors.length + ' 处:')
  errors.forEach(e => console.log('  - ' + e))
  process.exit(1)
} else {
  console.log('全部检查通过 ✓')
  console.log('页面数: ' + appJson.pages.length + '（工作台单页 · 无 tabBar）')
  console.log('规则条目: ' + rules.rules.length + '（章节 ' + rules.chapters.length + '，标签 ' + rules.tags.length + '）')
  console.log('规则解释: ' + obriTotal + ' 条（覆盖 ' + Object.keys(interpretations).length + ' 个条款）')
  console.log('裁判法速查: ' + visible.length + ' 项（4 板块，另隐藏 ' + hiddenCount + ' 项手势图文字版）')
  console.log('题目数: ' + q.questions.length + '（分类 ' + q.categories.length + '）')
  q.categories.forEach(c => {
    const n = q.questions.filter(x => x.cat === c.key).length
    console.log('  - ' + c.name + ': ' + n + ' 题')
  })
}

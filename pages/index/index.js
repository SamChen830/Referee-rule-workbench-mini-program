const rulesData = require('../../data/rules.js')
const mechData = require('../../data/mechanics.js')
const questionsData = require('../../data/questions.js')
const obriData = require('../../data/interpretations.js')

const MODES = [
  { key: 'rules', name: '规则速查' },
  { key: 'mech', name: '裁判法' },
  { key: 'quiz', name: '答题练习' }
]

const OPTION_LABELS = ['A', 'B', 'C', 'D']

// ===== 搜索同义词表：口语说法 → 规则术语（命中任一变体即命中） =====
const SYNONYMS = {
  '走步': ['带球走', '带球行进'],
  '带球走': ['走步'],
  '两次运球': ['二次运球'],
  '二次运球': ['两次运球'],
  '24秒': ['24秒钟', '进攻计时钟', '进攻时间'],
  '24秒钟': ['24秒', '进攻计时钟', '进攻时间'],
  '进攻时间': ['24秒', '24秒钟', '进攻计时钟'],
  '14秒': ['14秒钟'],
  '8秒': ['8秒钟'],
  '5秒': ['5秒钟'],
  '3秒': ['3秒钟'],
  '打手': ['非法用手'],
  '非法用手': ['打手'],
  '违体': ['违反体育道德'],
  '违反体育道德': ['违体'],
  '技犯': ['技术犯规'],
  '技术犯规': ['技犯'],
  '加时': ['决胜期'],
  '决胜期': ['加时'],
  '回场': ['球回后场'],
  '球回后场': ['回场'],
  '干扰球': ['干涉得分', '干扰得分'],
  '干涉得分': ['干扰得分', '干扰球'],
  '干扰得分': ['干涉得分', '干扰球'],
  '发球': ['掷球入界'],
  '边线球': ['掷球入界'],
  '界外球': ['掷球入界'],
  '掷球入界': ['发球', '界外球'],
  '换人': ['替换'],
  '替补': ['替换'],
  '暂停': ['要登记的暂停'],
  '要登记的暂停': ['暂停'],
  '夺权': ['取消比赛资格'],
  '取消比赛资格': ['夺权'],
  '中篮': ['球中篮', '投篮得分'],
  '犯规': [],
  '绝杀': ['比赛计时钟信号', '投篮出手']
}

// 热门搜索词（规则速查）
const HOT_KEYWORDS = ['带球走', '干涉得分', '球回后场', '24秒', '8秒', '违体犯规', '掷球入界', '圆柱体', '交替拥有', '可纠正的失误']

// 关键词扩展：返回原词 + 所有命中的同义变体
function expandKeyword(kw) {
  const list = [kw]
  Object.keys(SYNONYMS).forEach(k => {
    if (kw.indexOf(k) > -1) {
      SYNONYMS[k].forEach(v => { if (!list.includes(v)) list.push(v) })
    }
  })
  return list
}

// 从内容中截取关键词命中上下文（前 20 后 44 字），无命中取开头
function excerpt(content, kws) {
  const text = (content || '').replace(/\s/g, '')
  if (kws && kws.length) {
    let pos = -1
    kws.forEach(k => {
      const p = text.indexOf(k)
      if (p > -1 && (pos === -1 || p < pos)) pos = p
    })
    if (pos > -1) {
      const start = Math.max(0, pos - 20)
      return (start > 0 ? '…' : '') + text.slice(start, pos + 44) + '…'
    }
  }
  return text.slice(0, 42) + '…'
}

function buildChapters(rules) {
  return rulesData.chapters.map(ch => ({
    ...ch,
    count: rules.filter(r => r.chapter === ch.key).length,
    label: '第' + ch.no + '章·' + ch.name
  }))
}

function buildTags(rules, chapterKey) {
  const pool = chapterKey ? rules.filter(r => r.chapter === chapterKey) : rules
  const seen = []
  pool.forEach(r => (r.tags || []).forEach(t => { if (!seen.includes(t)) seen.push(t) }))
  return seen
}

function toRow(r, kws) {
  return {
    id: r.id,
    article: r.article,
    title: r.title,
    chapterName: r.chapterName,
    tags: (r.tags || []).slice(0, 2),
    obriCount: r.obriCount || 0,
    matchedObri: !!(kws && kws.length && (obriData.interpretations[String(r.article)] || []).some(e => kws.some(k => (e.text || '').indexOf(k) > -1))),
    summary: excerpt(r.content, kws)
  }
}

Page({
  data: {
    modes: MODES,
    mode: 'rules',
    panelDir: 'next',

    // ===== 规则速查 =====
    keyword: '',
    activeChapter: '',
    activeTag: '',
    chapterScroll: '',
    tagScroll: '',
    chapters: [],
    tags: [],
    hotKeywords: HOT_KEYWORDS,
    ruleList: [],
    ruleTotal: 0,
    showBackTop: false,

    // ===== 裁判法 =====
    mechSections: [],
    expanded: 'M1',
    mechItems: [],
    mechKeyword: '',
    mechGroups: [],
    mechTotal: 0,

    // ===== 答题练习 =====
    quizCats: [],
    totalQuestions: 0,
    answered: 0,
    accuracy: 0,
    accuracyText: '--',
    wrongCount: 0,
    wrongList: []
  },

  onLoad() {
    const rules = rulesData.rules
    const chapters = buildChapters(rules)

    const mechSections = mechData.sections.map(s => {
      const items = s.items.filter(i => !i.hidden)
      return {
        key: s.key,
        name: s.name,
        ver: s.ver || '2023 手册版',
        count: items.length,
        isTerms: s.key === 'M2',
        items
      }
    })

    this.setData({
      ruleTotal: rules.length,
      chapters,
      tags: buildTags(rules, ''),
      ruleList: rules.map(toRow),
      mechSections
    })
    // 初始化默认展开板块（M1）的内容，避免首次切到裁判法出现空白区
    this.filterMech()
  },

  onShow() {
    this.refreshQuiz()
  },

  refreshQuiz() {
    const record = wx.getStorageSync('practiceRecord') || { totalAnswered: 0, totalCorrect: 0 }
    const wrong = wx.getStorageSync('wrongBook') || []
    const wrongList = wrong
      .map(w => {
        const q = questionsData.questions.find(x => x.id === w.qid)
        if (!q) return null
        return {
          qid: q.id,
          question: q.question,
          answerLabel: OPTION_LABELS[q.answer],
          answerText: q.options[q.answer],
          explanation: q.explanation
        }
      })
      .filter(Boolean)

    const cats = questionsData.categories.map(c => ({
      ...c,
      count: questionsData.questions.filter(q => q.cat === c.key).length
    }))

    this.setData({
      quizCats: cats,
      totalQuestions: questionsData.questions.length,
      answered: record.totalAnswered,
      accuracy: record.totalAnswered ? Math.round(record.totalCorrect / record.totalAnswered * 100) : 0,
      accuracyText: record.totalAnswered ? Math.round(record.totalCorrect / record.totalAnswered * 100) + '%' : '--',
      wrongCount: wrongList.length,
      wrongList
    })
  },

  // ===== 模式切换 =====
  onMode(e) {
    this.switchMode(e.currentTarget.dataset.key)
  },
  switchMode(key) {
    if (!key || key === this.data.mode) return
    const from = MODES.findIndex(m => m.key === this.data.mode)
    const to = MODES.findIndex(m => m.key === key)
    this.setData({
      mode: key,
      // 切换方向：往右切从左滑入，往左切从右滑入
      panelDir: to > from ? 'next' : 'prev'
    })
    // 切模式回到顶部，避免停留在上一个模式的滚动位置
    wx.pageScrollTo({ scrollTop: 0, duration: 0 })
  },

  // ===== 左右滑动切换模式（规则 ↔ 裁判法 ↔ 答题） =====
  // 用 touchmove 实时判定滑动意图：一旦横向位移占优即锁定为横滑，
  // 手指带点纵向漂移也不影响判定；纵向滚动则彻底放弃。
  onSwipeStart(e) {
    const t = e.touches[0]
    this._swipe = { x0: t.clientX, y0: t.clientY, t0: Date.now(), locked: '' }
  },
  onSwipeMove(e) {
    const s = this._swipe
    if (!s || s.acted) return
    const t = e.touches[0]
    const dx = t.clientX - s.x0
    const dy = t.clientY - s.y0
    // 位移超 20px 即锁定方向：横滑占优就锁横滑
    if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
      s.locked = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
    }
    // 横滑锁定且达到触发距离，立即处理——不等抬手。
    // 否则从屏幕边缘起手时，系统返回手势会抢走 touchend，JS 来不及清搜索。
    if (s.locked === 'horizontal' && Math.abs(dx) >= 50) {
      this.handleSwipe(dx)
      s.acted = true
    }
  },
  // 左右横向滑动：按方向切换三模式（规则 ↔ 裁判法 ↔ 答题）
  handleSwipe(dx) {
    const idx = MODES.findIndex(m => m.key === this.data.mode)
    if (dx < 0 && idx < MODES.length - 1) this.switchMode(MODES[idx + 1].key)
    if (dx > 0 && idx > 0) this.switchMode(MODES[idx - 1].key)
  },
  onSwipeEnd(e) {
    const s = this._swipe
    this._swipe = null
    // 已在 move 阶段处理过，直接结束
    if (!s || s.acted) return
    if (s.locked !== 'horizontal') return
    // chip 横滚刚结束的 400ms 内不算页面滑动
    if (this._chipScrollAt && Date.now() - this._chipScrollAt < 400) return
    const t = e.changedTouches[0]
    const dx = t.clientX - s.x0
    const dt = Date.now() - s.t0
    if (Math.abs(dx) < 50 || dt > 1200) return
    // 兜底：极快轻扫（move 阶段未达 50px 阈值）仍按方向处理
    this.handleSwipe(dx)
  },
  onSwipeCancel() {
    this._swipe = null
  },
  // chip 横滚期间抑制滑动手势（scroll-view 滚动会冒泡 touch 事件）
  onChipScroll() {
    this._chipScrollAt = Date.now()
  },

  // 滚动超过一屏后显示回顶按钮
  onPageScroll(e) {
    const show = e.scrollTop > 360
    if (show !== this.data.showBackTop) this.setData({ showBackTop: show })
  },
  goTop() {
    wx.pageScrollTo({ scrollTop: 0, duration: 200 })
  },

  // ===== 规则速查 =====
  onKeyword(e) {
    this.setData({ keyword: e.detail.value })
    this.filterRules()
  },
  clearKeyword() {
    this.setData({ keyword: '' })
    this.filterRules()
  },
  onChapter(e) {
    const key = e.currentTarget.dataset.key
    this.setData({
      activeChapter: key,
      activeTag: '',
      tagScroll: '',
      // 选中章节滚入视野
      chapterScroll: key ? 'c-' + key : 'chip-all'
    })
    this.setData({ tags: buildTags(rulesData.rules, key) })
    this.filterRules()
  },
  onTag(e) {
    const { tag, idx } = e.currentTarget.dataset
    const turnOn = this.data.activeTag !== tag
    this.setData({
      activeTag: turnOn ? tag : '',
      // 选中的标签滚入视野（再次点击取消时保持原位）
      tagScroll: turnOn ? 't-' + idx : this.data.tagScroll
    })
    this.filterRules()
  },
  filterRules() {
    const { keyword, activeChapter, activeTag } = this.data
    const kw = keyword.trim()
    let list = rulesData.rules
    if (activeChapter) list = list.filter(r => r.chapter === activeChapter)
    if (activeTag) list = list.filter(r => (r.tags || []).includes(activeTag))
    let kws = []
    if (kw) {
      kws = expandKeyword(kw)
      // 条号搜索：纯数字直接匹配第 X 条
      const asArticle = /^\d{1,2}$/.test(kw) ? parseInt(kw, 10) : -1
      list = list.filter(r =>
        r.article === asArticle ||
        kws.some(k =>
          r.title.indexOf(k) > -1 ||
          (r.content || '').indexOf(k) > -1 ||
          (r.tags || []).some(t => t.indexOf(k) > -1) ||
          // 官方规则解释（OBRI）全文也纳入搜索范围
          (obriData.interpretations[String(r.article)] || []).some(e => (e.text || '').indexOf(k) > -1)
        )
      )
    }
    this.setData({ ruleList: list.map(r => toRow(r, kws)) })
  },
  // 点热搜词直接填充搜索
  onHotKeyword(e) {
    this.setData({ keyword: e.currentTarget.dataset.kw })
    this.filterRules()
  },
  goRule(e) {
    wx.navigateTo({ url: '/pages/rule-detail/rule-detail?id=' + e.currentTarget.dataset.id })
  },

  // ===== 裁判法 =====
  onMechKeyword(e) {
    this.setData({ mechKeyword: e.detail.value })
    this.filterMech()
  },
  clearMechKeyword() {
    this.setData({ mechKeyword: '' })
    this.filterMech()
  },
  toggleSection(e) {
    const key = e.currentTarget.dataset.key
    this.setData({ expanded: this.data.expanded === key ? '' : key })
    this.filterMech()
  },
  filterMech() {
    const { expanded, mechSections, mechKeyword } = this.data
    const kw = mechKeyword.trim()

    // ===== 全局搜索模式：关键词非空时跨 M1-M4 全部板块检索并按板块分组 =====
    if (kw) {
      const kws = expandKeyword(kw)
      const groups = []
      mechSections.forEach(sec => {
        const hit = i => kws.some(k =>
          sec.isTerms
            ? (i.term + (i.abbr || '') + i.text).indexOf(k) > -1
            : (i.no + ' ' + i.title + i.content).indexOf(k) > -1
        )
        const items = sec.items.filter(hit)
        if (!items.length) return
        groups.push({
          key: sec.key,
          name: sec.name,
          isTerms: sec.isTerms,
          count: items.length,
          items: sec.isTerms
            ? items.map(i => ({ term: i.term, abbr: i.abbr || 'n/a', text: i.text }))
            : items.map(i => ({ no: i.no, title: i.title, snippet: excerpt(i.content, kws) }))
        })
      })
      this.setData({
        mechGroups: groups,
        mechTotal: groups.reduce((n, g) => n + g.count, 0),
        mechItems: []
      })
      return
    }

    // ===== 浏览模式：展开单个板块，板块内过滤（无关键词时列出全部） =====
    this.setData({ mechGroups: [], mechTotal: 0 })
    const sec = mechSections.find(s => s.key === expanded)
    if (!sec) { this.setData({ mechItems: [] }); return }
    const items = sec.items
    this.setData({
      mechItems: sec.isTerms
        ? items.map(i => ({ term: i.term, abbr: i.abbr || 'n/a', text: i.text }))
        : items.map(i => ({ no: i.no, title: i.title, chars: i.chars || 0 }))
    })
  },
  goMech(e) {
    const { section, no, term } = e.currentTarget.dataset
    wx.navigateTo({
      url: '/pages/mech-detail/mech-detail?section=' + section + '&no=' + (no || '') + '&term=' + (term || '')
    })
  },

  // ===== 答题练习 =====
  goPractice(e) {
    const cat = e.currentTarget.dataset.cat || 'all'
    if (cat === 'wrong' && this.data.wrongCount === 0) return
    wx.navigateTo({ url: '/pages/practice/practice?cat=' + cat })
  },
  resetData() {
    wx.showModal({
      title: '重置答题统计',
      content: '将清空答题记录和错题本，此操作不可恢复。确定继续吗？',
      confirmColor: '#D64541',
      success: (res) => {
        if (!res.confirm) return
        wx.removeStorageSync('practiceRecord')
        wx.removeStorageSync('wrongBook')
        const app = getApp()
        app.globalData.practiceRecord = { totalAnswered: 0, totalCorrect: 0, history: [] }
        this.refreshQuiz()
        wx.showToast({ title: '已重置', icon: 'success' })
      }
    })
  },

  onShareAppMessage() {
    return { title: 'FIBA 规则裁判员工作台 · 规则速查 + 裁判法 + 晋升答题', path: '/pages/index/index' }
  }
})

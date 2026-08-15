const questionsData = require('../../data/questions.js')
const rulesData = require('../../data/rules.js')

const OPTION_LABELS = ['A', 'B', 'C', 'D']

// 给题目附加规则条款引用信息（依据跳转用）
function decorate(q) {
  if (!q.rule) return q
  const r = rulesData.rules.find(x => x.article === q.rule)
  return { ...q, ruleTitle: r ? r.title : '' }
}

Page({
  data: {
    cat: '',
    catName: '',
    list: [],
    index: 0,
    current: null,
    selected: -1,
    confirmed: false,
    correctCount: 0,
    finished: false,
    optionLabels: OPTION_LABELS
  },
  onLoad(options) {
    const cat = options.cat || ''
    let list
    let catName
    if (cat === 'wrong') {
      // 错题重练模式：从错题本加载
      const wrong = wx.getStorageSync('wrongBook') || []
      list = wrong
        .map(w => questionsData.questions.find(q => q.id === w.qid))
        .filter(Boolean)
      // 练习中答对的错题从错题本移除
      list.forEach(q => { q._fromWrong = true })
      catName = '错题重练'
    } else if (cat === 'all') {
      list = questionsData.questions
      catName = '全部题目'
    } else {
      list = questionsData.questions.filter(q => q.cat === cat)
      const catInfo = questionsData.categories.find(c => c.key === cat)
      catName = catInfo ? catInfo.name : '全部'
    }
    // Fisher-Yates 洗牌：分布均匀，避免 sort(()=>Math.random()-0.5) 的偏置
    // （选项顺序保持与解析一致，不做乱序）
    const shuffled = list.slice()
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = tmp
    }
    list = shuffled.map(decorate)
    this.setData({
      cat,
      catName,
      list,
      index: 0,
      current: list[0] || null,
      finished: list.length === 0,
      // 重置作答状态（onRestart 复用 onLoad，必须显式归零，否则继承上一轮）
      selected: -1,
      confirmed: false,
      correctCount: 0,
      resultPercent: 0
    })
  },
  onSelect(e) {
    if (this.data.confirmed) return
    this.setData({ selected: e.currentTarget.dataset.idx })
  },
  onConfirm() {
    if (this.data.selected < 0 || this.data.confirmed) return
    const { current, selected, correctCount } = this.data
    const correct = selected === current.answer
    this.setData({
      confirmed: true,
      correctCount: correct ? correctCount + 1 : correctCount
    })
    this.saveRecord(current, correct)
    if (!correct) {
      this.addWrong(current)
    } else if (this.data.cat === 'wrong' && current._fromWrong) {
      this.removeWrong(current.id)
    }
    // 确认后解析可能位于屏幕外，自动滚到解析区
    try {
      wx.pageScrollTo({ selector: '.explain', duration: 300 })
    } catch (e) { /* 低版本基础库无 selector，忽略 */ }
  },
  saveRecord(q, correct) {
    const app = getApp()
    const record = app.globalData.practiceRecord || { totalAnswered: 0, totalCorrect: 0, history: [] }
    record.totalAnswered += 1
    if (correct) record.totalCorrect += 1
    record.history.push({ qid: q.id, cat: q.cat, correct, time: Date.now() })
    if (record.history.length > 500) record.history = record.history.slice(-500)
    app.globalData.practiceRecord = record
    wx.setStorageSync('practiceRecord', record)
  },
  addWrong(q) {
    let wrong = wx.getStorageSync('wrongBook') || []
    if (!wrong.find(w => w.qid === q.id)) {
      wrong.push({ qid: q.id, time: Date.now() })
      wx.setStorageSync('wrongBook', wrong)
    }
  },
  removeWrong(qid) {
    let wrong = wx.getStorageSync('wrongBook') || []
    wrong = wrong.filter(w => w.qid !== qid)
    wx.setStorageSync('wrongBook', wrong)
  },
  onNext() {
    const next = this.data.index + 1
    if (next >= this.data.list.length) {
      this.setData({
        finished: true,
        // WXML 不支持 Math.round，正确率在 JS 预计算
        resultPercent: this.data.list.length
          ? Math.round(this.data.correctCount / this.data.list.length * 100) : 0
      })
      wx.pageScrollTo({ scrollTop: 0, duration: 0 })
      return
    }
    this.setData({
      index: next,
      current: this.data.list[next],
      selected: -1,
      confirmed: false
    })
    // 换题后回到顶部，避免停留在上一题的解析位置
    wx.pageScrollTo({ scrollTop: 0, duration: 0 })
  },
  onRestart() {
    this.onLoad({ cat: this.data.cat })
    wx.pageScrollTo({ scrollTop: 0, duration: 0 })
  },
  goBack() {
    wx.navigateBack()
  },
  // 解析区「依据：第X条」跳转规则原文
  goRule() {
    const rule = this.data.current && this.data.current.rule
    if (rule) wx.navigateTo({ url: '/pages/rule-detail/rule-detail?id=' + rule })
  }
})

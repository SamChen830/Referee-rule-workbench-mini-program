const rulesData = require('../../data/rules.js')
const obriData = require('../../data/interpretations.js')

Page({
  data: {
    rule: null,
    paragraphs: [],
    interpretations: [],
    obriExpanded: false,
    showBackTop: false
  },
  onLoad(options) {
    const rule = rulesData.rules.find(r => r.id === options.id || r.article === Number(options.id))
    if (!rule) {
      wx.showToast({ title: '未找到该条款', icon: 'none' })
      return
    }
    wx.setNavigationBarTitle({ title: '第' + rule.article + '条 · ' + rule.title })
    const interpretations = obriData.interpretations[String(rule.article)] || []
    this.setData({
      rule,
      paragraphs: (rule.content || '').split('\n').filter(p => p.trim()),
      interpretations
    })
  },
  toggleObri() {
    this.setData({ obriExpanded: !this.data.obriExpanded })
  },
  onPageScroll(e) {
    const show = e.scrollTop > 500
    if (show !== this.data.showBackTop) this.setData({ showBackTop: show })
  },
  goTop() {
    wx.pageScrollTo({ scrollTop: 0, duration: 200 })
  },
  goBack() {
    wx.navigateBack()
  }
})

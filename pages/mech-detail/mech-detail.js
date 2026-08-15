const mechData = require('../../data/mechanics.js')

Page({
  data: {
    sectionName: '',
    item: null,
    paragraphs: [],
    images: []
  },
  onLoad(options) {
    const sec = mechData.sections.find(s => s.key === options.section)
    if (!sec) {
      wx.showToast({ title: '未找到内容', icon: 'none' })
      return
    }
    let item = null
    if (options.no) {
      item = sec.items.find(i => i.no === options.no && !i.hidden)
    } else if (options.term) {
      item = sec.items.find(i => i.term === options.term)
    }
    if (!item) {
      wx.showToast({ title: '未找到内容', icon: 'none' })
      return
    }
    wx.setNavigationBarTitle({ title: item.title || item.term })
    this.setData({
      sectionName: sec.name,
      item,
      paragraphs: (item.content || item.text || '').split('\n').filter(p => p.trim()),
      images: item.images || []
    })
  },
  // 手势图预览
  previewImg(e) {
    const url = e.currentTarget.dataset.src
    wx.previewImage({
      current: url,
      urls: this.data.images.map(img => '/images/gestures/' + img)
    })
  }
})

const config = require('./config.js')

App({
  onLaunch() {
    // 初始化练习记录
    const record = wx.getStorageSync('practiceRecord') || {
      totalAnswered: 0,
      totalCorrect: 0,
      history: []
    }
    this.globalData.practiceRecord = record

    // 运行时错误捕获：错误会同时上报到微信公众平台「运维中心 → 异常监控」
    // （需在 mp.weixin.qq.com 后台开启「异常监控」）。本地也保留最近一次错误，
    // 便于体验版用户截图反馈。
    wx.onError((err) => {
      console.error('[global error]', err)
      try {
        const last = wx.getStorageSync('lastRuntimeError') || []
        last.unshift({ t: Date.now(), msg: String(err).slice(0, 500) })
        wx.setStorageSync('lastRuntimeError', last.slice(0, 5))
      } catch (e) { /* 存储失败不阻塞 */ }
    })
  },
  globalData: {
    practiceRecord: null,
    // 版本信息，页面可通过 getApp().globalData.version 读取
    version: config.APP_VERSION,
    releaseName: config.RELEASE_NAME,
    buildTime: config.BUILD_TIME
  }
})

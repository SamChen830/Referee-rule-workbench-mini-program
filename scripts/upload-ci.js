/**
 * 生产上传脚本（miniprogram-ci，官方命令行上传通道）
 * ------------------------------------------------------------
 * 前置准备：
 *   1. 安装依赖（用隔离的 node 环境，不要污染全局）：
 *      cd scripts && npm i miniprogram-ci
 *   2. 获取上传密钥（机密，仅发布负责人持有）：
 *      mp.weixin.qq.com → 开发 → 开发管理 → 开发设置
 *      → 「上传代码」→ 生成/下载「上传代码密钥」→ 保存为 scripts/private.key
 *      ⚠️ private.key 已被 .gitignore 排除，绝不可提交！
 *
 * 执行：
 *      node scripts/upload-ci.js
 *
 * 说明：
 *   - 版本号自动取自 ../config.js 的 APP_VERSION（与代码内 globalData.version 一致）
 *   - 上传后在 mp.weixin.qq.com「版本管理」中出现「开发版」，
 *     再由发布负责人「提交审核」→ 微信审核通过 →「发布」即上线生产
 */

const ci = require('miniprogram-ci')
const path = require('path')
const { APP_VERSION, RELEASE_NAME } = require('../config.js')

const APPID = 'wxb8e1708dd44558a2' // 与 project.config.json 保持一致
const projectPath = path.resolve(__dirname, '..')
const privateKeyPath = path.resolve(__dirname, 'private.key')

const version = APP_VERSION
const desc = `${RELEASE_NAME}`

console.log(`[upload] 准备上传 ${APPID} @ v${version}`)

const project = new ci.Project({
  appid: APPID,
  type: 'miniProgram',
  projectPath,
  privateKeyPath
})

ci.upload({
  project,
  version,
  desc,
  setting: {
    es6: true,
    enhance: true,
    postcss: true,
    minified: true,
    urlCheck: false
  },
  onProgressUpdate: (info) => {
    if (info._msg) console.log('  ', info._msg)
  }
})
  .then((res) => {
    console.log('[upload] 成功 ✅', JSON.stringify(res))
    console.log('[upload] 下一步：mp.weixin.qq.com → 版本管理 → 提交审核 → 发布')
  })
  .catch((err) => {
    console.error('[upload] 失败 ❌', err)
    process.exit(1)
  })

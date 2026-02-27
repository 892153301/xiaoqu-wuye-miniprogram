App({
  onLaunch() {
    // 初始化云开发
    wx.cloud.init({
      env: 'YOUR_CLOUD_ENV_ID', // 替换为您的云开发环境ID
      traceUser: true
    })
    
    // 检查登录状态
    this.checkLogin()
  },

  // 全局数据
  globalData: {
    userInfo: null,
    residentInfo: null,  // 业主信息
    buildingInfo: null   // 楼栋信息
  },

  // 检查登录状态
  checkLogin() {
    const token = wx.getStorageSync('token')
    if (!token) {
      this.login()
    }
  },

  // 微信登录
  login() {
    wx.login({
      success: res => {
        if (res.code) {
          // 调用云函数获取openid并登录
          wx.cloud.callFunction({
            name: 'login',
            data: { code: res.code }
          }).then(result => {
            wx.setStorageSync('token', result.result.token)
            this.globalData.userInfo = result.result.userInfo
            this.globalData.residentInfo = result.result.residentInfo
          })
        }
      }
    })
  }
})

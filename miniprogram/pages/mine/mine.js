const app = getApp()

Page({
  data: {
    userInfo: {},
    residentInfo: null,
    unreadCount: 0
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
    this.getUnreadCount()
  },

  // 加载用户信息
  async loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    this.setData({ userInfo })

    try {
      const res = await wx.cloud.callFunction({
        name: 'login',
        data: { action: 'getResidentInfo' }
      })
      this.setData({ residentInfo: res.result.data })
    } catch (err) {
      console.log('未绑定房屋')
    }
  },

  // 选择头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    this.setData({ 'userInfo.avatarUrl': avatarUrl })
    wx.setStorageSync('userInfo', this.data.userInfo)
  },

  // 获取未读消息
  async getUnreadCount() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'notice',
        data: { action: 'getUnreadCount' }
      })
      this.setData({ unreadCount: res.result.count })
    } catch (err) {
      console.error('获取未读消息失败:', err)
    }
  },

  // 绑定房屋
  bindHouse() {
    wx.scanCode({
      success: res => {
        // 解析二维码绑定房屋
        this.bindHouseByCode(res.result)
      },
      fail: () => {
        wx.showModal({
          title: '绑定房屋',
          content: '请联系物业获取房屋绑定二维码',
          showCancel: false
        })
      }
    })
  },

  // 通过二维码绑定
  async bindHouseByCode(code) {
    try {
      wx.showLoading({ title: '绑定中...' })
      await wx.cloud.callFunction({
        name: 'login',
        data: { action: 'bindHouse', code }
      })
      wx.hideLoading()
      wx.showToast({ title: '绑定成功', icon: 'success' })
      this.loadUserInfo()
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '绑定失败', icon: 'none' })
    }
  },

  // 页面跳转
  goPayment() {
    wx.navigateTo({ url: '/pages/payment/payment' })
  },
  goRepair() {
    wx.navigateTo({ url: '/pages/repair/repair' })
  },
  goVisitor() {
    wx.navigateTo({ url: '/pages/visitor/visitor' })
  },
  goComplaint() {
    wx.navigateTo({ url: '/pages/complaint/complaint' })
  },
  goFamily() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },
  goHistory() {
    wx.navigateTo({ url: '/pages/payment/payment' })
  },
  goNotice() {
    wx.switchTab({ url: '/pages/notice/notice' })
  },

  // 联系物业
  contactService() {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567'
    })
  },

  // 关于我们
  showAbout() {
    wx.showModal({
      title: '关于我们',
      content: '智慧社区小程序 v1.0.0\n为您提供便捷的物业服务',
      showCancel: false
    })
  }
})

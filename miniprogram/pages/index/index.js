const app = getApp()

Page({
  data: {
    banners: [],
    notices: [],
    unpaidBills: [],
    unpaidCount: 0,
    residentInfo: null
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 加载首页数据
  async loadData() {
    try {
      // 获取轮播公告
      const bannerRes = await wx.cloud.callFunction({
        name: 'notice',
        data: { action: 'getBanners' }
      })
      this.setData({ banners: bannerRes.result.data })

      // 获取最新公告
      const noticeRes = await wx.cloud.callFunction({
        name: 'notice',
        data: { action: 'getList', limit: 5 }
      })
      this.setData({ notices: noticeRes.result.data })

      // 获取待缴费账单
      const billRes = await wx.cloud.callFunction({
        name: 'payment',
        data: { action: 'getUnpaidList' }
      })
      this.setData({
        unpaidBills: billRes.result.data,
        unpaidCount: billRes.result.data.length
      })

      // 获取业主信息
      const residentRes = await wx.cloud.callFunction({
        name: 'login',
        data: { action: 'getResidentInfo' }
      })
      this.setData({ residentInfo: residentRes.result.data })

    } catch (err) {
      console.error('加载数据失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  // 跳转公告详情
  goNoticeDetail(e) {
    wx.navigateTo({
      url: `/pages/notice/detail?id=${e.currentTarget.dataset.id}`
    })
  },

  // 跳转公告列表
  goNoticeList() {
    wx.switchTab({ url: '/pages/notice/notice' })
  },

  // 跳转缴费页面
  goPayment() {
    wx.navigateTo({ url: '/pages/payment/payment' })
  },

  // 跳转支付
  goPay(e) {
    wx.navigateTo({
      url: `/pages/payment/pay?id=${e.currentTarget.dataset.id}`
    })
  },

  // 跳转报修
  goRepair() {
    wx.navigateTo({ url: '/pages/repair/repair' })
  },

  // 跳转访客预约
  goVisitor() {
    wx.navigateTo({ url: '/pages/visitor/visitor' })
  },

  // 跳转投诉建议
  goComplaint() {
    wx.navigateTo({ url: '/pages/complaint/complaint' })
  }
})

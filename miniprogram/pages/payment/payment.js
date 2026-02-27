Page({
  data: {
    residentInfo: {},
    unpaidBills: [],
    paidBills: []
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  async loadData() {
    try {
      // 获取业主信息
      const residentRes = await wx.cloud.callFunction({
        name: 'login',
        data: { action: 'getResidentInfo' }
      })
      this.setData({ residentInfo: residentRes.result.data })

      // 获取待缴费账单
      const unpaidRes = await wx.cloud.callFunction({
        name: 'payment',
        data: { action: 'getUnpaidList' }
      })
      this.setData({ unpaidBills: unpaidRes.result.data })

      // 获取已缴费账单
      const paidRes = await wx.cloud.callFunction({
        name: 'payment',
        data: { action: 'getPaidList', limit: 10 }
      })
      this.setData({ paidBills: paidRes.result.data })

    } catch (err) {
      console.error('加载账单失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  // 跳转支付页面
  goPay(e) {
    wx.navigateTo({
      url: `/pages/payment/pay?id=${e.currentTarget.dataset.id}`
    })
  },

  // 下载发票
  async downloadInvoice(e) {
    const billId = e.currentTarget.dataset.id
    try {
      wx.showLoading({ title: '生成中...' })
      
      const res = await wx.cloud.callFunction({
        name: 'payment',
        data: { action: 'getInvoice', billId }
      })

      // 下载发票文件
      const fileRes = await wx.cloud.downloadFile({
        fileID: res.result.fileID
      })

      wx.openDocument({
        filePath: fileRes.tempFilePath,
        success: () => {
          wx.hideLoading()
        },
        fail: () => {
          wx.hideLoading()
          wx.showToast({ title: '打开失败', icon: 'none' })
        }
      })
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '下载失败', icon: 'none' })
    }
  }
})

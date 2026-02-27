Page({
  data: {
    form: {
      visitorName: '',
      visitorPhone: '',
      plateNumber: '',
      visitTime: '',
      leaveTime: '',
      reason: ''
    },
    timeRange: [
      ['今天', '明天', '后天'],
      ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00']
    ],
    records: []
  },

  onLoad() {
    this.loadRecords()
  },

  onShow() {
    this.loadRecords()
  },

  // 加载预约记录
  async loadRecords() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'visitor',
        data: { action: 'getList' }
      })
      this.setData({ records: res.result.data })
    } catch (err) {
      console.error('加载预约记录失败:', err)
    }
  },

  // 输入处理
  onNameInput(e) {
    this.setData({ 'form.visitorName': e.detail.value })
  },
  onPhoneInput(e) {
    this.setData({ 'form.visitorPhone': e.detail.value })
  },
  onPlateInput(e) {
    this.setData({ 'form.plateNumber': e.detail.value.toUpperCase() })
  },
  onReasonInput(e) {
    this.setData({ 'form.reason': e.detail.value })
  },

  // 选择时间
  onTimeChange(e) {
    const { value } = e.detail
    const date = this.data.timeRange[0][value[0]]
    const time = this.data.timeRange[1][value[1]]
    this.setData({ 'form.visitTime': `${date} ${time}` })
  },

  onLeaveTimeChange(e) {
    const { value } = e.detail
    const date = this.data.timeRange[0][value[0]]
    const time = this.data.timeRange[1][value[1]]
    this.setData({ 'form.leaveTime': `${date} ${time}` })
  },

  // 提交预约
  async submitVisitor() {
    const { visitorName, visitorPhone, visitTime, leaveTime } = this.data.form

    // 验证
    if (!visitorName.trim()) {
      return wx.showToast({ title: '请输入访客姓名', icon: 'none' })
    }
    if (!visitorPhone || visitorPhone.length !== 11) {
      return wx.showToast({ title: '请输入正确手机号', icon: 'none' })
    }
    if (!visitTime) {
      return wx.showToast({ title: '请选择到访时间', icon: 'none' })
    }
    if (!leaveTime) {
      return wx.showToast({ title: '请选择离开时间', icon: 'none' })
    }

    wx.showLoading({ title: '提交中...' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'visitor',
        data: {
          action: 'create',
          ...this.data.form
        }
      })

      wx.hideLoading()
      wx.showToast({ title: '预约成功', icon: 'success' })

      // 重置表单并刷新
      this.setData({
        form: {
          visitorName: '',
          visitorPhone: '',
          plateNumber: '',
          visitTime: '',
          leaveTime: '',
          reason: ''
        }
      })
      this.loadRecords()

      // 显示访客码
      wx.showModal({
        title: '预约成功',
        content: `访客码：${res.result.code}\n请分享给访客，进门时出示`,
        showCancel: false
      })

    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '预约失败', icon: 'none' })
    }
  },

  // 分享访客码
  shareCode(e) {
    const code = e.currentTarget.dataset.code
    wx.setClipboardData({
      data: code,
      success: () => {
        wx.showToast({ title: '访客码已复制', icon: 'success' })
      }
    })
  }
})

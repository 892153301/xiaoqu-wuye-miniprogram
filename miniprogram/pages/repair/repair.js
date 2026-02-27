Page({
  data: {
    showForm: false,
    repairs: [],
    repairTypes: [
      { id: 'water', name: '水电维修' },
      { id: 'door', name: '门窗维修' },
      { id: 'wall', name: '墙面/地面' },
      { id: 'appliance', name: '家电维修' },
      { id: 'other', name: '其他问题' }
    ],
    timeRange: [
      ['今天', '明天', '后天'],
      ['09:00-11:00', '11:00-13:00', '14:00-16:00', '16:00-18:00', '18:00-20:00']
    ],
    form: {
      type: '',
      typeName: '',
      description: '',
      appointmentTime: '',
      images: []
    }
  },

  onLoad() {
    this.loadRepairs()
  },

  onShow() {
    this.loadRepairs()
  },

  // 切换表单显示
  toggleForm() {
    this.setData({ showForm: !this.data.showForm })
  },

  // 加载工单列表
  async loadRepairs() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'repair',
        data: { action: 'getList' }
      })
      this.setData({ repairs: res.result.data })
    } catch (err) {
      console.error('加载工单失败:', err)
    }
  },

  // 选择类型
  onTypeChange(e) {
    const index = e.detail.value
    const type = this.data.repairTypes[index]
    this.setData({
      'form.type': type.id,
      'form.typeName': type.name
    })
  },

  // 输入描述
  onDescriptionInput(e) {
    this.setData({ 'form.description': e.detail.value })
  },

  // 选择时间
  onTimeChange(e) {
    const { value } = e.detail
    const date = this.data.timeRange[0][value[0]]
    const time = this.data.timeRange[1][value[1]]
    this.setData({ 'form.appointmentTime': `${date} ${time}` })
  },

  // 选择图片
  chooseImage() {
    wx.chooseMedia({
      count: 6 - this.data.form.images.length,
      mediaType: ['image'],
      success: res => {
        const images = [...this.data.form.images, ...res.tempFiles.map(f => f.tempFilePath)]
        this.setData({ 'form.images': images })
      }
    })
  },

  // 预览图片
  previewImage(e) {
    wx.previewImage({
      urls: this.data.form.images,
      current: e.currentTarget.dataset.url
    })
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.form.images.filter((_, i) => i !== index)
    this.setData({ 'form.images': images })
  },

  // 提交工单
  async submitRepair() {
    const { type, description } = this.data.form
    
    if (!type) {
      return wx.showToast({ title: '请选择报修类型', icon: 'none' })
    }
    if (!description.trim()) {
      return wx.showToast({ title: '请描述问题', icon: 'none' })
    }

    wx.showLoading({ title: '提交中...' })

    try {
      // 上传图片
      const imageUrls = []
      for (const path of this.data.form.images) {
        const ext = path.match(/\.([^.]+)$/)[1] || 'jpg'
        const res = await wx.cloud.uploadFile({
          cloudPath: `repairs/${Date.now()}_${Math.random().toString(36).substr(2)}.${ext}`,
          filePath: path
        })
        imageUrls.push(res.fileID)
      }

      // 提交工单
      await wx.cloud.callFunction({
        name: 'repair',
        data: {
          action: 'create',
          ...this.data.form,
          images: imageUrls
        }
      })

      wx.hideLoading()
      wx.showToast({ title: '提交成功', icon: 'success' })
      
      // 重置表单并刷新列表
      this.setData({
        showForm: false,
        form: { type: '', typeName: '', description: '', appointmentTime: '', images: [] }
      })
      this.loadRepairs()

    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '提交失败', icon: 'none' })
      console.error('提交工单失败:', err)
    }
  },

  // 跳转详情
  goDetail(e) {
    wx.navigateTo({
      url: `/pages/repair/detail?id=${e.currentTarget.dataset.id}`
    })
  }
})

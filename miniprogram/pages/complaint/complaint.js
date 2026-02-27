Page({
  data: {
    form: {
      type: 'complaint',
      content: '',
      images: [],
      contact: ''
    },
    history: []
  },

  onLoad() {
    this.loadHistory()
  },

  onShow() {
    this.loadHistory()
  },

  // 设置类型
  setType(e) {
    this.setData({ 'form.type': e.currentTarget.dataset.type })
  },

  // 输入处理
  onContentInput(e) {
    this.setData({ 'form.content': e.detail.value })
  },
  onContactInput(e) {
    this.setData({ 'form.contact': e.detail.value })
  },

  // 选择图片
  chooseImage() {
    wx.chooseMedia({
      count: 4 - this.data.form.images.length,
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

  // 加载历史记录
  async loadHistory() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'complaint',
        data: { action: 'getList' }
      })
      this.setData({ history: res.result.data })
    } catch (err) {
      console.error('加载历史记录失败:', err)
    }
  },

  // 提交
  async submitComplaint() {
    const { content } = this.data.form

    if (!content.trim()) {
      return wx.showToast({ 
        title: `请输入${this.data.form.type === 'complaint' ? '投诉' : '建议'}内容`, 
        icon: 'none' 
      })
    }

    wx.showLoading({ title: '提交中...' })

    try {
      // 上传图片
      const imageUrls = []
      for (const path of this.data.form.images) {
        const ext = path.match(/\.([^.]+)$/)[1] || 'jpg'
        const res = await wx.cloud.uploadFile({
          cloudPath: `complaints/${Date.now()}_${Math.random().toString(36).substr(2)}.${ext}`,
          filePath: path
        })
        imageUrls.push(res.fileID)
      }

      // 提交
      await wx.cloud.callFunction({
        name: 'complaint',
        data: {
          action: 'create',
          ...this.data.form,
          images: imageUrls
        }
      })

      wx.hideLoading()
      wx.showToast({ title: '提交成功', icon: 'success' })

      // 重置表单
      this.setData({
        form: {
          type: 'complaint',
          content: '',
          images: [],
          contact: ''
        }
      })
      this.loadHistory()

    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '提交失败', icon: 'none' })
    }
  },

  // 跳转详情
  goDetail(e) {
    wx.navigateTo({
      url: `/pages/complaint/detail?id=${e.currentTarget.dataset.id}`
    })
  }
})

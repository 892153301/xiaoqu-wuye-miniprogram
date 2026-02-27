Page({
  data: {
    notices: [],
    currentCategory: 'all',
    loading: false,
    page: 1,
    hasMore: true
  },

  onLoad() {
    this.loadNotices()
  },

  onPullDownRefresh() {
    this.setData({ page: 1, notices: [] })
    this.loadNotices().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    if (this.data.hasMore) {
      this.loadNotices()
    }
  },

  // 切换分类
  switchCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({
      currentCategory: category,
      page: 1,
      notices: []
    })
    this.loadNotices()
  },

  // 加载公告列表
  async loadNotices() {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'notice',
        data: {
          action: 'getList',
          category: this.data.currentCategory,
          page: this.data.page,
          limit: 10
        }
      })

      const { data, total } = res.result
      this.setData({
        notices: [...this.data.notices, ...data],
        page: this.data.page + 1,
        hasMore: this.data.notices.length + data.length < total,
        loading: false
      })
    } catch (err) {
      console.error('加载公告失败:', err)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  // 跳转详情
  goDetail(e) {
    wx.navigateTo({
      url: `/pages/notice/detail?id=${e.currentTarget.dataset.id}`
    })
  }
})

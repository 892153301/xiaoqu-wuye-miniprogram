const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action } = event
  const { OPENID } = cloud.getWXContext()

  switch (action) {
    case 'getBanners':
      return await getBanners()
    case 'getList':
      return await getList(event)
    case 'getDetail':
      return await getDetail(event.id)
    case 'getUnreadCount':
      return await getUnreadCount(OPENID)
    default:
      return { code: 400, message: '未知操作' }
  }
}

// 获取轮播公告
async function getBanners() {
  try {
    const res = await db.collection('notices')
      .where({ isBanner: true, status: 'published' })
      .orderBy('publishTime', 'desc')
      .limit(5)
      .get()

    return { code: 200, data: res.data }
  } catch (err) {
    return { code: 500, message: '获取失败', error: err }
  }
}

// 获取公告列表
async function getList({ category, page = 1, limit = 10 }) {
  try {
    let where = { status: 'published' }
    if (category && category !== 'all') {
      where.category = category
    }

    const countRes = await db.collection('notices').where(where).count()
    
    const res = await db.collection('notices')
      .where(where)
      .orderBy('isTop', 'desc')
      .orderBy('publishTime', 'desc')
      .skip((page - 1) * limit)
      .limit(limit)
      .get()

    // 格式化数据
    const data = res.data.map(item => ({
      ...item,
      categoryName: getCategoryName(item.category),
      publishTime: formatTime(item.publishTime)
    }))

    return {
      code: 200,
      data,
      total: countRes.total
    }
  } catch (err) {
    return { code: 500, message: '获取失败', error: err }
  }
}

// 获取详情
async function getDetail(id) {
  try {
    // 增加浏览量
    await db.collection('notices').doc(id).update({
      data: { viewCount: _.inc(1) }
    })

    const res = await db.collection('notices').doc(id).get()
    return { code: 200, data: res.data }
  } catch (err) {
    return { code: 500, message: '获取失败', error: err }
  }
}

// 获取未读消息数
async function getUnreadCount(openid) {
  try {
    // 获取用户最后阅读时间
    const user = await db.collection('users').where({ _openid: openid }).get()
    const lastReadTime = user.data[0]?.lastReadTime || new Date(0)

    const countRes = await db.collection('notices')
      .where({
        status: 'published',
        publishTime: _.gt(lastReadTime)
      })
      .count()

    return { code: 200, count: countRes.total }
  } catch (err) {
    return { code: 500, count: 0 }
  }
}

// 辅助函数
function getCategoryName(category) {
  const map = { notice: '通知', maintain: '维修', activity: '活动' }
  return map[category] || '其他'
}

function formatTime(date) {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

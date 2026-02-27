const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { action } = event
  const { OPENID } = cloud.getWXContext()

  switch (action) {
    case 'getList':
      return await getList(OPENID)
    case 'create':
      return await create(OPENID, event)
    case 'getDetail':
      return await getDetail(event.id)
    default:
      return { code: 400, message: '未知操作' }
  }
}

// 获取列表
async function getList(openid) {
  try {
    const res = await db.collection('complaints')
      .where({ _openid: openid })
      .orderBy('createTime', 'desc')
      .get()

    const data = res.data.map(item => ({
      ...item,
      typeText: item.type === 'complaint' ? '投诉' : '建议',
      statusText: getStatusText(item.status),
      createTime: formatTime(item.createTime)
    }))

    return { code: 200, data }
  } catch (err) {
    return { code: 500, message: '获取失败', error: err }
  }
}

// 创建
async function create(openid, data) {
  try {
    const resident = await db.collection('residents').where({ _openid: openid }).get()
    
    const complaint = await db.collection('complaints').add({
      data: {
        _openid: openid,
        building: resident.data[0]?.building || '',
        unit: resident.data[0]?.unit || '',
        room: resident.data[0]?.room || '',
        type: data.type,
        content: data.content,
        images: data.images || [],
        contact: data.contact || '',
        status: 'pending',
        reply: '',
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    })

    return { code: 200, message: '提交成功', id: complaint._id }
  } catch (err) {
    return { code: 500, message: '提交失败', error: err }
  }
}

// 获取详情
async function getDetail(id) {
  try {
    const res = await db.collection('complaints').doc(id).get()
    return { code: 200, data: res.data }
  } catch (err) {
    return { code: 500, message: '获取失败', error: err }
  }
}

function getStatusText(status) {
  const map = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决'
  }
  return map[status] || status
}

function formatTime(date) {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

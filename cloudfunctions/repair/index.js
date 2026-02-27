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

// 获取工单列表
async function getList(openid) {
  try {
    const res = await db.collection('repairs')
      .where({ _openid: openid })
      .orderBy('createTime', 'desc')
      .get()

    const data = res.data.map(item => ({
      ...item,
      typeName: getTypeName(item.type),
      statusText: getStatusText(item.status),
      createTime: formatTime(item.createTime)
    }))

    return { code: 200, data }
  } catch (err) {
    return { code: 500, message: '获取失败', error: err }
  }
}

// 创建工单
async function create(openid, data) {
  try {
    const resident = await db.collection('residents').where({ _openid: openid }).get()
    
    const orderNo = `WX${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    
    const repair = await db.collection('repairs').add({
      data: {
        _openid: openid,
        orderNo,
        building: resident.data[0]?.building || '',
        unit: resident.data[0]?.unit || '',
        room: resident.data[0]?.room || '',
        type: data.type,
        typeName: getTypeName(data.type),
        description: data.description,
        appointmentTime: data.appointmentTime,
        images: data.images || [],
        status: 'pending',
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    })

    return { code: 200, message: '提交成功', orderId: repair._id }
  } catch (err) {
    return { code: 500, message: '提交失败', error: err }
  }
}

// 获取详情
async function getDetail(id) {
  try {
    const res = await db.collection('repairs').doc(id).get()
    return { code: 200, data: res.data }
  } catch (err) {
    return { code: 500, message: '获取失败', error: err }
  }
}

function getTypeName(type) {
  const map = {
    water: '水电维修',
    door: '门窗维修',
    wall: '墙面/地面',
    appliance: '家电维修',
    other: '其他问题'
  }
  return map[type] || '其他'
}

function getStatusText(status) {
  const map = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

function formatTime(date) {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

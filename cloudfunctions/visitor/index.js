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
    case 'verify':
      return await verify(event.code)
    default:
      return { code: 400, message: '未知操作' }
  }
}

// 获取预约列表
async function getList(openid) {
  try {
    const res = await db.collection('visitors')
      .where({ _openid: openid })
      .orderBy('createTime', 'desc')
      .limit(20)
      .get()

    const data = res.data.map(item => ({
      ...item,
      statusText: getStatusText(item.status),
      createTime: formatTime(item.createTime)
    }))

    return { code: 200, data }
  } catch (err) {
    return { code: 500, message: '获取失败', error: err }
  }
}

// 创建预约
async function create(openid, data) {
  try {
    const resident = await db.collection('residents').where({ _openid: openid }).get()
    
    // 生成6位访客码
    const code = Math.random().toString().substr(2, 6)
    
    // 检查时间冲突（简化版）
    const visitDate = new Date()
    const leaveDate = new Date(visitDate.getTime() + 4 * 60 * 60 * 1000) // 默认4小时

    const visitor = await db.collection('visitors').add({
      data: {
        _openid: openid,
        code,
        building: resident.data[0]?.building || '',
        unit: resident.data[0]?.unit || '',
        room: resident.data[0]?.room || '',
        visitorName: data.visitorName,
        visitorPhone: data.visitorPhone,
        plateNumber: data.plateNumber || '',
        visitTime: data.visitTime,
        leaveTime: data.leaveTime,
        reason: data.reason || '',
        status: 'approved', // 自动通过，实际项目可加审核
        visitDate,
        leaveDate,
        createTime: db.serverDate()
      }
    })

    return { 
      code: 200, 
      message: '预约成功',
      visitorId: visitor._id,
      code
    }
  } catch (err) {
    return { code: 500, message: '预约失败', error: err }
  }
}

// 验证访客码（门卫使用）
async function verify(code) {
  try {
    const res = await db.collection('visitors').where({ code }).get()
    
    if (res.data.length === 0) {
      return { code: 404, message: '无效的访客码' }
    }

    const visitor = res.data[0]
    const now = new Date()

    // 检查是否在有效时间内
    if (now < visitor.visitDate || now > visitor.leaveDate) {
      return { code: 400, message: '访客码已过期或未到时间' }
    }

    return {
      code: 200,
      message: '验证通过',
      data: {
        visitorName: visitor.visitorName,
        building: visitor.building,
        unit: visitor.unit,
        room: visitor.room,
        plateNumber: visitor.plateNumber
      }
    }
  } catch (err) {
    return { code: 500, message: '验证失败', error: err }
  }
}

function getStatusText(status) {
  const map = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    expired: '已过期'
  }
  return map[status] || status
}

function formatTime(date) {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { action, code } = event
  const { OPENID } = cloud.getWXContext()

  switch (action) {
    case 'getResidentInfo':
      return await getResidentInfo(OPENID)
    case 'bindHouse':
      return await bindHouse(OPENID, code)
    default:
      // 默认登录
      return await login(OPENID)
  }
}

// 登录
async function login(openid) {
  try {
    // 查找或创建用户
    let user = await db.collection('users').where({ _openid: openid }).get()
    
    if (user.data.length === 0) {
      // 新用户
      await db.collection('users').add({
        data: {
          _openid: openid,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
    }

    // 查找业主信息
    const resident = await db.collection('residents').where({ _openid: openid }).get()

    return {
      code: 200,
      message: '登录成功',
      data: resident.data[0] || null,
      token: openid
    }
  } catch (err) {
    return { code: 500, message: '登录失败', error: err }
  }
}

// 获取业主信息
async function getResidentInfo(openid) {
  try {
    const resident = await db.collection('residents').where({ _openid: openid }).get()
    
    if (resident.data.length === 0) {
      return { code: 404, message: '未绑定房屋' }
    }

    return {
      code: 200,
      data: resident.data[0]
    }
  } catch (err) {
    return { code: 500, message: '查询失败', error: err }
  }
}

// 绑定房屋
async function bindHouse(openid, code) {
  try {
    // 解析二维码中的房屋信息
    // 实际项目中二维码应包含加密信息
    const houseInfo = JSON.parse(code)
    
    // 检查房屋是否已被绑定
    const existing = await db.collection('residents').where({ 
      building: houseInfo.building,
      unit: houseInfo.unit,
      room: houseInfo.room 
    }).get()

    if (existing.data.length > 0 && existing.data[0]._openid !== openid) {
      return { code: 400, message: '该房屋已被其他用户绑定' }
    }

    // 更新或添加绑定
    if (existing.data.length > 0) {
      await db.collection('residents').doc(existing.data[0]._id).update({
        data: {
          _openid: openid,
          updateTime: db.serverDate()
        }
      })
    } else {
      await db.collection('residents').add({
        data: {
          _openid: openid,
          building: houseInfo.building,
          unit: houseInfo.unit,
          room: houseInfo.room,
          name: houseInfo.name,
          phone: houseInfo.phone,
          area: houseInfo.area,
          status: '已认证',
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
    }

    return { code: 200, message: '绑定成功' }
  } catch (err) {
    return { code: 500, message: '绑定失败', error: err }
  }
}

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { action } = event
  const { OPENID } = cloud.getWXContext()

  switch (action) {
    case 'getUnpaidList':
      return await getUnpaidList(OPENID)
    case 'getPaidList':
      return await getPaidList(OPENID, event.limit)
    case 'createOrder':
      return await createOrder(OPENID, event.billId)
    case 'payCallback':
      return await payCallback(event.orderId)
    case 'getInvoice':
      return await getInvoice(event.billId)
    default:
      return { code: 400, message: '未知操作' }
  }
}

// 获取待缴费列表
async function getUnpaidList(openid) {
  try {
    const resident = await db.collection('residents').where({ _openid: openid }).get()
    if (resident.data.length === 0) {
      return { code: 200, data: [] }
    }

    const { building, unit, room } = resident.data[0]
    
    const res = await db.collection('bills')
      .where({
        building,
        unit,
        room,
        status: 'unpaid'
      })
      .orderBy('deadline', 'asc')
      .get()

    const data = res.data.map(item => ({
      ...item,
      deadline: formatDate(item.deadline)
    }))

    return { code: 200, data }
  } catch (err) {
    return { code: 500, message: '获取失败', error: err }
  }
}

// 获取已缴费列表
async function getPaidList(openid, limit = 10) {
  try {
    const resident = await db.collection('residents').where({ _openid: openid }).get()
    if (resident.data.length === 0) {
      return { code: 200, data: [] }
    }

    const { building, unit, room } = resident.data[0]
    
    const res = await db.collection('bills')
      .where({
        building,
        unit,
        room,
        status: 'paid'
      })
      .orderBy('payTime', 'desc')
      .limit(limit)
      .get()

    const data = res.data.map(item => ({
      ...item,
      payTime: formatDate(item.payTime)
    }))

    return { code: 200, data }
  } catch (err) {
    return { code: 500, message: '获取失败', error: err }
  }
}

// 创建支付订单
async function createOrder(openid, billId) {
  try {
    const bill = await db.collection('bills').doc(billId).get()
    
    if (!bill.data || bill.data.status !== 'unpaid') {
      return { code: 400, message: '账单不存在或已缴费' }
    }

    // 创建统一支付订单
    const orderNo = `PAY${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    
    const order = await db.collection('orders').add({
      data: {
        _openid: openid,
        billId,
        orderNo,
        amount: bill.data.amount,
        status: 'pending',
        createTime: db.serverDate()
      }
    })

    // 这里应该调用微信支付统一下单接口
    // 实际开发需要接入微信支付
    return {
      code: 200,
      orderId: order._id,
      orderNo,
      amount: bill.data.amount
    }
  } catch (err) {
    return { code: 500, message: '创建订单失败', error: err }
  }
}

// 支付回调
async function payCallback(orderId) {
  try {
    const order = await db.collection('orders').doc(orderId).get()
    
    // 更新订单状态
    await db.collection('orders').doc(orderId).update({
      data: {
        status: 'paid',
        payTime: db.serverDate()
      }
    })

    // 更新账单状态
    await db.collection('bills').doc(order.data.billId).update({
      data: {
        status: 'paid',
        payTime: db.serverDate(),
        payMethod: '微信支付'
      }
    })

    return { code: 200, message: '支付成功' }
  } catch (err) {
    return { code: 500, message: '处理失败', error: err }
  }
}

// 获取电子发票
async function getInvoice(billId) {
  try {
    const bill = await db.collection('bills').doc(billId).get()
    
    // 实际项目中这里应该生成PDF发票
    // 示例返回发票文件ID
    return {
      code: 200,
      fileID: bill.data.invoiceFileID || ''
    }
  } catch (err) {
    return { code: 500, message: '获取失败', error: err }
  }
}

function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

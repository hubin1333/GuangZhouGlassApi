// 出库单
const Router = require('koa-router')
const moment = require('moment')
const sequelize = require('../db/seq_mysql')
const { Op, QueryTypes } = require('sequelize')
const DeliveryMain = require('../model/delivery_main.model')
const DeliveryDetail = require('../model/delivery_detail.model')
const Stock = require('../model/inventory_line.model')
const StockFlow = require('../model/inventory_balance.model')

DeliveryMain.hasMany(DeliveryDetail, {
  foreignKey: 'mainId',
  sourceKey: 'id',
  as: 'details',
  constraints: false,
})
DeliveryDetail.belongsTo(DeliveryMain, {
  foreignKey: 'mainId',
  targetKey: 'id',
  as: 'main',
  constraints: false,
})

const prefix = '/api/delivery'
const router = new Router({ prefix })

router.get('/', (ctx) => {
  ctx.body = 'hello delivery!'
})

router.post('/pagelist', async (ctx) => {
  try {
    const req = ctx.request.body || {}
    const { pageNum = 1, pageSize = 10, searchModel = {} } = req
    const pageIndex = Number(pageNum)
    const limit = Number(pageSize)

    const param = { isDelete: 0 }

    if (searchModel.outboundNo) {
      param.outboundNo = { [Op.like]: `%${searchModel.outboundNo}%` }
    }
    if (searchModel.orderNo) {
      param.orderNo = { [Op.like]: `%${searchModel.orderNo}%` }
    }
    if (searchModel.customerName) {
      param.customerName = { [Op.like]: `%${searchModel.customerName}%` }
    }
    if (searchModel.customerId) {
      param.customerId = searchModel.customerId
    }
    if (searchModel.warehouseId) {
      param.warehouseId = searchModel.warehouseId
    }
    if (searchModel.outboundStatus !== undefined && searchModel.outboundStatus !== null && searchModel.outboundStatus !== '') {
      param.outboundStatus = searchModel.outboundStatus
    }
    if (searchModel.outboundType !== undefined && searchModel.outboundType !== null && searchModel.outboundType !== '') {
      param.outboundType = searchModel.outboundType
    }
    if (searchModel.start && searchModel.end) {
      param.outboundTime = { [Op.between]: [searchModel.start, searchModel.end] }
    }

    const { count, rows } = await DeliveryMain.findAndCountAll({
      where: param,
      order: [['id', 'DESC']],
      limit,
      offset: (pageIndex - 1) * limit,
      include: [
        {
          model: DeliveryDetail,
          as: 'details',
          required: false,
          where: { isDelete: 0 },
        },
      ],
      distinct: true,
    })

    ctx.body = {
      code: 200,
      msg: '查找成功',
      data: { rows, count },
    }
  } catch (err) {
    console.error('pagelist err:', err)
    ctx.body = {
      code: 201,
      msg: '查找失败：' + err.message,
      data: err,
    }
  }
})

router.get('/query/:id', async (ctx) => {
  try {
    const id = ctx.params.id
    if (!id) {
      ctx.body = { code: 201, msg: 'id 不能为空', data: null }
      return
    }

    const main = await DeliveryMain.findOne({
      where: { id, isDelete: 0 },
      raw: true,
    })
    if (!main) {
      ctx.body = { code: 201, msg: '记录不存在', data: null }
      return
    }

    const details = await DeliveryDetail.findAll({
      where: { mainId: id, isDelete: 0 },
      raw: true,
    })

    ctx.body = {
      code: 200,
      msg: '查找成功',
      data: { main, details },
    }
  } catch (err) {
    console.error('query err:', err)
    ctx.body = {
      code: 201,
      msg: '查找失败：' + err.message,
      data: err,
    }
  }
})
// 
async function revertDeliveryFromStock(deliveryId, transaction) {
  console.log('revertDeliveryFromStock', deliveryId)

  const details = await DeliveryDetail.findAll({
    where: { mainId: deliveryId, isDelete: 0 },
    transaction,
    raw: true,
  })
  if (!details.length) return
  console.log('revertDeliveryFromStock---details:', JSON.stringify(details))
  const balanceUpdates = {}

  for (const d of details) {
    const qty = Number(d.deliveryNum || 0)
    const goodsModel = d.goodsModel || null
    const goodsColor = d.goodsColor || null
    const soLineId = d.orderDetailId || null

    const activeLine = await Stock.findOne({
      where: {
        goodsModel,
        goodsColor,
        soLineId,
        status: 'active',
      },
      order: [['id', 'DESC']],
      transaction,
      raw: true,
    })

    if (!activeLine) {
      console.warn('revertDeliveryFromStock: 未找到对应的出库库存记录', { goodsModel, goodsColor, soLineId })
      continue
    }

    const prevHistory = await Stock.findOne({
      where: {
        goodsModel,
        goodsColor,
        moLineId,
        soLineId,
        id: { [Op.lt]: activeLine.id },
      },
      order: [['id', 'DESC']],
      transaction,
      raw: true,
    })

    await Stock.update(
      { status: 'history' },
      { where: { id: activeLine.id }, transaction }
    )

    if (prevHistory) {
      await Stock.update(
        { status: 'active' },
        { where: { id: prevHistory.id }, transaction }
      )
    }

    const key = `${goodsModel || ''}|${goodsColor || ''}`
    if (!balanceUpdates[key]) {
      balanceUpdates[key] = { goodsModel, goodsColor,soLineId,moLineId, total: 0 }
    }
    balanceUpdates[key].total += qty
  }

  for (const key of Object.keys(balanceUpdates)) {
    const { goodsModel, goodsColor, total } = balanceUpdates[key]
    const [row] = await StockFlow.findOrCreate({
      where: { goodsModel, goodsColor },
      defaults: { stockNum: 0, isDelete: 0 },
      transaction,
    })
    await row.increment('stockNum', { by: total, transaction })
  }
}
//  
async function applyDeliveryToStock(deliveryId, transaction) {
  console.log('applyDeliveryToStock', deliveryId)

  const details = await DeliveryDetail.findAll({
    where: { mainId: deliveryId, isDelete: 0 },
    transaction,
    raw: true,
  })
  console.log('applyDeliveryToStock---details:', JSON.stringify(details))
  if (!details.length) return

  const now = moment().format('YYYY-MM-DD HH:mm:ss')
  const balanceUpdates = {}
  console.log('applyDeliveryToStock---balanceUpdates:', JSON.stringify(balanceUpdates))
  for (const d of details) {
    const qty = Number(d.deliveryNum || 0)
    const goodsModel = d.goodsModel || null
    const goodsColor = d.goodsColor || null
    const soLineId = d.orderDetailId || null

    const prevLine = await Stock.findOne({
      where: {
        goodsModel,
        goodsColor,
        //soLineId,
        status: 'active',
      },
      order: [['id', 'DESC']],
      transaction,
      raw: true,
    })

    // if (!prevLine) {
    //   console.warn('applyDeliveryToStock: 未找到对应的库存入库记录', { goodsModel, goodsColor, soLineId })
    //   continue
    // }

    await Stock.update(
      { status: 'history' },
      { where: { id: prevLine.id }, transaction }
    )

    await Stock.create({
      receiptLineId: prevLine.receiptLineId,
      moLineId: prevLine.moLineId,
      soLineId,
      goodsModel,
      goodsColor,
      stockType: prevLine.stockType || '订单库存',
      sourceType: '出库',
      originalQty: prevLine.originalQty,
      changeQty: -qty,
      stockNum: Number(prevLine.stockNum || 0) - qty,
      status: 'active',
      createTime: now,
      remark: null,
    }, { transaction })

    const key = `${goodsModel || ''}|${goodsColor || ''}`
    if (!balanceUpdates[key]) {
      balanceUpdates[key] = { goodsModel, goodsColor, total: 0 }
    }
    balanceUpdates[key].total += qty
  }

  for (const key of Object.keys(balanceUpdates)) {
    const { goodsModel, goodsColor, total } = balanceUpdates[key]
    const [row] = await StockFlow.findOrCreate({
      where: { goodsModel, goodsColor },
      defaults: { stockNum: 0, isDelete: 0 },
      transaction,
    })
    const newNum = Math.max(0, Number(row.stockNum || 0) - total)
    await row.update({ stockNum: newNum }, { transaction })
  }
}
// 生成出库单编号
// 格式：CKYYYYMMDD001 
async function generateOutboundNo(prefix = 'CK') {
  const dateStr = moment().format('YYMMDD')
  const fullPrefix = `${prefix}${dateStr}`

  const rows = await sequelize.query(
    `SELECT MAX(delivery_no) AS maxNo FROM delivery_main WHERE delivery_no LIKE ? AND is_delete = 0`,
    {
      replacements: [`${fullPrefix}%`],
      type: QueryTypes.SELECT,
    }
  )
  const maxNo = rows && rows[0] && rows[0].maxNo
  let nextSeq = 1
  if (maxNo) {
    const suffix = maxNo.substring(fullPrefix.length)
    const num = parseInt(suffix, 10)
    if (!isNaN(num)) nextSeq = num + 1
  }
  return `${fullPrefix}${String(nextSeq).padStart(3, '0')}`
}
 
router.post('/processOutbound', async (ctx) => {
  let transaction = null
  try {
    const req = ctx.request.body || {}
    const { mainModel, detailList } = req

    if (!mainModel) {
      ctx.body = { code: 201, msg: '主表数据不能为空', data: null }
      return
    }

    transaction = await sequelize.transaction()

    mainModel.deliveryNo = await generateOutboundNo()
      
    mainModel.createTime = moment().format('YYYY-MM-DD HH:mm:ss')
    mainModel.isDelete = 0

    const createdMain = await DeliveryMain.create(mainModel, { transaction })

    if (Array.isArray(detailList) && detailList.length > 0) {
      const detailData = detailList.map((item) => ({
        ...item,
        mainId: createdMain.id,
        isDelete: 0,
      }))
      await DeliveryDetail.bulkCreate(detailData, { transaction })
    }

    await applyDeliveryToStock(createdMain.id, transaction)

    await transaction.commit()

    ctx.body = {
      code: 200,
      msg: '出库单新增成功',
      data: { id: createdMain.id },
    }
  } catch (err) {
    if (transaction) await transaction.rollback()
    console.error('processOutbound err:', err)
    ctx.body = {
      code: 500,
      msg: '出库单新增失败：' + err.message,
      data: err,
    }
  }
})

router.put('/editWithDetails', async (ctx) => {
  let transaction = null
  try {
    const req = ctx.request.body || {}
    const { mainModel, detailList } = req

    if (!mainModel || !mainModel.id) {
      ctx.body = { code: 201, msg: '主表数据及 id 不能为空', data: null }
      return
    }

    transaction = await sequelize.transaction()

    await revertDeliveryFromStock(mainModel.id, transaction)

    mainModel.updateTime = moment().format('YYYY-MM-DD HH:mm:ss')
    
    await DeliveryMain.update(mainModel, {
      where: { id: mainModel.id },
      transaction,
    })

    await DeliveryDetail.destroy({
      where: { mainId: mainModel.id },
      transaction,
    })

    if (Array.isArray(detailList) && detailList.length > 0) {
      const detailData = detailList.map((item) => ({
        ...item,
        id: item.id || undefined,
        mainId: mainModel.id,
        isDelete: 0,
      }))
      await DeliveryDetail.bulkCreate(detailData, { transaction })
    }

    await applyDeliveryToStock(mainModel.id, transaction)

    await transaction.commit()

    ctx.body = {
      code: 200,
      msg: '出库单修改成功',
      data: null,
    }
  } catch (err) {
    if (transaction) await transaction.rollback()
    console.error('editWithDetails err:', err)
    ctx.body = {
      code: 500,
      msg: '出库单修改失败：' + err.message,
      data: err,
    }
  }
})

router.post('/approve/:id', async (ctx) => {
  try {
    const id = ctx.params.id
    if (!id) {
      ctx.body = { code: 201, msg: 'id 不能为空', data: null }
      return
    }
    const result = await DeliveryMain.update(
      { outboundStatus: 2, updateTime: moment().format('YYYY-MM-DD HH:mm:ss') },
      { where: { id } }
    )
    ctx.body = {
      code: 200,
      msg: '审批成功',
      data: result,
    }
  } catch (err) {
    console.error('approve err:', err)
    ctx.body = {
      code: 201,
      msg: '审批失败：' + err.message,
      data: err,
    }
  }
})

router.post('/reverseApprove/:id', async (ctx) => {
  try {
    const id = ctx.params.id
    if (!id) {
      ctx.body = { code: 201, msg: 'id 不能为空', data: null }
      return
    }
    const result = await DeliveryMain.update(
      { outboundStatus: 3, updateTime: moment().format('YYYY-MM-DD HH:mm:ss') },
      { where: { id } }
    )
    ctx.body = {
      code: 200,
      msg: '反审批成功',
      data: result,
    }
  } catch (err) {
    console.error('reverseApprove err:', err)
    ctx.body = {
      code: 201,
      msg: '反审批失败：' + err.message,
      data: err,
    }
  }
})

router.delete('/delete/:id', async (ctx) => {
  let transaction = null
  try {
    const id = ctx.params.id
    if (!id) {
      ctx.body = { code: 201, msg: 'id 不能为空', data: null }
      return
    }

    transaction = await sequelize.transaction()

    await DeliveryMain.update(
      { isDelete: 1, outboundStatus: 4, updateTime: moment().format('YYYY-MM-DD HH:mm:ss') },
      { where: { id }, transaction }
    )
    await DeliveryDetail.update(
      { isDelete: 1 },
      { where: { mainId: id }, transaction }
    )

    await transaction.commit()

    ctx.body = {
      code: 200,
      msg: '删除成功',
      data: null,
    }
  } catch (err) {
    if (transaction) await transaction.rollback()
    console.error('delete err:', err)
    ctx.body = {
      code: 500,
      msg: '删除失败：' + err.message,
      data: err,
    }
  }
})

router.post('/delmany', async (ctx) => {
  let transaction = null
  try {
    const req = ctx.request.body || []
    if (!Array.isArray(req) || req.length === 0) {
      ctx.body = { code: 201, msg: '参数不能为空', data: null }
      return
    }

    const ids = req.map((item) => item.id).filter(Boolean)
    if (ids.length === 0) {
      ctx.body = { code: 201, msg: '有效 id 为空', data: null }
      return
    }

    transaction = await sequelize.transaction()
    const now = moment().format('YYYY-MM-DD HH:mm:ss')

    await DeliveryMain.update(
      { isDelete: 1, outboundStatus: 4, updateTime: now },
      { where: { id: { [Op.in]: ids } }, transaction }
    )
    await DeliveryDetail.update(
      { isDelete: 1 },
      { where: { mainId: { [Op.in]: ids } }, transaction }
    )

    await transaction.commit()

    ctx.body = {
      code: 200,
      msg: '批量删除成功',
      data: ids.length,
    }
  } catch (err) {
    if (transaction) await transaction.rollback()
    console.error('delmany err:', err)
    ctx.body = {
      code: 500,
      msg: '批量删除失败：' + err.message,
      data: err,
    }
  }
})

module.exports = { deliveryRouter: router }
const Router = require('koa-router')
const moment = require('moment')
const sequelize = require('../db/seq_mysql')
const { Op, QueryTypes } = require('sequelize')
const MoMain = require('../model/mo_main.model')
const MoDetail = require('../model/mo_detail.model')
const SoDetail = require('../model/so_detail.model')
const SoMain = require('../model/so_main.model')
const ReceiptDetail = require('../model/receipt_detail.model')

MoMain.hasMany(MoDetail, {
  foreignKey: 'mainId',
  sourceKey: 'id',
  as: 'details',
  constraints: false,
})

MoDetail.belongsTo(MoMain, {
  foreignKey: 'mainId',
  targetKey: 'id',
  as: 'main',
  constraints: false,
})

MoDetail.belongsTo(SoDetail, {
  foreignKey: 'soLineId',
  targetKey: 'id',
  as: 'soDetail',
  constraints: false,
})

SoDetail.hasMany(MoDetail, {
  foreignKey: 'soLineId',
  sourceKey: 'id',
  as: 'moDetails',
  constraints: false,
})

const prefix = '/api/mo'
const router = new Router({ prefix })

router.get('/', (ctx) => {
  ctx.body = 'hello purOrder!!!!!'
})

router.get('/pagelist', async (ctx) => {
  try {
    const req = ctx.request.body || {}
    const { pageNum = 1, pageSize = 10, searchModel = {} } = req
    const pageIndex = Number(pageNum)
    const limit = Number(pageSize)

    const param = { isDelete: 0 }

    if (searchModel.orderNo) {
      param.orderNo = { [Op.like]: `%${searchModel.orderNo}%` }
    }
    if (searchModel.customerName) {
      param.customerName = { [Op.like]: `%${searchModel.customerName}%` }
    }
    if (searchModel.customerId) {
      param.customerId = searchModel.customerId
    }
    if (searchModel.orderStatus !== undefined && searchModel.orderStatus !== null && searchModel.orderStatus !== '') {
      param.orderStatus = searchModel.orderStatus
    }
    if (searchModel.start && searchModel.end) {
      param.orderTime = { [Op.between]: [searchModel.start, searchModel.end] }
    }

    const { count, rows } = await MoMain.findAndCountAll({
      where: param,
      order: [['id', 'DESC']],
      limit,
      offset: (pageIndex - 1) * limit,
      include: [
        {
          model: MoDetail,
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

    const main = await MoMain.findOne({
      where: { id, isDelete: 0 },
      include: [
        {
          model: MoDetail,
          as: 'details',
          required: false,
          where: { isDelete: 0 },
          include: [
            {
              model: SoDetail,
              as: 'soDetail',
              required: false,
              include: [
                {
                  model: SoMain,
                  as: 'main',
                  required: false,
                },
              ],
            },
          ],
        },
      ],
    })
    if (!main) {
      ctx.body = { code: 201, msg: '记录不存在', data: null }
      return
    }

    const mainData = main.toJSON()
    const details = mainData.details || []
    if (details.length > 0) {
      const moLineIds = details.map(d => d.id)
      const receiptSumList = await ReceiptDetail.findAll({
        attributes: [
          'moLineId',
          [sequelize.fn('SUM', sequelize.col('receipt_num')), 'receiptTotal'],
        ],
        where: { moLineId: { [Op.in]: moLineIds }, isDelete: 0 },
        group: ['moLineId'],
        raw: true,
      })
      const receiptSumMap = {}
      receiptSumList.forEach(r => {
        receiptSumMap[r.moLineId] = Number(r.receiptTotal) || 0
      })
      details.forEach(d => {
        d.receiptTotal = receiptSumMap[d.id] || 0
      })
    }

    ctx.body = {
      code: 200,
      msg: '查找成功',
      data: mainData,
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

async function generateOrderNo(prefix = 'MO') {
  const dateStr = moment().format('YYMMDD')
  const fullPrefix = `${prefix}${dateStr}`

  const rows = await sequelize.query(
    `SELECT MAX(order_no) AS maxNo FROM mo_main WHERE order_no LIKE ? AND is_delete = 0`,
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
 

router.post('/processOrder', async (ctx) => {
  let transaction = null
  try {
    const req = ctx.request.body || {}
    const { mainModel, detailList } = req

    if (!mainModel) {
      ctx.body = { code: 201, msg: '主表数据不能为空', data: null }
      return
    }

    transaction = await sequelize.transaction()

    mainModel.orderNo = await generateOrderNo()

    mainModel.createTime = moment().format('YYYY-MM-DD HH:mm:ss')
    mainModel.isDelete = 0

    const createdMain = await MoMain.create(mainModel, { transaction })

    if (Array.isArray(detailList) && detailList.length > 0) {
      const detailData = detailList.map((item) => ({
        ...item,
        mainId: createdMain.id,
        isDelete: 0,
      }))
      await MoDetail.bulkCreate(detailData, { transaction }) 
    }

    await transaction.commit()

    ctx.body = {
      code: 200,
      msg: '订单新增成功',
      data: { id: createdMain.id },
    }
  } catch (err) {
    if (transaction) await transaction.rollback()
    console.error('processOrder err:', err)
    ctx.body = {
      code: 500,
      msg: '订单新增失败：' + err.message,
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
    mainModel.updateTime = moment().format('YYYY-MM-DD HH:mm:ss')

    await MoMain.update(mainModel, {
      where: { id: mainModel.id },
      transaction,
    })

    const oldDetails = await MoDetail.findAll({
      where: { mainId: mainModel.id, isDelete: 0 },
      raw: true,
      transaction,
    }) 

    await MoDetail.destroy({
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
      await MoDetail.bulkCreate(detailData, { transaction })
      
    }

    await transaction.commit()

    ctx.body = {
      code: 200,
      msg: '订单修改成功',
      data: null,
    }
  } catch (err) {
    if (transaction) await transaction.rollback()
    console.error('editWithDetails err:', err)
    ctx.body = {
      code: 500,
      msg: '订单修改失败：' + err.message,
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
    const result = await MoMain.update(
      { orderStatus: 2, updateTime: moment().format('YYYY-MM-DD HH:mm:ss') },
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
    const result = await MoMain.update(
      { orderStatus: 3, updateTime: moment().format('YYYY-MM-DD HH:mm:ss') },
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

    const oldDetails = await MoDetail.findAll({
      where: { mainId: id, isDelete: 0 },
      raw: true,
      transaction,
    })

    await MoMain.update(
      { isDelete: 1, orderStatus: 4, updateTime: moment().format('YYYY-MM-DD HH:mm:ss') },
      { where: { id }, transaction }
    )
    await MoDetail.update(
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

    const oldDetails = await MoDetail.findAll({
      where: { mainId: { [Op.in]: ids }, isDelete: 0 },
      raw: true,
      transaction,
    })

    await MoMain.update(
      { isDelete: 1, orderStatus: 4, updateTime: now },
      { where: { id: { [Op.in]: ids } }, transaction }
    )
    await MoDetail.update(
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

module.exports = { moRouter: router }
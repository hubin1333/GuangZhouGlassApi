const Router = require('koa-router')
const moment = require('moment')
const sequelize = require('../db/seq_mysql')
const { Op, QueryTypes } = require('sequelize')
const soMain = require('../model/so_main.model')
const soDetail = require('../model/so_detail.model')
const moDetail = require('../model/mo_detail.model')
// 销售订单 
soMain.hasMany(soDetail, {
  foreignKey: 'mainId',
  sourceKey: 'id',
  as: 'details',
  constraints: false,
})
soDetail.belongsTo(soMain, {
  foreignKey: 'mainId',
  targetKey: 'id',
  as: 'main',
  constraints: false,
})

const prefix = '/api/so'
const router = new Router({ prefix })

router.get('/', (ctx) => {
  ctx.body = 'hello purOrder!'
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

    const { count, rows } = await soMain.findAndCountAll({
      where: param,
      order: [['id', 'DESC']],
      limit,
      offset: (pageIndex - 1) * limit,
      include: [
        {
          model: soDetail,
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

    const main = await soMain.findOne({
      where: { id, isDelete: 0 },
      raw: true,
    })
    if (!main) {
      ctx.body = { code: 201, msg: '记录不存在', data: null }
      return
    }

    const details = await soDetail.findAll({
      where: { mainId: id, isDelete: 0 },
      raw: true,
    })

    if (details.length > 0) {
      const soLineIds = details.map(d => d.id)
      const moSumList = await moDetail.findAll({
        attributes: [
          'soLineId',
          [sequelize.fn('SUM', sequelize.col('mo_num')), 'moTotal'],
        ],
        where: { soLineId: { [Op.in]: soLineIds }, isDelete: 0 },
        group: ['soLineId'],
        raw: true,
      })
      const moSumMap = {}
      moSumList.forEach(m => {
        moSumMap[m.soLineId] = Number(m.moTotal) || 0
      })
      details.forEach(d => {
        d.moTotal = moSumMap[d.id] || 0
      })
    }

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

//已经下到工厂的数量  在Mo_detail中,按goodsModel,goodsColor,分组,求stockNum的总和
async function getMoCount(mainId) {
  const result = await soDetail.findAll({
    attributes: [
      'goodsModel',
      'goodsColor',
      [sequelize.fn('SUM', sequelize.col('mo_num')), 'factoryTotal'],
    ],
    where: { isDelete: 0 },
    group: ['soLineId'],
    raw: true,
  })
  return result
}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    



async function generateOrderNo(prefix = 'CO') {
  const dateStr = moment().format('YYMMDD')
  const fullPrefix = `${prefix}${dateStr}`

  const rows = await sequelize.query(
    `SELECT MAX(order_no) AS maxNo FROM so_main WHERE order_no LIKE ? AND is_delete = 0`,
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

router.post('/generateOrderNo', async (ctx) => {
  try {
    const req = ctx.request.body || {}
    const newNo = await generateOrderNo(req.prefix)

    ctx.body = {
      code: 200,
      msg: '生成成功',
      data: newNo,
    }
  } catch (err) {
    console.error('generateOrderNo err:', err)
    ctx.body = {
      code: 201,
      msg: '生成失败：' + err.message,
      data: err,
    }
  }
})

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

    const createdMain = await soMain.create(mainModel, { transaction })

    if (Array.isArray(detailList) && detailList.length > 0) {
      const detailData = detailList.map((item) => ({
        ...item,
        mainId: createdMain.id,
        isDelete: 0,
      }))
      await soDetail.bulkCreate(detailData, { transaction })
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

    await soMain.update(mainModel, {
      where: { id: mainModel.id },
      transaction,
    })

    await soDetail.destroy({
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
      await soDetail.bulkCreate(detailData, { transaction })
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
    const result = await soMain.update(
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
    const result = await soMain.update(
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

    await soMain.update(
      { isDelete: 1, orderStatus: 4, updateTime: moment().format('YYYY-MM-DD HH:mm:ss') },
      { where: { id }, transaction }
    )
    await soDetail.update(
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

    await soMain.update(
      { isDelete: 1, orderStatus: 4, updateTime: now },
      { where: { id: { [Op.in]: ids } }, transaction }
    )
    await soDetail.update(
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

module.exports = { soRouter: router }

//入库
const Router = require('koa-router')
const moment = require('moment')
const sequelize = require('../db/seq_mysql')
const { Op, QueryTypes } = require('sequelize')
const ReceiptMain = require('../model/receipt_main.model')
const ReceiptDetail = require('../model/receipt_detail.model')    
const MoDetail = require('../model/mo_detail.model')
const MoMain = require('../model/mo_main.model')
const SoDetail = require('../model/so_detail.model')
const SoMain = require('../model/so_main.model')
const Stock = require('../model/inventory_line.model')
const StockFlow = require('../model/inventory_balance.model')

ReceiptMain.hasMany(ReceiptDetail, {
  foreignKey: 'mainId',
  sourceKey: 'id',
  as: 'details',
  constraints: false,
})

ReceiptDetail.belongsTo(ReceiptMain, {
  foreignKey: 'mainId',
  targetKey: 'id',
  as: 'main',
  constraints: false,
})

ReceiptDetail.belongsTo(MoDetail, {
  foreignKey: 'moLineId',
  targetKey: 'id',
  as: 'moDetail',
  constraints: false,
})

MoDetail.hasMany(ReceiptDetail, {
  foreignKey: 'moLineId',
  sourceKey: 'id',
  as: 'receiptDetails',
  constraints: false,
})

/**
 * 将入库单明细写入库存流水(inventory_line)，并累加库存汇总(inventory_balance)
 * 调用时机：新增入库单时直接生效（暂不考虑审核环节）
 *
 * 关联链路：ReceiptDetail.moLineId → MoDetail.soLineId → SoDetail
 *   - moLineId：直接从 ReceiptDetail 取
 *   - soLineId：通过 ReceiptDetail.moLineId 批量查 MoDetail 后带出
 *
 * 版本化库存流水逻辑（append-only ledger）：
 *   判断批次：goodsModel + goodsColor + soLineId 三者相同
 *   - 同批次没有 active 记录 → 建档：originalQty = changeQty = qty, stockNum = qty, status = 'active'
 *   - 同批次已有 active 记录 → 版本滚动：
 *       1) 上一条 active 记录 → status 改为 'history'
 *       2) 新增 active 记录：originalQty 继承上一条的 originalQty（不变）,
 *          changeQty = 当前入库数量, stockNum = 上一条 stockNum + changeQty
 *
 * @param {number} receiptId   入库单主表ID(receipt_main.id)
 * @param {object} transaction Sequelize 事务对象，保证单据与库存原子性
 */
async function applyReceiptToStock(receiptId, transaction) {
  console.log('applyReceiptToStock', receiptId)

  // 1. 查出该入库单所有有效明细行
  const details = await ReceiptDetail.findAll({
    where: { mainId: receiptId, isDelete: 0 },
    transaction,
    raw: true,
  })
  if (!details.length) return

  // 2. 收集所有 moLineId，批量查询 MoDetail 构建 Map，
  //    目的是从 ReceiptDetail.moLineId 反查到 MoDetail.soLineId（销售订单明细ID）
  const moLineIds = details.map(d => d.moLineId).filter(Boolean)
  let moMap = {}
  if (moLineIds.length) {
    const moDetails = await MoDetail.findAll({
      where: { id: { [Op.in]: moLineIds }, isDelete: 0 },
      transaction,
      raw: true,
    })
    moMap = Object.fromEntries(moDetails.map(m => [m.id, m]))
  }

  const now = moment().format('YYYY-MM-DD HH:mm:ss')
  const balanceUpdates = {}    // 按 goodsModel + goodsColor 分组的数量汇总，用于更新 inventory_balance

  // 3. 逐行处理：先查同批次是否已有 active 记录，再决定是建档还是版本滚动
  for (const d of details) {
    const mo = d.moLineId ? moMap[d.moLineId] : null
    const soLineId = mo ? mo.soLineId : null   // 通过 MoDetail 反带 soLineId
    const qty = Number(d.receiptNum || 0)

    // 优先取 ReceiptDetail 自身的 goodsModel/Color，没有则回退到 MoDetail 的
    const goodsModel = d.goodsModel || (mo && mo.goodsModel) || null
    const goodsColor = d.goodsColor || (mo && mo.goodsColor) || null

    // 按 goodsModel + goodsColor + receiptLineId 判断是否属于同一批次
    const prevLine = await Stock.findOne({
      where: {
        goodsModel,
        goodsColor,
        receiptLineId: d.id,
        status: 'active',
      },
      order: [['id', 'DESC']],
      transaction,
      raw: true,
    })

    let originalQty, stockNum
    if (prevLine) {
      // 同批次已有 active 记录 → 版本滚动
      // 把上一条置为历史
      await Stock.update(
        { status: 'history' },
        { where: { id: prevLine.id }, transaction }
      )
      // originalQty 保持不变，stockNum 累加上一条的 stockNum
      originalQty = prevLine.originalQty
      stockNum = Number(prevLine.stockNum || 0) + qty
    } else {
      // 同批次首次出现 → 建档
      originalQty = qty
      stockNum = qty
    }

    // 新增一条 active 版本记录
    await Stock.create({
      receiptLineId: d.id,
      moLineId: d.moLineId || null,
      soLineId,
      goodsModel,
      goodsColor,
      stockType: '订单库存',
      sourceType: '入库',
      originalQty,
      changeQty: qty,
      stockNum,
      status: 'active',
      createTime: now,
      remark: null,
    }, { transaction })

    // 按 型号|颜色 做分组 key，相同商品的多行数量合并，用于更新 inventory_balance
    const key = `${goodsModel || ''}|${goodsColor || ''}|${d.id || ''}`
    if (!balanceUpdates[key]) {
      balanceUpdates[key] = { goodsModel, goodsColor, receiptLineId: d.id, total: 0 }
    }
    balanceUpdates[key].total += qty
  }

  // 4. 逐组累加库存汇总表（inventory_balance），
  //    若该商品型号+颜色组合不存在则自动创建一条初始记录
  for (const key of Object.keys(balanceUpdates)) {
    const { goodsModel, goodsColor, receiptLineId, total } = balanceUpdates[key]
    const [row] = await StockFlow.findOrCreate({
      where: { goodsModel, goodsColor, receiptLineId },
      defaults: { stockNum: 0, receiptLineId, isDelete: 0 },
      transaction,
    })
    await row.update({
      stockNum: Number(row.stockNum || 0) + total,
      lastInTime: now,
    }, { transaction })
  }
}

/**
 * 冲回入库单对库存的影响（删除入库单 / 反审批时调用）
 * 逻辑：
 *   1. 根据 receiptId 查出该入库单的所有明细 ReceiptDetail
 *   2. 用明细的 receiptLineId 找到 inventory_line 里对应的 active 记录
 *   3. 对每条待冲回的 active 记录：
 *      - 找到同批次(goodsModel + goodsColor + soLineId)中，id < 当前记录的最近一条 history
 *      - 当前记录 → status='history'
 *      - 上一条 history → status='active'（恢复为当前有效版本）
 *   4. 按 goodsModel + goodsColor 汇总 changeQty，扣减 InventoryBalance.stockNum
 *
 * @param {number} receiptId   入库单主表ID(receipt_main.id)
 * @param {object} transaction Sequelize 事务对象
 */
async function revertReceiptFromStock(receiptId, transaction) {
  // 1. 查出入库单所有明细，拿到 receiptLineId 集合
  const details = await ReceiptDetail.findAll({
    where: { mainId: receiptId, isDelete: 0 },
    transaction,
    raw: true,
  })
  if (!details.length) return

  const receiptLineIds = details.map(d => d.id)

  // 2. 找到这次入库对应的所有 inventory_line 记录
  const lines = await Stock.findAll({
    where: {
      receiptLineId: { [Op.in]: receiptLineIds },
      status: 'active',
    },
    transaction,
    raw: true,
  })
  if (!lines.length) return

  const balanceUpdates = {}

  // 3. 逐行冲回：当前 → history，上一条 history → active
  for (const l of lines) {
    // 找到同批次(goodsModel + goodsColor + soLineId)中，id 小于当前记录的最近一条
    const prevHistory = await Stock.findOne({
      where: {
        goodsModel: l.goodsModel,
        goodsColor: l.goodsColor,
        soLineId: l.soLineId || null,
        id: { [Op.lt]: l.id },
      },
      order: [['id', 'DESC']],
      transaction,
      raw: true,
    })

    // 当前这条冲回为 history
    await Stock.update(
      { status: 'history' },
      { where: { id: l.id }, transaction }
    )

    // 如果存在上一条版本，恢复为 active
    if (prevHistory) {
      await Stock.update(
        { status: 'active' },
        { where: { id: prevHistory.id }, transaction }
      )
    }

    // 汇总 changeQty，用于扣减 InventoryBalance
    const key = `${l.goodsModel || ''}|${l.goodsColor || ''}`
    if (!balanceUpdates[key]) {
      balanceUpdates[key] = { goodsModel: l.goodsModel, goodsColor: l.goodsColor, total: 0 }
    }
    balanceUpdates[key].total += Number(l.changeQty || 0)
  }

  // 4. 逐组扣减库存汇总
  for (const key of Object.keys(balanceUpdates)) {
    const { goodsModel, goodsColor, total } = balanceUpdates[key]
    const row = await StockFlow.findOne({
      where: { goodsModel, goodsColor },
      transaction,
    })
    if (row) {
      const newNum = Math.max(0, Number(row.stockNum || 0) - total)
      await row.update({ stockNum: newNum }, { transaction })
    }
  }
}
 

const prefix = '/api/receipt'
const router = new Router({ prefix })

router.get('/', (ctx) => {
  ctx.body = 'hello receipt!'
})

router.post('/pagelist', async (ctx) => {
  try {
    const req = ctx.request.body || {}
    const { pageNum = 1, pageSize = 10, searchModel = {} } = req
    const pageIndex = Number(pageNum)
    const limit = Number(pageSize)

    const param = { isDelete: 0 }

    if (searchModel.receiptNo) {
      param.receiptNo = { [Op.like]: `%${searchModel.receiptNo}%` }
    }
    if (searchModel.orderNo) {
      param.orderNo = { [Op.like]: `%${searchModel.orderNo}%` }
    }
    if (searchModel.supplierName) {
      param.supplierName = { [Op.like]: `%${searchModel.supplierName}%` }
    }
    if (searchModel.supplierId) {
      param.supplierId = searchModel.supplierId
    }
    if (searchModel.warehouseId) {
      param.warehouseId = searchModel.warehouseId
    }
    if (searchModel.inboundStatus !== undefined && searchModel.inboundStatus !== null && searchModel.inboundStatus !== '') {
      param.inboundStatus = searchModel.inboundStatus
    }
    if (searchModel.inboundType !== undefined && searchModel.inboundType !== null && searchModel.inboundType !== '') {
      param.inboundType = searchModel.inboundType
    }
    if (searchModel.start && searchModel.end) {
      param.inboundTime = { [Op.between]: [searchModel.start, searchModel.end] }
    }

    const { count, rows } = await ReceiptMain.findAndCountAll({
      where: param,
      order: [['id', 'DESC']],
      limit,
      offset: (pageIndex - 1) * limit,
      include: [
        {
          model: ReceiptDetail,
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

    const main = await ReceiptMain.findOne({
      where: { id, isDelete: 0 },
      include: [
        {
          model: ReceiptDetail,
          as: 'details',
          required: false,
          where: { isDelete: 0 },
          include: [
            {
              model: MoDetail,
              as: 'moDetail',
              required: false,
              include: [
                {
                  model: MoMain,
                  as: 'main',
                  required: false,
                },
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
        },
      ],
    })
    if (!main) {
      ctx.body = { code: 201, msg: '记录不存在', data: null }
      return
    }

    ctx.body = {
      code: 200,
      msg: '查找成功',
      data: main,
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

async function generateInboundNo(prefix = 'RK') {
  const dateStr = moment().format('YYMMDD')
  const fullPrefix = `${prefix}${dateStr}`

  const rows = await sequelize.query(
    `SELECT MAX(receipt_no) AS maxNo FROM receipt_main WHERE receipt_no LIKE ? AND is_delete = 0`,
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

 

router.post('/processInbound', async (ctx) => {
  console.log(
    "processInbound",
  )
  let transaction = null
  try {
    const req = ctx.request.body || {}
    const { mainModel, detailList } = req

    if (!mainModel) {
      ctx.body = { code: 201, msg: '主表数据不能为空', data: null }
      return
    }

    transaction = await sequelize.transaction()

    mainModel.receiptNo = await generateInboundNo() 
      
    mainModel.createTime = moment().format('YYYY-MM-DD HH:mm:ss') 
    mainModel.isDelete = 0

    const createdMain = await ReceiptMain.create(mainModel, { transaction })

    if (Array.isArray(detailList) && detailList.length > 0) {
      const detailData = detailList.map((item) => ({
        ...item,
        mainId: createdMain.id,
        isDelete: 0,
      }))
      await ReceiptDetail.bulkCreate(detailData, { transaction })
    }

    await applyReceiptToStock(createdMain.id, transaction)

    await transaction.commit()

    ctx.body = {
      code: 200,
      msg: '入库单新增成功',
      data: { id: createdMain.id },
    }
  } catch (err) {
    if (transaction) await transaction.rollback()
    console.error('processInbound err:', err)
    ctx.body = {
      code: 500,
      msg: '入库单新增失败：' + err.message,
      data: err,
    }
  }
})

router.put('/editWithDetails', async (ctx) => {
  console.log(
    "editWithDetails",
  )
  let transaction = null
  try {
    
    const req = ctx.request.body || {}
    const { mainModel, addList = [], updateList = [], deleteIds = [] } = req

    if (!mainModel || !mainModel.id) {
      ctx.body = { code: 201, msg: '主表数据及 id 不能为空', data: null }
      return
    }

    transaction = await sequelize.transaction()

    await revertReceiptFromStock(mainModel.id, transaction)

    mainModel.updateTime = moment().format('YYYY-MM-DD HH:mm:ss')

    await ReceiptMain.update(mainModel, {
      where: { id: mainModel.id },
      transaction,
    })

    if (Array.isArray(deleteIds) && deleteIds.length > 0) {
      await ReceiptDetail.update(
        { isDelete: 1 },
        { where: { id: { [Op.in]: deleteIds } }, transaction }
      )
    }

    if (Array.isArray(updateList) && updateList.length > 0) {
      for (const item of updateList) {
        const { id, ...rest } = item
        if (id) {
          await ReceiptDetail.update(rest, {
            where: { id },
            transaction,
          })
        }
      }
    }

    if (Array.isArray(addList) && addList.length > 0) {
      const detailData = addList.map((item) => ({
        ...item,
        mainId: mainModel.id,
        isDelete: 0,
      }))
      await ReceiptDetail.bulkCreate(detailData, { transaction })
    }

    await applyReceiptToStock(mainModel.id, transaction)

    await transaction.commit()

    ctx.body = {
      code: 200,
      msg: '入库单修改成功',
      data: null,
    }
  } catch (err) {
    if (transaction) await transaction.rollback()
    console.error('editWithDetails err:', err)
    ctx.body = {
      code: 500,
      msg: '入库单修改失败：' + err.message,
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
    const result = await ReceiptMain.update(
      { inboundStatus: 2, updateTime: moment().format('YYYY-MM-DD HH:mm:ss') },
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
    const result = await ReceiptMain.update(
      { inboundStatus: 3, updateTime: moment().format('YYYY-MM-DD HH:mm:ss') },
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

    await revertReceiptFromStock(id, transaction)

    await ReceiptMain.update(
      { isDelete: 1, inboundStatus: 4, updateTime: moment().format('YYYY-MM-DD HH:mm:ss') },
      { where: { id }, transaction }
    )
    await ReceiptDetail.update(
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

    for (const id of ids) {
      await revertReceiptFromStock(id, transaction)
    }

    await ReceiptMain.update(
      { isDelete: 1, inboundStatus: 4, updateTime: now },
      { where: { id: { [Op.in]: ids } }, transaction }
    )
    await ReceiptDetail.update(
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

module.exports = { receiptRouter: router }
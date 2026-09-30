
//库存余额
const Router = require('koa-router')
const moment = require('moment')
const sequelize = require('../db/seq_mysql')
const { Op, QueryTypes } = require('sequelize')
const ReceiptMain = require('../model/receipt_main.model')
const ReceiptDetail = require('../model/receipt_detail.model')
const DeliveryMain = require('../model/delivery_main.model')
const DeliveryDetail = require('../model/delivery_detail.model')
const MoDetail = require('../model/mo_detail.model')
const MoMain = require('../model/mo_main.model')
const SoDetail = require('../model/so_detail.model')
const SoMain = require('../model/so_main.model')
const Good = require('../model/good.model')
const InventoryLine = require('../model/inventory_line.model')
const InventoryBalance = require('../model/inventory_balance.model')

// === 关联定义（仅本路由独有的关联，其余已在各业务路由中注册） ===

// InventoryBalance.receiptLineId  →  ReceiptDetail.id
InventoryBalance.belongsTo(ReceiptDetail, {
  foreignKey: 'receiptLineId',
  targetKey: 'id',
  as: 'receiptDetail',
  constraints: false,
})
ReceiptDetail.hasMany(InventoryBalance, {
  foreignKey: 'receiptLineId',
  sourceKey: 'id',
  as: 'inventoryBalances',
  constraints: false,
})

// InventoryBalance.goodsModel  →  Good.goodsModel  （字符串字段关联）
InventoryBalance.belongsTo(Good, {
  foreignKey: 'goodsModel',
  targetKey: 'goodsModel',
  as: 'goodInfo',
  constraints: false,
})

const prefix = '/api/stock'
const router = new Router({ prefix })

router.get('/', (ctx) => {
  ctx.body = 'hello stock!'
})

router.post('/pagelist', async (ctx) => {
  try {
    const req = ctx.request.body || {}
    const { pageNum = 1, pageSize = 10, searchModel = {} } = req
    const pageIndex = Number(pageNum)
    const limit = Number(pageSize)

    const param = { isDelete: 0 }

    if (searchModel.goodsModel) {
      param.goodsModel = { [Op.like]: `%${searchModel.goodsModel}%` }
    }
    if (searchModel.goodsColor) {
      param.goodsColor = { [Op.like]: `%${searchModel.goodsColor}%` }
    }

    const { count, rows } = await InventoryBalance.findAndCountAll({
      where: param,
      order: [['id', 'DESC']],
      limit,
      offset: (pageIndex - 1) * limit,
      include: [
        {
          model: Good,
          as: 'goodInfo',
          required: false,
          where: { isDelete: 0 },
          attributes: ['id', 'goodsDesc', 'goodsModel', 'goodsSize', 'goodsColor', 'driverSide', 'hole'],
        },
        {
          model: ReceiptDetail,
          as: 'receiptDetail',
          required: false,
          where: { isDelete: 0 },
          attributes: ['id', 'mainId', 'moLineId', 'goodsModel', 'goodsDesc', 'goodsSize', 'goodsColor', 'receiptNum', 'receiptWeight', 'orderNo', 'brand', 'remark'],
          include: [
            {
              model: ReceiptMain,
              as: 'main',
              required: false,
              attributes: ['id', 'receiptNo', 'supplierName', 'inboundStatus', 'inboundTime', 'createTime'],
            },
            {
              model: MoDetail,
              as: 'moDetail',
              required: false,
              where: { isDelete: 0 },
              attributes: ['id', 'mainId', 'soLineId', 'goodsModel', 'goodsDesc', 'moNum'],
              include: [
                {
                  model: MoMain,
                  as: 'main',
                  required: false,
                  attributes: ['id', 'orderNo', 'supplierName', 'orderStatus'],
                },
                {
                  model: SoDetail,
                  as: 'soDetail',
                  required: false,
                  where: { isDelete: 0 },
                  attributes: ['id', 'mainId', 'goodsModel', 'goodsDesc', 'orderNum', 'customerOrderNo'],
                  include: [
                    {
                      model: SoMain,
                      as: 'main',
                      required: false,
                      attributes: ['id', 'orderNo', 'customerName', 'orderStatus'],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      distinct: true,
    })

    const seen = new Set()
    const dedupedRows = rows.filter((r) => {
      if (seen.has(r.id)) return false
      seen.add(r.id)
      return true
    })

    ctx.body = {
      code: 200,
      msg: '查找成功',
      data: { rows: dedupedRows, count },
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

  
router.post('/clear', async (ctx) => {
  const transaction = await sequelize.transaction()
  try {
    const { data: list = [] } = ctx.request.body || {}
    //console.log('clear list:', list)

    const hasCustomerOrder = list.includes('客户订单')
    const hasProductionOrder = list.includes('生产订单')
    const hasInbound = list.includes('商品入库')
    const hasOutbound = list.includes('商品出库')
    const hasInventory = list.includes('商品库存')

    if (hasCustomerOrder) {
      await SoDetail.destroy({ truncate: true, transaction })
      await SoMain.destroy({ truncate: true, transaction })
    }
    if (hasProductionOrder) {
      await MoDetail.destroy({ truncate: true, transaction })
      await MoMain.destroy({ truncate: true, transaction })
    }
    if (hasInbound) {
      await ReceiptDetail.destroy({ truncate: true, transaction })
      await ReceiptMain.destroy({ truncate: true, transaction })
    }
    if (hasOutbound) {
      await DeliveryDetail.destroy({ truncate: true, transaction })
      await DeliveryMain.destroy({ truncate: true, transaction })
    }
    if (hasInventory) {
      await InventoryLine.destroy({ truncate: true, transaction })
      await InventoryBalance.destroy({ truncate: true, transaction })
    }

    await transaction.commit()
    ctx.body = {
      code: 200,
      msg: '清空成功',
      data: null,
    }
  } catch (err) {
    await transaction.rollback()
    console.error('clear err:', err)
    ctx.body = {
      code: 201,
      msg: '清空失败：' + err.message,
      data: err,
    }
  }
})
 

module.exports = { stockRouter: router }
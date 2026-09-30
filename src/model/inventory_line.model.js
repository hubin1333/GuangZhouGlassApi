// 库存行
const Op = require('sequelize').Op
const {
  DataTypes
} = require('sequelize')

const seq = require('../db/seq_mysql')

const InventoryLine = seq.define('inventory_line', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: '主键ID',
  },   
  goodsModel: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'goods_model',
    comment: '商品型号',
  },
  // goodsDesc: {
  //   type: DataTypes.STRING,
  //   allowNull: true,
  //   field: 'goods_desc',
  //   comment: '商品描述',
  // },
  // goodsSize: {
  //   type: DataTypes.STRING,
  //   allowNull: true,
  //   field: 'goods_size',
  //   comment: '商品尺寸',
  // },
  // goodsHole: {
  //   type: DataTypes.STRING,
  //   allowNull: true,
  //   field: 'goods_hole',
  //   comment: '商品孔径',
  // },
  goodsColor: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'goods_color',
    comment: '商品颜色',
  }, 
  moLineId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'mo_line_id',
    comment: '入库单行表ID（外键关联 mo_line.id）',
  },
  soLineId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'so_line_id',
    comment: '销售订单行表ID（外键关联 so_line.id）',
  },
  receiptLineId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'receipt_line_id',
    comment: '收货单行表ID（外键关联 receipt_line.id）',
  },
 
  stockType: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'stock_type',
    comment: '库存类型:1-订单库存,2-备件库存',
  }, 
  sourceType: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'source_type',
    comment: '来源类型:1-入库,2-出库，3-调整,',
  }, 
  originalQty: {
    type: DataTypes.DECIMAL(20, 0),
    allowNull: true,
    field: 'original_qty',
    comment: '原始数量， 该数量为库存行的初始数量',
  },
  changeQty: {
    type: DataTypes.DECIMAL(20, 0),
    allowNull: true,
    field: 'change_qty',
    comment: '变更数量， 该数量为库存行的变更数量',
  },
  stockNum: {
    type: DataTypes.DECIMAL(20, 0),
    allowNull: true,  
    field: 'stock_num',
    comment: '库存数量， 该数量为库存行的当前数量',
  },
  // brand: {
  //   type: DataTypes.STRING,
  //   allowNull: true,
  //   comment: '商标',
  // },
  // barcode: {
  //   type: DataTypes.STRING,
  //   allowNull: true,
  //   comment: '标签',
  // },
  status: { 
    type: DataTypes.STRING,  
    allowNull: true,
    defaultValue: 'active',
    field: 'status',
    comment: '状态：active=正常 history=历史记录',
  },
  remark: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '备注',
  },
  createTime: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'create_time',
    comment: '创建时间',
  },
}, {
  timestamps: false,
  tableName: 'inventory_line',
})

InventoryLine.sync({
  alter: true,
})

module.exports = InventoryLine
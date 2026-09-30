// 库存余额
const Op = require('sequelize').Op
const {
  DataTypes,
  STRING
} = require('sequelize')

const seq = require('../db/seq_mysql')

const InventoryBalance = seq.define('inventory_balance', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: '主键ID',
  },
  soLineId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'so_line_id',
    comment: '销售订单行表ID（外键关联 so_line.id）',
  },
   moLineId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'mo_line_id',
    comment: '生产订单行表ID（外键关联 mo_line.id）',
  },
 
  receiptLineId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'receipt_line_id',
    comment: '入库单行表ID（外键关联 receipt_line.id）',  
  },

  goodsModel: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'goods_model',
    comment: '商品型号',
  },
  
  goodsColor: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'goods_color',
    comment: '商品颜色',
  },
  stockNum: {
    type: DataTypes.DECIMAL(20, 0),
    allowNull: true,
    field: 'stock_num',
    comment: '库存数量',
  },
   lastInTime: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'last_in_time',
    comment: '最后入库时间',
  },  
  lastOutTime: {    
    type: DataTypes.STRING,
    allowNull: true,
    field: 'last_out_time',
    comment: '最后出库时间',
  },
  remark: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '备注',
  },
  isDelete: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    field: 'is_delete',
    comment: '逻辑删除：0=正常 1=已删除',
  },
}, {
  timestamps: false,
  tableName: 'inventory_balance',
})

InventoryBalance.sync({
  alter: true,
})

module.exports = InventoryBalance

const {
  DataTypes
} = require('sequelize')

const seq = require('../db/seq_mysql')

const ReceiptDetail = seq.define('receipt_detail', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: '主键ID',
  },
  mainId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'main_id',
    comment: '入库单主表ID（外键关联 receipt_main.id）',
  },
  moLineId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'mo_line_id',
    comment: '生产订单明细ID（外键关联 mo_detail.id）',
  },
  goodsModel: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'goods_model',
    comment: '商品型号',
  }, 
  goodsDesc: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'goods_desc',
    comment: '商品描述',
  },
  goodsSize: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'goods_size',
    comment: '商品尺寸',
  },
  goodsHole: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'goods_hole',
    comment: '商品孔径',
  },
  goodsColor: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'goods_color',
    comment: '商品颜色',
  },
  boxNo: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'box_no',
    comment: '箱子编号',
  },
  boxSize: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'box_size',
    comment: '箱子尺寸',
  },
  boxWeight: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'box_weight',
    comment: '箱子重量',
  },
  receiptNum: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: true,
    field: 'receipt_num',
    comment: '入库数量',
  },
  receiptWeight: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: true,
    field: 'receipt_weight',
    comment: '入库克重',
  },
  orderNo: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'order_no',
    comment: '订单编号',
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '商标',
  },
  barcode: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '标签',
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
  tableName: 'receipt_detail',
})

ReceiptDetail.sync({
  alter: true,
})

module.exports = ReceiptDetail

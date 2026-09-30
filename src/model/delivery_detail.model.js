  // 出库单明细
const {
  DataTypes
} = require('sequelize')

const seq = require('../db/seq_mysql')

const DeliveryDetail = seq.define('delivery_detail', {
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
    comment: '出库单主表ID（外键关联 delivery_main.id）',
  },
  orderDetailId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'order_detail_id',
    comment: '订单明细ID',
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
  deliveryNum: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: true,
    field: 'delivery_num',
    comment: '出库数量',
  },
  deliveryWeight: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: true,
    field: 'delivery_weight',
    comment: '出库克重',
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
  tableName: 'delivery_detail',
})

DeliveryDetail.sync({
  alter: true,
})

module.exports = DeliveryDetail

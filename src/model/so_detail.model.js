const {
  DataTypes
} = require('sequelize')

const seq = require('../db/seq_mysql')

const SoDetail = seq.define('so_detail', {
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
    comment: '采购订单主表ID（外键关联 pur_order_main.id）',
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
  goodsPrice: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: true,
    field: 'goods_price',
    comment: '商品价格',
  },
  goodsAmount: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: true,
    field: 'goods_amount',
    comment: '商品金额',
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
  // boxWeight: {
  //   type: DataTypes.STRING,
  //   allowNull: true,
  //   field: 'box_weight',
  //   comment: '箱子重量',
  // },
  orderNum: {
    type: DataTypes.DECIMAL(20, 0),
    allowNull: true,
    field: 'order_num',
    comment: '客户订单数量',
  }, 
  // orderWeight: {
  //   type: DataTypes.DECIMAL(20, 2),
  //   allowNull: true,
  //   field: 'order_weight',
  //   comment: '订单克重',
  // },
  customerOrderNo: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'customer_order_no',
    comment: '客户下的原始订单号',
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
  tableName: 'so_detail',
})

SoDetail.sync({
  alter: true,
})

module.exports = SoDetail

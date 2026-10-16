// 计划生产单明细
const {
  DataTypes
} = require('sequelize')

const seq = require('../db/seq_mysql')

const MoDetail = seq.define('mo_detail', {
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
  soLineId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'so_line_id',
    comment: '销售订单明细ID（外键关联 so_detail.id）',
  },
  sourceType: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '备件生产',
    field: 'source_type',
    comment: '来源类型:客户订单，备件生产，其他来源，其他',
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
  moNum: {
    type: DataTypes.DECIMAL(20, 0),
    allowNull: true,
    field: 'mo_num',
    comment: '计划生产数量',
  },
  // boxWeight: {
  //   type: DataTypes.STRING,
  //   allowNull: true,
  //   field: 'box_weight',
  //   comment: '箱子重量',
  // },
  // orderNum: {
  //   type: DataTypes.DECIMAL(20, 0),
  //   allowNull: true,
  //   field: 'order_num',
  //   comment: '订单数量',
  // },
  
  // orderWeight: {
  //   type: DataTypes.DECIMAL(20, 2),
  //   allowNull: true,
  //   field: 'order_weight',
  //   comment: '订单克重',
  // },
   
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
  tableName: 'mo_detail',
})

MoDetail.sync({
  alter: true,
})

module.exports = MoDetail

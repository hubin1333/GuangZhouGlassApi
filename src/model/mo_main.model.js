// 计划生产单
const {
  DataTypes
} = require('sequelize')

const seq = require('../db/seq_mysql')

const MoMain = seq.define('mo_main', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: '主键ID',
  }, 
 orderNo: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'order_no',
    comment: '订单单号',
  },
  supplierId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'supplier_id',
    comment: '供应商ID',
  },
  supplierName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'supplier_name',
    comment: '供应商名称',
  }, 
  creatorId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'creator_id',
    comment: '创建用户ID',
  },
  creatorName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'creator_name',
    comment: '创建用户名称',
  },
  orderTime: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'order_time',
    comment: '订单时间',
  },
  totalNum: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: true,
    field: 'total_num',
    comment: '订单总数量（合计）',
  },  
  totalAmount: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: true,
    field: 'total_amount',
    comment: '订单总金额（合计）',
  },  
  totalWeight: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: true,
    field: 'total_weight',
    comment: '订单总克重（合计）',
  }, 
  orderStatus: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'order_status',
    comment: '订单状态：1:待审批 2:已审批 3:已反审批 4:已删除',
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
  modifierId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'modifier_id',
    comment: '更新用户ID',
  },
  modifierName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'modifier_name',
    comment: '更新用户名称',
  },
  updateTime: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'update_time',
    comment: '更新时间',
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
  tableName: 'mo_main',
})

MoMain.sync({
  alter: true,
})

module.exports = MoMain

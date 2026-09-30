const {
  DataTypes
} = require('sequelize')

const seq = require('../db/seq_mysql')

const ReceiptMain = seq.define('receipt_main', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: '主键ID',
  },
   receiptNo: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'receipt_no',
    comment: '入库单号',
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
  warehouseId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'warehouse_id',
    comment: '入库仓库ID',
  },
  warehouseName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'warehouse_name',
    comment: '入库仓库名称',
  },
  inboundType: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'inbound_type',
    comment: '入库类型：0=普通入库 1=退货入库 2=调拨入库',
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
  inboundTime: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'inbound_time',
    comment: '入库时间',
  },
  totalNum: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: true,
    field: 'total_num',
    comment: '入库总数量（合计）',
  },
  totalWeight: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: true,
    field: 'total_weight',
    comment: '入库总克重（合计）',
  }, 
  inboundStatus: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'inbound_status',
    comment: '入库状态：1:待审批 2:已审批 3:已反审批 4:已删除',
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
  tableName: 'receipt_main',
})

ReceiptMain.sync({
  alter: true,
})

module.exports = ReceiptMain

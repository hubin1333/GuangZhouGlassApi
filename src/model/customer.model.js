const { DataTypes } = require('sequelize')
const seq = require('../db/seq_mysql')

const Customer = seq.define('customer', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: '主键ID',
  },
  customerNo: {
    type: DataTypes.STRING,
    field: 'customer_no',
    comment: '客户编号',
  },
  customerName: {
    type: DataTypes.STRING,
    field: 'customer_name',
    comment: '客户名称',
  },
  goodsName: {
    type: DataTypes.STRING,
    field: 'goods_name',
    comment: '采购产品',
  },
   orderStatus: {
    type: DataTypes.STRING,
    field: 'order_status',
    comment: '国家',
  },
   country: {
    type: DataTypes.STRING,
    comment: '国家',
  },
   country: {
    type: DataTypes.STRING,
    comment: '国家',
  },
   httpLink: {
    type: DataTypes.STRING,
    field: 'http_link',
    comment: '社媒链接',
  },
  email: {
    type: DataTypes.STRING,
    comment: 'E-Mail',
  },
  companyName: {
    type: DataTypes.STRING,
    field: 'company_name',
    comment: '公司名称',
  },
  mobile: {
    type: DataTypes.STRING,
    comment: '手机号',
  },
  phone: {
    type: DataTypes.STRING,
    comment: '联系电话',
  },
  fax: {
    type: DataTypes.STRING,
    comment: '传真',
  },
  address: {
    type: DataTypes.STRING,
    comment: '地址',
  },
  remark: {
    type: DataTypes.TEXT,
    comment: '备注',
  },
  createName: {
    type: DataTypes.STRING,
    field: 'create_name',
    comment: '录入人',
  },
  createTime: {
    type: DataTypes.STRING,
    field: 'create_time',
    comment: '录入时间',
  },
  isDelete: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'is_delete',
    comment: '删除标记：0=正常 1=已删除',
  }
}, {
  timestamps: false,
  tableName: 'customer'
})

Customer.sync({ alter: true })
module.exports = Customer
//订单
const {
  DataTypes
} = require('sequelize')

const seq = require('../db/seq_mysql') 

const Order = seq.define('order', { 
  UUID: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },
  no: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  }, 
  express: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },
  customer: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },
  tel: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },
  addr: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  }, 
  wx: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },
  isdelivery:{
    type: DataTypes.STRING,
    allowNull: true,
    comment: '能否发货',
  },
  isdeliveryDt:{
    type: DataTypes.STRING,
    allowNull: true,
    comment: '确认可发货时间',
  },
  deliveryDt:{
    type: DataTypes.STRING,
    allowNull: true,
    comment: '发货时间',
  },
  addrProvince: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },
  addrCity: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },
  addrArea: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },
  addrStreet: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  }, 
  totalAmount: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },
  freight: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '运费',
  },
  offerAmount: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '优惠金额',
  },
  dsAmount: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '代收金额',
  },
   addAmount: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '增值金额',
  },
  customersrc: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '客户来源项目',
  },
  addtime:{
    type: DataTypes.STRING,
    allowNull: true,
    comment: '添加时间',
  },
  djr: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '兑接人',
  },
  payAmount: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '总金额',
  }, 
  qty: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },
  hg: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '是否为回购',
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '订单状态',
  },
  remark: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },  
  createDt: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },  
  creater: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },  
   uid: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },
  isdaitian:{
    type: DataTypes.STRING,
    allowNull: true,
    comment: '是否代填',
  }, 
  dt_uid:{
    type: DataTypes.STRING,
    allowNull: true,
    comment: '代填人UId',
  } ,
  dt_name:{
    type: DataTypes.STRING,
    allowNull: true,
    comment: '代填人',
  } , 
},{  
  timestamps: false,
  tableName:'Order_base'  
}) 
// 强制同步数据库(创建数据表)
Order.sync({
  //alter: true
}) 



module.exports = Order
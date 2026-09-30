//部门
const {
  DataTypes
} = require('sequelize')

const seq = require('../db/seq_mysql') 

const Trace = seq.define('trace', {
  // id 会被sequelize自动创建, 管理
 
  question: {
    type: DataTypes.TEXT,
    allowNull: true,
     field: 'question', 
    comment: '问题',  
  }, 
  follow: {
    type: DataTypes.TEXT,
    allowNull: true,
     field: 'follow',
    comment: '跟进',
  },
  customerId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'customer_id',
    comment: '客户ID',
  },
  
  remark:{
    type:DataTypes.STRING,
    allowNull: true,
    field: 'remark',
    comment: ' ',
  },
  createName:{
    type:DataTypes.STRING,
    allowNull: true,
    field: 'create_name',
    comment: ' ',
  },
  createTime:{
    type:DataTypes.STRING,
    allowNull: true,
    field: 'create_time',
    comment: ' ',
  }, 
},{  
  timestamps: false,
  tableName:'trace'  
})

// 强制同步数据库(创建数据表)
Trace.sync({
  alter: true
}) 
module.exports = Trace

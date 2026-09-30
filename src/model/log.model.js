//操作日志
const {
  DataTypes
} = require('sequelize')

const seq = require('../db/seq_mysql') 

const Log = seq.define('log', { 
  operator: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '操作人',
  }, 
  createDt: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '操作时间',
  },
  module: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '操作模块',
  },
  content: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '具体操作',
  }, 
  remark: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },
    
},{  
  timestamps: false,
  tableName:'operator_log'  
})

// 强制同步数据库(创建数据表)
Log.sync({
  //alter: true
}) 
module.exports = Log
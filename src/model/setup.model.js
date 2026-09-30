//系统参数
const {
  DataTypes
} = require('sequelize')

const seq = require('../db/seq_mysql') 

const Setup = seq.define('setup', {
  // id 会被sequelize自动创建, 管理
  name: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },  
  val: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },
     
},{  
  timestamps: false,
  tableName:'setup'  
})

// 强制同步数据库(创建数据表)
Setup.sync({
  //alter: true
}) 
module.exports = Setup
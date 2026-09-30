const {
  DataTypes
} = require('sequelize')

const seq = require('../db/seq_mysql')
 
const Smscode = seq.define('smscode', {
  // id 会被sequelize自动创建, 管理

  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '电话号码',
  },
  smscode: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '登陆时的短信验证码',
  },
  smstime: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '登陆时的短信验证码产生的时间戳',
  },
 
  createtime: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '提交时间',
  }, 
},{  
  timestamps: false,  
  tableName:'smscode'
})

// 强制同步数据库(创建数据表)
Smscode.sync({
  //alter: true
})

 
module.exports = Smscode
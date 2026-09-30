// 角色
const {
  DataTypes
} = require('sequelize')

const seq = require('../db/seq_mysql')

// 创建模型()
const Role = seq.define('sys_role', {
  // id 会被sequelize自动创建, 管理
  name: {
    type: DataTypes.STRING,
    allowNull: true, 
    comment: '角色名称',
  }, 
  remark:{
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },
 
},{
  timestamps: false
})

// 强制同步数据库(创建数据表)
Role.sync({
  force: true
})

module.exports = Role
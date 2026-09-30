const {
  DataTypes
} = require('sequelize')

const seq = require('../db/seq_mysql')

// 创建模型()
const Auth = seq.define('sys_auth', {
  // id 会被sequelize自动创建, 管理
  roleid: {
    type: DataTypes.STRING,
    allowNull: true, 
    comment: '角色id或者UID',
  }, 
  menuid:{
    type: DataTypes.STRING,
    allowNull: true,
    comment: '菜单或按钮id',
  },
  authtype: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '菜单1;按钮2',
  },   
},{
  timestamps: false,
  tableName:"sys_auth"
})

// 强制同步数据库(创建数据表)
Auth.sync({
  //force: true
})

module.exports = Auth
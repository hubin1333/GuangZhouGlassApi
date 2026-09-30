//菜单或者按钮
const {
  DataTypes
} = require('sequelize')

const seq = require('../db/seq_mysql')
const { table } = require('console')

// 创建模型()
const Menu = seq.define('menu', {
  // id 会被sequelize自动创建, 管理
  fid: {
    type: DataTypes.STRING,
    allowNull: true, 
    comment: ' ',
  }, 
  name: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '名称',
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },   
  icon: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  }, 
  routername: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  }, 
  routeraddr: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  }, 
  promit: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  }, 
  path: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  }, 
  fname: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  }, 
  remark: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  }, 
  ordernum: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: ' ',
  }, 
  isuse: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },  
},{
  timestamps: false,
  tableName:"sys_menu"
})

// 强制同步数据库(创建数据表)
Menu.sync({
  //alter: true
})

module.exports = Menu
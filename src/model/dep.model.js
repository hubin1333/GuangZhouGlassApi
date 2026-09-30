//部门
const {
  DataTypes
} = require('sequelize')

const seq = require('../db/seq_mysql') 

const Dep = seq.define('comp', { 
  no: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  }, 
  name: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '名称',
  },
  person: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },
  addr: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },
  remark: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },
    
},{  
  timestamps: false,
  tableName:'dep'  
})

// 强制同步数据库(创建数据表)
Dep.sync({
  //alter: true
}) 
module.exports = Dep
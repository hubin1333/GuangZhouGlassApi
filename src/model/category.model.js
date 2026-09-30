//资产分类
const {
  DataTypes
} = require('sequelize')

const seq = require('../db/seq_mysql') 

const Category = seq.define('category', {
  // id 会被sequelize自动创建, 管理
    
  no: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },
  code: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },
   fid:{
    type:DataTypes.STRING,
    allowNull:true,
    comment:'上级id号',
   },
  type: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '是否为一级分类',
  },
  // duration: {
  //   type: DataTypes.STRING,
  //   allowNull: true,
  //   comment: '报废年限',
  // }, 
  // ischeck:{
  //   type: DataTypes.STRING,
  //   allowNull: true,
  //   comment: '是否检验',
  // },
  // cycle:{
  //   type: DataTypes.STRING,
  //   allowNull: true,
  //   comment: '检验周期',
  // }, 
},{  
  timestamps: false,
  tableName:'category'  
})

// 强制同步数据库(创建数据表)
Category.sync({
  //alter: true
}) 
module.exports = Category
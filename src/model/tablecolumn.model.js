//表头显示
const {
  DataTypes
} = require('sequelize')

const seq = require('../db/seq_mysql') 

const TableColumn = seq.define('tablecolumn', {
  // id 会被sequelize自动创建, 管理
    
  uid: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '用户UID',
  },
  content: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },
  tablename: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '表名',
  },
    
},{  
  timestamps: false,
  tableName:'table_column'  
})

// 强制同步数据库(创建数据表)
TableColumn.sync({
  //alter: true
}) 
module.exports = TableColumn
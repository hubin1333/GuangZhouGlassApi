const {
  DataTypes
} = require('sequelize')

const seq = require('../db/seq_mysql')

// 创建模型()
const Dict = seq.define('dict', {
  // id 会被sequelize自动创建, 管理
  code: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: false,
    comment: '代码',
  },
  level: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '级别',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '名称',
  },
  highid: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '所属上一级别',
  },   
  isComp: {
    type: DataTypes.STRING,
    allowNull: true,
    comment:'是否为构件',
  },   
  sequence: {
    type: DataTypes.STRING,
    allowNull: true,
    comment:'排序',
  }, 
  fid:{
    type: DataTypes.STRING,
    defaultValue:"0",
    comment:'父一级',
  }  
 
},{
  timestamps: false,
  tableName: 'dict'
})

// 强制同步数据库(创建数据表)
Dict.sync({
  //alter: true
})

module.exports = Dict
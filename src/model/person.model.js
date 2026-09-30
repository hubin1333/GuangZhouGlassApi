//部门
const {
  DataTypes
} = require('sequelize')

const seq = require('../db/seq_mysql') 

const Person = seq.define('person', {
  // id 会被sequelize自动创建, 管理
  /**
   *  
            dep:'', 
        name:'',    
        sex:'',
        phone:'',
        addr:'',
        status:'',
        remark:'',   
   */



  dep: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  }, 
  name: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '名称',
  },
  sex: {
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
  status: {
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
  tableName:'person'  
})

// 强制同步数据库(创建数据表)
Person.sync({
  //alter: true
}) 
module.exports = Person
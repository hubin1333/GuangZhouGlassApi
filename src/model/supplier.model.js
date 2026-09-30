//部门
const {
  DataTypes
} = require('sequelize')

const seq = require('../db/seq_mysql') 

const Supplier = seq.define('supplier', {
  // id 会被sequelize自动创建, 管理
 
  supplierNo: {
    type: DataTypes.STRING,
    allowNull: true,
     field: 'supplier_no',
    comment: ' ',  
  }, 
  supplierName: {
    type: DataTypes.STRING,
    allowNull: true,
     field: 'supplier_name',
    comment: '名称',
  },
  supplierPerson: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'supplier_person',
    comment: ' ',
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'company_name',
    comment: ' ',
  },
  mobile: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },
  fax: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },
  address:{
    type:DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },
  remark:{
    type:DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },
  createName:{
    type:DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  },
  createTime:{
    type:DataTypes.STRING,
    allowNull: true,
    comment: ' ',
  }, 
},{  
  timestamps: false,
  tableName:'supplier'  
})

// 强制同步数据库(创建数据表)
Supplier.sync({
  alter: true
}) 
module.exports = Supplier
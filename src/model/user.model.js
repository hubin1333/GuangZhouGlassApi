const {
  DataTypes
} = require('sequelize')

const seq = require('../db/seq_mysql')

// 创建模型(Model zd_user -> 表 zd_users)
const User = seq.define('user', {
  // id 会被sequelize自动创建, 管理
  uid: {
    type: DataTypes.STRING,
    unique: true,
    comment: '用户ID, 唯一',
  },
  pwd: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '密码',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '真实姓名',
  },
  dep:{
    type:DataTypes.STRING,
    allowNull:true,
  },
  mac:{
    type:DataTypes.STRING,
    allowNull:true,
  },
 roleid: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '用户ID',
  },
  rolename: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '用户角色',
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '状态',
  }, 
  addr: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '详细地址',
  },
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
  ismac:{
    type: DataTypes.STRING,
    defaultValue:"是",
    allowNull: true,
    comment: '是否要求绑定',
  }
},{  
  timestamps: false,  
  tableName: 'users',
})

// 强制同步数据库(创建数据表)
User.sync({
  //alter: true
})

// User.create({
//   uid:"system",
//   pwd:"system",
//   roleid:"100",
//   name:"system",
//   rolename:"系统管理员",
//   status:"正常",
// })
module.exports = User
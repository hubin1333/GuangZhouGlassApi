const { DataTypes } = require('sequelize')
const seq = require('../db/seq_mysql')

const Country = seq.define('country', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: '主键ID',
  },
  countryNo: {
    type: DataTypes.STRING,
    field: 'country_no',
    comment: '国家编号',
  },
  countryName: {
    type: DataTypes.STRING,
    field: 'country_name',
    comment: '国家名称',
  },
  countryCode: {
    type: DataTypes.STRING,
    field: 'country_code',
    comment: '英文代码',
  },
  remark: {
    type: DataTypes.TEXT,
    comment: '备注',
  },
  createName: {
    type: DataTypes.STRING,
    field: 'create_name',
    comment: '录入人',
  },
  createTime: {
    type: DataTypes.STRING,
    field: 'create_time',
    comment: '录入时间',
  },
  isDelete: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'is_delete',
    comment: '删除标记：0=正常 1=已删除',
  }
}, {
  timestamps: false,
  tableName: 'country'
})

Country.sync({ alter: true })
module.exports = Country
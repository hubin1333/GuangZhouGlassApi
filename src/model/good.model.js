const { DataTypes } = require('sequelize')
const seq = require('../db/seq_mysql')

const Good = seq.define('good', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    comment: '主键ID',
  },
  goodsDesc: {
    type: DataTypes.STRING,
    field: 'goods_desc',
    comment: '描述',
  },
  goodsModel: {
    type: DataTypes.STRING,
    field: 'goods_model',
    comment: '型号',
  },
  goodsSize: {
    type: DataTypes.STRING,
    field: 'goods_size',
    comment: '尺寸',
  },
  goodsColor: {
    type: DataTypes.STRING,
    field: 'goods_color',
    comment: '颜色',
  },
  driverSide: {
    type: DataTypes.STRING,
    field: 'driver_side',
    comment: '左/右肽：0=无 1=LHD 2=RHD 3=LHD&RHD',
  },
  print: {
    type: DataTypes.STRING,
    comment: '印刷',
  },
  hole: {
    type: DataTypes.STRING,
    comment: '孔',
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '商品状态：1=在用 2=停用',
  },
  createTime: {
    type: DataTypes.STRING,
    field: 'create_time',
    comment: '创建时间',
  },
  updateTime: {
    type: DataTypes.STRING,
    field: 'update_time',
    comment: '更新时间',
  },
  isDelete: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'is_delete',
    comment: '删除标记：0=正常 1=已删除',
  }
}, {
  timestamps: false,
  tableName: 'Good'
})

Good.sync({ alter: true })
module.exports = Good
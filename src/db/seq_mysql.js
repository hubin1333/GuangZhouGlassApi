const {Sequelize}=require('sequelize')
const {mysql2}=require('mysql2')

const seq = new Sequelize('xun_ri_glass', 'root', '123456', {
    host: 'localhost',
    dialect:'mysql',
    dialectModule: mysql2,  
    logging: false, 
    timezone: '+08:00',
    define: {
      underscored: true,
      freezeTableName: true,
    },
  });
 
seq
  .authenticate()
  .then(() => {
    console.log('mysql数据库连接成功')
  })
  .catch((err) => {
    console.log('mysql数据库连接失败', err)
  })

  module.exports = seq;
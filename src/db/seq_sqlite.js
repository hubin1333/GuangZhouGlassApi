const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'src/db/Educ.db'  
});


//使用 .authenticate() 函数测试连接是否正常
sequelize.authenticate().then(() => {
  console.log('sqlite连接成功！.')
}).catch(err => {
  console.error('sqlite连接失败！', err)
})

module.exports = sequelize;

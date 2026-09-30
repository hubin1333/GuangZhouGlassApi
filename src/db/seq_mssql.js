const { Sequelize } = require('sequelize')
const qt = require('sequelize').QueryTypes

const dbCon = new Sequelize("eszw2023", "sa", "123456", {
    host: "127.0.0.1",
    port: 1433,
    dialect: "mssql",
    dialectOptions: {
        options: {     
            encrypt: false,
        },
    },
    define: {
        charset: 'utf8',
        freezeTableName: true
    },
    pool: {
        max: 5,
        min: 2,
        acquire: 10000,
        idle: 600000
    },
    logging:true,
});
//以下是测试连接
const connectDB = async () => {
    try {
        await dbCon.authenticate();
        console.log("****************mssql数据库连接成功.");
    } catch (error) {
        console.log(error);
    }
 

    
    // 查询数据库
    // const a = await dbCon.query('select top 1 * from admin' , {
       
    //     type: qt.SELECT
    // })
    // console.log(a);
  }

  connectDB()

module.exports=dbCon
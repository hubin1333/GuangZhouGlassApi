const Router = require('koa-router')
const moment = require('moment')
const TableColumn = require('../model/tablecolumn.model')
const {
    DataTypes,
    Op
} = require('sequelize') 

const tabColRouter = new Router({
    prefix: '/api/tabCol'
})
tabColRouter.get('/', (ctx, next) => {
    ctx.body = " hello tableColumn!"
})  
//列表设置
tabColRouter.post('/setCol', async (ctx, next) => {
     try {
        console.log('列表设置!')
        let req = ctx.request.body 
        let list = Array.isArray(req.content) ? req.content : []
        // 先删除该用户该表的旧配置
        await TableColumn.destroy({
            where: {
                uid: req.uid, tableName: req.tablename
            }
        })
        // 每列一行写入
        let rows = list.map(c => ({
            uid: req.uid,
            tableName: req.tablename,
            colName: c.colName,
            colWidth: String(c.minWidth ?? '')
        }))
        let result = rows.length ? await TableColumn.bulkCreate(rows) : []
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '数据提交成功!',
            data: result
        }    
    } catch (err) {
        console.log("新增失败:" + err)
        ctx.body = {
            code: 201,
            msg: '数据提交失败:'+err,
            data: err
        }
    }
})

//列表获取
tabColRouter.post('/getCol', async (ctx, next) =>{
    try {
        console.log('列表获取!')
        let req = ctx.request.body 
        let result =await TableColumn.findAll({
            where: { 
                uid: req.uid
            }
        }) 
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '数据获取成功!',
            data: result
        }    
    } catch (err) {
        console.log("列表获取失败:" + err)
        ctx.body = {
            code: 201,
            msg: '数据获取失败',
            data: err
        }
    }
})  
  
module.exports = {
    tabColRouter
}
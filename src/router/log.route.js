const Router = require('koa-router') 
const moment = require('moment')
const Log = require('../model/log.model') 
const sequelize = require('../db/seq_mysql') 
const {
    DataTypes,
    Op,
    QueryTypes
} = require('sequelize') 

const logRouter = new Router({
    prefix: '/api/log'
})
logRouter.get('/', (ctx, next) => {
    ctx.body = " hello log!"
})
 

logRouter.post('/find', async (ctx, next) => {
      try { 
        let req = ctx.request.body
        console.log(req)
        const{pageNum=1,pageSize=10,searchModel={}} =req
        let param = {}
        if(searchModel.module){
            param.module = { [Op.like]: `%${searchModel.module}%` }
        }
        if(searchModel.content){
            param.content = { [Op.like]: `%${searchModel.content}%` }
        }
        if(searchModel.operator){
            param.operator = searchModel.operator
        }
        result = await Log.findAndCountAll({ 
            where: param,
            limit: pageSize,
            offset: pageNum == 1 ? 0 : (pageNum - 1) * pageSize,
            order:[  ['createDt','DESC']]
        }) 
        //console.log(result)
        ctx.response.status = 200; 
        ctx.body = {
            code: 200,
            msg: '数据查找成功',
            data: result,
        }
    } catch (err) {
        console.log(err)   
        ctx.body = {
            code: 201,
            msg: '数据查找失败'+err,
            data: err
        }
    }
}) 

logRouter.post('/add', async (ctx, next) => {
    try {
        //console.log('新增操作!')
        let req = ctx.request.body
        console.log(req) 
        req.operator = req.uid  
        req.createDt = moment().format('YYYY-MM-DD HH:mm:ss')
        let result = await Log.create(req)
        //console.log(result)
        //新增操作
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '数据提交成功',
            data: result
        }    
    } catch (err) {
        console.log("新增失败:" + err)
        ctx.body = {
            code: 201,
            msg: '数据提交失败',
            data: err
        }
    }
}) 


logRouter.post('/getlist', async (ctx, next) => {
    try {   
        let req = ctx.request.body
        const {pageSize,pageNum}=req
        let result=await Log.findAndCountAll({
            //where:param,
            limit: pageSize,
            offset: pageNum == 1 ? 0 : (pageNum - 1) * pageSize,
            order:[  ['createDt','DESC']]
        })
        console.log('result:'+JSON.stringify(result))
        ctx.response.status = 200; 
        ctx.body = {
            code: 200,
            msg: '查找成功!',
            data: result
,
        }
    } catch (err) {
        console.log('getlist:'+err)
        ctx.body = {
            code: 201,
            msg: '查找失败',
            data: err
        }
    }
})

  

module.exports = {
    logRouter
}
const Router = require('koa-router')
const path = require('path')
const moment = require('moment')
const Dep = require('../model/dep.model')
const send = require('koa-send');
const fse = require('fs-extra'); // 使用fs-extra代替fs
const sequelize = require('../db/seq_mysql') 
const {
    DataTypes,
    Op,
    QueryTypes
} = require('sequelize')
const Dict = require('../model/dict.model')

const depRouter = new Router({
    prefix: '/api/dep'
})
depRouter.get('/', (ctx, next) => {
    ctx.body = " hello dep!"
})
    
depRouter.post('/search', async (ctx, next) => {
      try { 
        let req = ctx.request.body
        let param = {}
        let pageNum = req.pageNum
        let pageSize = req.pageSize 
        let name=req.name 
        let result = null;
        if (name) { 
            console.log('name:',name) 
            result = await Dep.findAndCountAll({
                where: {
                    name: {
          [Op.like]: `%${req.name}%`
        }
                    },
                limit: pageSize,
                offset: pageNum == 1 ? 0 : (pageNum - 1) * pageSize,
                order: [
                    //['createtime','DESC']
                    ['id']
                ],
            })
        } else {
            result = await Dep.findAndCountAll({ 
                limit: pageSize,
                offset: pageNum == 1 ? 0 : (pageNum - 1) * pageSize,
                order: [
                    ['id']
                ],
            })
        }
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
            msg: '数据查找失败',
            data: err
        }
    }
}) 

depRouter.post('/add', async (ctx, next) => {
    try {
        console.log('新增操作!')
        let req = ctx.request.body
        console.log(req) 
        let result = await Dep.create(req)
        console.log(result)
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

depRouter.put('/edit', async (ctx, next) => {
    //编辑操作
    try {
        console.log('编辑操作!')
        let req = ctx.request.body
        console.log(req)
        let id = req.id
        let result = await Dep.update(req, {
            where: {
                id: id
            }
        })
        console.log(result)
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '数据修改成功',
            data: result
        }
    } catch (err) {
        console.log("修改失败:" + err)
        ctx.body = {
            code: 201,
            msg: '数据修改失败',
            data: err
        }
    }
}) 

depRouter.post('/delete', async (ctx, next) => {
    try {
        console.log('删除操作!')
        let req = ctx.request.body
        console.log(req) 
        let id = req.id
        let result = await Dep.destroy({
            where: { 
                id: id
            }
        })
        console.log(result)
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '删除成功',
            data: result
        }
    } catch (err) {
        ctx.body = {
            code: 201,
            msg: '删除失败:'+err,
            data: err
        }
    }
})

depRouter.post('/batch', async (ctx, next) => {
    try {
        console.log('批量导入操作!')
        let req = ctx.request.body
        console.log(req)
           for (let item of req) {   
             await Dep.create(item)
           }
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '数据批量导入成功',
            data: req.length
        }
    } catch (err) {
        console.log("数据批量导入:" + err)
        ctx.body = {
            code: 201,
            msg: '数据批量导入失败',
            data: err
        }
    }
})

//delmany
depRouter.post('/delmany', async (ctx, next) => {
    //编辑操作
    try {
        let result = null
        console.log('删除操作!')
        let req = ctx.request.body
        console.log(req)
        for (var item of req) {
            let id = item
            let result = await Dep.destroy({
                where: {
                    id: id
                }
            })
        }
        console.log(result)
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '删除成功',
            data: result
        }
    } catch (err) {
        ctx.body = {
            code: 201,
            msg: '删除失败'+err,
            data: err
        }
    }
})

depRouter.post('/selectbypage', async (ctx, next) => {
    try {
        console.log('Comp查找操作!')
        let req = ctx.request.body
        console.log(req)
        let pageIndex = req.pageNum
        let pageSize = req.pageSize
        let result = await Dep.findAndCountAll({
            limit: pageSize,    
            offset: pageIndex == 1 ? 0 : (pageIndex - 1) * pageSize
        })
        console.log(result)

        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '查找成功',
            data: result,
        }
    } catch (err) {
        4
        console.log('err', err);

        ctx.body = {
            code: 201,
            msg: '查找失败',
            data: err
        }
    }
})

depRouter.get('/getall', async (ctx) => {
  try {  
    const result = await Dep.findAll( ) 
    ctx.body = {
      code: 200,
      msg: '查找成功',
      data: result,
    }
  } catch (err) { 
    ctx.body = {
      code: 201,
      msg: '查找失败：' + err.message,
      data: err,
    }
  }
})

depRouter.get('/pagelist', async (ctx) => {
  try {
    const req = ctx.request.body || {}
    const { pageNum = 1, pageSize = 10, searchModel = {} } = req
    const pageIndex = Number(pageNum)
    const limit = Number(pageSize)  

    const { count, rows } = await Dep.findAndCountAll({ 
      limit,
      offset: (pageIndex - 1) * limit, 
    })

    ctx.body = {
      code: 200,
      msg: '查找成功',
      data: { rows, count },
    }
  } catch (err) {
    console.error('pagelist err:', err)
    ctx.body = {
      code: 201,
      msg: '查找失败：' + err.message,
      data: err,
    }
  }
})
  


module.exports = {
    depRouter
}
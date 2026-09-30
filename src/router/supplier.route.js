const Router = require('koa-router')
const moment = require('moment')
const Supplier = require('../model/supplier.model')
const {
    DataTypes,
    Op
} = require('sequelize') 

const supplierRouter = new Router({
    prefix: '/api/supplier'
})
supplierRouter.get('/', (ctx, next) => {
    ctx.body = " hello supplier!"
}) 
supplierRouter.post('/search', async (ctx, next) => {
    try {

        let req = ctx.request.body
        let param = {}
        let pageNum = req.pageNum
        let pageSize = req.pageSize
        if (req.name.length != 0) {
            param.name = req.name
        }
        if (req.uid.length != 0) {
            param.uid = req.uid
        }
        if (req.status.length != 0) {
            param.status = req.status
        }

        let result = null;
        if (param.length == 0) {
            result = await Supplier.findAndCountAll({
                //where: param,
                limit: pageSize,
                offset: pageNum == 1 ? 0 : (pageNum - 1) * pageSize,
                order: [
                    //['createtime','DESC']
                    ['id']
                ],
            })
        } else {
            result = await Supplier.findAndCountAll({
                where: param,
                limit: pageSize,
                offset: pageNum == 1 ? 0 : (pageNum - 1) * pageSize,
                order: [
                    ['id']
                ],
            })
        }

        ctx.response.status = 200;

        //write.write("aa",result)
        ctx.body = {
            code: 200,
            msg: '数据查找成功',
            data: result,
        }
    } catch (err) {
        console.log(err)
        //write.write("aa",err)     
        ctx.body = {
            code: 201,
            msg: '数据查找失败',
            data: err
        }
    }
}) 

supplierRouter.post('/add', async (ctx, next) => {
    try {
        console.log('新增操作!')
        let req = ctx.request.body
        console.log(req) 
        let result = await Supplier.create(req)
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

supplierRouter.post('/update', async (ctx, next) => {
    //编辑操作
    try {
        console.log('编辑操作!')
        let req = ctx.request.body
        console.log(req)
        let id = req.id
        let result = await Supplier.update(req, {
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

supplierRouter.delete('/delete/:id', async (ctx, next) => {
    try {
        console.log('删除操作!')
        let id = ctx.params.id  
        let result = await Supplier.destroy({
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

supplierRouter.post('/batch', async (ctx, next) => {
    try {
        console.log('批量导入操作!')
        let req = ctx.request.body
        console.log(req)
           for (let item of req) {   
             await Supplier.create(item)
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
supplierRouter.post('/delmany', async (ctx, next) => {
    //编辑操作
    try {
        let result = null
        console.log('删除操作!')
        let req = ctx.request.body
        console.log(req)
        for (var item of req) {
            let id = item.id
            await Supplier.destroy({
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
            msg: '删除失败',
            data: err
        }
    }
})

supplierRouter.get('/pagelist', async (ctx, next) => {
    try {
        console.log('Supplier查找操作!')
        let req = ctx.query
        console.log(req)
        let pageIndex = Number(ctx.query.pageNum)
        let pageSize = Number(ctx.query.pageSize)
        let result = await Supplier.findAndCountAll({
            limit: pageSize,    
            offset: pageIndex == 1 ? 0 : (pageIndex - 1) * pageSize
        }) 
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '查找成功',
            data: result,
        }
    } catch (err) { 
        console.log('err', err); 
        ctx.body = {
            code: 201,
            msg: '查找失败:'+err,
            data: err
        }
    }
})

supplierRouter.get('/getall', async (ctx, next) => {
    try {
        console.log('Comp查找操作!')
        let req = ctx.request.body
        console.log(req) 
        let result = await Supplier.findAll({
            attributes: ['id', 'name']
        })
        console.log(result)

        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '查找成功',
            data: result,
        }
    } catch (err) {
        ctx.body = {
            code: 201,
            msg: '查找失败',
            data: err
        }
    }
})

 
module.exports = {
    supplierRouter
}
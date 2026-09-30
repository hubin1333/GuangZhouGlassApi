const Router = require('koa-router')
const moment = require('moment')
const Category = require('../model/category.model')
const {
    DataTypes,
    Op
} = require('sequelize') 

const categoryRouter = new Router({
    prefix: '/api/category'
})
categoryRouter.get('/', (ctx, next) => {
    ctx.body = " hello category!"
}) 
categoryRouter.post('/search', async (ctx, next) => {
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
            result = await Category.findAndCountAll({
                //where: param,
                limit: pageSize,
                offset: pageNum == 1 ? 0 : (pageNum - 1) * pageSize,
                order: [
                    //['createtime','DESC']
                    ['id']
                ],
            })
        } else {
            result = await Category.findAndCountAll({
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

categoryRouter.post('/add', async (ctx, next) => {
    try {
        console.log('新增操作!')
        let req = ctx.request.body
        console.log(req) 
        let result = await Category.create(req)
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

categoryRouter.post('/edit', async (ctx, next) => {
    //编辑操作
    try {
        console.log('编辑操作!')
        let req = ctx.request.body
        console.log(req)
        let id = req.id
        let result = await Category.update(req, {
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

categoryRouter.post('/delete', async (ctx, next) => {
    try {
        console.log('删除操作!')
        let req = ctx.request.body
        console.log(req) 
        let id = req.id
        let result = await Category.destroy({
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
            msg: '删除失败',
            data: err
        }
    }
})
//delmany
categoryRouter.post('/delmany', async (ctx, next) => {
    //编辑操作
    try {
        let result = null
        console.log('删除操作!')
        let req = ctx.request.body
        console.log(req)
        for (var item of req) {
            let id = item.id
            let result = await Category.destroy({
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

categoryRouter.get('/pagelist', async (ctx, next) => {
    try {  
        let req = ctx.query 
        //console.log(req)
        let pageIndex = Number(ctx.query.pageNum)
        let pageSize = Number(ctx.query.pageSize)
        let result = await Category.findAndCountAll({
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
            msg: '查找失败',
            data: err
        }
    }
})

categoryRouter.get('/gettree', async (ctx, next) => {
    try { 
        let req = ctx.query  
        let result = await Category.findAll()   
        let arr=[]
        for(let item of result){           
            let param={
                id:item.id,
                label:item.name,
            }
            arr.push(param)
        }

        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '查找成功',
            data: arr,
        }
    } catch (err) {    
        console.log('err', err);

        ctx.body = {
            code: 201,
            msg: '查找失败',
            data: err
        }
    }
})

categoryRouter.get('/getall', async (ctx, next) => {
    try { 
        let req = ctx.request.body 
        let param={
            fid:0
        }
        let result = await Category.findAll({
            where:param  
        }) 
        let arr=[]
        for(let item of result){         
            let p={fid:item.id }
            let children= await Category.findAll(
                {
                    where:p
                }
            ) 
            let param={
                id:item.id,
                name:item.name,
                no:item.no,
                code:item.code,
                fid:item.fid,
                type:item.type,
                children:children
            } 
            arr.push(param)  
        }
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '查找成功',
            data: arr,
        }
    } catch (err) {
        console.log(err)
        ctx.body = {
            code: 201,
            msg: '查找失败',
            data: err
        }
    }
})
 
module.exports = {
    categoryRouter
}
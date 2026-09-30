const Router = require('koa-router')
const Country = require('../model/country.model')

const countryRouter = new Router({
    prefix: '/api/country'
})

countryRouter.get('/', (ctx, next) => {
    ctx.body = " hello country!"
})

countryRouter.post('/search', async (ctx, next) => {
    try {
        let req = ctx.request.body
        let param = {}
        let pageNum = req.pageNum
        let pageSize = req.pageSize

        Object.entries(req).forEach(([key, value]) => {
            if (key != "pageNum" && key != "pageSize") {
                if (value !== "" && value !== null && value !== undefined) {
                    param[key] = value
                }
            }
        })
        param.isdel = req.isdel == "1" ? "1" : null
        delete param.pageNum
        delete param.pageSize

        let result = await Country.findAndCountAll({
            where: param,
            limit: pageSize,
            offset: pageNum == 1 ? 0 : (pageNum - 1) * pageSize,
            order: [['id']]
        })
        ctx.response.status = 200
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

countryRouter.post('/add', async (ctx, next) => {
    try {
        let req = ctx.request.body
        let result = await Country.create(req)
        ctx.response.status = 200
        ctx.body = {
            code: 200,
            msg: '数据提交成功',
            data: result
        }
    } catch (err) {
        console.log(err)
        ctx.body = {
            code: 201,
            msg: '数据提交失败',
            data: err
        }
    }
})

countryRouter.post('/update', async (ctx, next) => {
    try {
        let req = ctx.request.body
        let id = req.id
        let result = await Country.update(req, {
            where: { id: id }
        })
        ctx.response.status = 200
        ctx.body = {
            code: 200,
            msg: '数据修改成功',
            data: result
        }
    } catch (err) {
        console.log(err)
        ctx.body = {
            code: 201,
            msg: '数据修改失败',
            data: err
        }
    }
})

countryRouter.delete('/delete/:id', async (ctx, next) => {
    try {
        let id = ctx.params.id
        let result = await Country.destroy({
            where: { id: id }
        })
        ctx.response.status = 200
        ctx.body = {
            code: 200,
            msg: '删除成功',
            data: result
        }
    } catch (err) {
        ctx.body = {
            code: 201,
            msg: '删除失败:'+err.message,
            data: err
        }
    }
})

countryRouter.post('/batchdel', async (ctx, next) => {
    try {
        let req = ctx.request.body
        for (var item of req) {
            await Country.destroy({
                where: { id: item.id }
            })
        }
        ctx.response.status = 200
        ctx.body = {
            code: 200,
            msg: '删除成功',
            data: req.length
        }
    } catch (err) {
        ctx.body = {
            code: 201,
            msg: '删除失败',
            data: err
        }
    }
})

countryRouter.get('/pagelist', async (ctx, next) => {
    try {
        let pageIndex = Number(ctx.query.pageNum)
        let pageSize = Number(ctx.query.pageSize)
        let result = await Country.findAndCountAll({
            limit: pageSize,
            offset: pageIndex == 1 ? 0 : (pageIndex - 1) * pageSize,
            order: [['id']]
        })
        ctx.response.status = 200
        ctx.body = {
            code: 200,
            msg: '查找成功',
            data: result,
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

countryRouter.get('/getall', async (ctx, next) => {
    try {  
        let result = await Country.findAll( )
        ctx.response.status = 200
        ctx.body = {
            code: 200,
            msg: '查找成功',
            data: result,
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

countryRouter.get('/selectbyid/:id', async (ctx, next) => {
    try {
        let id = ctx.params.id
        let result = await Country.findByPk(id)
        ctx.response.status = 200
        ctx.body = {
            code: 200,
            msg: '数据查询成功',
            data: result
        }
    } catch (err) {
        ctx.body = {
            code: 201,
            msg: '数据查询失败',
            data: err
        }
        console.log(err)
    }
})

countryRouter.post('/batch', async (ctx, next) => {
    try {
        let req = ctx.request.body
        Country.bulkCreate(req, {
            validate: true,
            individualHooks: true
        }).then(result => {
            ctx.body = {
                code: 200,
                msg: '数据批量导入成功',
                data: result.length
            }
        }).catch(err => {
            console.log(err)
            ctx.body = {
                code: 201,
                msg: '数据批量导入失败',
                data: err
            }
        })
    } catch (err) {
        console.log(err)
        ctx.body = {
            code: 201,
            msg: '数据批量导入失败',
            data: err
        }
    }
})

module.exports = {
    countryRouter
}
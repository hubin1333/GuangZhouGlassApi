const Router = require('koa-router')
const { Op } = require('sequelize')
const Customer = require('../model/customer.model')

const customerRouter = new Router({
    prefix: '/api/customer'
})

customerRouter.get('/', (ctx, next) => {
    ctx.body = " hello customer!"
})

customerRouter.post('/search', async (ctx, next) => {
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

        let result = await Customer.findAndCountAll({
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

customerRouter.post('/add', async (ctx, next) => {
    try {
        let req = ctx.request.body
        let result = await Customer.create(req)
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

customerRouter.post('/update', async (ctx, next) => {
    try {
        let req = ctx.request.body
        let id = req.id
        let result = await Customer.update(req, {
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

customerRouter.delete('/delete/:id', async (ctx, next) => {
    try {
        let id = ctx.params.id
        let result = await Customer.destroy({
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

customerRouter.post('/batchdel', async (ctx, next) => {
    try {
        let req = ctx.request.body
        for (var item of req) {
            await Customer.destroy({
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

customerRouter.get('/pagelist', async (ctx, next) => {
    try {
        let pageNum = Number(ctx.query.pageNum) || 1
        let pageSize = Number(ctx.query.pageSize) || 10
         
        let keyword = ctx.query.keyword

        let where = { isDelete: 0 }

        
        if (keyword) {
            where[Op.or] = [
                { customerNo: { [Op.like]: `%${keyword}%` } },
                { customerName: { [Op.like]: `%${keyword}%` } },
                { companyName: { [Op.like]: `%${keyword}%` } },
                { country: { [Op.like]: `%${keyword}%` } },
                { mobile: { [Op.like]: `%${keyword}%` } },
                { phone: { [Op.like]: `%${keyword}%` } },
                { email: { [Op.like]: `%${keyword}%` } },
            ]
        }

        let result = await Customer.findAndCountAll({
            where,
            limit: pageSize,
            offset: pageNum == 1 ? 0 : (pageNum - 1) * pageSize,
            order: [['id', 'DESC']]
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

customerRouter.get('/selectbyid/:id', async (ctx, next) => {
    try {
        let id = ctx.params.id
        let result = await Customer.findByPk(id)
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

customerRouter.post('/batch', async (ctx, next) => {
    try {
        let req = ctx.request.body
        Customer.bulkCreate(req, {
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
    customerRouter
}
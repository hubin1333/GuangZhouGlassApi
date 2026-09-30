const Router = require('koa-router')
const Good = require('../model/good.model')
const { Op, fn, col, literal } = require('sequelize')
const moment = require('moment')

const goodRouter = new Router({
    prefix: '/api/good'
})

goodRouter.get('/', (ctx, next) => {
    ctx.body = " hello good!"
})

goodRouter.post('/add', async (ctx, next) => {
    try {
        let req = ctx.request.body
        let now = moment().format('YYYY-MM-DD HH:mm:ss')
        req.createTime = now
        let result = await Good.create(req)
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

goodRouter.post('/update', async (ctx, next) => {
    try {
        let req = ctx.request.body
        let id = req.id
        let now = moment().format('YYYY-MM-DD HH:mm:ss')
        req.updateTime = now
        let result = await Good.update(req, {
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
            msg: '数据修改失败:'+err.message,
            data: err
        }
    }
})

goodRouter.delete('/delete/:id', async (ctx, next) => {
    try {
        let id = ctx.params.id
        let result = await Good.destroy({
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
            msg: '删除失败:' + err.message,
            data: err
        }
    }
})

goodRouter.post('/batchdel', async (ctx, next) => {
    try {
        let req = ctx.request.body
        for (var item of req) {
            await Good.destroy({
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

goodRouter.post('/pagelist', async (ctx, next) => {
    try {
        let req = ctx.request.body || {}
        let param = {}
        let pageNum = Number(req.pageNum) || 1
        let pageSize = Number(req.pageSize) || 10

        Object.entries(req).forEach(([key, value]) => {
            if (key !== "pageNum" && key !== "pageSize") {
                if (value !== "" && value !== null && value !== undefined) {
                    param[key] = { [Op.like]: `%${value}%` }
                }
            }
        })
        console.log('param:',param)
        let query = {
            limit: pageSize,
            offset: pageNum == 1 ? 0 : (pageNum - 1) * pageSize,
            order: [['id']]
        }
        if (Object.keys(param).length > 0) {
            query.where = { [Op.or]: param }
        }
        console.log('query:',query)
        let result = await Good.findAndCountAll(query)
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
            msg: '数据查找失败:' + err.message,
            data: err
        }
    }
})

goodRouter.get('/selectbyid/:id', async (ctx, next) => {
    try {
        let id = ctx.params.id
        let result = await Good.findByPk(id)
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

goodRouter.get('/selectbyModel/:str(.+)', async (ctx, next) => {
    try {
        let str = ctx.params.str
        let result = await Good.findAll({
            where: { goodsModel: { [Op.like]: `${str}%`} }
        })
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


goodRouter.post('/batch', async (ctx, next) => {
    try {
        let req = ctx.request.body  
         
        Good.bulkCreate(req, {
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
            msg: '数据批量导入失败:'+err,
            data: err
        }
    }
})

goodRouter.get('/getall', async (ctx, next) => {
    try {
        let result = await Good.findAll({
            attributes: ['id', 'goodsDesc', 'goodsModel', 'goodsSize', 'goodsColor', 'status']
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

async function findDuplicates() {
    const groups = await Good.findAll({
        attributes: [
            'goodsModel',
            [fn('COUNT', col('id')), 'cnt']
        ],
        where: { isDelete: 0 },
        group: ['goodsModel'],
        having: literal('cnt > 1'),
        raw: true,
    })

    if (!groups.length) {
        return { groups: [], records: [] }
    }

    const models = groups.map(g => g.goodsModel)
    const records = await Good.findAll({
        where: { goodsModel: { [Op.in]: models }, isDelete: 0 },
        order: [['goodsModel'], ['id']],
    })

    return { groups, records }
}

goodRouter.post('/duplicates', async (ctx, next) => {
    try {
        const result = await findDuplicates()
        console.log(result)
        ctx.response.status = 200
        ctx.body = {
            code: 200,
            msg: result.groups.length ? '查找成功' : '没有重复的 goodsModel',
            data: result,
        }
    } catch (err) {
        console.log(err)
        ctx.body = {
            code: 201,
            msg: '查找失败:' + err.message,
            data: err
        }
    }
})

module.exports = {
    goodRouter
}
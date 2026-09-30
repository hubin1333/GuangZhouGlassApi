const Router = require('koa-router')
const Role = require('../model/role.model')


const roleRouter = new Router({
    prefix: '/api/role'
}) //路由前缀
roleRouter.get('/', (ctx, next) => {
    ctx.body = " hello users!"
})
 
roleRouter.post('/add', async (ctx, next) => {
    try {
        console.log('新增操作!')
        let req = ctx.request.body
        console.log(req)
        delete req.id
        let result = await Role.create(req)
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

roleRouter.post('/edit', async (ctx, next) => {
    //编辑操作
    try {
        console.log('编辑操作!')
        let req = ctx.request.body
        console.log(req)
        let id = req.id
        let result = await Role.update(req, {
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
        console.log("用户修改失败:" + err)
        ctx.body = {
            code: 201,
            msg: '数据修改失败',
            data: err
        }
    }
})
  
roleRouter.post('/delete', async (ctx, next) => {
    try {
        console.log('删除操作!')
        let req = ctx.request.body
        console.log(req)
        let user_id = req.user_id
        let id = req.id
        let result = await Role.destroy({
            where: {
                //user_id: user_id
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
roleRouter.post('/delmany', async (ctx, next) => {
    //编辑操作
    try {
        let result = null
        console.log('删除操作!')
        let req = ctx.request.body
        console.log(req)
        for (var item of req) {
            let user_id = item.user_id
            let result = await Role.destroy({
                where: {
                    user_id: user_id
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

roleRouter.post('/pagelist', async (ctx, next) => {
    try {
        console.log('User查找操作!')
        let req = ctx.request.body
        console.log(req)
        let pageIndex = req.pageNum
        let pageSize = req.pageSize
        let result = await Role.findAndCountAll({
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
        ctx.body = {
            code: 201,
            msg: '查找失败',
            data: err
        }
    }
})

roleRouter.get('/list', async (ctx, next) => {
    try {
        let req = ctx.request.body
        console.log(req)
        let result = await Role.findAll()
        console.log(result)

        ctx.response.status = 200;
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
roleRouter.post('/findone', async (ctx, next) => {
    try {
        let req = ctx.request.body
        let roleid = req.roleid
        
        let result = await Role.findOne({
            where: {
                roleid:roleid,
            },

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
module.exports = {
    roleRouter
}
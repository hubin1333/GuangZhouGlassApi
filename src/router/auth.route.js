// 0//权限
const Router = require('koa-router')
const Auth = require('../model/auth.model')
const sequelize = require('../db/seq_mysql')
const {
    QueryTypes,
    JSON
} = require('sequelize')


const authRouter = new Router({
    prefix: '/api/auth'
}) //路由前缀

authRouter.get('/', (ctx, next) => {
    ctx.body = " hello auth!"
})

authRouter.post('/add', async (ctx, next) => {
    try {
        let req = ctx.request.body
        console.log(req)
        const {userLists,menuLists,authLists} =req
        for(let i=0;i<userLists.length;i++){
            let item=userLists[i]
            console.log('item'+item)
            let findRst=await Auth.findOne({where:{roleid:item}})
            //console.log('findRst:'+JSON.stringify(findRst))    
            await Auth.destroy({ where: {roleid: item }})
            menuLists.forEach(async ele => {
                console.log('menu:'+ ele)
                await Auth.create({roleid:item,menuid:ele,authtype:1})
            });
            authLists.forEach(async ele=>{
                  console.log('auth:'+ ele)
                await Auth.create({roleid:item,menuid:ele,authtype:2})
            })  
        }   
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '操作成功!',
            data: 1,
        }
    } catch (err) {
        console.log(err)
        ctx.body = {
            code: 201,
            msg: '操作失败!',
            data: err
        }
    }
})

authRouter.post('/edit', async (ctx, next) => {
    try {
        let req = ctx.request.body
        let id = ctx.request.body.id
        console.log(req)
        let result = await Auth.update({
            value: req.value,
        }, {
            where: {
                id: id
            }
        })
        console.log(result)
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '修改成功',
            data: 1,
        }
    } catch (err) {
        ctx.body = {
            code: 201,
            msg: '修改失败',
            data: err
        }
        console.log(err)
    }
})

authRouter.post('/delete', async (ctx, next) => {
    try {
        let req = ctx.request.body
        let id = req.id
        await Auth.destroy({
            where: {
                id: id
            }
        })
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '删除成功',
            data: 1,
        }
    } catch (err) {
        console.log(err)
        ctx.body = {
            code: 201,
            msg: '删除失败',
            data: err
        }
    }
})
authRouter.post('/search', async (ctx, next) => {
    try {

        let req = ctx.request.body
        let param = {}
        let pageNum = req.pageNum
        let pageSize = req.pageSize
        if (req.meterCode.length != 0) {
            param.meterCode = req.meterCode
        }
        if (req.meterName.length != 0) {
            param.meterName = req.meterName
        }
        // if (req.status.length != 0) {
        //     param.status = req.status
        // }

        let result = null;
        if (param.length == 0) {
            result = await PayOrder.findAndCountAll({
                where: param,
                limit: pageSize,
                offset: pageNum == 1 ? 0 : (pageNum - 1) * pageSize,
                order: [
                    //['createtime','DESC']
                    ['id']
                ],
            })
        } else {
            result = await PayOrder.findAndCountAll({
                where: param,
                limit: pageSize,
                offset: pageNum == 1 ? 0 : (pageNum - 1) * pageSize,
                order: [
                    ['id']
                ],
            })
        }

        ctx.response.status = 200; 
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
authRouter.get('/getAuth', async (ctx, next) => {
    try {
        let roleid = ctx.query.roleId
        let result
        let menuAuth = []
        let btnAuth = []

        let rst1 = await sequelize.query("select * from sys_menu where type = 0 and fid != 0   order by ordernum ", {
            type: QueryTypes.SELECT
        })
        let rst2 = await sequelize.query("select * from sys_menu where type = 1 and fid != 0  order by ordernum ", {
            type: QueryTypes.SELECT
        })
        let rst3 = await sequelize.query("select id,promit from sys_menu where type = 2 ", {
            type: QueryTypes.SELECT
        })
        if (roleid == 100 || roleid == 7 || roleid == "system") {

            if (rst1 && rst1.length > 0) {
                for (let item1 of rst1) {
                    let child
                    if (rst2 && rst2.length > 0) {
                        child = (rst2.filter((item) => item.fid == item1.id))
                    }
                    let param = {
                        id: item1.id,
                        icon: item1.icon,
                        name: item1.name,
                        children: child
                    }
                    menuAuth.push(param)
                }
            }

            let btns = []
            if (rst3.length > 0) {
                for (let item of rst3) {
                    btns.push(item.promit)
                }
            }
            btnAuth = rst3
        }
        else
        {

            let str = "SELECT name,menuid,path,promit,type,ordernum from (select * from sys_auth WHERE roleid='" + roleid + "')a LEFT JOIN sys_menu on a.menuid=sys_menu.id"
            console.log('获取权限语句-str:' + str)
            let rst4 = await sequelize.query(str, {
                type: QueryTypes.SELECT
            })
            menuAuth = rst4.filter(item => item.type == "1")
            btnAuth = rst4.filter(item => item.type == "2")
        }
        result = {
            menuAuth: menuAuth,
            btnAuth: btnAuth
        }
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
authRouter.post('/listall', async (ctx, next) => {
    try {
        let req = ctx.request.body
        //let name = req.name

        let result = await Auth.findAndCountAll({
            // where: {
            //     name:name,

            // },

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
    authRouter
}
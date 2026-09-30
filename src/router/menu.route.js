const Router = require('koa-router')
const Menu = require('../model/menu.model')
const sequelize = require('../db/seq_mysql')
const {
    QueryTypes, Op
} = require('sequelize')



const menuRouter = new Router({
    prefix: '/api/menu'
}) //路由前缀

menuRouter.get('/', (ctx, next) => {
    ctx.body = " hello menu!"
})

menuRouter.post('/add', async (ctx, next) => {
    try {
        let req = ctx.request.body
        console.log(req)
        req.id = 0
        let resulte = await Menu.create(req)
        console.log(resulte)
        //新增操作
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '创建成功',
            data: 1,
        }
    } catch (err) {
        console.log(err)
        ctx.body = {
            code: 201,
            msg: '创建失败',
            data: err
        }
    }
})

menuRouter.put('/update', async (ctx, next) => {
    try {
        let req = ctx.request.body
        let id = ctx.request.body.id
        console.log(req)
        let result = await Menu.update( req, {
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

menuRouter.post('/delete', async (ctx, next) => {
    try {
        let req = ctx.request.body
        let id = req.id
        await Menu.destroy({
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
menuRouter.post('/search', async (ctx, next) => {
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
menuRouter.post('/findone', async (ctx, next) => {
    try {
        let req = ctx.request.body
        let name = req.name

        let result = await Menu.findOne({
            where: {
                name: name,

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
menuRouter.get('/getOneLevelMenu', async (ctx, next) => {
    try {
        let req = ctx.request.body
        //let name = req.name

        let result = await Menu.findAll({
            where: {
                type: 0,
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

menuRouter.get('/getTwoLevelMenu', async (ctx, next) => {
    try {
        let req = ctx.request.body
        //let name = req.name

        let result = await Menu.findAll({
            where: {
                type: 1,
            },
            order: [['ordernum'],]
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

menuRouter.post('/getBtnMenu', async (ctx, next) => {
    try {
        let req = ctx.request.body    
        let result = await Menu.findAll({
            where: {
                type: 2,
                fid:req.id
            },
            order: [['ordernum'],]
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


//所有菜单递归
menuRouter.get('/allMenu', async (ctx, next) => {
    try {
        let arr1 = await sequelize.query("SELECT * from sys_menu where fid!=0 and type=0  order by ordernum", { type: QueryTypes.SELECT });
        //console.log(rst1)
        let arr2 = await sequelize.query("SELECT id,fid,name from sys_menu where  type=1  ", { type: QueryTypes.SELECT });
        let arr3 = await sequelize.query("SELECT id,fid,name from sys_menu where  type=2  ", { type: QueryTypes.SELECT });
        const result=[]
        console.log(1)
        for (let i = 0; i < arr2.length; i++) {
            let rst= arr3.filter(item=>item.fid==arr2[i].id)
            let param={
                id:arr2[i].id,
                fid:arr2[i].fid,
                name:arr2[i].name,
                hideCheckbox: true,
                child:rst
            } 
            result.push(param);  
        }
        console.log(2)
        let newRst=[]
        for (let i = 0; i < arr1.length; i++) {
        let rst= result.filter(item=>item.fid==arr1[i].id)
            let p={
                id:arr1[i].id,
                name:arr1[i].name,
                child:rst
            } 
            newRst.push(p);  
        }
        

        ctx.response.status = 200
        ctx.body = {
            code: 200,
            msg: '数据查询成功',
            data: newRst
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


menuRouter.get('/allBtn', async (ctx, next) => {
    try {
        // let req = ctx.request.body
        // let param={}
        //     param.fid={
        //         [Op.not]:0
        //     }

        // let result = await Menu.findAll({
        //     where: param
        // })

        let rst1 = await sequelize.query("SELECT * from sys_menu where fid!=0 and type=0   order by ordernum", { type: QueryTypes.SELECT });
        console.log(rst1)
        let rst2 = await sequelize.query("SELECT id,fid,name from sys_menu where  type=1  ", { type: QueryTypes.SELECT });
        let rst3 = await sequelize.query("SELECT id,fid,name from sys_menu where  type=2  ", { type: QueryTypes.SELECT });
        let menus = []
        let sonChild = []
        console.log(1)
        if (rst1 && rst1.length > 0) {
            for (let item1 of rst1) {
                //console.log(item1)
                let child = []
                console.log(2)
                // if (rst2 && rst2.length > 0) {
                child = (rst2.filter((item) => item.fid == item1.id))
                //if(child&&child.length>0){
                console.log(3)

                for (let itemChild of child) {
                    let btns = []
                    if (rst3 && rst3.length > 0) {
                        for (let itemBtn of rst3) {
                            btns = rst3.filter((n) => n.fid = itemChild.id)
                        }

                    }
                    let paramChild = {
                        id: itemChild.id,
                        fid: itemChild.fid,
                        name: itemChild.name,
                        btns: btns
                    }
                    sonChild.push(paramChild)
                }
                // }
                //}
                let param = {
                    id: item1.id,
                    //icon: item1.icon,
                    name: item1.name,
                    child: sonChild,

                }
                menus.push(param)
            }
        }


        ctx.response.status = 200
        ctx.body = {
            code: 200,
            msg: '数据查询成功',
            data: menus
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

menuRouter.get('/gettree', async (ctx, next) => {
    try {
        let rst1 = await sequelize.query("SELECT * from sys_menu where fid!=0 and type=0 order by ordernum", { type: QueryTypes.SELECT });
        console.log('rst1' + rst1)
        let rst2 = await sequelize.query("SELECT id,fid,name from sys_menu where  type=1 ", { type: QueryTypes.SELECT });
        let rst3 = await sequelize.query("SELECT id,fid,name from sys_menu where  type=2 ", { type: QueryTypes.SELECT });
        let menus = []
        if (rst1 && rst1.length > 0) {
            for (let item1 of rst1) {
                //console.log(item1)
                let child = []

                if (rst2 && rst2.length > 0) {
                    child = (rst2.filter((item) => item.fid == item1.id))
                    if (child && child.length > 0) {
                        for (let itemChild of child) {
                            let btns = []
                            if (rst3 && rst3.length > 0) {
                                for (let itemBtn of rst3) {
                                    btns = rst3.filter((n) => n.fid = itemChild.id)
                                }

                            }
                            let paramChild = {
                                id: itemChild.id,
                                fid: itemChild.fid,
                                name: itemChild.name,
                                btns: btns
                            }

                        }
                    }
                }
                let param = {
                    id: item1.id,
                    //icon: item1.icon,
                    name: item1.name,
                    child: child,

                }
                menus.push(param)
            }
        }


        ctx.response.status = 200
        ctx.body = {
            code: 200,
            msg: '数据查询成功',
            data: menus
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

menuRouter.post('/getThreeLevelMenu', async (ctx, next) => {
    try {
        let req = ctx.request.body
        //let name = req.name

        let result = await Menu.findAll({
            where: {
                type: 2,
                fid: req.fid
            },
            order: [['ordernum'],]
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


function buildTreeWithFor(level1, level2, level3) {
    // 1. 先为一级节点挂载二级节点（level1 <- level2，匹配id=fid）
    for (let i = 0; i < level1.length; i++) {
        const parent = level1[i];
        parent.children = []; // 初始化子节点数组，统一结构
        // 遍历二级节点，匹配当前一级节点的id
        for (let j = 0; j < level2.length; j++) {
            const child = level2[j];
            if (child.fid === parent.id) {
                parent.children.push(child); // 匹配成功，挂载为子节点
            }
        }
    }

    // 2. 再为二级节点挂载三级节点（level2 <- level3，匹配id=fid）
    for (let i = 0; i < level2.length; i++) {
        const parent = level2[i];
        parent.children = []; // 初始化子节点数组
        // 遍历三级节点，匹配当前二级节点的id
        for (let j = 0; j < level3.length; j++) {
            const child = level3[j];
            if (child.fid === parent.id) {
                parent.children.push(child); // 匹配成功，挂载为子节点
            }
        }
    }

    // 最终树形结构的根节点是一级节点数组
    return level1;
}



menuRouter.get('/selectbyFid/:fid', async (ctx, next) => {
    try {
        let fid = ctx.params.fid
        let result = await Menu.findAll({
            where: { fid: fid },
            order: [['ordernum']]
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

menuRouter.get('/selectbytype/:type', async (ctx, next) => {
    try {
        let type = ctx.params.type
        let result = await Menu.findAll({
            where: { type: type },
            order: [['ordernum']]
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

menuRouter.get('/selectbyid/:id', async (ctx, next) => {
    try {
        let id = ctx.params.id
        let result = await Menu.findByPk(id)
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
    menuRouter
}
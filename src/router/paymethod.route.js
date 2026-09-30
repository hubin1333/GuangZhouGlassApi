const Router = require('koa-router')
const path = require('path')
const moment = require('moment') 
const PayMethod = require('../model/pay_method.model') 
const send = require('koa-send');
const fse = require('fs-extra'); // 使用fs-extra代替fs
const sequelize = require('../db/seq_mysql') 
const {
    DataTypes,
    Op,
    QueryTypes
} = require('sequelize') 

const paymethodRouter = new Router({
    prefix: '/api/paymethod'
})
paymethodRouter.get('/', (ctx, next) => {
    ctx.body = " hello dep!"
})
  
 
paymethodRouter.post('/search', async (ctx, next) => {
      try { 
        let req = ctx.request.body
        let param = {}
        let pageNum = req.pageNum
        let pageSize = req.pageSize 
        let name=req.name 
        let result = null;
        if (name) { 
            console.log('name:',name) 
            result = await PayMethod.findAndCountAll({
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
            result = await PayMethod.findAndCountAll({ 
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

  
paymethodRouter.post('/add', async (ctx, next) => { 
    try {
        console.log('新增操作!')
        let req = ctx.request.body
        console.log(req) 
        
        let result = await PayMethod.create(req) 
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

paymethodRouter.post('/edit', async (ctx, next) => {
    //编辑操作
    try {
        console.log('编辑操作!')
        let req = ctx.request.body
        console.log(req)
        let id = req.id
        let result = await PayMethod.update(req, {
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

paymethodRouter.post('/delete', async (ctx, next) => {
    try {
        console.log('删除操作!')
        let req = ctx.request.body
        console.log(req) 
        let id = req.id
        let result = await PayMethod.destroy({
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

paymethodRouter.post('/batch', async (ctx, next) => {
    try {
        console.log('批量导入操作!')
        let req = ctx.request.body
        console.log(req)
           for (let item of req) {   
             await PayMethod.create(item)
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
paymethodRouter.post('/delmany', async (ctx, next) => {
    //编辑操作
    try {
        let result = null
        console.log('删除操作!')
        let req = ctx.request.body
        console.log(req)
        for (var item of req) {
            let id = item.id
            let result = await PayMethod.destroy({
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

paymethodRouter.post('/pagelist', async (ctx, next) => {
    try {
        console.log('Comp查找操作!')
        let req = ctx.request.body
        console.log(req)
        let pageIndex = req.pageNum
        let pageSize = req.pageSize
        let result = await PayMethod.findAndCountAll({
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
    } catch (err) { 4
        console.log('err', err);

        ctx.body = {
            code: 201,
            msg: '查找失败',
            data: err
        }
    }
})
 

paymethodRouter.get('/getlist', async (ctx, next) => {
    try {
        console.log('depList查找操作!')    
        let req = ctx.request.body
        //console.log(req)
       
        let result=[]
        
        let noData = await sequelize.query("SELECT DISTINCT no FROM dep",{type: QueryTypes.SELECT})
        console.log('noData:'+JSON.stringify(noData))

         for (let index = 0; index < noData.length; index++) {  let param={   
        }   
             let rst=await sequelize.query("SELECT id,no,name,addr FROM dep where no='"+noData[index].no+"'",{type:QueryTypes.SELECT})
             param.name=noData[index].no
             param.children=rst
            result.push(param)
         } 
        console.log('result:'+JSON.stringify(result))
        
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '查找成功',
            data:             result
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

paymethodRouter.get('/all_2', async (ctx, next) => {
    try {
        console.log('all!')
        let req = ctx.request.body
       
        let sqlStr="select * from pay_method ";
        let rst = await sequelize.query(sqlStr, {
            type: QueryTypes.SELECT
        })
        for (let index = 0; index < rst.length; index++) {
            let element = rst[index];
            let id=element.id
           
            sqlStr = "select * from pay_account where payMethodId='"+ id +"'"
            let rst2 = await sequelize.query(sqlStr, {
                type: QueryTypes.SELECT
            }) 
            rst[index].childrens=[]
            rst[index].childrens.push(rst2)    
            
        }     
        let result = {}
        result.count = rst.length
        result.rows = rst//rst.slice(startIndex, startIndex + pageSize)
        //console.log('result:'+JSON.stringify(result))
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

//获取收款方式以及收款账号包括个人微信号
paymethodRouter.post('/getall', async (ctx, next) => {
    try { 
        let req = ctx.request.body
       
        let sqlStr="select * from pay_method ";
        let rst = await sequelize.query(sqlStr, {
            type: QueryTypes.SELECT
        })
        for (let index = 0; index < rst.length; index++) {
            let element = rst[index];
            let id=element.id
            if(element.name==="微信收款"){
                sqlStr="select id,wx name from wx where uid ='"+req.uid+"'"
            }else{
                sqlStr = "select * from pay_account where payMethodId='"+ id +"'"
            }
            let rst2 = await sequelize.query(sqlStr, {
                type: QueryTypes.SELECT
            }) 
            rst[index].childrens=rst2   
        }     
        let result = {}
        result.count = rst.length
        result.rows = rst//rst.slice(startIndex, startIndex + pageSize)
        console.log('result:'+JSON.stringify(result))
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
  

module.exports = {
    paymethodRouter
}
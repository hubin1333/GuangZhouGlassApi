const Router = require('koa-router')
const Dict = require('../model/dict.model')
const sequelize = require('../db/seq_mysql')
const NodeCache = require('node-cache');
const dictCache = new NodeCache({ stdTTL: 300 }); // 缓存5分钟

const {
    QueryTypes
} = require('sequelize')


const dictRouter = new Router({
    prefix: '/api/dict'
}) //路由前缀

dictRouter.get('/', (ctx, next) => {
    ctx.body = " hello dict!"
})

dictRouter.post('/create', async (ctx, next) => {
    try {
        let req = ctx.request.body
        console.log(req)
        let resulte = await Dict.create(req)
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

dictRouter.post('/update', async (ctx, next) => {
    try {
        let req = ctx.request.body
        let id = ctx.request.body.id
        console.log(req)
        let result = await Dict.update({
            code: req.code,
            name: req.name
        }, {
            where: {
                id: id
            }
        })
        console.log(result)
        //新增操作
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

dictRouter.post('/delete', async (ctx, next) => {
    try {
        let req = ctx.request.body
        const id = req.id
        await Dict.destroy({
            where: {
                id: id
            }
        })
        await Dict.destroy({
            where: {
                highid: id
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

//获取一级数字字典
dictRouter.get('/list_V1', async (ctx, next) => {
    try {

        let req = ctx.request.body;
        let result = await sequelize.query("select * from dict where level=1")
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '数据获取成功!',
            data: result[0]
        }
    } catch (err) {
        console.log(err)
        ctx.body = {
            code: 203,
            msg: '数据获取失败!',
            data: err
        }
    }
})

//根据一级编号获取下一级的内容
dictRouter.post('/list_V2', async (ctx, next) => {
    try {

        let req = ctx.request.body;
        let result = await Dict.findAll({
            where: {
                highid: req.highid
            }
        })
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '数据获取成功!',
            data: result
        }
    } catch (err) {
        console.log(err)
        ctx.body = {
            code: 203,
            msg: '数据获取失败!',
            data: err
        }
    }
})

//根据一级名称获取二级的内容
dictRouter.post('/list_V4', async (ctx, next) => {
    try {
        console.log('根据一级名称获取二级的内容')
        const req = ctx.request.body;
        console.log(req)
        let result = await sequelize.query("select * from dict where highid in(select id from dict where name= '" + req.name + "')",{type: QueryTypes.SELECT})
           
        
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '数据获取成功!',
            data: result
        }
    } catch (err) {
        console.log(err)
        ctx.body = {
            code: 203,
            msg: '数据获取失败!',
            data: err
        }
    }
})

dictRouter.get('/list_V3', async (ctx, next) => {
    try {

        let req = ctx.request.body;
        let result = await sequelize.query("select * from dict ")
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '数据获取成功!',
            data: result
        }
    } catch (err) {
        console.log(err)
        ctx.body = {
            code: 203,
            msg: '数据获取失败!',
            data: err
        }
    }
})

dictRouter.get('/list_V6', async (ctx, next) => {
    try {

        let selResult = await sequelize.query("select id,code,name from dict where level=1", {
            type: QueryTypes.SELECT
        })
        let ret = selResult
        let result = []
        for (let item of ret) {
            let ret = await sequelize.query("select id,code,name from dict where highid=" + item.id + "", {
                type: QueryTypes.SELECT
            })
            //console.log(ret)
            item.children = JSON.parse(JSON.stringify(ret))
            result.push(item)

        }

        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '数据获取成功!',
            data: result
        }
    } catch (err) {
        console.log(err)
        ctx.body = {
            code: 203,
            msg: '数据获取失败!',
            data: err
        }
    }
}) 

// 常量提取
const SQL_PARENT = 'SELECT id, code, name FROM dict WHERE level = 1';
const SQL_CHILDREN = 'SELECT id, code, name, highid FROM dict WHERE highid IN (:parentIds)';

// 抽取为 Service 函数
async function getDictTree() {
  const cacheKey = 'dict_tree_v5';
  const cacheData = dictCache.get(cacheKey);
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@cacheData:'+JSON.stringify(cacheData))
  if (cacheData) return cacheData;

  // 查询父级
  const parentList = await sequelize.query(SQL_PARENT, {
    type: QueryTypes.SELECT,
  });

  if (!parentList.length) return [];

  // 查询子级（一次查询）
  const parentIds = parentList.map(item => item.id);
  const childList = await sequelize.query(SQL_CHILDREN, {
    replacements: { parentIds },
    type: QueryTypes.SELECT,
  });

  // 组装树结构
  const treeData = parentList.map(parent => ({
    ...parent,
    children: childList.filter(child => Number(child.highid) === Number(parent.id)),
  }));

  // 写入缓存
  dictCache.set(cacheKey, treeData);
  return treeData;
}

// 路由层
dictRouter.get('/list_V5', async (ctx) => {
  try {
    const treeData = await getDictTree();

    ctx.status = 200;
    ctx.body = {
      code: 200,
      msg: '字典数据获取成功!',
      data: treeData,
    };
  } catch (err) {
    console.error('[字典接口错误]', err);
    ctx.status = 500;
    ctx.body = {
      code: 500,
      msg: '字典数据获取失败'+err,
      data: null,
    };
  }
});
 
module.exports = {
    dictRouter
}
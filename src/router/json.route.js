const Router = require('koa-router')
const fs = require('fs')
const path = require('path')

const jsonRouter = new Router({
    prefix: '/api/json'
})

jsonRouter.get('/:fileName', async (ctx, next) => {
    try {
        let fileName = ctx.params.fileName
        let filePath = path.resolve(__dirname, '../json', fileName + '.json')
        if (!fs.existsSync(filePath)) {
            ctx.response.status = 404
            ctx.body = {
                code: 404,
                msg: '文件不存在',
                data: null
            }
            return
        }
        let jsonData = fs.readFileSync(filePath, 'utf-8')
        ctx.response.status = 200
        ctx.body = {
            code: 200,
            msg: '查找成功',
            data: JSON.parse(jsonData)
        }
    } catch (err) {
        console.log('err', err)
        ctx.response.status = 500
        ctx.body = {
            code: 500,
            msg: '读取失败',
            data: err
        }
    }
})

module.exports = {
    jsonRouter
}
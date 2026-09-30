//app 业务模块
const Koa = require('koa')
const KoaBody = require('koa-body')
const static  = require('koa-static')
const path = require('path')
const cors = require('koa-cors')
const fs = require('fs')
 
 
const app = new Koa();

app.use(cors())
app.use(KoaBody())

app.use(require('koa-static')('./mobile')) //供静态文件服务
app.use(static(path.join(__dirname))) //供静态文件服务
  
module.exports = app
//app 业务模块
const Koa = require('koa')
const KoaBody = require('koa-body')
const static  = require('koa-static')
const path = require('path')
const cors = require('koa-cors')
const fs = require('fs')
const send = require('koa-send');

//const {dictRouter} = require('../router/dict.route.js')  
const {userRouter} = require('../router/user.route.js')
const {soRouter} = require('../router/so.route.js')  
const {moRouter} = require('../router/mo.route.js')
const {supplierRouter} = require('../router/supplier.route.js')
const {depRouter} = require('../router/dep.route.js')
const {categoryRouter} = require('../router/category.route.js')   
const {goodRouter} = require('../router/good.route.js')  
const {countryRouter} = require('../router/country.route.js')   
 
const {menuRouter} = require('../router/menu.route.js') 
const {authRouter} = require('../router/auth.route.js')  
 
const { logRouter} =require('../router/log.route.js')
 
const {tabColRouter}=require('../router/tablecolumn.route.js')
const {jsonRouter}=require('../router/json.route.js')
const {customerRouter}=require('../router/customer.route.js')
const {traceRouter}=require('../router/trace.route.js')
const {storeDataRouter}=require('../router/storeData.route.js') 
const {receiptRouter}=require('../router/receipt.route.js')
const {deliveryRouter}=require('../router/delivery.route.js') 
const {stockRouter}=require('../router/stock.route.js')
 



const app = new Koa();

app.use(cors())
app.use(KoaBody({
  multipart: true,
  jsonLimit: '50mb',
  textLimit: '50mb',
  formidable: {
    maxFileSize: 100 * 1024 * 1024,
    maxFieldsSize: 50 * 1024 * 1024
  }
}))

app.use(require('koa-static')('./public')) //供静态文件服务
app.use(static(path.join(__dirname))) //供静态文件服务

//console.log(__dirname + '/ '); 
app.use(menuRouter.routes())
app.use(authRouter.routes())  
app.use(userRouter.routes())  
app.use(goodRouter.routes())  

app.use(depRouter.routes())  
app.use(categoryRouter.routes())   
//app.use(dictRouter.routes())    
app.use(countryRouter.routes())  
app.use(logRouter.routes())  
app.use(tabColRouter.routes())
app.use(jsonRouter.routes())
app.use(customerRouter.routes())
app.use(supplierRouter.routes())
app.use(storeDataRouter.routes())
app.use(receiptRouter.routes())
 app.use(traceRouter.routes())
 
app.use(moRouter.routes()) 
app.use(deliveryRouter.routes())
app.use(soRouter.routes())
app.use(stockRouter.routes())

module.exports = app
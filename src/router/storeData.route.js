const Router = require('koa-router')
const moment = require('moment')
const path = require('path');
const fs = require('fs')
const Order = require('../model/order.model') 
const User = require('../model/user.model')
const Supplier = require('../model/supplier.model') 
const Customer = require('../model/customer.model') 
const Country = require('../model/country.model') 
const Log = require('../model/log.model')
const Setup = require('../model/setup.model')
const TableColumn=require('../model/tablecolumn.model')

const sequelize = require('../db/seq_mysql')
const {
    DataTypes,
    Op,
    QueryTypes,
    UUID
} = require('sequelize') 
const { get } = require('http');

 
const storeDataRouter = new Router({
    prefix: '/api/storedata'
})
storeDataRouter.get('/', (ctx, next) => {
    ctx.body = " hello dep!"
})  
 


storeDataRouter.get('/getall', async (ctx, next) => {
      try {
        let supplier = await getSupplierData()
        let customer = await getCustomerData()
        let country = await getCountryData()
        let result = {
            supplier:supplier,
            customer:customer,
            country:country
        }
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '数据获取成功',
            data: result
        }    
    } catch (err) {
        console.log("数据获取失败:" + err)
        ctx.body = {
            code: 201,
            msg: '数据获取失败:' + err,
            data: err
        }
    }
}) 
  
 
/**
 * 
 * @param {用户ID} uid 
 * @returns 获取列表
 */
async function getTabCol(uid){
      return await TableColumn.findAll({
            where: { 
                uid: uid
            }
        }) 
}   

async function getSupplierData(){
    return await Supplier.findAll()
}

async function getCustomerData(){
    return await Customer.findAll()
}

async function getCountryData(){
    return await Country.findAll()
}



module.exports = {
    storeDataRouter
}
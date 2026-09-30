﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿const Router = require('koa-router')
const moment = require('moment')
const Order = require('../model/order.model')
const Good = require('../model/good.model')
const OrderGood = require('../model/order_good.model')
const PayRecord = require('../model/pay_record.model')
const Log = require('../model/log.model')
const Setup = require('../model/setup.model')
const TableColumn = require('../model/tablecolumn.model')
const phoneDesensitize = require('../utils/phone.js')

const sequelize = require('../db/seq_mysql')
const {
    DataTypes,
    Op,
    QueryTypes,
    UUID,
    where
} = require('sequelize')
const OrderNo = require('../model/order_no.model')
const OrderSearchCount = require('../model/order_search_count.model')
const Refund = require('../model/refund.model')
const { sum } = require('pdf-lib')

// 定义关联关系
Order.hasMany(OrderNo, {
  foreignKey: 'UUID',
  sourceKey: 'UUID',
  as: 'orderNos',
  constraints: false
});

Order.hasMany(Refund, {
  foreignKey: 'UUID',
  sourceKey: 'UUID',
  as: 'refunds',
  constraints: false
});

let sumData={}
const model = '订单管理'
const orderRouter = new Router({
    prefix: '/api/order'
})
orderRouter.get('/', (ctx, next) => {
    ctx.body = " hello dep!"
})


orderRouter.post('/find', async (ctx, next) => {
    try {
        let req = ctx.request.body
        const { pageIndex, pageSize, creater, str } = req

        let result = await Order.findAndCountAll({
            where: {
                //[Op.and]: [{ a: 5 }, { b: 6 }]
                [Op.and]: [{ creater: creater }, { [Op.or]: [{ no: str }, { customer: str }] }]
            },
            limit: pageSize,
            offset: pageIndex == 1 ? 0 : (pageIndex - 1) * pageSize,
            order: [['createDt', 'DESC']],
        })
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '查找成功',
            data: result,
        }
    } catch (err) {
        console.log('err', err);

        ctx.body = {
            code: 201,
            msg: '查找失败',
            data: err
        }
    }
})

orderRouter.post('/getbyuuid', async (ctx, next) => {
    try {
        let req = ctx.request.body
        const { UUID } = req

        let result = await Order.findOne({
            where: {
                UUID
            }
        })
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '查找成功',
            data: result,
        }
    } catch (err) {
        console.log('err', err);

        ctx.body = {
            code: 201,
            msg: '查找失败',
            data: err
        }
    }
})

orderRouter.post('/add', async (ctx, next) => { 
    let transaction = null;
    try {
        console.log('新增订单操作开始!');
        const req = ctx.request.body || {};

        // 1. 入参校验：核心数据不能为空
        const { orderModel, payforData, orderGoodData } = req;
        const validations = [
            { value: orderModel, check: v => v, msg: '订单主数据不能为空' },
            { value: payforData, check: v => Array.isArray(v) && v.length > 0, msg: '支付记录数据不能为空' },
            { value: orderGoodData, check: v => Array.isArray(v) && v.length > 0, msg: '订单商品数据不能为空' },
        ];
        for (const { value, check, msg } of validations) {
            if (!check(value)) {
                ctx.status = 200;
                ctx.body = { code: 201, msg, data: null };
                return;
            }
        }

        // 2. 检查UUID是否已存在，防止重复提交
        if (orderModel.UUID) {
            const existingOrder = await Order.findOne({ where: { UUID: orderModel.UUID } });
            if (existingOrder) {
                ctx.status = 200;
                ctx.body = { code: 201, msg: '该订单已存在，请勿重复提交', data: null };
                return;
            }
        }

        // 2. 启动事务（正确定义事务变量）
        transaction = await sequelize.transaction();

        // 3. 补充订单创建时间
        orderModel.createDt = moment().format("YYYY-MM-DD HH:mm:ss");
        //  判断是否可以发货 补充可以发货时间
        if(orderModel.isdelivery&&orderModel.isdelivery==='能') orderModel.isdeliveryDt=moment().format('YYYY-MM-DD HH:mm:ss')


        // 4. 事务内执行数据库操作（统一使用 transaction 变量）
        // 4.1 创建订单主记录
        const createdOrder = await Order.create(orderModel, { transaction });
        // 4.2 批量创建支付记录
        const createdPayRecords = await PayRecord.bulkCreate(payforData, { transaction });
        // 4.3 批量创建订单商品
        const createdOrderGoods = await OrderGood.bulkCreate(orderGoodData, { transaction });
        // 4.4 记录操作日志（修复model未定义问题，建议改为具体模块名如"订单管理"）
        const createdLog = await Log.create({
            operator: orderModel.uid,
            createDt: moment().format('YYYY-MM-DD HH:mm:ss'),
            module: '订单管理', // 替换为实际模块名，避免未定义的model变量
            content: `新增订单：${createdOrder.UUID || '未知ID'}` // 日志内容更具体
        }, { transaction });

        // 5. 手动提交事务（所有操作成功后提交）
        await transaction.commit();
        console.log('新增订单事务提交成功!');

        // 6. 成功响应（返回创建的核心数据，避免未定义的result）
        ctx.status = 200;
        ctx.body = {
            code: 200,
            msg: '数据提交成功',
            data: {
                orderId: createdOrder.id,
                payRecordCount: createdPayRecords.length,
                orderGoodCount: createdOrderGoods.length
            }
        };
    } catch (err) {
        // 7. 异常处理：回滚事务 + 友好提示
        if (transaction) {
            await transaction.rollback();
            console.log('新增订单失败，事务已回滚!' );
        }
        console.error("新增失败:", );

        // 错误响应：隐藏敏感信息，仅返回错误消息
        ctx.status = 500; // 符合RESTful规范的HTTP状态码
        ctx.body = {
            code: 500,
            msg: '数据提交失败：' + err.message,
            data: null
        };
    }
})

orderRouter.post('/addbymobile', async (ctx, next) => {
    let transaction = null;
    
    try {
        console.log('新增订单操作开始!');
        const req = ctx.request.body || {};

        // 1. 入参校验：核心数据不能为空
        const { orderModel } = req;
        if (!orderModel) {
            throw new Error('订单主数据不能为空');
        }


        // 2. 启动事务（正确定义事务变量）
        transaction = await sequelize.transaction();

        // 3. 补充订单创建时间
        orderModel.createDt = moment().format("YYYY-MM-DD HH:mm:ss");

        // 4. 事务内执行数据库操作（统一使用 transaction 变量）
        // 4.1 创建订单主记录
        const createdOrder = await Order.create(orderModel, { transaction });
        // 4.2 批量创建支付记录
        //const createdPayRecords = await PayRecord.bulkCreate(payforData, { transaction });
        // 4.3 批量创建订单商品
        //const createdOrderGoods = await OrderGood.bulkCreate(orderGoodData, { transaction });
        // 4.4 记录操作日志（修复model未定义问题，建议改为具体模块名如"订单管理"）
        const createdLog = await Log.create({
            operator: orderModel.uid,
            createDt: moment().format('YYYY-MM-DD HH:mm:ss'),
            module: '订单管理', // 替换为实际模块名，避免未定义的model变量
            content: `新增订单：${createdOrder.id || '未知ID'}` // 日志内容更具体
        }, { transaction });

        // 5. 手动提交事务（所有操作成功后提交）
        await transaction.commit();
        console.log('新增订单事务提交成功!');

        // 6. 成功响应（返回创建的核心数据，避免未定义的result）
        ctx.status = 200;
        ctx.body = {
            code: 200,
            msg: '数据提交成功',
            data: {
                orderId: createdOrder.id,
                //payRecordCount: createdPayRecords.length,
                // orderGoodCount: createdOrderGoods.length
            }
        };
    } catch (err) {
        // 7. 异常处理：回滚事务 + 友好提示
        if (transaction) {
            await transaction.rollback();
            console.log('新增订单失败，事务已回滚!');
        }
        console.error("新增失败:", err);

        // 错误响应：隐藏敏感信息，仅返回错误消息
        ctx.status = 500; // 符合RESTful规范的HTTP状态码
        ctx.body = {
            code: 500,
            msg: '数据提交失败：' + err.message,
            data: null
        };
    }
})

orderRouter.post('/edit', async (ctx, next) => {
    //编辑操作
    let transaction = null;
    try {
        console.log('编辑操作!')
        let req = ctx.request.body
        console.log(req)
        //涉及的内容比较多
        //1.订单的基础信息
        //2.订单的商品信息
        //3.订单的付款信息
        //4.订单的图片信息
        const { orderModel, payforData, orderGoodData } = req;

        transaction = await sequelize.transaction();
        //基础信息直接修改
        const updateOrder = await Order.update(orderModel, {
            where: { UUID: orderModel.UUID }, // 条件
            transaction: transaction // 事务
        });
        //订单的商品信息删除后再新增   
        const delOrderGoods = await OrderGood.destroy(
            { where: { UUID: orderModel.UUID } },
            { transaction });
        const createdOrderGoods = await OrderGood.bulkCreate(orderGoodData, { transaction });
        //订单的付款方式的修改 需要走审批

        let id = req.id
        let result = await Order.update(req, {
            where: {
                id: id
            }
        })

        console.log(result)
        Log.create({
            operator: req.uid,
            createDt: moment().format('YYYY-MM-DD HH:mm:ss'),
            module: model,
            content: '修改'
        })
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '数据修改成功',
            data: result
        }
    } catch (err) {
        if (transaction) {
            await transaction.rollback();
            console.log('数据修改失败，事务已回滚!');
        }
        console.log("修改失败:" + err)
        ctx.body = {
            code: 201,
            msg: '数据修改失败',
            data: err
        }
    }
})

orderRouter.post('/edit_order_base', async (ctx, next) => {
    //编辑操作
    try {
        console.log('edit_order_base编辑操作!')
        let req = ctx.request.body
        console.log(req)
        if(req.isdelivery&&req.isdelivery==='能') req.isdeliveryDt=moment().format('YYYY-MM-DD HH:mm:ss') 

        let result = await Order.update(req, { where: { id: req.id } });
        console.log(result)
        Log.create({
            operator: req.uid,
            createDt: moment().format('YYYY-MM-DD HH:mm:ss'),
            module: model,
            content: '修改基本内容:'+req.UUID
        })
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

orderRouter.post('/edit_order_good', async (ctx, next) => {
    //编辑操作
    let transaction = null;
    try {
        console.log('edit_order_good编辑操作!')
        let req = ctx.request.body
        console.log(req)
        transaction = await sequelize.transaction()
        const { UUID, selGoodData } = req
        //先删除，再新增
        let result = await OrderGood.destroy(
            { where: { UUID: UUID }, transaction });
        const createdOrderGoods = await OrderGood.bulkCreate(selGoodData, { transaction });


        await Log.create({
            operator: req.uid,
            createDt: moment().format('YYYY-MM-DD HH:mm:ss'),
            module: model,
            content: '修改订单商品详情:'+req.UUID
        }, { transaction });

        await transaction.commit();
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '修改订单商品详情成功',
            data: result
        }
    } catch (err) {
        if (transaction) {
            await transaction.rollback();
            console.log('数据修改失败，事务已回滚!');
        }
        console.error("修改订单商品详情:", err);

        // 错误响应：隐藏敏感信息，仅返回错误消息
        ctx.status = 500;
        ctx.body = {
            code: 500,
            msg: '修改订单商品详情失败：' + err.message,
            data: null
        };
    }
})

orderRouter.post('/edit_fh', async (ctx, next) => {
    //编辑操作
    try {
        console.log('edit_fh编辑操作!')
        let req = ctx.request.body
        console.log(req)
        let result = await Order.update(req, { where: { UUID: req.UUID } });
        console.log(result)
        Log.create({
            operator: req.uid,
            createDt: moment().format('YYYY-MM-DD HH:mm:ss'),
            module: model,
            content: '发货管理修改内容'
        })
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

orderRouter.post('/delete', async (ctx, next) => {
    try {
        console.log('删除操作!')
        let req = ctx.request.body
        console.log(req)
        let UUID = req.UUID

         //根据订单UUID查询是否存在付款记录 pay_record
         const payList = await sequelize.query(
            `SELECT * FROM pay_record WHERE UUID = ? LIMIT 1`,
            {
                replacements: [UUID],
                type: QueryTypes.SELECT
            }
        )
       // 存在付款记录，禁止删除
        if (payList.length > 0) {
            ctx.body = {
                code: 201,
                msg: '删除失败：该订单已存在付款记录，无法删除',
                data: null
            }
            return
        }

        let result = await Order.destroy({
            where: {
                UUID: UUID
            }
        })
        console.log(result)
        Log.create({
            operator: req.uid,
            createDt: moment().format('YYYY-MM-DD HH:mm:ss'),
            module: model,
            content: '删除'
        })
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '删除成功',
            data: result
        }
    } catch (err) {
        ctx.body = {
            code: 201,
            msg: '删除失败:' + err,
            data: err
        }
    }
})

orderRouter.post('/batch', async (ctx, next) => {
    try {
        console.log('批量导入操作!')
        let req = ctx.request.body
        console.log(req)
        for (let item of req) {
            await Order.create(item)
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
orderRouter.post('/delmany', async (ctx, next) => {
    //编辑操作
    try {
        let result = null
        console.log('删除操作!')
        let req = ctx.request.body
        console.log(req)
        for (var item of req) {
            let id = item.id
            let result = await Order.destroy({
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

//#region 订单管理 默认显示及查找

  
orderRouter.post('/pagelist', async (ctx, next) => {
    try {
        const req = ctx.request.body;
        console.log('pagelist:'+JSON.stringify(req))
        const { pageNum = 1, pageSize = 10, uid, uDep, isSearch, start, end, searchModel = {} } = req;
        const pageIndex = Number(pageNum);
        const limit = Number(pageSize);

        if (isSearch && !await searchCount(uid, uDep)) {
            ctx.body = { code: 201, msg: '超过当日最大查询次数，不可查询！', data: null };
            return;
        }
        
        // 构建查询参数
        const param = buildQueryParam({ uDep, uid, isSearch, start, end, searchModel });
        console.log('最终查询参数param:' + JSON.stringify(param))  //createDt显示出来会是空
        
        // 关联查询 
        const include = [
            {
                model: OrderGood,           // 关联的模型：订单商品表
                as: 'goods',                // 关联数据的别名，查询结果中会以 goods 字段返回
                required: searchModel.goodname ? true : false,  // 是否强制内连接
                where: searchModel.goodname ? { name: { [Op.like]: `%${searchModel.goodname}%` } } : {},
                include: [                  // 嵌套关联：订单商品 -> 商品信息
                    {
                        model: Good,        // 关联的模型：商品表
                        as: 'goodInfo',     // 别名
                        required: false     // 左连接，允许商品信息为空
                    }
                ]
            },
            {
                model: PayRecord,
                as: 'pays',
                required: searchModel.payMethod? true : false,
                where: searchModel.payMethod? { payMethod: searchModel.payMethod } : {},
                foreignKey: 'UUID',
                sourceKey: 'UUID'
            },
            {
                model: OrderNo,
                as: 'orderNos',
                required: false,
                foreignKey: 'UUID',
                sourceKey: 'UUID'
            },
            {
                model: Refund,
                as: 'refunds',
                required: false,
                foreignKey: 'UUID',
                sourceKey: 'UUID'
            }
        ];

        const { count, rows: orderList } = await Order.findAndCountAll({
            where: param,
            order: [['createDt', 'DESC']],
            limit,
            offset: (pageIndex - 1) * limit,
            distinct: true,
            include
        });

        const { processedOrders, noData } = await formatOrderList(orderList, uDep, uid);
        const finalList = processedOrders;

        const sumData = getSumData(finalList);

        ctx.body = {
            code: 200,
            msg: '查找成功',
            data: { rows: finalList, sumData, count, noData }
        };

    } catch (err) {
        console.error('订单查询接口异常：', err);
        ctx.body = {
            code: 201,
            msg: `查找失败：${err.message}`,
            data: err.stack || err
        };
    }
});

/**
 * 构建订单查询参数
 * @param {Object} params 查询参数对象
 * @param {string} params.uDep 用户部门
 * @param {string} params.uid 用户ID
 * @param {boolean} params.isSearch 是否为搜索模式
 * @param {string} params.tel 电话号码（客服专用）
 * @param {string} params.no 订单号
 * @param {string} params.start 开始时间
 * @param {string} params.end 结束时间
 * @param {Object} params.searchModel 搜索条件对象
 * @returns {Object} 返回构建好的查询参数
 */
function buildQueryParam({ uDep,uid,isSearch,start,end,searchModel }) {
    const param = {}; 
    // 客服部门查询逻辑
    if (uDep === '客服') {
        if (isSearch) {
            // 客服搜索：优先按电话查询，否则按创建者+其他条件
            if (searchModel.tel) {
                param.tel = searchModel.tel;  // 客服搜索：按电话查询
                return param;
            } else {
                param.creater = uid;
                if (searchModel.no) param.no = searchModel.no;
                if (searchModel.customer) param.customer = searchModel.customer;
                if (searchModel.status) param.status = searchModel.status;
                if (searchModel.remark) param.remark = { [Op.like]: `%${searchModel.remark}%` };
                if (searchModel.customersrc) param.customersrc = searchModel.customersrc;
                
            }
        } else {
            // 客服非搜索(默认)模式：只显示自己创建的订单
            param.creater = uid;
        }
    } else  { // 非客服部门查询逻辑
        if (isSearch) {
        // 非客服部门搜索：
        // 使用白名单机制过滤字段，防止关联表字段错误添加到主表查询
            const allowedFields = ['UUID','no','express', 'customer', 'tel','addr','wx','creater','hg', 'status', 'remark', 'customersrc', 'addtime','isdelivery'];// 允许的搜索字段
            for (const key in searchModel) {
                // goodname 在 OrderGood 表中处理，payMethod 在 PayRecord 表中处理
                if (key !== 'goodname' && allowedFields.includes(key)) {
                    param[key] = { [Op.like]: `%${searchModel[key]}%` };
                }
            }
        }else{
            // 非客服部门非搜索(默认)模式：

        }
    }

    // 添加时间范围条件
    if (start && end) {
        param.createDt = { [Op.between]: [start, end] };
    } 
    return param;
} 
 
orderRouter.post('/search', async (ctx, next) => {
    try {
        let req = ctx.request.body
        const { pageNum, pageSize, uid, uDep, searchModel } = req
        let result = null;
        let param = {}

        for (let key in searchModel) {
            param[key] = searchModel[key]
        }

        let end = moment().format("YYYY-MM-DD 23:59:59")
        console.log('Param:' + JSON.stringify(param))
        if (param.start && param.end) {
            console.log('1')
            param.createDt = { [Op.between]: [param.start, param.end] }
            delete param.start
            delete param.end
        }
        else {
            console.log('2')
            let setupKey = ''
            if (uDep === "客服") setupKey = "order_kf_sel_days"
            else if (uDep === "财务") setupKey = "order_cw_sel_days"
            else if (uDep === "售后") {
                setupKey = "order_sh_sel_days"
                param.uid = uid
            }
            let start = ''

            if (!setupKey) {
                start = moment().add(-Number(30), 'd').format("YYYY-MM-DD 00:00:00");
                param.createDt = { [Op.between]: [start, end] };
                console.log('3')
            } else {
                // 查询部门配置
                console.log('4')
                const selDays = await Setup.findOne({ where: { name: setupKey } });
                console.log('selDays:' + selDays);

                // 安全取值 + 转数字！！
                const days = selDays?.val ? Number(selDays.val) : 30;
                console.log('days:' + days);

                // ✅ 必须定义 start
                start = moment().add(-Number(days), 'd').format("YYYY-MM-DD 00:00:00");
                console.log('start:' + start);
                console.log('end:' + end);

                param.createDt = { [Op.between]: [start, end] };
            }
        }
        console.log('param:' + JSON.stringify(param))

        result = await Order.findAndCountAll({
            where: param,
            limit: pageSize,
            offset: pageNum == 1 ? 0 : (pageNum - 1) * pageSize,
            order: [
                ['createDt', 'DESC']
            ],
        })
        console.log('result:' + JSON.stringify(result))

        let orderNoData = []
        let rows = result.rows.map(item => item.toJSON()); //关键一行，转普通对象 
        for (let i = 0; i < rows.length; i++) {

            //console.log(i+":"+JSON.stringify(rows[i]))
            const row = rows[i]
            //获取商品信息
            const goods = await OrderGood.findAll({ where: { UUID: row.UUID } })
            //将商品信息拼接在一起
            //console.log('goods:'+JSON.stringify(goods))
            let goodStr = "";
            let sumQty = 0
            if (goods && goods.length > 0) {
                goods.forEach((item, index) => {
                    if (index !== 0) {
                        goodStr += ";";
                    }
                    goodStr += "品名:" + item.name
                    sumQty = Number(sumQty) + Number(item.qty)
                    if (item.spec && item.spec != "") {
                        goodStr += ";规格:" + item.spec
                    }
                    if (item.qty !== undefined && item.qty !== null && item.qty !== "") {
                        goodStr += ";数量:" + item.qty
                    }
                })
            }
            rows[i].good = goodStr;
            rows[i].qty = sumQty;
            //console.log('rows[i]:'+goodStr)
            //获取付款总额(打款金额)
            let orderPays = await PayRecord.findAll({ where: { UUID: row.UUID } })
            //console.log(i + ":" + JSON.stringify(orderPays))
            if (orderPays.length > 0) {
                rows[i].totalPayForAmount = orderPays.reduce((sum, item) => Number(sum) + Number(item.payAmount), 0);
            } else {
                rows[i].totalPayForAmount = 0
            }

            //console.log('goodStr:' + JSON.stringify(rows[i].good))
            //console.log('totalPayForAmount:' + JSON.stringify(rows[i].totalPayForAmount))
            //获取子单号
            let rst = await OrderNo.findAll({ where: { UUID: row.UUID } })
            orderNoData.push({
                UUID: row.UUID,
                nos: rst,
            })

            //console.log(i + "  " + JSON.stringify(rows[i]))
        }
        //const p = { rows: rows, count: result.count }
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '数据查找成功',
            data: {
                rows: rows,
                count: result.count,
                noData: orderNoData
            }
        }
    } catch (err) {
        console.log(err)
        ctx.body = {
            code: 201,
            msg: '数据查找失败' + err,
            data: err
        }
    }
})
//#endregion

orderRouter.get('/getall', async (ctx, next) => {
    try {
        let req = ctx.request.body
        console.log(req)
        let result = await Order.findAll({
            attributes: ['id', 'name']
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

orderRouter.get('/getlist', async (ctx, next) => {
    try {
        console.log('depList查找操作!')
        let req = ctx.request.body
        //console.log(req)

        let result = []

        let noData = await sequelize.query("SELECT DISTINCT no FROM dep", {
            type: QueryTypes.SELECT
        })
        console.log('noData:' + JSON.stringify(noData))

        for (let index = 0; index < noData.length; index++) {
            let param = {}
            let rst = await sequelize.query("SELECT id,no,name,addr FROM dep where no='" + noData[index].no + "'", {
                type: QueryTypes.SELECT
            })
            param.name = noData[index].no
            param.children = rst
            result.push(param)
        }
        console.log('result:' + JSON.stringify(result))

        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '查找成功',
            data: result,
        }
    } catch (err) {
        console.log('getlist:' + err)
        ctx.body = {
            code: 201,
            msg: '查找失败',
            data: err
        }
    }
})

//发货管理的查询   
orderRouter.post('/delivery_1', async (ctx, next) => {
    try {
        console.log('发货管理查询!!!')
        let req = ctx.request.body
        //const rstFind= await Setup.findOne({where:{name:'delivery_sel_days'}})//系统参数里设置的时长
        //let days=rstFind.val||3
        //console.log('days:'+JSON.stringify(days))
        const threeDayAgo = moment().add(-req.selDays, 'd').format("YYYY-MM-DD 00:00:00")
        const today = moment().format("YYYY-MM-DD 23:59:59")

        let pageIndex = req.pageNum
        let pageSize = req.pageSize
        let param = {}
        param.isdelivery = "能"
        param.createDt = { [Op.gte]: [threeDayAgo] }
        let result = await Order.findAndCountAll({
            where: param,
            limit: pageSize,
            order: [['createDt', 'DESC']],
            offset: pageIndex == 1 ? 0 : (pageIndex - 1) * pageSize
        })
        let orderNoData = []
        let rows = result.rows.map(item => item.toJSON()); //关键一行，转普通对象 
        for (let i = 0; i < rows.length; i++) {

            //console.log(i+":"+JSON.stringify(rows[i]))
            const row = rows[i]
            //获取商品信息
            const goods = await OrderGood.findAll({ where: { UUID: row.UUID } })
            //将商品信息拼接在一起
            let goodStr = "";
            let sumQty = 0
            let totalGoodAmount=0;
            if (goods && goods.length > 0) {
                // goods.forEach((item, index) => {
                //     let goodAmount=0
                //     if (index !== 0) {
                //         goodStr += ";";
                //     }
                //     goodStr += "品名:" + item.name
                //     sumQty = Number(sumQty) + Number(item.qty)
                //     if (item.spec && item.spec != "") {
                //         goodStr += ";规格:" + item.spec
                //     }
                //     if (item.qty !== undefined && item.qty !== null && item.qty !== "") {
                //         goodStr += ";数量:" + item.qty
                //     }
                //     //根据品名找出单价
                //     const findGood = await Good.findOne({ where: { name: item.name } });
                //     if(findGood&&item.qty){
                //         goodAmount=Number(item.qty) * Number(findGood.minprice || 0);
                //     }
                //     totalGoodAmount +=goodAmount
                // })

                for (const item of goods) {
                    let goodAmount = 0
                    if (goodStr) goodStr += ";"
                    goodStr += "品名:" + item.name
                    sumQty = Number(sumQty) + Number(item.qty)
                    if (item.spec && item.spec != "") {
                        goodStr += ";规格:" + item.spec
                    }
                    if (item.qty !== undefined && item.qty !== null && item.qty !== "") {
                        goodStr += ";数量:" + item.qty
                    }
                    // 这里可以正常使用await
                    const findGood = await Good.findOne({ where: { name: item.name } });
                    if(findGood&&item.qty){
                        goodAmount=Number(item.qty) * Number(findGood.minprice || 0);
                    }
                    totalGoodAmount += goodAmount
                    } 
            }
            row[i].totalGoodAmount=totalGoodAmount;
            rows[i].good = goodStr;
            rows[i].qty = sumQty
            //获取付款总额(打款金额)
            let orderPays = await PayRecord.findAll({ where: { UUID: row.UUID } })
            console.log(i + ":" + JSON.stringify(orderPays))
            if (orderPays.length > 0) {
                rows[i].totalPayForAmount = orderPays.reduce((sum, item) => Number(sum) + Number(item.payAmount), 0);
            } else {
                rows[i].totalPayForAmount = 0
            }
            row[i].addAmount= Number(row[i].addAmount) || 0;
            row[i].freight= Number(row[i].freight) || 0;
            row[i].offerAmount = Number(row[i].offerAmount)||0;
            row[i].totalAmount = Number(row[i].totalGoodAmount) + Number(row[i].freight) + Number(row[i].addAmount)- Number(row[i].offerAmount);
            console.log('goodStr:' + JSON.stringify(rows[i].good))
            //获取子单号
            let rst = await OrderNo.findAll({ where: { UUID: row.UUID } })
            orderNoData.push({
                UUID: row.UUID,
                nos: rst,
            })

            console.log(i + "  " + JSON.stringify(rows[i]))
        }
        await Log.create({
            operator: req.uid,
            createDt: moment().format('YYYY-MM-DD HH:mm:ss'),
            module: "发货管理",
            content: '数据显示'
        })
        const p = { rows: rows, count: result.count }
        //console.log(JSON.stringify(p)) 
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '查找成功',
            data: { data: p, nos: orderNoData }
        }
    } catch (err) {
        console.log('发货查询失败:' + err)
        ctx.body = {
            code: 201,
            msg: '查找失败',
            data: err
        }
    }
})
 
orderRouter.post('/orderdetail', async (ctx, next) => {
  try {
    console.log('订单详情查询!!!')
    const req = ctx.request.body || {}
    console.log('req' + JSON.stringify(req))
    const { UUID } = req

    if (!UUID) {
      ctx.body = {
        code: 201,
        msg: 'UUID不能为空',
        data: null
      }
      return next()
    }

    const [orderGoods, payRecords, order, refunds] = await Promise.all([
      OrderGood.findAll({ where: { UUID: UUID }, raw: true }),
      PayRecord.findAll({ where: { UUID: UUID }, raw: true }),
      Order.findOne({ where: { UUID: UUID }, raw: true }),
      Refund.findAll({ where: { UUID: UUID }, raw: true }),
    ]) 

    ctx.body = {
      code: 200,
      msg: '查找成功',
      data: {
        order,
        orderGoods,
        payRecords,
        refunds
      }
    }
  } catch (err) {
    console.log('订单详情查询err', err)
    ctx.body = {
      code: 201,
      msg: '查找失败',
      data: err && err.message ? err.message : err
    }
  }
})





orderRouter.post('/delivery', async (ctx, next) => {
  try {
    console.log('发货管理查询!!!')
    const req = ctx.request.body || {}
    console.log('req'+JSON.stringify(req))
    const {isdelivery,isSearch,status,no,customer,tel,start,end,pageNum,pageSize} = req
    const offset = (pageNum - 1) * pageSize 
    
    const param = { }
    
    if(!isSearch){
        param.isdelivery = "能"
        param.status = "未发货"
    }else{
        if (no !== "") {
            param.no = no
        }
        if (customer !== "") {
            param.customer = customer
        }
        if (tel !== "") {
            param.tel = tel
        }
        if(isdelivery!==""){
            param.isdelivery = isdelivery   
        }
        if(status!==""){
            param.status = status
        }   
    } 
    param.createDt = { [Op.between]: [start, end] }

    console.log('param'+JSON.stringify(param))

    const { count, rows: orderList } = await Order.findAndCountAll({
      where: param,
      limit: pageSize,
      offset,
      order: [['isdeliveryDt', 'DESC']],
      raw: true // 直接返回普通对象，省去 toJSON()
    })

    if (orderList.length === 0) {
      // 操作日志
      await Log.create({
        operator: req.uid || '',
        createDt: moment().format('YYYY-MM-DD HH:mm:ss'),
        module: "发货管理",
        content: '数据显示，无匹配订单'
      })
      ctx.body = {
        code: 200,
        msg: '查找成功',
        data: { data: { rows: [], count: 0 }, nos: [] }
      }
      return next()
    }

    // ========== 4. 批量预处理，一次性查所有关联数据（大幅提速） ==========
    // 提取当前页所有订单UUID
    const uuidList = orderList.map(item => item.UUID)

    // 并行一次性查询全部关联，避免循环await
    const [allOrderGoods, allPayRecords, allOrderNos, allGoods,allRefunds] = await Promise.all([
      OrderGood.findAll({ where: { UUID: uuidList }, raw: true }),
      PayRecord.findAll({ where: { UUID: uuidList }, raw: true }),
      OrderNo.findAll({ where: { UUID: uuidList }, raw: true }),
      Good.findAll({ raw: true }),
      Refund.findAll({ where: { UUID: uuidList } , raw: true })
    ])

    // 构建Map方便快速匹配（O(1)查询）
    // 1. 商品基础信息 key:商品名称
    const goodMap = new Map()
    allGoods.forEach(g => goodMap.set(g.name, Number(g.minprice || 0)))

    // 2. 订单商品分组 key:UUID
    const orderGoodMap = new Map()
    allOrderGoods.forEach(og => {
      if (!orderGoodMap.has(og.UUID)) orderGoodMap.set(og.UUID, [])
      orderGoodMap.get(og.UUID).push(og)
    })

    // 3. 付款记录分组 key:UUID
    const payMap = new Map()
    allPayRecords.forEach(p => {
      if (!payMap.has(p.UUID)) payMap.set(p.UUID, [])
      payMap.get(p.UUID).push(p)
    })

    // 4. 子单号分组 key:UUID
    const noMap = new Map()
    allOrderNos.forEach(n => {
      if (!noMap.has(n.UUID)) noMap.set(n.UUID, [])
      noMap.get(n.UUID).push(n)
    })

    //5. 退款记录分组
    const refundMap=new Map()
    allRefunds.forEach(n=>{
        if (!refundMap.has(n.UUID)) refundMap.set(n.UUID, [])
        refundMap.get(n.UUID).push(n)
    })

    // ========== 6. 遍历订单组装拓展字段（无循环内DB查询） ==========
    const orderNoData = []
    const resultRows = orderList.map(row => {
      const uuid = row.UUID
      const goods = orderGoodMap.get(uuid) || []
      let goodStr = ''
      let sumQty = 0
      let totalGoodAmount = 0

      goods.forEach((item, idx) => {
        if (idx > 0) goodStr += ';'
        goodStr += `品名:${item.name}`
        if (item.spec) goodStr += `;规格:${item.spec}`
        const qty = Number(item.qty || 0)
        sumQty += qty
        goodStr += `;数量:${qty}`

        // 计算单品金额
        const price = goodMap.get(item.name) || 0
        totalGoodAmount += qty * price
      })

      // 付款总额
      const pays = payMap.get(uuid) || []
      const totalPayForAmount = pays.reduce((sum, p) => sum + Number(p.payAmount || 0), 0)

       // 退款列表 + 退款总金额
      const refunds = refundMap.get(uuid) || []
      const refund = refunds.reduce((sum, r) => sum + Number(r.refundAmount || 0), 0)


      // 订单费用字段统一转数字兜底
      const addAmount = Number(row.addAmount || 0)
      const freight = Number(row.freight || 0)
      const offerAmount = Number(row.offerAmount || 0)
      const totalAmount = totalGoodAmount + freight + addAmount - offerAmount
      const noPayAmount = Number(totalAmount) - Number(totalPayForAmount);
      // 收集子单号数据
      orderNoData.push({
        UUID: uuid,
        nos: noMap.get(uuid) || []
      })

      // 合并拓展字段返回
      return {
        ...row, 
        good: goodStr,
        qty: sumQty,
        totalGoodAmount,
        totalPayForAmount,
        addAmount,
        freight,
        offerAmount,
        totalAmount,
        noPayAmount,
        refunds,              // 当前订单全部退款记录数组
        refund     // 当前订单退款总金额
      }
    })

    // 写入操作日志
    await Log.create({
      operator: req.uid || '',
      createDt: moment().format('YYYY-MM-DD HH:mm:ss'),
      module: "发货管理",
      content: `数据显示，查询到${resultRows.length}条订单`
    })

    // 返回结果
    ctx.body = {
      code: 200,
      msg: '查找成功',
      data: {
        data: { rows: resultRows, count },
        nos: orderNoData
      }
    }
  } catch (err) {
    console.error('发货查询失败:', err)
    // 异常日志记录
    await Log.create({
      operator: ctx.request.body?.uid || '',
      createDt: moment().format('YYYY-MM-DD HH:mm:ss'),
      module: "发货管理",
      content: `查询异常：${err.message}`
    }).catch(logErr => console.error('日志写入失败', logErr))

    ctx.body = {
      code: 201,
      msg: '查找失败：' + err.message,
      data: err.stack
    }
  }
})

//发货管理导入   
orderRouter.post('/deliveryImport', async (ctx, next) => {
    try {
        console.log('批量导入操作!')
        let req = ctx.request.body
        console.log(typeof req)
        console.log(JSON.stringify(req))
        let count = 0
        if (typeof req === 'string') req = JSON.parse(req);
        for (let item of req) {
            await Order.update(
                { no: item.no }, { where: { id: item.id } }
            )
            ++count
        }
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '批量导入操作成功！',
            data: count
        }
    } catch (error) {
        console.log(error)
        ctx.body = {
            code: 201,
            msg: '批量导入操作失败！',
            data: error
        }
    }
});


// 批量发货
orderRouter.post('/batch_delivery', async (ctx, next) => {
    try {
        const req = ctx.request.body;
        const { ids, updateData } = req;

        // 参数校验
        if (!Array.isArray(ids) || ids.length === 0) {
            ctx.status = 400;
            ctx.body = {
                code: 400,
                msg: '可发货订单不能为空',
                data: null
            };
            return;
        } 
        // 批量更新 id IN [1,2,3]
        const updateNum = await Order.update(updateData, {
            where: {
                id: ids
            }
        });

    
    // 写入操作日志
    await Log.create({
      operator: req.uid || '',
      createDt: moment().format('YYYY-MM-DD HH:mm:ss'),
      module: "发货管理",
      content: `批量发货，处理${updateNum[0]}条订单`
    })

    // 返回结果
    ctx.body = {
      code: 200,
      msg: `批量发货成功，成功处理${updateNum[0]}条数据`,
      data: updateNum[0]
    }
  } catch (err) {
    console.error('批量发货失败:', err)
    // 异常日志记录
    await Log.create({
      operator: req.uid || '',
      createDt: moment().format('YYYY-MM-DD HH:mm:ss'),
      module: "发货管理",
      content: `查询异常：${err.message}`
    }).catch(logErr => console.error('日志写入失败', logErr))

    ctx.body = {
      code: 201,
      msg: '批量发货失败：' + err.message,
      data: err.stack
    }
  }
})


//售后查询 默认
orderRouter.post('/sh_pagelist', async (ctx, next) => {
    try {
        console.log('售后查询--默认查询!')
        let req = ctx.request.body
        const start = moment().add(-90, 'd').format("YYYYMMDD")
        const end = moment().format("YYYY-MM-DD")
        let pageIndex = req.pageNum
        let pageSize = req.pageSize
        let param = {}
        param.createDt = { [Op.gte]: [start] }
        let result = await Order.findAndCountAll({
            where: param,
            limit: pageSize,
            offset: pageIndex == 1 ? 0 : (pageIndex - 1) * pageSize,
            order: [['createDt', 'DESC']]
        })
        console.log(result)
        Log.create({
            operator: req.uid,
            createDt: moment().format('YYYY-MM-DD HH:mm:ss'),
            module: "售后查询",
            content: '数据显示'
        })
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '查找成功',
            data: result,
        }
    } catch (err) {
        console.log('发货查询失败:' + err)
        ctx.body = {
            code: 201,
            msg: '查找失败',
            data: err
        }
    }
})


orderRouter.post('/sh_searchV', async (ctx, next) => {
    try {
        console.log('售后查询:')
        let req = ctx.request.body
        console.log(req)
        //获取最大查询天数
        let setup=await Setup.findOne({where:{name:'sh_sel_days'}})
        let days=setup?.val || 15
        let pageIndex = req.pageNum || 1
        let pageSize = req.pageSize || 10
 
        //支付记录筛选条件
        const paramPayRecord = {}
        if (req.start && req.end) {
            paramPayRecord.createDt = { [Op.between]: [req.start, req.end] }
        }else{
            let start=moment().subtract(days, 'days').format('YYYY-MM-DD 00:00:00');
            let end=moment().format('YYYY-MM-DD 23:59:59')
              paramPayRecord.createDt = { [Op.between]: [start,end] }
        }
        let param={}
        if(req.searchModel){
              for (let key in req.searchModel) {
                    const val = req.searchModel[key];   
                    param[key] = val;
                } 
            //delete param.payNo
        }
        if(param.payNo){
            paramPayRecord.payNo={ [Op.like]: `%${param.payNo}%` }
            delete param.payNo
        }
        if(param.payMethod){
            paramPayRecord.payMethod=param.payMethod
            delete param.payMethod
        }
        let payReconds = await PayRecord.findAll({
            where: paramPayRecord,
            order: [['createDt', 'DESC']],
        })

        // 收集所有 UUID
        const uuidSet = new Set()
        payReconds.forEach(p => p.UUID && uuidSet.add(p.UUID))
        const uuids = Array.from(uuidSet)

        // 批量预取相关数据
        let orderMap = new Map()
        let orderGoodsGroup = new Map()
        let goodMap = new Map()
        let paySumByUUID = new Map()
        let refundSumByUUID = new Map()

        if (uuids.length > 0) {
            const [orders, allOrderGoods, allGoods, allPayRecords, allRefunds] = await Promise.all([
                Order.findAll({ where: { UUID: { [Op.in]: uuids } } }),
                OrderGood.findAll({ where: { UUID: { [Op.in]: uuids } } }),
                Good.findAll({ attributes: ['no', 'name', 'minprice'] }),
                PayRecord.findAll({ where: { UUID: { [Op.in]: uuids } } }),
                Refund.findAll({ where: { UUID: { [Op.in]: uuids } } }),
            ])

            orders.forEach(o => orderMap.set(o.UUID, o))

            allOrderGoods.forEach(og => {
                if (!orderGoodsGroup.has(og.UUID)) orderGoodsGroup.set(og.UUID, [])
                orderGoodsGroup.get(og.UUID).push(og)
            })

            allGoods.forEach(g => goodMap.set(g.no, { name: g.name, minprice: Number(g.minprice || 0) }))

            allPayRecords.forEach(p => {
                const sum = paySumByUUID.get(p.UUID) || 0
                paySumByUUID.set(p.UUID, sum + Number(p.payAmount || 0))
            })

            allRefunds.forEach(r => {
                const sum = refundSumByUUID.get(r.UUID) || 0
                refundSumByUUID.set(r.UUID, sum + Number(r.amount || 0))
            })
        }

        const processedDatas = payReconds.map((item) => {
            const payRow = item.toJSON()
            const order = orderMap.get(payRow.UUID)
            if (!order) return null

            let row = order.toJSON()

            const goods = orderGoodsGroup.get(row.UUID) || []
            let goodStr = ''
            let sumQty = 0
            let totalGoodAmount = 0

            goods.forEach((good, i) => {
                if (i !== 0) goodStr += ';';
                goodStr += `品名:${good.name}`;
                if (good.spec) {
                    goodStr += `;规格:${good.spec}`;
                }
                const findGood = goodMap.get(good.no)
                const qty = Number(good.qty || 0)
                if (qty && findGood) {
                    goodStr += `;数量:${qty}`;
                    sumQty += qty;
                    totalGoodAmount += qty * findGood.minprice;
                }
            })

            row.totalGoodAmount = totalGoodAmount;
            row.good = goodStr;
            row.qty = sumQty;

            row.addAmount = Number(row.addAmount) || 0;
            row.freight = Number(row.freight) || 0;
            row.offerAmount = Number(row.offerAmount) || 0;

            row.totalAmount = Number(row.totalGoodAmount) + Number(row.freight) + Number(row.addAmount) - Number(row.offerAmount);

            row.totalPayForAmount = paySumByUUID.get(row.UUID) || 0;

            row.noPayAmount = Number(row.totalAmount) - Number(row.totalPayForAmount);

            row.refund = refundSumByUUID.get(row.UUID) || 0;

            return row;
        })  
        //console.log('processedDatas:'+JSON.stringify(processedDatas))
        //console.log('param:'+JSON.stringify(param))
       //动态筛选
       const filteredList=filterList(processedDatas,param) 
       //数组分页
       const {rows,count}=paginateArray(filteredList,pageIndex,pageSize)
        //分页完成后，统一手机号脱敏
       const finalRows = rows
            .filter(item =>item)
            .map(item => { 
                return {
                ...item,
                tel: phoneDesensitize(item.tel || '')
                };
        });
         
        
        // 记录日志
        await Log.create({
            operator: req.uid || '',
            createDt: moment().format('YYYY-MM-DD HH:mm:ss'),
            module: '售后查询',
            content: '查找'
        })
        ctx.status = 200;
        ctx.body = {
            code: 200,
            msg: '查找成功',
            data: {
                rows: finalRows,
                count: count, 
            }
        };
       } catch (err) {
        console.error('售后服务查询接口异常：', err);
        ctx.body = {
            code: 201,
            msg: `查找失败：${err.message}`,
            data: err.stack || err
        };
    }
});

// ==============================================
// 订单奖励接口
// ==============================================
orderRouter.post('/reward', async (ctx, next) => {
  try {
    console.log('订单奖励计算查询!')
    const req = ctx.request.body
    const { start, end, pageNum, pageSize } = req

    // 时间范围
    let param = {
      createDt: { [Op.between]: [start, end] }
    }
    if(req.creater){
        param.creater="JH31"
    } 

    // 1. 分页查询订单
    const { count, rows } = await Order.findAndCountAll({
      where: param,
      limit: pageSize,
      offset: pageNum == 1 ? 0 : (pageNum - 1) * pageSize,
      order: [['createDt', 'DESC']]
    })
    console.log('rows:'+JSON.stringify(rows))

    if (!rows || rows.length === 0) {
      ctx.body = { code: 200, msg: '查找成功', data: { rows: [], count: 0 } }
      return
    }

    // 2. 批量查询（一次性查完，性能大幅提升）
    const uuidList = rows.map(item => item.UUID)
    const orderGoods = await OrderGood.findAll({ where: { UUID: uuidList } })

    // 3. 处理订单
    let newRst = []
    for (let [index,item] of rows.entries()) {
      console.log(index,"-------:"+JSON.stringify(item))
      const UUID = item.UUID
      let rewardMoney = 0
      let rewardType = ''
      let goodName = ''
      let totalAmount = 0

      try {
        // 筛选主商品
        const mainGoods = orderGoods.filter(g => g.UUID === UUID && g.isMain === '是')

        // 主商品 !=1 → 手动处理
        if (mainGoods.length !== 1) {
          rewardMoney = '手动处理'
          goodName = mainGoods.map(g => g.name).join(',')
        }
        else {
          const mainGood = mainGoods[0]
          goodName = mainGood.name
          console.log('mainGood:'+JSON.stringify(mainGood))
          // 查询商品配置
          const findGood = await Good.findOne({ where: { no: mainGood.no } })
          if (!findGood) throw new Error('商品不存在')
          console.log('findGood:'+JSON.stringify(findGood))

          const goodAmount = Number(mainGood.qty) * Number(findGood.minprice || 0)
          const minRewardAmount = Number(mainGood.qty) * Number(findGood.rewardParam || 0)

          // 实收总金额
          totalAmount = Number(goodAmount)
            + Number(item.freight || 0)
            + Number(item.addAmount || 0)
            - Number(item.offerAmount || 0)

          rewardType = findGood.rewardType

          // ✅ 调用抽离的奖励方法    ***********需要认证一下
          rewardMoney = calculateRewardMoney(
            findGood.rewardType,
            findGood.rewardMoney,
            mainGood.qty,
            totalAmount,
            minRewardAmount,
            item
          )
        }

        // 组装返回
        newRst.push({
          no: item.no,
          customer: item.customer,
          tel: phoneDesensitize(item.tel||''),
          addr: item.addr,
          good: goodName,
          totalAmount: totalAmount,
          createDt: item.createDt,
          creater: item.creater,
          rewardType: rewardType,
          rewardMoney: rewardMoney
        })

      } catch (e) {
        console.log('单条订单异常 UUID=' + UUID, e)
        continue
      }
      console.log("*******************")
    }

    // 返回结果
    ctx.body = {
      code: 200,
      msg: '查找成功',
      data: { rows: newRst, count }
    }

  } catch (err) {
    console.error('订单奖励接口异常', err)
    ctx.body = {
      code: 201,
      msg: '查找失败',
      data: err.message || '服务异常'
    }
  }
})

//奖励方法
// ==============================================
// 抽离：统一奖励计算方法（直接复制到你的代码里）
// ==============================================
function calculateRewardMoney(rewardType,rewardMoney,qty,totalAmount, minTotalAmount, item  ) {
  // 默认奖励为 0
  let rewardMoneyResult = 0

  // 1. 满足指定金额 按数量奖励
  if (rewardType === '满足指定金额按数量奖励') {
    console.log('1')
    
      console.log('minTotalAmount:'+JSON.stringify(minTotalAmount))
        console.log('rewardMoney * qty:'+JSON.stringify(rewardMoney * qty))
          console.log('totalAmount:'+JSON.stringify(totalAmount))
    rewardMoneyResult = totalAmount >= minTotalAmount ? rewardMoney * qty : 0 
    console.log('totalAmount:'+JSON.stringify(totalAmount))
    console.log('rewardMoneyResult:'+JSON.stringify(rewardMoneyResult))
 }
  // 2. 满足指定金额 不按数量 / 按订单奖励(不按数量)
  else if (rewardType === "满足指定金额不按数量奖励" || rewardType ===  '满足指定金额按订单奖励--不按数量') {
    console.log('2')
    rewardMoneyResult = totalAmount >= minTotalAmount ? rewardMoney : 0
  }

  // 3. 满足指定金额 首次购买 不按数量奖励
  else if (rewardType === '满足指定金额首次购买不按数量奖励') {
    if (item.hg === '首次购买' && totalAmount >= minTotalAmount) {
        console.log('3')
        rewardMoneyResult = rewardMoney
    }
  }

  // 4. 满足指金额 按订单限制时间奖励（20天内）
//   else if (rewardType === '满足指金额按订单限制时间奖励') {
//     const firstOrder = firstOrderMap[tel]
//     if (firstOrder) {
//       const days = moment().diff(moment(firstOrder.createDt), 'days') + 1
//       if (days <= 20 && totalAmount >= minTotalAmount) {
//         rewardMoneyResult = rewardMoney
//       }
//     }
//   }

  return rewardMoneyResult
}

//员工业绩
orderRouter.post('/analyze_1_1',  async (ctx, next) => {
    try {
        console.log('员工业绩!')
        let req = ctx.request.body
        console.log(req)
        const {
            start,
            end,
        } = req
        let pageNum = req.pageNum
        let pageSize = req.pageSize

        const str = "SELECT sum(totalAmount) sumAmount, count(*) count, creater  from order_base where  createDt BETWEEN '" + start + "' and '" + end + "'  GROUP BY creater order by creater desc";
        console.log('str:' + str)
        let result = await sequelize.query(str, {
            type: QueryTypes.SELECT
        })
        console.log('result:' + JSON.stringify(result))
        // result.sort((a, b) => b.sumAmount - a.sumAmount)
        // const startIndex = pageNum == 1 ? 0 : (pageNum - 1) * pageSize
        // const endIndex = startIndex + pageSize
        // let rst = {}
        // if (result.length > 0) {
        //     rst.count = result.length
        //     rst.rows = result.splice(startIndex, endIndex)
        // } else {
        //     rst = {
        //         count: 0,
        //         rows: null,
        //     }
        // }

       // console.log('rst:' + JSON.stringify(rst))
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '查找成功',
            data: result,
        }
    } catch (err) {
        console.log('员工业绩查询失败:' + err)
        ctx.body = {
            code: 201,
            msg: '查找失败'+err.message,
            data: err
        }
    }
})


orderRouter.post('/analyze_1', async (ctx, next) => {
    try {
        console.log('员工业绩!')
        let req = ctx.request.body
        console.log(req)
        const {
            start,
            end,
        } = req
        let pageNum = req.pageNum
        let pageSize = req.pageSize
        let param = {
            createDt: {
                [Op.between]: [start, end]
            }
        }
        const orderList = await Order.findAll({
            where: param,
            //limit: pageSize,
            //offset: pageNum == 1 ? 0 : (pageNum - 1) * pageSize,
        })

        const goodList = await Good.findAll({
            attributes: ['name', 'minprice']
        })
        const goodMap = new Map()
        goodList.forEach(g => {
            goodMap.set(g.name, Number(g.minprice || 0))
        })

        const detailedList = await Promise.all(orderList.map(async row => {
            const rowUUID = row.UUID
            const goods = await OrderGood.findAll({
                where: {
                    UUID: rowUUID
                }
            })

            let sumQty = 0
            let totalGoodAmount = 0
            goods.forEach(item => {
                const qty = Number(item.qty || 0)
                sumQty += qty
                const price = goodMap.get(item.name) || 0
                totalGoodAmount += qty * price
            })

            const addAmount = Number(row.addAmount || 0)
            const freight = Number(row.freight || 0)
            const offerAmount = Number(row.offerAmount || 0)
            const totalAmount = totalGoodAmount + freight + addAmount - offerAmount

            return {
                ...row.dataValues,
                totalGoodAmount,
                totalAmount,
                sumQty,
            }
        }))

        const groupMap = new Map()
        detailedList.forEach(item => {
            const key = item.creater || ''
            if (!groupMap.has(key)) {
                groupMap.set(key, {
                    creater: key,
                    orderCount: 0,
                    totalAmount: 0,
                })
            }
            const g = groupMap.get(key)
            g.orderCount += 1
            g.totalAmount += Number(item.totalAmount || 0)
        })

        const result = Array.from(groupMap.values()).sort((a, b) => b.totalAmount - a.totalAmount)

        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '查找成功',
            data: result,
        }
    } catch (err) {
        console.log('员工业绩查询失败:' + err)
        ctx.body = {
            code: 201,
            msg: '查找失败' + err.message,
            data: err
        }
    }
})
 

//回购分析
orderRouter.post('/analyze_2', async (ctx, next) => {
    try {
        console.log('回购分析!')
        let req = ctx.request.body
        console.log(req)
        const {
            start,
            end,
        } = req
        let pageNum = req.pageNum
        let pageSize = req.pageSize
        let param = {
            createDt: {
                [Op.between]: [start, end]
            },
            hg: {[Op.ne]:["首次购买"]}
        }
        const orderList = await Order.findAll({
            where: param,
            //limit: pageSize,
            //offset: pageNum == 1 ? 0 : (pageNum - 1) * pageSize,
        })

        const goodList = await Good.findAll({
            attributes: ['name', 'minprice']
        })
        const goodMap = new Map()
        goodList.forEach(g => {
            goodMap.set(g.name, Number(g.minprice || 0))
        })

        const detailedList = await Promise.all(orderList.map(async row => {
            const rowUUID = row.UUID
            const goods = await OrderGood.findAll({
                where: {
                    UUID: rowUUID
                }
            })

            let sumQty = 0
            let totalGoodAmount = 0
            goods.forEach(item => {
                const qty = Number(item.qty || 0)
                sumQty += qty
                const price = goodMap.get(item.name) || 0
                totalGoodAmount += qty * price
            })

            const addAmount = Number(row.addAmount || 0)
            const freight = Number(row.freight || 0)
            const offerAmount = Number(row.offerAmount || 0)
            const totalAmount = totalGoodAmount + freight + addAmount - offerAmount

            return {
                ...row.dataValues,
                totalGoodAmount,
                totalAmount,
                sumQty,
            }
        }))

        const groupMap = new Map()
        detailedList.forEach(item => {
            const key = item.creater || ''
            if (!groupMap.has(key)) {
                groupMap.set(key, {
                    creater: key,
                    orderCount: 0,
                    totalAmount: 0,
                })
            }
            const g = groupMap.get(key)
            g.orderCount += 1
            g.totalAmount += Number(item.totalAmount || 0)
        })

        const result = Array.from(groupMap.values()).sort((a, b) => b.totalAmount - a.totalAmount)

        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '查找成功',
            data: result,
        }
    } catch (err) {
        console.log('员工业绩查询失败:' + err)
        ctx.body = {
            code: 201,
            msg: '查找失败' + err.message,
            data: err
        }
    }
})

orderRouter.post('/dashboard', async (ctx, next) => {
    try {
        let req = ctx.request.body
        console.log(req)
        const {
            uDep,
            uid,
        } = req
        let today = moment().format("YYYY-MM-DD")

        let todayStart = today + " 00:00:00"
        let todayEnd = today + " 23:59:59"
        let firstDayOfMonth = moment().startOf('month')
        let monthStart = firstDayOfMonth.format("YYYY-MM-DD") + " 00:00:00"
        let endDayOfMonth = moment().endOf('month')
        let monthEnd = endDayOfMonth.format("YYYY-MM-DD" + " 23:59:59")
        let startOfWeek = moment().startOf('week')
        let weekStart = startOfWeek.format("YYYY-MM-DD") + " 00:00:00"
        let endOfWeek = moment().endOf('week')
        let weekEnd = endOfWeek.format("YYYY-MM-DD" + " 23:59:59")
        //今天所有总金额 --------今日成交
        let str = "select sum(totalAmount) sumAmount, count(*) count, creater,uid from order_base where createDt BETWEEN '" + todayStart
            + "' and '" + todayEnd + "'  GROUP BY creater,uid "
        //console.log('str:' + str)
        let todayResult = await sequelize.query(str, { type: QueryTypes.SELECT })

        str = "select sum(totalAmount) sumAmount, count(*) count, creater,uid from order_base where createDt BETWEEN '" + monthStart
            + "' and '" + monthEnd + "'  GROUP BY creater,uid "
        //console.log('str:' + str)
        let monthResult = await sequelize.query(str, { type: QueryTypes.SELECT })

        str = "select sum(totalAmount) sumAmount, count(*) count, creater,uid from order_base where createDt BETWEEN '" + weekStart
            + "' and '" + weekEnd + "'  GROUP BY creater,uid "
        //console.log('str:' + str)
        let weekResult = await sequelize.query(str, { type: QueryTypes.SELECT })

        //今日回购总汇
        str = "SELECT sum(totalAmount) sumAmount, count(*) count  from order_base where hg like '%回购%' and createDt BETWEEN '" + todayStart
            + "' and '" + todayEnd + "'";
        let todayHgResult = await sequelize.query(str, { type: QueryTypes.SELECT })

        //本月回购总汇
        str = "SELECT sum(totalAmount) sumAmount, count(*) count  from order_base where hg like '%回购%' and createDt BETWEEN '" + monthStart
            + "' and '" + monthEnd + "'";
        let monthHgResult = await sequelize.query(str, { type: QueryTypes.SELECT })

        let start=moment().subtract(7, 'days').format('YYYY-MM-DD 00:00:00');
        let end =moment().format('YYYY-MM-DD 23:59:59')
        //最近七天各商品销售情况
        str = "select name,sum(qty) sumQty,sum(amount) sumAmount from  (select order_good.*,good.minprice, minprice*qty as amount from order_good LEFT JOIN good on order_good.no=good.no WHERE UUID in (select UUID from  order_base where createDt BETWEEN '" + start + "' and '" + end + "')) b GROUP BY name ORDER BY sum(amount) desc,sum(qty) desc"

        let weekGoodResult = await sequelize.query(str, { type: QueryTypes.SELECT })
        //console.log('最近七天各商品销售情况Sql:'+str)
        //上一个周期各商品销售情况
        start = moment().subtract(14, 'days').format('YYYY-MM-DD 00:00:00"');
        end = moment().subtract(7, 'days').format('YYYY-MM-DD 23:59:59');
         
        str = "select name,sum(qty) sumQty,sum(amount) sumAmount from  (select order_good.*,good.minprice, minprice*qty as amount from order_good LEFT JOIN good on order_good.no=good.no WHERE UUID in (select UUID from  order_base where createDt BETWEEN '" + start + "' and '" + end + "')) b GROUP BY name ORDER BY sum(amount) desc,sum(qty) desc"
        //console.log('上一个周期各商品销售情况Sql:'+str)
        let beforeWeekGoodResult = await sequelize.query(str, { type: QueryTypes.SELECT })


        //今日销售排行榜
        start=moment().format('YYYY-MM-DD 00:00:00');
        end =moment().format('YYYY-MM-DD 23:59:59')

        str =" select creater,sum(amount) amount from "
        str +="(select order_base.creater,A.* from "
        str +="(select order_good.UUID,order_good.name,good.minprice, minprice*qty as amount from order_good LEFT JOIN good on order_good.no=good.no WHERE UUID in (select UUID from  order_base where createDt BETWEEN '"+start+"' and '"+end+"')) "
        str +=" A LEFT JOIN order_base on A.UUID=order_base.UUID)B  GROUP BY creater ORDER by amount desc "
        
        let todaySaleTop10 = await sequelize.query(str, { type: QueryTypes.SELECT })

         //本周销售排行榜
        start= moment().startOf('isoWeek').format('YYYY-MM-DD 00:00:00');
        end = moment().endOf('isoWeek').format('YYYY-MM-DD 23:59:59');
        str =" select creater,sum(amount) amount from "
        str +="(select order_base.creater,A.* from "
        str +="(select order_good.UUID,order_good.name,good.minprice, minprice*qty as amount from order_good LEFT JOIN good on order_good.no=good.no WHERE UUID in (select UUID from  order_base where createDt BETWEEN '"+start+"' and '"+end+"')) "
        str +=" A LEFT JOIN order_base on A.UUID=order_base.UUID)B  GROUP BY creater ORDER by amount desc "
        
        let weekSaleTop10 = await sequelize.query(str, { type: QueryTypes.SELECT })


        //本月销售排行榜
        start= moment().startOf('month').format('YYYY-MM-DD 00:00:00');
        end =moment().endOf('month').format('YYYY-MM-DD 23:59:59');

        str =" select creater,sum(amount) amount from "
        str +="(select order_base.creater,A.* from "
        str +="(select order_good.UUID,order_good.name,good.minprice, minprice*qty as amount from order_good LEFT JOIN good on order_good.no=good.no WHERE UUID in (select UUID from  order_base where createDt BETWEEN '"+start+"' and '"+end+"')) "
        str +=" A LEFT JOIN order_base on A.UUID=order_base.UUID)B  GROUP BY creater ORDER by amount desc "
        
        let monthSaleTop10 = await sequelize.query(str, { type: QueryTypes.SELECT })

    

        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '首页数据查找成功!!!',
            data: {
                todayResult: todayResult,
                monthResult: monthResult,
                weekResult: weekResult,
                todayHgResult: todayHgResult,
                monthHgResult: monthHgResult,
                weekGoodResult: weekGoodResult,
                beforeWeekGoodResult: beforeWeekGoodResult,
                todaySaleTop10: getSaleRankList(todaySaleTop10, uid),
                weekSaleTop10:  getSaleRankList(weekSaleTop10, uid),
                monthSaleTop10: getSaleRankList(monthSaleTop10, uid),
            },
        }
    } catch (err) {
        console.log('首页数据:' + err)
        ctx.body = {
            code: 201,
            msg: '查找失败'+err,
            data: err
        }
    }
})
 
 
/**
 * 订单列表格式化处理
 * @param {Array} orderList 订单源数据
 * @returns {Promise<{processedOrders: [], noData: []}>}
 */
async function formatOrderList(orderList,uDep,uid) {
  const noData = [];

  const processedOrders = orderList.map((item) => {
    const row = item.toJSON();
    const rowUUID = row.UUID;

    // 处理订单商品（从已 JOIN 的数据中获取，使用关联别名 goods）
    const goods = row.goods || [];
    let goodStr = '';
    let sumQty = 0;
    let totalGoodAmount = 0;

    for (let i = 0; i < goods.length; i++) {
      const good = goods[i];
      if (i !== 0) goodStr += ';';
      goodStr += `品名:${good.name}`;

      if (good.spec) {
        goodStr += `;规格:${good.spec}`;
      }

      const findGood = good.goodInfo;
      if (good.qty && findGood) {
        goodStr += `;数量:${good.qty}`;
        sumQty += Number(good.qty);
        totalGoodAmount += Number(good.qty) * Number(findGood.minprice || 0);
      }
    }

    row.totalGoodAmount = totalGoodAmount;
    row.good = goodStr;
    row.qty = sumQty;

    row.addAmount= Number(row.addAmount) || 0;
    row.freight= Number(row.freight) || 0;
    row.offerAmount = Number(row.offerAmount)||0;
    row.addAmount = Number(row.addAmount)||0;  //增值金额

    // 计算总金额
    row.totalAmount = Number((Number(row.totalGoodAmount) + Number(row.freight) + Number(row.addAmount) - Number(row.offerAmount)).toFixed(2));

    // 已付款总额（从已 JOIN 的数据中获取，使用关联别名 pays）
    const orderPays = row.pays || [];
    row.totalPayForAmount = Number(orderPays.reduce(
      (sum, pay) => sum + Number(pay.payAmount),
      0
    ).toFixed(2));

    // 未付总额
    row.noPayAmount = Number((Number(row.totalAmount) - Number(row.totalPayForAmount)).toFixed(2));
      
    //-----------隐藏关键信息-----------
    if(uDep==='客服'&&uid!==row.creater){ 
      row.totalAmount='******'
      row.totalPayForAmount='******'
      row.noPayAmount='******'
    }

    // 子单号数据（从已 JOIN 的数据中获取，使用默认属性名）
    const orderNos = row.orderNos || [];
    noData.push({ UUID: rowUUID, nos: orderNos });

    // 退款金额（从已 JOIN 的数据中获取，使用默认属性名）
    const refunds = row.refunds || [];
    row.refund = refunds.reduce(
        (sum, pay) => sum + Number(pay.amount),
        0
    );

    // 清理关联数据，避免返回给前端
    delete row.goods;
    delete row.pays;
    delete row.orderNos;
    delete row.refunds;

    return row;
  });

  // 统一返回多个结果
  return {
    processedOrders,
    noData
  };
} 
/**
 * 动态筛选数组
 * @param {Array} list 原始数组
 * @param {Object} filters 筛选条件 {name: '张三', payNo: '123', status: 1}
 * @returns 筛选后的数组
 */
function filterList(list, filterObj) {
  // 1. 如果 list 是空/null，直接返回空数组，防止崩溃
  if (!Array.isArray(list)) return [];

  return list.filter(item => {
    // 2. 核心修复：如果 item 是 null/undefined，直接过滤掉
    if (!item) return false;

    // 遍历所有筛选字段
    //console.log('item:' + (item.tel || ''))
    //console.log('filterObj:' + JSON.stringify(filterObj))

    return Object.keys(filterObj).every(key => {
      const val = filterObj[key]
      // 空字符串/undefined/null 不参与筛选
      if (val === '' || val === undefined || val === null) return true

      // 3. 安全读取 item[key]，不存在就返回不匹配
      const itemVal = item[key];
      if (itemVal === undefined || itemVal === null) return false;

      // 模糊匹配（字符串包含）
      if (typeof itemVal === 'string') {
        return itemVal.includes(val)
      }
      // 数字精准匹配
      return itemVal === val
    })
  })
}

function getSaleRankList(saleData, currentUid) {
  // 1. 真实排序
  const sortedList = [...saleData].sort((a, b) => b.amount - a.amount);
  const selfIndex = sortedList.findIndex(item => item.creater === currentUid);
  const result = [];

  // 生成固定 10 行
  for (let i = 0; i < 10; i++) {
    const realRank = i + 1;
    const item = sortedList[i];
    
    // ==============================================
    // 核心逻辑：用户不在榜单 → 全部显示真实数据
    // ==============================================
    if (selfIndex === -1) {
      if (item) {
        result.push({ rank: realRank, creater: item.creater, amount: item.amount });
      } else {
        result.push({ rank: realRank, creater: "", amount: "" });
      }
    } 
    // ==============================================
    // 核心逻辑：用户在榜单 → 只显示 上一名 + 自己
    // ==============================================
    else {
      const prevIndex = selfIndex > 0 ? selfIndex - 1 : -1;

      // 只显示：上一名 或 自己
      if (i === selfIndex || i === prevIndex) {
        result.push({
          rank: realRank,
          creater: item?.creater || "",
          amount: item?.amount || ""
        });
      } 
      // 其他全部打码
      else {
        result.push({
          rank: realRank,
          creater: "****",
          amount: "****"
        });
      }
    }
  }

  return result;
}

async function searchCount(uid, uDep) {
  const today = moment().format("YYYY-MM-DD");
  // 1. 查询今日搜索次数
  const searchCount = await OrderSearchCount.findOne({
    where: {
      uid: uid,
      //uDep: uDep,
      searchDt: today
    }
  });

  // 2. 查询配置 
  const setup = await Setup.findAll();

  // 3. 根据部门获取每日最大可查询次数
  let setCount = 100; // 默认值
  switch (uDep) {
    case "客服":
      setCount = setup.find(item => item.name === "order_kf_sel_everyday")?.val || 5;
      break;
    case "财务":
      setCount = setup.find(item => item.name === "order_cw_sel_everyday")?.val || 10;
      break;
    case "售后":
      setCount = setup.find(item => item.name === "order_sh_sel_everyday")?.val || 10;
      break;
    default:
      setCount = 100;
  }

 // 3. 如果已有记录，判断是否超限
  if (searchCount) {
    if (Number(searchCount.count) >= Number(setCount)) {
      return false; // 超限了，不让查
    }
    // 没超限 → count +1 并保存
    await searchCount.update({
      count: Number(searchCount.count) + 1
    });
  } 
  // 4. 没有记录 → 创建一条，count=1
  else {
    await OrderSearchCount.create({
      uid: uid,
      //uDep: uDep,
      searchDt: today,
      count: 1
    });
  }

  // 5. 允许查询
  return true;
}

/**
 * 数组分页
 * @param {Array} array 要分页的数组
 * @param {Number} pageNum 当前页码，默认 1
 * @param {Number} pageSize 每页条数，默认 10
 * @returns {Object} { rows: 当前页数据, count: 总条数 }
 */
function paginateArray(array, pageNum = 1, pageSize = 10) {
  const startIndex = (pageNum - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  return {
    rows: array.slice(startIndex, endIndex), // 当前页数据
    count: array.length,                     // 总条数
  };
}

// 统一电话脱敏
// function phoneDesensitize(phone) {
//   if (!phone) return ''
//   phone = String(phone).replace(/\s-/g, '')
  
//   // 11位手机号
//   if (/^1\d{10}$/.test(phone)) {
//     return phone.slice(0,3) + '****' + phone.slice(7)
//   }
//   // 普通座机
//   if (phone.length >= 7) {
//     return phone.slice(0,2) + '****' + phone.slice(-2)
//   }
//   return phone
// }

function getSumData(arr) {
  const sumData = {};
  sumData.totalAmount = Number(arr.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0).toFixed(2));
  sumData.freight = Number(arr.reduce((sum, item) => sum + (Number(item.freight) || 0), 0).toFixed(2));
  sumData.offerAmount = Number(arr.reduce((sum, item) => sum + (Number(item.offerAmount) || 0), 0).toFixed(2));
  sumData.dsAmount = Number(arr.reduce((sum, item) => sum + (Number(item.dsAmount) || 0), 0).toFixed(2));
  sumData.totalPayForAmount = Number(arr.reduce((sum, item) => sum + (Number(item.totalPayForAmount) || 0), 0).toFixed(2));
  sumData.noPayAmount = Number(arr.reduce((sum, item) => sum + (Number(item.noPayAmount) || 0), 0).toFixed(2));
  sumData.refund = Number(arr.reduce((sum, item) => sum + (Number(item.refund) || 0), 0).toFixed(2));
  sumData.addAmount = Number(arr.reduce((sum, item) => sum + (Number(item.addAmount) || 0), 0).toFixed(2));
  return sumData;
}

module.exports = {
    orderRouter
}
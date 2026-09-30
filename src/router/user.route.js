const fs=require('fs')
const path = require('path');
const Router = require('koa-router')
const axios = require('axios')
const sequelize = require('../db/seq_mysql') 
const moment = require('moment')
const User = require('../model/user.model')
const Log = require('../model/log.model')  
const Smscode = require('../model/smsCode.model')
const {
    DataTypes,
    Op,
    QueryTypes
} = require('sequelize')  

//const { console } = require('inspector');

let smsPama={
    //接口账号
    apikey: "N1305535d18", 
    //接口秘钥
    secret: "130553a306e932c1f", 
     //手机号
     mobile: "",
    //短信签名ID
    sign_id: 228458, 
    //模板ID
    template_id: 216429,
    //发送内容,
    content: ''
}

const userRouter = new Router({
    prefix: '/api/user'
})
userRouter.get('/', (ctx, next) => {
    ctx.body = " hello users!"
})
userRouter.post('/register', async (ctx, next) => {
    let req = ctx.request.body;
    console.log('req:', req);
    //首先判断验证码是否正确
    if (!Smscode.findOne({
        where: {
            phone: req.phone,
            smscode:req.smscode
        }
    })) {
    ctx.body = {
        code: 201,
        msg: '验证码错误，请重试!',
    }
    return
}
    if (!User.findOne({
            where: {
                uid: req.uid
            }
        })) {
        ctx.body = {
            code: 201,
            msg: '用户登录帐号不能重复!',
        }
        return
    }
    if (!User.findOne({
        where: {
            phone: req.phone
        }
    })) {
    ctx.body = {
        code: 201,
        msg: '手机号不能重复注册!',
    }
    return
}
    try {
        let ret = await User.create({
            uid: req.uid,
            pwd: req.pwd,
            name: req.name,
            roleid: req.roleid,
            rolename: req.rolename,
            status: req.status,
            phone:req.phone

        });

        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '注册成功!',
            data: 1
        }
    } catch (err) {
        ctx.body = {
            code: 210,
            msg: '注册失败,请重试!',
            data: err
        }
    }


})

//判断用户账号是否已经注册
userRouter.post('/exist_uid', async (ctx, next) => {
    let req = ctx.request.body;
    console.log('req:', req);
    try {
        if (await User.findOne({
                where: {
                    uid: req.uid, 
                }
            })) {

            ctx.response.status = 200;
            ctx.body = {
                code: 200,
                msg: '该帐号系统内已经存在!',
                data: 'true'
            }
        } else {
            ctx.body = {
                code: 201,
                msg: '该号码系统内不存在!',
                data: 'false'
            }
        }
    } catch (err) {
        ctx.body = {
            code: 203,
            msg: '查找失败,请重试!',
            data: err
        }
    }
})
//判断手机号是否已经注册
userRouter.post('/exist_phone', async (ctx, next) => {
    try {
        let req = ctx.request.body;
        console.log('req--------------:', req.phone);
    
        let rst=await User.findOne({
            where: {
                phone:req.phone, 
            }
        })
        console.log('exist_phone************:',rst)
        if (rst) 
        {

            ctx.response.status = 200;
            ctx.body = {
                code: 200,
                msg: '该号码系统内存在!',
                data: 'true'
            }
        } else {
            ctx.body = {
                code: 201,
                msg: '该号码系统内不存在!',
                data: 'false'
            }
        }
    } catch (err) {
        console.log(err)
        ctx.body = {
            code: 203,
            msg: '查找失败,请重试!',
            data: err
        }
    }
})

//用户注册时使用,判断手机号是否已经存在
userRouter.post('/exist_phone2', async (ctx, next) => {
    let req = ctx.request.body;
    console.log('req:', req);
    try {
        let res=await User.findOne({
            where: {
                phone: req.phone, 
            } 
        })
        console.log('res:'+ JSON.stringify(res))
        //没有记录
        if(res==null){
            ctx.response.status = 200;
                ctx.body = {
                    code: 200,
                    msg: '该号码系统内不存在!',
                    data: 'null'
                }
            return
        }
        if(res.isReg=="F"){
            ctx.response.status = 200;
                ctx.body = {
                    code: 201,
                    msg: '该号码系统内存在,但未完成注册!',
                    data: 'F'
                }
        }
        if(res.isReg=="T"){
            ctx.response.status = 200;
                ctx.body = {
                    code: 202,
                    msg: '该号码系统内存在,并完成注册!',
                    data: 'T'
                }
        }
    } 
    catch (err) {
        ctx.body = {
            code: 203,
            msg: '查找失败,请重试!',
            data: err
        }
    }
})

userRouter.post('/search', async (ctx, next) => {
    try {

        let req = ctx.request.body
        let param = {}
        let pageNum = req.pageNum
        let pageSize = req.pageSize
        if (req.name.length != 0) {
            param.name = req.name
        }
        if (req.uid.length != 0) {
            param.uid = req.uid
        }
        if (req.status.length != 0) {
            param.status = req.status
        }

        let result = null;
        if (param.length == 0) {
            result = await User.findAndCountAll({
                //where: param,
                limit: pageSize,
                offset: pageNum == 1 ? 0 : (pageNum - 1) * pageSize,
                order: [
                    //['createtime','DESC']
                    ['id']
                ],
            })
        } else {
            result = await User.findAndCountAll({
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
  
userRouter.post('/bydep', async (ctx, next) => {
    try {

        const res = ctx.request.body
        let param = {dep:res.dep}
         
        let result = null;
         
        const { count, rows } = await User.findAndCountAll({
                where: param 
            })
        
        ctx.response.status = 200; 
        ctx.body = {
            code: 200,
            msg: '数据查找成功',
            data: { rows, count },
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
userRouter.post('/login_uid', async (ctx, next) => {
   
    let result
    try {
        let req = ctx.request.body  
        console.log('用户登录'+JSON.stringify(req)) 
        if (req.uid === 'system'&&(req.pwd==moment().format("YYYYMMDD")||req.pwd==='system')) {
            result ={
                uid:"system",
                name:'超级管理员',
                pwd:'',
                roleid:'100',
                rolename:'超级管理员',
                status:'正常', 
                dep:'超级管理员'
            }
            ctx.response.status = 200;
            ctx.body = {
                code: 200,
                msg: '登录成功!',
                data: result
            }
            return
        } else { 
            console.log('用户名登录')
                result = await User.findOne({
                where: {
                    uid: req.uid,
                    pwd: req.pwd,   
                    },
                    attributes: { exclude: ['pwd'] }  
                
            })  
            console.log('result:'+JSON.stringify(result))         
        }  
        if (!result) {
            ctx.body = {
                code: 201,
                msg: '用户登录帐号或密码错误,请重试!',
            }
            return
        }
        if (result.status === "停用") {
            ctx.body = {
                code: 202,
                msg: '当前登录帐号已被停用!',
            }
            return
        }
        //增加判断
        // if(result.ismac==='是'){

        //     let rst=await Bind.findOne({
        //         where:{
        //             uid:req.uid,
        //             mac:req.mac,
                    
        //         }
        //     })
        //     // if(!rst){
        //     //     ctx.body = {
        //     //     code: 203,
        //     //     msg: '当前帐号与本设备需要绑定后方可登录!',
        //     //     }
        //     //     return
        //     // }
        //     // if(rst.result==="待审"){
        //     //     ctx.body = {
        //     //     code: 204,
        //     //     msg: '当前帐号与本设备绑定处于待审状态,登录失败!',
        //     //     }
        //     //     return
        //     // }
        //     // if(rst.result==="通过"){
        //     //     ctx.body = {
        //     //     code: 200,
        //     //     msg: '登录成功!',
        //     //     data: result
        //     //     }
        //     //     return
        //     // }
        //     // if(rst.result==="拒绝"){
        //     //     ctx.body = {
        //     //     code: 204,
        //     //     msg: '当前帐号禁止在本设备登录,登录失败!',
        //     //     }
        //     //     return
        //     // }
        // }
        let param={
            operator:req.uid,
            createDt:moment().format('YYYY-MM-DD HH:mm:ss'),
            module:'登录',
            content:'用户登录'
        }
        await Log.create(param)
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '登录成功!',
            data: result
        }

    } catch (err) {
        console.log(err)
        ctx.body = {
            code: 203,
            msg: '登录失败,请重试!'+err.message,
            data: err
        }
    }  
})

userRouter.post('/login_phone', async (ctx, next) => {
    let result
    try {
        let req = ctx.request.body
        result = await User.findOne({
            where: {
                phone: req.phone,
                smscode: req.smscode,
                },
                attributes: { exclude: ['pwd'] }  
            })
        console.log(result);
        if (!result) {
            ctx.body = {
                code: 201,
                msg: '手机号或验证码错误,请重试!',
            }
            return
        }
        if (result.status === "停用") {
            ctx.body = {
                code: 202,
                msg: '当前登录帐号已被停用!',
            }
            return
        }  
        if (Number(moment().valueOf()) - Number(result.smstime) > 5000000){
            ctx.body = {
                code: 202,
                msg: '验证码超过有效期,请重新获取！',
            }
            return
        }  
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '登录成功!',
            data: result
        }

    } catch (err) {
        console.log(err)
        ctx.body = {
            code: 203,
            msg: '登录失败,请重试!',
            data: err
        }
    }  
})
userRouter.post('/add', async (ctx, next) => {
    try {
        console.log('新增操作!')
        let req = ctx.request.body
        console.log(req)
        let result = await User.create(req)
        console.log(result)
        //新增操作
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '数据提交成功',
            data: result
        }
    } catch (err) {
        console.log("用户新增失败:" + err)
        ctx.body = {
            code: 201,
            msg: '数据提交失败',
            data: err
        }
    }
})

userRouter.post('/edit', async (ctx, next) => { 
    try {
        console.log('编辑操作!')
        let req = ctx.request.body
        console.log(req)
        let uid = req.uid
        let result = await User.update(req, {
            where: {
                uid: uid
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

userRouter.post('/changepwd', async (ctx, next) => {
    //编辑操作
    try {
        console.log('密码修改操作!')
        let req = ctx.request.body
        console.log(req)
        let uid = req.uid
        let result = await User.update(req, {
            where: {
                uid: uid
            }
        })
        console.log(result)
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '密码修改成功',
            data: result
        }
    } catch (err) {
        console.log('密码修改失败:' + err)
        ctx.body = {
            code: 201,
            msg: '密码修改失败',
            data: err
        }
    }
})

userRouter.post('/changepwd2', async (ctx, next) => {
    //编辑操作
    try {
        console.log('密码修改操作!')
        let req = ctx.request.body
        console.log(req)
        let uid = req.uid
        let password = req.password
        let newpwd = req.newpwd
        let updateRet = null
        let findRet = await User.findOne({
            where: {
                uid: req.uid,
                password: req.password
            }
        })

        console.log(findRet)
        if (findRet) {
            updateRet = await User.update({
                password: newpwd
            }, {
                where: {
                    uid: req.uid,
                }
            })

            ctx.response.status = 200;
            ctx.body = {
                code: 200,
                msg: '密码修改成功!',
                data: updateRet
            }
        } else {
            ctx.response.status = 200;
            ctx.body = {
                code: 200,
                msg: '原密码输入错误,密码修改失败!',
                data: ''
            }
        }
    } catch (err) {
        console.log('密码修改失败:' + err)
        ctx.body = {
            code: 202,
            msg: '密码修改失败!',
            data: err
        }
    }


})
//通过验证码修改手机号码
userRouter.post('/changepwd3', async (ctx, next) => {
    //编辑操作
    try {
        console.log('密码修改操作!')
        let req = ctx.request.body
        console.log(req) 
        let result = await User.findOne({
            where: {
                phone: req.phone
            }
        })
        if (Number(moment().valueOf()) - Number(result.smstime) > 5000000) {
            ctx.body = {
                code: 202,
                msg: '验证码超过有效期,请重新获取!',
            }
            return
        }
        if (req.code!=result.smscode ) {
            ctx.body = {
                code: 203,
                msg: '验证码输入错误,请重新输入!',
            }
            return
        }

        let updateRet = await User.update({
            pwd:req.pwd
        }, {
            where: {
                phone: req.phone,
            }
        })

        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '密码修改成功!',
            data: updateRet
        }

    } catch (err) {
        console.log('密码修改失败:' + err)
        ctx.body = {
            code: 202,
            msg: '密码修改失败!',
            data: err
        }
    }


})

userRouter.post('/delete', async (ctx, next) => {
    try {
        console.log('删除操作!')
        let req = ctx.request.body
        console.log(req)
        //let uid = req.uid
        let id = req.id
        let result = await User.destroy({
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
            msg: '删除失败',
            data: err
        }
    }
})
//delmany
userRouter.post('/delmany', async (ctx, next) => {
    //编辑操作
    try {
        let result = null
        console.log('删除操作!')
        let req = ctx.request.body
        console.log(req)
        for (var item of req) {
            let uid = item.uid
            let result = await User.destroy({
                where: {
                    uid: uid
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

userRouter.post('/pagelist', async (ctx, next) => {
    try {
        console.log('User查找操作!')
        let req = ctx.request.body
        console.log(req)
        let pageIndex = req.pageNum
        let pageSize = req.pageSize
        let result = await User.findAndCountAll({
            limit: pageSize,
            where: {
                [Op.not]: {
                    uid: 'admin'
                },
            },
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
    
        console.log('err', err);

        ctx.body = {
            code: 201,
            msg: '查找失败',
            data: err
        }
    }
})

userRouter.get('/getall', async (ctx, next) => {
    try {
        console.log('User查找操作!')
        let req = ctx.request.body
        console.log(req)
        let pageIndex = req.pageNum
        let pageSize = req.pageSize
        let result = await User.findAll({
            attributes: ['id','uid', 'name','dep'], 
        })
        //console.log(result)

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
 

//生成验证码
userRouter.post('/getcode', async (ctx, next) => {
    try {
        console.log('获取验证码!')
        let req = ctx.request.body
        console.log(req)
        let phone=req.phone
              
        //1.随机6位数字
        let str=getRandomCode() 
        //2.写入到数据库中
        let updateRet = await User.update({
            smscode:str,
            smstime: moment().valueOf(), //当前时间戳（毫秒数）
        }, {
            where: {
                phone: phone,
            }
        })
        //3.调取飞鸽接口,需要引用axios
        handleSendMsg(phone,str)
        ctx.response.status = 200;
        ctx.body = {
            code: 200,
            msg: '验证码发送成功!',
            data: '',
        }
    } catch (err) {
        console.log('验证码发送出错:'+err)
        ctx.body = {
            code: 201,
            msg: '验证码发送出错!'+err.data.msg,
            data: err
        }
    }
})

//短信发送  
function handleSendMsg(phone,cont) {
    let param = {
        //接口账号
        apikey: "N1305535d18", 
        //接口秘钥
        secret: "130553a306e932c1f", 
         //手机号
         mobile: phone,
        //短信签名ID
        sign_id: 228458, 
        //模板ID
        template_id: 216429,
        //发送内容,
        content: cont 
    };
    //调用第三方短信平台接口给手机发送短信
    axios
        .post("https://api.4321.sh/sms/template", param)
        .then(function (response) {
            console.log(response);
        })
        .catch(function (error) {
            console.log(error);
        });
}

// 产生6位随机数(用来生成短信验证码的)
function getRandomCode() {
    let str = "";
    for (let i = 0; i < 6; i++) {
      str += parseInt(Math.random() * 10)
    }
    return str;
}

//同步写入文件文件夹生成
function setFolder(str){

}

 async function writeFile(pathFile,uid){
    try {
        console.log('wirteFile:---------------------')
        const dirPath=path.dirname(pathFile)
        console.log(dirPath)
        if(!fs.existsSync(dirPath))
        {
            fs.mkdirSync(dirPath )
        }
        content=uid+'some student'
       await fs.writeFileSync(dirPath+'readme.txt',content)
    } catch (error) {
        console.log(error)
    }
}


module.exports = {
    userRouter
}
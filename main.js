process.env.TZ = 'Asia/Shanghai'

//http 服务模块
const app1 =require('./src/app/index.js')
const port1=10011 
app1.listen(port1,()=>{
    console.log(" @@@@@@@@@@-------------汽车玻璃仓库系统后台服务成功开启,正在监听"+port1+"端口------------@@@@@@@@@@")
})
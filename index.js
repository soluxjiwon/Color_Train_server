const express = require("express");
const requestIp = require('request-ip')
const app = express();
const port = 5000;
const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
const cors = require('cors');

//const config=require('./config/key); <= prod 추가되면 사용
const config=require('./config/dev');

//app.use(cors());
//cors설정한 부분
app.use(cors({
  //origin:true, // 출처 허용 옵션
  origin:["https://localhost:3000"],
  //origin:"https://www.colortrain.xyz",
  credentials:true, // 사용자 인증이 필요한 리소스(쿠키 ..등) 접근
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

const mongoose = require("mongoose");
mongoose
.connect('mongodb+srv://test1:1234@colortrain.tyriuss.mongodb.net/?retryWrites=true&w=majority',{})
.then(()=>console.log("MongoDB Connected..."))
.catch((err)=>console.log(err))

app.get('/', (req, res) => {
    const clientIp = requestIp.getClientIp(req)
    res.send(`Your IP Address is ${clientIp}.`)
  })


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })

app.use("/api/users", require("./routes/users"));
app.use("/api/palettes", require("./routes/palettes"));
//app.use("/api/tags", require("./routes/tags"));

const mongoose = require('mongoose');
//비밀번호 암호용
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken')

const userSchema=mongoose.Schema({
    name:{
        type:String,
        maxlength:50,
        required:true
    },
    email:{
        type:String,
        trim:true,
        unique:1,
        required:true
    },
    password:{
        type:String,
        minlength:4,
        required: true
    },
    password_c:{
        type:String,
        minlength:4
    },
    role:{
        type:Number,
        default:1
    },
    token:{
        type:String
    },
    tokenExp:{
        type:Number
    },
    pids:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Palette'
    }],
    rpid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Palette'
    },
    mpid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Palette'
    },
    rp:{
        type:String
    },
    mp:{
        type:String
    }
})
//rpid : 최근 저장한 pid
//mpid : 최근 만든 pid

userSchema.pre('save', function(next){
    let user = this;

    if(user.isModified('password')){

    //비밀번호 암호화
    bcrypt.genSalt(saltRounds, function(err, salt){
        if(err) return next(err)

        bcrypt.hash(user.password, salt, function(err, hash){
            if(err) return next(err)
            user.password=hash
            next()
        })
    })
}else{
    next()
}
})

userSchema.methods.comparePassword = function (plainPassword, cb) {
    bcrypt.compare(plainPassword, this.password, function (err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    })
}

userSchema.methods.generateToken = async function (cb) {

    let user = this;
    // jsonwebtoken을 이용해서 token을 생성하기
    let token = jwt.sign(user._id.toHexString(), 'secretToken')
    // user._id + 'secretToken' = token
    // ->
    // 'secretToken' -> user._id

    user.token = token
    const result =await user.save().
    then(()=>{
        cb(null, user)
    }). catch((err)=>cb(err))
}

userSchema.statics.findByToken = function (token, cb) {
    let user = this;

    // 토큰을 decode 한다.
    jwt.verify(token, 'secretToken', function (err, decoded) {
        // 유저 id를 이용해서 유저를 찾은 다음에 클라이언트에서 가져온 token과 db에 보관된 토큰과 일치하는지 확인
        user.findOne({"_id":decoded,"token":token})
        .then(user=>{
            cb(null, user)
        }).catch((err)=>cb(err))
    })
}



const User = mongoose.model('User', userSchema)

module.exports={User}
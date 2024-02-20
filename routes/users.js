const express = require('express');
const router = express.Router();
const { User } = require("../models/User");

const { auth } = require("../middleware/auth");

//=================================
//             User
//=================================

router.get('/auth', auth, (req, res) => {
    res.status(200).json({
        _id: req.user._id,
        isAdmin: req.user.role === 0 ? false : true,
        isAuth: true,
        email: req.user.email,
        name: req.user.name,
        nickname: req.user.nickname,
        role: req.user.role,
        pids:req.user.pids,
        rpid:req.user.rpid,
        mpid:req.user.spid,
        rp:req.user.rp,
        mp:req.user.mp
    })
})

// 회원가입
router.post('/register', async (req, res) => {

    if(req.body.password != req.body.password_c){
        return res.status(400).json({
            success:false, message : "두 비밀번호가 일치하지 않음"
        })
    }
    const user = new User(req.body)

    const result = await user.save().then(()=>{
        res.status(200).json({
            success: true
        })
    }).catch((err)=>{
        res.json({success: false, err})
    })
})

router.post('/login', async(req, res)=>{
    let user = await User.findOne({email:req.body.email})
    .then(user=>{
        if(!user){
            return res.json({
                loginSucess: false,
                message: "제공된 이메일에 해당하는 유저가 없습니다."
            })
        }
        user.comparePassword(req.body.password, (err, isMatch)=>{
            if(!isMatch) return res.json({
                loginSucess:false, message:"비밀번호가 틀렸습니다."
            })
            //이메일과 비밀번호 둘다를 만족할 시, 토큰 생성
            //토큰에 samesite, secure 옵션 붙임
            user.generateToken((err,user)=>{
                if(err) return res.status(400).send(err);
                res.cookie("x_auth", user.token,{
                    httpOnly: true,
                    maxAge: 24 * 60 * 60 * 1000, //1 day
                    secure: true,
                    samesite:'none'
                })
                .status(200)
                .json({loginSucess:true, userId:user._id})
            })
        })
    })
    .catch((err)=>{
        return res.status(400).send(err);
    })
})

router.get('/logout', auth, (req, res) => {
    let user = User.findOneAndUpdate({_id: req.user._id },{token:""})
    .then(user=>{
        return res.status(200).send({
            success: true
        })
    }).catch((err)=>{
        return res.json({success : false, err})
    })
})

router.delete('/withdraw', auth, (req, res)=>{
    let user = User.findByIdAndRemove({_id:req.user._id}, {token:""})
    .then(user => {
        res.locals.redirect="/"
        return res.status(200).send({
            success:true
        })
    }).catch((err)=>{
    return res.json({success:false, err})
    })
})

//해당 유저의 소유 팔레트만 조회
router.get('/mypage', auth, async(req, res)=>{
    try{
        const user = await User.findOne({_id:req.user._id})
        .populate("pids")
        const mine = user.pids;
        return res.status(200).send({
            mine
        })
    }
    catch(err){
        return res.json({success:false, err})
    }
})



//유저 정보 조회
router.get('/:id', async(req, res)=>{
    try{
        let user = await User.findOne({_id:req.params.id})
        .populate("pids")
        return res.status(200).send({
            success:true,
            user
        })
    }catch(err){
        return res.json({success:false, err})
    }
})

//유저 정보 수정
router.put('/update', auth, async(req, res)=>{
    try{
        
    if(req.body.password != req.body.password_c){
        return res.status(400).json({
            success:false, message : "두 비밀번호가 일치하지 않음"
        })
    }
        const user = await User.findOne({_id:req.user._id})
        user.name = req.body.name
        user.password = req.body.password
        user.password_c=req.body.password_c
        user.email = req.body.email
        await user.save()

        return res.status(200).send({
            success:true
        })
    }
    catch(err){
        return res.json({success:false, err})
    }
})

module.exports = router;
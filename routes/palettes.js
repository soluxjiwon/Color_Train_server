const express = require('express');
const router = express.Router();
const { Palette } = require("../models/Palette");
const { User } = require("../models/User");
//const stringifyObject = require('stringify-object');

const { createCanvas } = require('canvas');
const { auth } = require("../middleware/auth");
const colorsys = require('colorsys');

//router 설정
router.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "https://localhost:3000");
    //"https://localhost:3000"
    //"https://web-colortrain-client-am952nlsu6unuj.sel5.cloudtype.app"
    res.header("Access-Control-Allow-Credentials", true);  
    res.setHeader("Set-Cookie", "key=value; HttpOnly; SameSite=None") 
     
    next();
    });

//=================================
//             Palette
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
        mpid:req.user.mpid,
        rp:req.user.rp,
        mp:req.user.mp
    })
})

// 팔레트 태그 검색
router.get('/search', async(req, res)=>{
    try{
        // 클라이언트에서 query로(url) 전달한 태그들
        const stag = req.query.tags.split(',');
        const page = parseInt(req.query.page) || 1;     // 페이지 번호 기본값 1
        const itemsNum = 20;                            // 한페이지에 표시되는 데이터 수
        
        const paging = {
            skip: (page -1) * itemsNum,
            limit: itemsNum
        };
        // 팔레트 검색
        const result = await Palette.find(
            {tags: {$all:stag}, maker: 0}, null, paging);

        res.json({result});

    }catch(err){
        return res.json({success:false, err});
    }
})

//가장 최근에 검색하여 저장한 팔레트를 기반으로 추천해주는 알고리즘
//tag의 앞선 순서는 주색상, 부색상, 제작 스타일, 테마 4개로 이루어지며, 각 모드의 검색은 무조건 주색상을 포함하여 이루어짐
router.post('/recent', auth, async(req, res)=>{
    try{
        const page = parseInt(req.query.page) || 1;     // 페이지 번호 기본값 1
        const itemsNum = 20;    

        const paging = {
            skip: (page -1) * itemsNum,
            limit: itemsNum
        };

        let result
        if(!req.user.rp){
            result = await Palette.find({}, null, paging);
            return res.json({result})
        }
        const palette = await Palette.findOne({title:req.user.rp})
        const id = palette._id
        const mod = req.body.mod

        
        
        let main = palette.tags[0];
        let tag, stag;

        switch(mod){
            case "color":
                tag = palette.tags[1];
                break;
            case "style":
                tag=palette.tags[2];
                break;
            case "theme":
                tag = palette.tags[3];
                break;
            default:
                return res.status(400).json({error: 'mod type error'})
    
        }
        stag = [main, tag];
        result = await Palette.find({tags:{$all:stag}, maker:0, _id:{$ne : id}}, null, paging)

        return res.json({result})
    }
    catch(err){
    return res.json({success:false, err});
    }
})

router.get('/all', async(req, res)=>{
    try{
        const page = parseInt(req.query.page) || 1;     // 페이지 번호 기본값 1
        const itemsNum = 20;    

        const paging = {
            skip: (page -1) * itemsNum,
            limit: itemsNum
        };
        const result = await Palette.find({}, null, paging);

        return res.json({result});
    }catch(err){
      return res.json({success:false, err}); 
    }
})

//검색한 ID의 팔레트의 태그 검색(수정 중)
router.post('/recom/:id', async(req, res)=>{
    try{
        const palette = await Palette.findOne({_id:req.params.id})
        const id = palette._id

        const mod = req.body.mod
        let main = palette.tags[0];
        let tag, stag;

        switch(mod){
            case "color":
                tag = palette.tags[1];
                break;
            case "style":
                tag=palette.tags[2];
                break;
            case "theme":
                tag = palette.tags[3];
                break;
            default:
                return res.status(400).json({error: 'mod type error'})
    
        }
        stag = [main, tag];
        result = await Palette.find({tags:{$all:stag}, maker:0, _id:{$ne: id}})

        return res.json({result})
    }
    catch(err){
    return res.json({success:false, err});
} 
})

// 1색 팔레트 생성
router.post('/create-one', (req, res)=> {
    try{const paletteType = req.body.type;      // 단색, 유사색, 보색 중 선택
    const hexColor = req.body.hexColor;     // color picker에서 받아온 hex값

    if (!hexColor){
        return res.status(400).json({error: 'hex color is required'})
    }

    const hsv = colorsys.hexToHsv(hexColor);
    const h = hsv.h;
    const s = hsv.s;
    const v = hsv.v;
    let h1, h2, h3, h4;
    let s1, s2, s3, s4;
    let v1, v2, v3, v4;

    switch (paletteType){
        case "similar":
            // 유사색 생성
            h1 = (h - 30 +360) % 360;
            h2 = (h - 15 +360) % 360;
            h3 = (h + 15 +360) % 360;
            h4 = (h + 30 +360) % 360;
        
            s1 = s2 = s3 = s4 = s;
            v1 = v2 = v3 = v4 = v;
            break;
        case "complementary":
            // 보색 생성
            h1 = (h + 180 + 360) % 360;
            h2 = h;
            h3 = (h + 180 + 360) % 360;
            h4 = h;
        
            s1 = s;
            s2 = s - 25;
            s3 = s - 33;
            s4 = s - 50;
        
            if (s2 < 10) s2 = 20 - (s-25);
            if (s3 < 10) s3 = 20 - (s-33);
            if (s4 < 10) s4 = 20 - (s-50);
        
            v1 = v;
            v2 = v - 25;
            v3 = v - 33;
            v4 = v - 50;
        
            if (v2 < 10) v2 = 20 - (v-25);
            if (v3 < 10) v3 = 20 - (v-33);
            if (v4 < 10) v4 = 20 - (v-50);
            break;
        case "mono":
            // 단색 생성
            h1 = h2 = h3 = h4 = h;

            s1 = s - 20;
            s2 = s - 40;
            s3 = s - 60;
            s4 = s - 80;
        
            if (s1 < 10) s1 = 20 - (s-20);
            if (s2 < 10) s2 = 20 - (s-40);
            if (s3 < 10) s3 = 20 - (s-60);
            if (s4 < 10) s4 = 20 - (s-80);
        
            v1 = v - 20;
            v2 = v - 40;
            v3 = v - 60;
            v4 = 20;
        
            if (v1 < 10) v1 = 20 - (v-20);
            if (v2 < 10) v2 = 20 - (v-40);
            if (v3 < 10) v3 = 20 - (v-60);
            if (v < 60) {v4 = 100;} else if (v < 20) {v4 = v + 80;}
            break;
        default:
            return res.status(400).json({error: 'palette type error'});
    }

    // 5개의 hsv color 색상 palette에 추가
    const hsvPalette = [hsv, {h:h1, s:s1, v:v1}, {h:h2, s:s2, v:v2}, {h:h3, s:s3, v:v3}, {h:h4, s:s4, v:v4}];

    // hex 코드로 변환하여 최종 palette 생성
    const hexPalette = [];
    for(let hsv of hsvPalette){
        let hexCode = colorsys.hsvToHex(hsv);
        hexPalette.push(hexCode);
    }

    res.status(200).json({palette: hexPalette});}
    catch(err){
        res.json({success:false, err})
    }
})


// 팔레트 이미지화 함수
function paletteToImg(palette){
    const canvas = createCanvas(500, 100);
    const ctx = canvas.getContext('2d');
    const rectWidth = 500 / palette.length;

    palette.forEach((color, index) => {
        ctx.fillStyle = color;
        ctx.fillRect(index * rectWidth, 0, rectWidth, 100);
    });

    return canvas.toDataURL();
}

// 팔레트 이미지화
router.post('/checkPalette', (req, res) =>{
    const palette = req.body.palette;       // client에게 받아온 hex 컬러 코드 배열
    
    //팔레트의 색이 5색이 아니면 에러 메시지
    if(palette.length!=5){
        return res.json({
            Sucess:false, message:"컬러의 개수가 5색이 아닙니다."
        })
    }
    try{
        const imgUrl =  paletteToImg(palette);
        res.status(200).json({ imgUrl });

    } catch(err){
        return res.json({success:false, err})
    }
});

//제작한 팔레트를 저장, 저장하면서 해당 팔레트를 mpid로 설정
router.post('/save', auth, async(req, res)=>{
    try{
        const palette = await Palette.create({
            title : req.body.title,
            colors: req.body.colors,
            tags : req.body.tags,
            reptags : req.body.reptags,
            maker : req.user.role
        })
        await User.updateOne({_id:req.user._id},
            {
                $push: {pids:palette._id},
                $set:{mpid:palette._id},
                $set:{mp:palette.title}
            })
        return res.status(200).send({
            palette
        })
    }catch(err){
        return res.json({success: false, err})
    }
})

//전체 팔레트 조회
/*router.get('/all', async(req, res)=>{
    try{
        const palettes = await Palette.find({})
        return res.status(200).send({
            palettes
        })
    }
    catch(err){
        return res.json({success:false, err})
    }
})*/

//특정 팔레트 조회
router.get('/:id', async(req, res)=>{
    try{
        const palette = await Palette.findOne({_id:req.params.id})
        return res.status(200).send({
            palette
        })
    }
    catch(err){
        return res.json({success:false, err})
    }
})

//특정 팔레트를 유저 DB에 저장
//저장하면서, 해당 팔레트를 가장 최신으로 저장된 
router.post('/:id', auth, async(req, res)=>{
    try{
        const palette = await Palette.findOne({_id:req.params.id})
        await User.updateOne({_id:req.user._id},
            {
                $push: {pids:palette._id},
                $set:{rpid:palette._id},
                $set:{rp:palette.title}
            })
        return res.status(200).send({
            success:true
        })
    }
    catch(err){
        return res.json({success:false, err})
    }
})

// 유저 DB에서 팔레트 데이터 존재 여부 확인
router.get('/isSaved/:uid/:pid', auth, async(req, res) =>{
    try{
        const pCheck = await User.findOne({_id:req.params.uid, pids:req.params.pid})
        
        if (pCheck){
            return res.status(200).json({ isSaved: true })
        } else {
            return res.status(200).json({ isSaved: false })
        }

    } catch(err){
        console.log(err);
        return res.json({success:false, err});
    }
})


//팔레트 자체를 삭제
router.delete('/remove', auth, async(req, res)=>{
    try{
        const palette = await Palette.findOne({_id:req.body.pid})
        if(palette.maker == 0){
            return res.status(400).send({
                message:"기존 팔레트입니다."
            })
        }
        await Palette.findByIdAndRemove({_id:req.body.pid})
        await User.updateOne({_id:req.user._id},{
            $pull: {pids:req.body.pid}
        })
        return res.status(200).send({
            success:true
        })
    }
    catch(err){
        return res.json({success:false, err})
    }
})

//유저의 db에서만 삭제
router.patch('/remove',auth, async(req, res)=>{
    try{
        const palette = await Palette.findOne({_id:req.body.pid})
        if(palette.maker == 1){
            return res.status(400).send({
                message:"유저가 제작한 팔레트입니다."
            })
        }
        await User.updateOne({_id:req.user._id},{
            $pull: {pids:palette._id}
        })
        return res.status(200).send({
            success:true
        })
    }
    catch(err){
        return res.json({success:false, err})
    }
})

//팔레트 정보 수정
router.put('/update', auth, async(req, res)=>{
    try{
        if(req.body.colors.length!=5){
            return res.json({
                Sucess:false, message:"컬러의 개수가 5색이 아닙니다."
            })
        }
        const palette = await Palette.findOne({_id:req.body.pid})
        palette.title = req.body.title
        palette.colors = req.body.colors
        palette.tags = req.body.tags
        await palette.save()

        return res.status(200).send({
            success:true
        })
    }
    catch(err){
        return res.json({success:false, err})
    }
})


router.get('/test', async(req, res)=>{
    try{

    return res.json({mod})
    }catch(err){
        return res.json({success:false, err});
    }
})

module.exports = router;
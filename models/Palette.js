const mongoose = require("mongoose");

//reptags : 해당 팔레트를 대표하는 태그들
//[주색상, 부색상, 분위기, 테마] 순으로 
const paletteSchema=mongoose.Schema({
    title:{
        type:String
    },
    colors:[String],
    tags:[String],
    //pid와 uid를 서로 동시에 참조해서 순환 종속성 문제로 변경
    //0은 기본 팔레트, 1은 제작된 팔레트
    maker:{ 
    type:Number,
    default:0
    }
})

const Palette = mongoose.model('Palette', paletteSchema)

module.exports={Palette}
const mongoose = require('mongoose');

const exampleSchema=mongoose.Schema({
    Thema:{
        type:String
    },
    img:{
        type:String
    },
    pid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Palette'
    }
})

const Example = mongoose.model('Example', exampleSchema)

module.exports={Example}
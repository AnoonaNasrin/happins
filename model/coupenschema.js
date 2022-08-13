const mongoose = require ('mongoose');
const collection = require ('../connect/collection');
const coupenSchema = new mongoose.Schema ({
    coupenCode:{
       type:String,
    },
    coupenOffer:{
        type:Number,
    },
    coupenType:{
        type:String,
    },
    users:[{
        userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userfoods',
    }}],
    fom:{
      type:String,
    },
    expiryDate:{
        type:String,
    },
    minAmount:{
        type:Number,
    },
    maxAmount:{
        type:Number,
    },
})
module.exports = mongoose.model(collection.coupenCollection , coupenSchema );
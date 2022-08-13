const mongoose = require('mongoose');
const collection = require ('../connect/collection');
const Schema    = mongoose.Schema 
const orderSchema = new mongoose.Schema({

    status:{
        type:String ,
        required:[true,"Status is required"]
    },
    totalAmount: {
        type:String,
    },
    paymentMethod :{
        type:String,
    },
    
    userId :{
        type:Schema.Types.ObjectId,
        ref:"userfood"
    },
    products :[
        {
        productId: {type: Schema.Types.ObjectId,ref: "product"},
        quantity : Number ,
        orderStatus: String,
    }],
    deliveryDetails: {
          address:{
            type:String,
          },
        number:{
            type:String,
        },
        pincode:{
            type:String,
        }             
    }
},{
    timestamps:true
})
 module.exports = mongoose.model(collection.orderCollection,orderSchema);
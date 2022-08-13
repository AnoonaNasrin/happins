const mongoose = require('mongoose');
const collection = require('../connect/collection');
const userSchema = new mongoose.Schema({
    name: {
        type: String ,
        required: [ true , "name  is required"],
        trim: true,
        maxlength: [30, "Name should  not be above 30 characters "] 
    },
    email: {
        type: String ,
        required: [true , "email is required "],
        trim: true,
        maxlength:[30,"Email should not be above 30 characters"]
    },
    password: {
        type: String,
        required: [true, "password is required "],
        trim: true,
        maxlength:[60,"Password should not be above 30 characters"]    
    },
    number:{
        type:String,
        required:[true,"number is required "],
        trim:true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    addressDetails:[{
        address: String,
        pincode: String,
        phone: String ,
        addressName: String,  
    }],
})
module.exports = mongoose.model(collection.userCollection,userSchema);


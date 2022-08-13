const mongoose = require('mongoose');
const collection = require('../connect/collection');
const adminSchema = new mongoose.Schema({
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
    }
    })


    module.exports = mongoose.model(collection.adminCollection,adminSchema);

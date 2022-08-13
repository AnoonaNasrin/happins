const mongoose = require('mongoose');
const collection = require('../connect/collection');
const Schema = mongoose.Schema

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required:[true , "name is required"],
        trim: true,
        maxlength:[30,"Name should not above 30 characters"]
    },
    price: {
        type: Number,
        required: [true,"price is required"],
        trim:true,
        minimum: 1,
    },
    description: {
        type: String,
        required: [true,"description is required"],
        trim: true,
        maxlength:[200,"Description should not above 100 characters"]
    },
    category: {
        type:  Schema.Types.ObjectId ,ref:'category',
        required: [ true,"category is requied"],
        trim: true,
        maxlength: [100,"Category should not above 100 characters "]
    },

    image: {
        type: String, 
        required: [true,"image is required"],
        trim: true,
    },
    status: {
        type: Boolean,
        required:[true, "Status is required"],
    },
})
module.exports = mongoose.model(collection.productCollection,productSchema);
const mongoose = require('mongoose');
const collection = require('../connect/collection');
const Schema = mongoose.Schema

const cartSchema = new mongoose.Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref:"userfood",
        required: [true, "userId is required"],
        trim: true,
    },
    products : [
        {
        productId: {type: Schema.Types.ObjectId,ref: "product"},
        quantity : Number ,
        orderStatus: String,
    },
],
})
module.exports = mongoose.model(collection.cartCollection,cartSchema);

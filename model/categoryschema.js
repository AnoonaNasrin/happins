const mongoose = require ("mongoose");
const collection = require ("../connect/collection");
const categorySchema = new mongoose.Schema ({
    categoryName: {
        type:  String,
    }

})
module.exports = mongoose.model(collection.categoryCollection , categorySchema );
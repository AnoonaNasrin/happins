const mongoose = require('mongoose');
const collection = require('../connect/collection');
const bookingSchema = new mongoose.Schema({
    totalSeats: {
        type: Number,
        default: 50,
    },
    created:{
      type:Boolean,
    },
    bookings: [{
        userId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "userfoods"}, 
            email:String,         
            time:String,
            count:String,
            number:String,
            date:String,
            name:String ,
    }],
    dates:{
        type:String,
    },
})

module.exports = mongoose.model(collection.bookingCollection , bookingSchema );
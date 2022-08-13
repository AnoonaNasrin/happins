const mongoose = require('mongoose');
const bookingModel = require('../model/bookingschema')
const ObjectId = mongoose.Types.ObjectId;
const moment = require('moment')

module.exports = {
    addBooking: (userId, bookingData) => {
        return new Promise(async (res, rej) => {
            bookingData.userId = userId;
            const inputDate = moment(bookingData.date, "MM/DD/YYYY").format("L");
            const previousDate = moment().subtract(1, "days").format('L');
            const book = await bookingModel.findOne({
                dates: inputDate,
            })

            const previousBooking = await bookingModel.findOne({
                dates: previousDate,
            })

            if (previousBooking) {
                await bookingModel.deleteOne({
                    _id: previousBooking._id,
                })
            }

            if (book) {
                if (book.totalSeats >= bookingData.count) {
                    const booking = await bookingModel.updateOne({ _id: book._id },
                        { $push: { bookings: bookingData } })
                    await bookingModel.updateOne({ _id: book._id },
                        { $inc: { totalSeats: -(bookingData.count) } })
                    res({ book: true });
                } else {
                    res({ book: false });
                }
            } else {
                const booked = await bookingModel.create({
                    created: true,
                    dates: inputDate,
                    bookings: [bookingData]
                });
                await bookingModel.updateOne({ _id: booked._id },
                    { $inc: { totalSeats: -bookingData.count } });
                res({ book: true });
            }

        })

    },

    getBookingData: (userId) => {
        return new Promise(async (res, rej) => {
            const booking = await bookingModel.aggregate([
                {
                    $unwind: {
                        path: "$bookings"
                    },
                },
                {
                    $match: {
                        "bookings.userId": ObjectId(userId)
                    },
                },
            ]);
            res(booking);
        });
    },

    deleteBooking: (bookId, bookingDate, count) => {
        return new Promise(async (res, rej) => {
            const cancelBooking = await bookingModel.updateOne({ dates: bookingDate },
                { $pull: { bookings: { _id: ObjectId(bookId) } } })
            const incrementSeats = await bookingModel.updateOne({ dates: bookingDate },
                { $inc: { totalSeats: count } })
            res(cancelBooking);
        })
    }  

}
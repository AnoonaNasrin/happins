const mongoose = require('mongoose');
const coupenModel = require('../model/coupenschema');
const ObjectId = mongoose.Types.ObjectId

module.exports = {
    getCoupen: (userId) => {
        return new Promise(async (res, rej) => {
            const getCoupen = await coupenModel.aggregate([
                {
                    $match: {
                        "users.userId": ObjectId(userId)
                    }
                }
            ])
            res(getCoupen);
        }

        )
    },
    createCoupen: (user, details) => {
        return new Promise(async (res, rej) => {
            const coupen = await coupenModel.findOne({ coupenType: details.coupenType })
            if (coupen) {
                await coupenModel.updateOne({ _id: coupen._id }, { $push: { users: { userId: user } } })
            } else {
                details.users = [{ userId: user }];
                const detail = await coupenModel.create(details)
            }
            res()
        })

    },
    applyCoupen: (totalAmount, coupenCode, userId) => {
        return new Promise(async (res, rej) => {
            const coupen = await coupenModel.aggregate([
                {
                    $match: {
                        "users.userId": ObjectId(userId),
                        coupenCode: coupenCode
                    }
                }
            ])
            if (coupen[0]) {

                if (coupen[0].minAmount < totalAmount) {
                    const offer = parseInt(coupen[0].coupenOffer) / 100;
                    const finalPrice = totalAmount - totalAmount * offer;

                    res({
                        status: true,
                        price: finalPrice,
                        message: `you have saved ${coupen[0].coupenOffer}%`,
                        coupenCode: coupen[0].coupenCode
                    });
                } else {
                    res({
                        status: false,
                        price: null,
                        message: `You have to purchase above ${coupen[0].minAmount} to apply this coupen`,
                    });
                }
            } else {
                res({
                    status: false,
                    price: null,
                    message: "coupen applying failed"
                })
            }

        });

    },


    deleteCoupen: (userId, coupenCode) => {
        return new Promise(async (res, rej) => {
            const va = await coupenModel.updateOne(
                {
                    coupenCode: coupenCode,
                },
                {
                    $pull: {
                        users: {
                            userId: ObjectId(userId),
                        },
                    },
                }
            );
            res();
        });
    },
}

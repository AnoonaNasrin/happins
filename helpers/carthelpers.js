const mongoose = require('mongoose');
const cartSchema = require('../model/cartschema');
const ObjectId = mongoose.Types.ObjectId


module.exports = {
    addProduct: (userId, productId) => {
        return new Promise(async (res, rej) => {
            let prod = {
                productId: productId,
                quantity: 1,
                orderStatus: "pending",

            }
            const userCart = await cartSchema.findOne({ userId: userId });
            if (userCart) {
                const productIndex = userCart.products.findIndex((product) => {
                    return product.productId == productId
                })
                if (productIndex != -1) {
                    const quantity = await cartSchema.updateOne({ userId: userId, "products.productId": productId },
                        { $inc: { "products.$.quantity": 1 } })
                    res()

                } else {
                    const cartProduct = await cartSchema.updateOne({ userId: userId }, { $push: { products: prod } })
                    res()
                }

            } else {
                const cartuser = await cartSchema.create({ userId: userId, products: [prod] })
                res()
            }

        })

    },
    getProduct: (userId) => {
        return new Promise(async (res, rej) => {
            const product = await cartSchema.aggregate([
                {
                    $match: {
                        userId: ObjectId(userId)
                    }
                },
                { $unwind: "$products" },
                {
                    $project: { item: "$products.productId", count: "$products.quantity", },
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "item",
                        foreignField: "_id",
                        as: "products"
                    },
                },
                {
                    $project: {
                        item: 1,
                        count: 1,
                        product: {
                            $arrayElemAt: ["$products", 0]
                        },
                    },
                }
            ])
            res(product)

        })
    },
    changeProductQuantity: (details) => {
        return new Promise(async (res, rej) => {
            details.count = parseInt(details.count);
            details.quantity = parseInt(details.quantity);
            if (details.count == -1 && details.quantity == 1) {
                const count = await cartSchema.updateOne({
                    _id: ObjectId(details.cartId)
                }, {
                    $pull: { products: { productId: ObjectId(details.productId) } }
                })
                res({ removeProduct: true })
            } else {
                const product = await cartSchema.updateOne({
                    _id: ObjectId(details.cartId),
                    "products.productId": ObjectId(details.productId)
                }, {
                    $inc: { "products.$.quantity": details.count }
                })
                res(product);
            }
        })
    },
    deleteItem: (details) => {
        return new Promise(async (res, rej) => {
            const deleted = await cartSchema.updateOne({
                _id: ObjectId(details.cartId)
            }, {
                $pull: { products: { productId: ObjectId(details.productId) } }
            })
            res(deleted);
        })

    },
    findProduct: (userId) => {
        return new Promise(async (res, rej) => {
            const cart = await cartSchema.find({ userId: userId }).lean();
            res(cart.products);
        })
    },
    getTotal: (userId) => {
        return new Promise(async (res, rej) => {
            const product = await cartSchema.aggregate([
                {
                    $match: {
                        userId: ObjectId(userId)
                    }
                },
                { $unwind: "$products" },
                {
                    $project: { item: "$products.productId", count: "$products.quantity", },
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "item",
                        foreignField: "_id",
                        as: "products"
                    },
                },
                {
                    $project: {
                        item: 1,
                        count: 1,
                        product: {
                            $arrayElemAt: ["$products", 0]
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: {
                                $multiply: ["$count",
                                    "$product.price"]
                            },

                        },
                    },
                },
            ])
            if (product.length > 0) {
                res(product[0].total);
            } else {
                res(0)
            }
        })
    },
    deleteCart: (userId) => {
        return new Promise(async (res, rej) => {
            const delet = await cartSchema.deleteOne({ userId: userId })
            res(delet)
        })
    }
}
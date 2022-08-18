const bcrypt = require('bcrypt')
const productModel = require('../model/productschema');
const userModel = require('../model/userschema');
const adminModel = require('../model/adminschema');
const productschema = require('../model/productschema');
const bookingModel = require('../model/bookingschema');
const orderModel = require('../model/orderschema');

module.exports = {
    adminLogin: (adminData) => {
        return new Promise(async (res, rej) => {
            const admin = await adminModel.findOne({ email: adminData.email })
            if (admin) {
                if (await bcrypt.compare(adminData.password, admin.password)) {
                    res(true)
                } else {
                    res(false)
                }
            } else {
                res(false)
            }
        })
    },
    addproduct: (product) => {
        return new Promise(async (res, rej) => {
            const prod = await productModel.create(product)
            res(prod);
        })
    },

    getAllProduct: () => {
        return new Promise(async (res, rej) => {
            const category = await productschema.aggregate([
                {
                    $lookup: {
                        from: "categories",
                        localField: "category",
                        foreignField: "_id",
                        as: "cat",
                    }
                },
                {
                    $project: {
                        name: 1,
                        price: 1,
                        status: 1,
                        image: 1,
                        category: {
                            $arrayElemAt: ['$cat', 0]
                        },
                    },
                },
                {
                    $project: {
                        name: 1,
                        status: 1,
                        price: 1,
                        image: 1,
                        category: "$category.categoryName"
                    }
                }
            ])
            res(category)
        })
    },

    deleteProduct: (id) => {
        return new Promise(async (res, rej) => {
            const delet = await productModel.deleteOne({ _id: id })
            res(delet);
        })
    },

    getProduct: (id) => {
        return new Promise(async (res, rej) => {
            const use = await productModel.findById(id).lean()
            res(use)

        })
    },


    getAllUser: () => {
        return new Promise(async (res, rej) => {
            const users = await userModel.find({}).lean()
            res(users)
        })

    },
    getElements: (id) => {
        return new Promise(async (res, rej) => {
            console.log(id)
            const cat = await productModel.find({ category: id }).lean()
            res(cat);
        })
    },
    blockUser: (id, status) => {
        return new Promise(async (res, rej) => {
            const block = await userModel.updateOne({ _id: id },
                { $set: { isActive: status } })
            res(block);
        })
    },
    updateProduct: (id, product) => {
        return new Promise(async (res, rej) => {
            const prod = await productModel.findOneAndUpdate({ _id: id }, product).lean()
            res(prod);

        })

    }
    ,
    getUser: (id) => {
        return new Promise(async (res, rej) => {
            const user = await userModel.findById(id).lean();
            res(user);
        })
    },

    getAllBookings: () => {
        return new Promise(async (res, rej) => {
            const bookings = await bookingModel.aggregate([{
                $unwind: '$bookings'
            }]);
            res(bookings);
        })
    },
    changeStatus: (orderId, status) => {
        return new Promise(async (res, rej) => {
            const stat = await orderModel.updateOne({ _id: orderId },
                { $set: { 'products.$[].orderStatus': status } })
            res(stat);
        })

    },

    activeUsers: () => {
        return new Promise(async (res, rej) => {
            const active = await userModel.find({ isActive: true })
            res(active);
        })
    },

    getRevenue: () => {
        return new Promise(async (res, rej) => {
            const revenue = await orderModel.aggregate([
                {
                    $match: {
                        status: 'placed',
                    }
                }, {
                    $group: {
                        _id: null,
                        totalAmount: {
                            $sum: {
                                $toDecimal: "$totalAmount"
                            }
                        }
                    }
                }

            ])
            console.log(revenue)
            res(revenue[0])
        })
    },
    getProfit: () => {
        return new Promise(async (res, rej) => {
            const profit = await orderModel.aggregate([
                {
                    $match: {
                        status: "delivered",
                    }
                }, {
                    $group: {
                        _id: null,
                        totalAmount: {
                            $sum: {
                                $toDecimal: "$totalAmount"
                            }
                        }
                    }

                }
            ])
            res(profit[0]);
        })

    },
    findTotalCod: () => {
        return new Promise(async (res, rej) => {
            const totalCod = await orderModel.find({ paymentMethod: 'COD' })
            res(totalCod);
        })
    },
    findTotalCodAmount: () => {
        return new Promise(async (res, rej) => {
            const totalAmount = await orderModel.aggregate([{
                $match: {
                    paymentMethod: "COD"
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: {
                        $sum: {
                            $toDecimal: "$totalAmount"
                        }
                    }
                }

            }
            ])
            res(totalAmount[0])
        })
    },
    findTotalOnline: () => {
        return new Promise(async (res, rej) => {
            const totalOnline = await orderModel.find({ paymentMethod: 'online' })
            res(totalOnline);
        })
    },
    findTotalOnlineAmount: () => {
        return new Promise(async (res, rej) => {
            const totalAmount = await orderModel.aggregate([{
                $match: {
                    paymentMethod: "online"
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: {
                        $sum: {
                            $toDecimal: "$totalAmount"
                        }
                    }
                }

            }
            ])
            res(totalAmount[0]);
        })
    },

    getDeliveryStatus: () => {
        const deliveryStatus = []
        return new Promise(async (res, rej) => {
            const onTheWay = await orderModel.aggregate([
                {
                    $unwind: "$products"
                },
                {
                    $match: {
                        "products.orderStatus": "on the way"

                    }
                }
            ])
            let orderontheway = onTheWay.length;
            deliveryStatus.push(orderontheway);

            const preparing = await orderModel.aggregate([
                {
                    $unwind: '$products'
                },
                {
                    $match: {
                        "products.orderStatus": "preparing"
                    }
                }

            ])
            let orderPreparing = preparing.length;
            deliveryStatus.push(orderPreparing);

            const completed = await orderModel.aggregate([
                {
                    $unwind: "$products"
                },
                {
                    $match: {
                        "products.orderStatus": "completed"
                    }
                }

            ])
            let orderCompleted = completed.length;
            deliveryStatus.push(orderCompleted);

            const cancel = await orderModel.aggregate([
                {
                    $unwind: "$products"
                },
                {
                    $match: {
                        "products.orderStatus": "canceled"
                    }
                }
            ])
            let orderCancel = cancel.length;
            deliveryStatus.push(orderCancel);
            res(deliveryStatus);
        })

    },

    getPaymentStatus: () => {
        const payment = [];
        return new Promise(async (res, rej) => {
            const cod = await orderModel.aggregate([{
                $match: {
                    paymentMethod: "COD",
                },
            },
            ])
            let codLength = cod.length;
            payment.push(codLength);

            const online = await orderModel.aggregate([{
                $match: {
                    paymentMethod: "online"
                }
            },
            ])
            let onlineLength = online.length;
            payment.push(onlineLength);

            res(payment);
        })


    },

    getAllOrders : () => {
        return new Promise (async (res,rej) => {
            const orders = await orderModel.find({});
            let ordersLength = orders.length ;
            res(ordersLength);
        })
    }

}


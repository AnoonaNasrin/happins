const mongoose = require('mongoose')
const userModel = require("../model/userschema");
const productModel = require("../model/productschema");
const bcrypt = require("bcrypt");
const { response } = require("express");
const carthelpers = require("./carthelpers");
const cartModel = require('../model/cartschema')
const orderModel = require('../model/orderschema');
const Razorpay = require('razorpay');
const crypto = require('crypto')
const ObjectId = mongoose.Types.ObjectId
require('dotenv').config();

const secretKey = process.env.RAZOR_PAY_SECRETKEY;
const keyId = process.env.RAZOR_PAY_KEY_ID;

const instance = new Razorpay({
  key_id: keyId,
  key_secret: secretKey,
});

module.exports = {
  doLogin: async (userData) => {
    return new Promise(async (res, rej) => {
      const user = await userModel.findOne({ email: userData.email });
      console.log(user);
      if (user) {
        if (await bcrypt.compare(userData.password, user.password)) {
          res({
            user: user,
            status: true
          });
        } else {
          res({
            user: null,
            status: false
          });
        }
      } else {
        res({
          user: null,
          status: false
        });

      }
    })

  },
  doSignup: async (userData) => {
    return new Promise(async (res, rej) => {
      let valid = {};
      const user = await userModel.findOne({ email: userData.email });

      if (user) {
        valid.exist = true;
        res(valid);
      } else {
        console.log(userData);
        userData.password = await bcrypt.hash(userData.password, 10);

        const newUser = await userModel.create(userData);
        res(newUser);
      }
    });
  },
  doExist: (userData) => {
    return new Promise(async (res, rej) => {
      let exist = {};
      const userEmail = await userModel.findOne({ email: userData.email });
      const userNumber = await userModel.findOne({ number: userData.number });

      exist.email = userEmail ? true : false;
      exist.number = userNumber ? true : false;
      res(exist);
    });
  },
  getAllProduct: () => {
    return new Promise(async (res, rej) => {

      const product = await productModel.find({}).lean();
      res(product);
    })
  },
  category: (type) => {
    return new Promise(async (res, rej) => {
      const categ = await productModel.find({ category: type }).lean()
      res(categ)
    })
  }
  ,
  getUserByNumber: (userNumber) => {
    return new Promise(async (res, rej) => {
      const user = await userModel.findOne({ number: userNumber }).lean();
      if (user) {
        res({ status: true, user: user })
      } else {
        res({ status: false, user: null })
      }
    })
  },
  placeOrder: (order, products, total) => {
    return new Promise(async (res, rej) => {
      console.log(order, products, total);
      const status = order.method == 'COD' ? 'placed' : 'pending'
      const Orderobj = {
        deliveryDetails: {
          mobile: order.mobile,
          address: order.address,
          pincode: order.pincode
        },
        userId: order.userId,
        paymentMethod: order.method,
        products: products,
        totalAmount: total,
        status: status,
      }
      const delivery = await orderModel.create(Orderobj)
      carthelpers.deleteCart(order.userId);
      res(delivery._id.toString())
    }
    )
  }
  ,
  getProductList: (userId) => {
    return new Promise(async (res, rej) => {
      const cart = await cartModel.findOne({ userId: userId }).lean();
      res(cart.products);
    }
    )
  },
  generateRazorpay: (orderId, totalPrice) => {
    return new Promise((res, rej) => {
      const options = {
        amount: totalPrice * 1000,
        currency: "INR",
        receipt: orderId
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log(err)
        } else {
          console.log("New Order :", order);
          res(order)
        }
      });
    })
  },
  verifyPayment: (Details) =>
    new Promise((resolve, reject) => {
      let hmac = crypto.createHmac("sha256", secretKey);

      hmac.update(
        Details["response[razorpay_order_id]"] +
        "|" +
        Details["response[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");
      if (hmac == Details["response[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    }),
  changePaymentStatus: (orderId) => {
    return new Promise(async (res, rej) => {
      const changePayment = await orderModel.updateOne({ _id: orderId }, {
        $set: {
          status: "placed"
        }
      })
      res();
    })
  },

  getOrders: (userId) => {
    return new Promise(async (res, rej) => {
      const orders = await orderModel.aggregate([
        {
          $match: {
            userId: ObjectId(userId),
            status: 'placed'
          }
        },
        { $unwind: "$products" },
        {
          $project: {
            totalAmount: 1,
            paymentMethod: 1,
            createdAt: 1,
            quantity: "$products.quantity",
            productId: "$products.productId",
            deliveryDetails: 1
          }
        },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: 'products'
          }
        },
        {
          $project: {
            quantity: 1,
            paymentMethod: 1,
            totalAmount: 1,
            createdAt: 1,
            deliveryDetails: 1,
            product: {
              $arrayElemAt: ["$products", 0]
            }
          },
        }
      ])
      res(orders);
    })

  },
  getUser: (userId) => {
    return new Promise(async (res, rej) => {
      const user = await userModel.findOne({ _id: userId }).lean()
      res(user);
    })
  },
  cancelOrder: (orderId, productId) => {
    return new Promise(async (res, rej) => {
      const cancel = await orderModel.updateOne(
        {
          _id: ObjectId(orderId)
        },
        {
          $pull:
          {
            products:
            {
              productId: ObjectId(productId)
            }
          }
        })
      res(cancel);
    })
  },

  getOrderDetails: () => {
    return new Promise(async (res, rej) => {
      const orderDetails = await orderModel.aggregate([{
        $unwind: "$products"
      },
      {
        $lookup: {
          from: "userfoods",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $project: {
          paymentMethod: 1,
          createdAt: 1,
          totalAmount: 1,
          deliveryDetails: 1,
          orderStatus:"$products.orderStatus",
          quantity: "$products.quantity",
          productId: "$products.productId",
          products: 1,
          user: {
            $arrayElemAt: ['$user', 0]
          }
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product",
        }
      },
      {
        $project: {
          paymentMethod: 1,
          createdAt: 1,
          totalAmount: 1,
          deliveryDetails: 1,
          quantity: 1,
          user: 1,
          orderStatus:1,
          product: {
            $arrayElemAt: ['$product', 0]
          }
        }
      },
      ])
      res(orderDetails);
    }
    )
  },
  addAddress: (userId, details) => {
    return new Promise(async (req, res) => {
      const address = await userModel.updateOne({
        _id: userId
      }, {
        $push: { addressDetails: details }
      })
      res(address);
    })

  },

  getAddress: (userId) => {
    console.log("get Addres")
    return new Promise(async (res, rej) => {
      const address = await userModel.aggregate([
        {
          $match: { _id: ObjectId(userId) }
        },
        { $unwind: { path: "$addressDetails" } },
        {
          $project: {
            addressDetails: 1,
          },
        }
      ])



      res(address);
    })
  },
  deleteAddress: (userId, addressId) => {
    return new Promise(async (res, rej) => {
      const delet = await userModel.updateOne({
        _id: ObjectId(userId)
      },
        {
          $pull: {
            addressDetails: {
              _id: ObjectId(addressId)
            }
          }
        })
      res(delet)
    })
  },
  getSingleAddress: (userId, addressId) => {
    return new Promise(async (res, rej) => {
      const address = await userModel.aggregate([{
        $match: { _id: ObjectId(userId) }
      },
      { $unwind: { path: '$addressDetails' } },
      { $match: { 'addressDetails._id': ObjectId(addressId) } },

      ])
      res(address[0])
    })

  },

  getOrdersTotal: (userId) => {
    return new Promise(async (res, rej) => {
      const orders = await orderModel.aggregate([
        {
          $match: {
            userId: ObjectId(userId),
            status: 'placed'
          }
        },
        { $unwind: "$products" },
        {
          $project: {
            totalAmount: 1,
            paymentMethod: 1,
            createdAt: 1,
            quantity: "$products.quantity",
            productId: "$products.productId",
            deliveryDetails: 1
          }
        },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: 'products'
          }
        },
        {
          $project: {
            quantity: 1,
            paymentMethod: 1,
            totalAmount: 1,
            createdAt: 1,
            deliveryDetails: 1,
            product: {
              $arrayElemAt: ["$products", 0]
            }
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $multiply: ["$quantity", "$product.price"]
              }
            }
          }
        }
      ])
      if (orders.length > 0) {
        res(orders[0].total);
      } else {
        res(0);
      }
    })

  },
}


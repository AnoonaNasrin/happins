const express = require("express");
const { doExist } = require("../../helpers/userhelpers");
const userHelper = require("../../helpers/userhelpers");
const otpHelper = require("../../helpers/otphelper");
const { asyncWrapper } = require("../../middleware/asyncwrapper");
const categoryhelper = require("../../helpers/categoryhelpers");
const adminhelpers = require("../../helpers/adminhelpers");
const carthelpers = require('../../helpers/carthelpers');
const bookinghelper = require("../../helpers/bookinghelper");
const coupenhelpers = require("../../helpers/coupenhelpers");
const { response } = require("express");
const moment = require('moment')

const { checkLogin } = require('../../middleware/checkLogin')



const router = express.Router();
let otpError = false;
let getOtp = false;
let mobError = false;
let loginErr = false;

/* GET users listing. */

router.get("/login", function (req, res) {
  if (req.session.user == true) {
    const user = req.session.user;
    res.redirect("/");
  } else {
    res.render("users/userlogin", { user: true, loginErr });
    loginErr = false
  }
});

router.post("/login", asyncWrapper(async (req, res) => {
  const result = await userHelper.doLogin(req.body)
  if (result.status) {
    req.session.user = true;
    req.session.userDetail = result.user;
    res.redirect("/");
  } else {
    loginErr = true
    res.redirect("/login");
  }
}));

/* GET otp login */

router.get('/otplogin', asyncWrapper(async (req, res) => {
  res.render('users/otplogin', { user: true, getOtp: getOtp, mobError: mobError })
  getOtp = false;
  mobError = false
}));

router.post('/otplogin', asyncWrapper(async (req, res) => {
  const user = await userHelper.getUserByNumber(req.body.number)
  console.log(user);
  if (user.status == true) {
    getOtp = true;
    req.session.userInfo = user.user;
    res.redirect('/otplogin-verification')
  } else {
    mobError = true
    res.redirect('/otplogin');
  }
}))

router.get("/otplogin-verification", asyncWrapper(async (req, res) => {
  const userInfo = req.session.userInfo;
  const otp = await otpHelper.doSms(userInfo.number);
  console.log(otp);
  res.render("users/otpscreen", { otp, otpError, user: true, userLogin: req.session.user });
  otpError = false;
}));

router.post("/otplogin-verification", asyncWrapper(async (req, res) => {
  const userInfo = req.session.userInfo;
  const { first, second, third, fourth, fifth, sixth } = req.body;
  const code = first + second + third + fourth + fifth + sixth;
  const verify = await otpHelper.otpVerify(userInfo.number, code);

  if (verify.valid) {
    req.session.user = true
    req.session.userDetail = userInfo
    res.redirect("/");
  } else {
    otpError = true;
    res.redirect("/otplogin-verification");
  }
}));

/* GET signup */

router.get("/signup", (req, res) => {
  let existEm = req.session.existEmail;
  let existNu = req.session.existNumber;
  res.render("users/usersignup", { existEm, existNu, user: true });
});

router.post("/signup", asyncWrapper(async (req, res) => {
  console.log(req.body);
  const result = await userHelper.doExist(req.body);
  console.log(result);
  if (result.email || result.number == true) {
    req.session.existEmail = result.email;
    req.session.existNumber = result.number;
    res.redirect("/signup");
  } else {
    req.session.userInfo = req.body;
    res.redirect("/otp-verification");
  }
}));

router.get("/otp-verification", asyncWrapper(async (req, res) => {
  const userInfo = req.session.userInfo;
  const otp = await otpHelper.doSms(userInfo.number);
  console.log(otp);
  res.render("users/otpscreen", { otp, otpError, user: true });
  otpError = false;
}));

router.post("/otp-verification", asyncWrapper(async (req, res) => {
  const userInfo = req.session.userInfo;
  const { first, second, third, fourth, fifth, sixth } = req.body;
  const code = first + second + third + fourth + fifth + sixth;
  const verify = await otpHelper.otpVerify(userInfo.number, code);

  if (verify.valid) {
    const user = await userHelper.doSignup(userInfo);
    const coupen = await coupenhelpers.createCoupen(user._id,
      {
        coupenCode: "First!20",
        coupenOffer: 20,
        coupenType: "New user",
        minAmount: 50,
      })
    res.redirect("/login");
  } else {
    otpError = true;
    res.redirect("/otp-verification");
  }
}));

/* Get menu */

router.get('/menu', asyncWrapper(async (req, res) => {
  const product = await userHelper.getAllProduct()
  const category = await categoryhelper.getCategory()
  console.log(category);
  res.render('users/usermenu', { product, user: true, category, userLogin: req.session.userDetail });
}));

router.get('/menus/:id', asyncWrapper(async (req, res) => {
  const id = req.params.id;
  const category = await categoryhelper.getCategory()
  const product = await adminhelpers.getElements(id);
  console.log(product);
  res.render('users/usermenu', { product, user: true, category });
}));

router.get('/item-detail/:id', asyncWrapper(async (req, res) => {
  const id = req.params.id;
  const product = await adminhelpers.getProduct(id);
  const relatedProduct = await adminhelpers.getElements(product.category)
  res.render('users/itemdetails', { user: true, product, relatedProduct })
}))

router.get("/", (req, res) => {
  res.render("users/userhome", { user: true, userLogin: req.session.userDetail });
});

/* Get cart */

router.get('/cart', checkLogin, asyncWrapper(async (req, res) => {
  req.session.coupen = {
    status: false,
  };
  const userId = req.session.userDetail._id;
  const product = await carthelpers.getProduct(userId);
  product.forEach((element) => {
    element.total = parseInt(element.product.price) * parseInt(element.count);
  })
  const total = await carthelpers.getTotal(userId);
  const coupens = await coupenhelpers.getCoupen(userId)
  res.render('users/usercart', { user: true, product, total, coupens, userLogin: req.session.userDetail })
}));

router.post("/changecount", checkLogin, asyncWrapper(async (req, res) => {
  const response = await carthelpers.changeProductQuantity(req.body)
  res.json(response);
}))

router.post("/applyCoupen", checkLogin, async (req, res) => {
  const userId = req.session.userDetail._id;
  const response = await coupenhelpers.applyCoupen(
    req.body.totalPrice,
    req.body.coupenCode,
    userId
  );
  req.session.coupen = response;
  res.json(response);
});

router.post('/cart-item-delete', checkLogin, asyncWrapper(async (req, res) => {
  const response = await carthelpers.deleteItem(req.body)
  res.json(response);
}))

router.get('/add-to-cart/:id', checkLogin, asyncWrapper(async (req, res) => {
  const productId = req.params.id;
  const userId = req.session.userDetail._id;
  const add = await carthelpers.addProduct(userId, productId);
  res.redirect('/cart')
}));

/* Plce order */

router.get('/place-Order', checkLogin, asyncWrapper(async (req, res) => {
  console.log("place")
  const userId = req.session.userDetail._id;
  const address = await userHelper.getAddress(userId);
  const product = await carthelpers.getProduct(userId);
  const totalPrice = await carthelpers.getTotal(userId);
  const coupen = req.session.coupen
  let total;
  if (coupen.status == true) {
    total = coupen.price;
  } else {
    total = totalPrice
  }
  const priceDetails = {
    totalPrice,
    total,
    discount: parseInt(totalPrice - total) * -1,
  };
  res.render('users/placeorder', { user: true, userId, address, product, priceDetails, userLogin: req.session.userDetail });
}))

router.post('/place-Order', checkLogin, asyncWrapper(async (req, res) => {
  const userId = req.session.userDetail._id;
  const product = await userHelper.getProductList(userId);
  const totalPrice = await carthelpers.getTotal(userId)
  const coupen = req.session.coupen
  let total;
  if (coupen.status == true) {
    total = coupen.price;
  } else {
    total = totalPrice
  }
  const order = req.body;
  const address = await userHelper.getSingleAddress(userId, order.addressId);
  order.mobile = address.addressDetails.phone;
  order.pincode = address.addressDetails.pincode;
  order.address = address.addressDetails.address;
  const orderId = await userHelper.placeOrder(order, product, total);
  if (order.method == 'COD') {
    res.json({ cod: true })
  } else {
    const response = await userHelper.generateRazorpay(orderId, total)
    res.json(response)
  }
}
));

router.get('/order-successful', checkLogin, asyncWrapper(async (req, res) => {
  const coupen = req.session.coupen;
  const userId = req.session.userDetail._id
  if (coupen && coupen.status) {
    await coupenhelpers.deleteCoupen(userId, coupen.coupenCode);
  }
  res.render('users/ordersuccess', { user: true, userLogin: req.session.userDetail })
}))

router.post('/verify-payment', checkLogin, asyncWrapper(async (req, res) => {
  console.log(req.body);
  try {
    const verify = await userHelper.verifyPayment(req.body)
    const payment = await userHelper.changePaymentStatus(req.body["order[receipt]"]);
    res.json({
      verify: true
    });
  } catch (error) {
    console.log(error);
    res.json({
      verify: false
    })
  }
}))

router.get('/orders', checkLogin, asyncWrapper(async (req, res) => {
  const userId = req.session.userDetail._id;
  const orders = await userHelper.getOrders(userId)
  const orderTotal = await userHelper.getOrderTotalPayment(userId)
  console.log(orderTotal);

  orders.forEach((e) => {
    e.createdAt = moment(e.createdAt).format("L");
  });
  res.render('users/orderdetail', { orders, orderTotal, user: true, userr: req.session.userDetail, userLogin: req.session.userDetail });
})
)

router.post('/cancelOrder', checkLogin, asyncWrapper(async (req, res) => {
  const orderId = req.body.orderId;
  const productId = req.body.productId;
  console.log(req.body);
  const cancel = await userHelper.cancelOrder(orderId, productId)
  res.json({ delete: true });
}))



/* Booking table */

router.get('/booktable', checkLogin, (req, res) => {
  res.render('users/userbook', { user: true, userLogin: req.session.userDetail })
})

router.post('/booktable', checkLogin, asyncWrapper(async (req, res) => {
  const userId = req.session.userDetail._id;
  const booking = await bookinghelper.addBooking(userId, req.body);
  res.json(booking);
}))

router.get("/bookings", checkLogin, (req, res) => {
  res.render("users/mybooking", { user: true, userLogin: req.session.userDetail });
})

router.post('/delete-booking', checkLogin, asyncWrapper(async (req, res) => {
  const date = req.body.bookDate;
  const bookId = req.body.bookId;
  const count = req.body.count;
  const bookingCancel = await bookinghelper.deleteBooking(bookId, date, count)
  res.json({});
}))

router.get('/mybooking', checkLogin, asyncWrapper(async (req, res) => {
  const userId = req.session.userDetail._id;
  const bookings = await bookinghelper.getBookingData(userId)
  res.render('users/mybooking', { bookings, userLogin: req.session.userDetail })
}))

/**address */


router.get("/profile", checkLogin, asyncWrapper(async (req, res) => {
  const userId = req.session.userDetail._id;
  const users = await userHelper.getUser(userId);
  const address = await userHelper.getAddress(userId);
  res.render("users/userprofile", { user: true, users, address, userLogin: req.session.userDetail });
}));

router.get("/add-address", checkLogin, asyncWrapper(async (req, res) => {
  const userId = req.session.userDetail._id;
  const address = await userHelper.getAddress(userId)
  res.render("users/useraddress", { user: true, address, userLogin: req.session.userDetail });
}));

router.post('/save-address', checkLogin, asyncWrapper(async (req, res) => {
  console.log(req.body)
  const userId = req.session.userDetail._id;
  const address = await userHelper.addAddress(userId, req.body);
  res.json({});
}))

router.post('/deleteaddress', checkLogin, async (req, res) => {
  const userId = req.session.userDetail._id;
  const delet = await userHelper.deleteAddress(userId, req.body.addressId)
  res.json({})
})


/**chef */

router.get('/chef', (async (req, res) => {
  res.render('users/userchef', { user: true, userLogin: req.session.userDetail })
}))

router.get('/about', async (req, res) => {
  res.render('users/userabout', { user: true, userLogin: req.session.userDetail })
})
/** logout */

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

module.exports = router;
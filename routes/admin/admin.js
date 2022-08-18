const express = require("express");
const router = express.Router();
const multer = require("multer");
const adminHelpers = require("../../helpers/adminhelpers");
const categoryhelpers = require("../../helpers/categoryhelpers");
const userhelpers = require("../../helpers/userhelpers");
const { asyncWrapper } = require("../../middleware/asyncwrapper");
const moment = require('moment');
const { adminLogin } = require('../../middleware/checkLogin');
const bookinghelper = require("../../helpers/bookinghelper");
const asyncwrapper = require("../../middleware/asyncwrapper");

/**multer */

const storages = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "public/upload");
  },
  filename: (req, file, callback) => {
    callback(null, file.fieldname + "-" + Date.now() + ".jpg");
  },
});

const upload = multer({
  storage: storages,
});

let loginErr = false;

/**login*/
router.get("/", asyncWrapper(async (req, res) => {d
  if (req.session.admin == true) {
    const users = await adminHelpers.getAllUser()
    const active = await adminHelpers.activeUsers()
    const revenue = await adminHelpers.getRevenue()
    const profit = await adminHelpers.getProfit()
    const cod = await adminHelpers.findTotalCod() 
    const online = await adminHelpers.findTotalOnline()
    const totalOnline = await adminHelpers.findTotalOnlineAmount()
    const findTotalCodAmount = await adminHelpers.findTotalCodAmount()
    const ordersLength = await adminHelpers.getAllOrders()
    const data = {
      totalUsers: users.length,
      totalActiveUsers: active.length,
      revenue: revenue,
      profit: profit,
      totalOnline: totalOnline,
      totalCod: findTotalCodAmount,
      ordersLength:ordersLength,
      cod : cod.length,
      online: online.length, 
    }
    res.render("admin/adminhome", { admin: true, data, });
  } else {
    res.redirect("/admin/login");
  }
}));


router.get("/login", (req, res) => {
  if (req.session.admin == true) {
    res.redirect("/admin", { admin: true });
  } else {
    res.render("admin/adminlogin", { loginErr, admin: true });
    loginErr = false;
  }
});

router.post("/login", asyncWrapper(async (req, res) => {
  const admin = req.body;
  const adlogin = await adminHelpers.adminLogin(admin)
  if (adlogin) {
    req.session.admin = true;
    res.redirect("/admin");
  } else {
    loginErr = true;
    res.redirect("/admin/login");
  }
}));

/** dashboard */


/**addproduct */

router.get("/addproduct", adminLogin, asyncWrapper(async (req, res) => {
  const category = await categoryhelpers.getCategory();
  res.render("admin/addproduct", { admin: true, category });
}));

router.post("/addproduct", upload.single("image"), asyncWrapper(async (req, res) => {
  const product = req.body;
  product.image = req.file.filename;
  const pro = await adminHelpers.addproduct(product);
  res.redirect("/admin/addproduct");
}));

/**product management */

router.get('/productmanagement', adminLogin, asyncWrapper(async (req, res) => {
  const product = await adminHelpers.getAllProduct();
  const category = await categoryhelpers.getCategory();
  res.render("admin/productmanagement", { product, admin: true, category })
}));

/**delete product */
router.get('/productmanagement/delete/:id', adminLogin, asyncWrapper(async (req, res) => {
  const id = req.params.id;
  const delet = await adminHelpers.deleteProduct(id);
  res.redirect("/admin/productmanagement");
}));

/**edit product */
router.get('/productmanagement/edit', adminLogin, asyncWrapper(async (req, res) => {
  const id = req.query.id;
  const upd = await adminHelpers.getProduct(id);
  console.log(upd);
  res.render('admin/editproduct', { upd, admin: true })
}));

router.post('/editproduct/:id', upload.single('image'), asyncWrapper(async (req, res) => {
  const id = req.params.id;
  const prod = req.body;
  const updt = await adminHelpers.updateProduct(id, prod);
  res.redirect('/admin/productmanagement')

}));

/** user management*/

router.get("/usermanagement", adminLogin, asyncWrapper(async (req, res) => {
  const users = await adminHelpers.getAllUser();
  console.log(users);
  res.render("admin/usermanagement", { users, admin: true });
}));

/**block user */
router.get("/usermanagement/block/:id", adminLogin, asyncWrapper(async (req, res) => {
  const id = req.params.id;
  const user = await adminHelpers.getUser(id);
  if (user.isActive == true) {
    const block = await adminHelpers.blockUser(id, false);
  } else {
    const block = await adminHelpers.blockUser(id, true);
  }
  res.redirect("/admin/usermanagement");
}));

/**order management */

router.get('/order-management', adminLogin, asyncWrapper(async (req, res) => {
  const management = await userhelpers.getOrderDetails();
  management.forEach((e) => {
    e.createdAt = moment(e.createdAt).format("L");
  });
  res.render('admin/ordermanagement', { admin: true, management })
}))

router.post('/change-status', asyncWrapper(async (req, res) => {
  const orderId = req.body.orderId;
  const status = req.body.status;
  const changeStatus = await adminHelpers.changeStatus(orderId, status);
  req.json({});
}))

router.post('/delivery-check', asyncWrapper(async (req, res) => {
  const deliveryStatus = await adminHelpers.getDeliveryStatus();
  const paymentStatus = await adminHelpers.getPaymentStatus()
  
  console.log(deliveryStatus)
  console.log(paymentStatus);
  res.json({ deliveryStatus ,paymentStatus  })
}))

/** booking management  */

router.get('/booking-management', adminLogin, asyncWrapper(async (req, res) => {
  const booking = await adminHelpers.getAllBookings();
  console.log(booking)
  res.render('admin/bookingmanagement', { admin: true, booking })
}))



/** Logout */

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/admin/login");
});

module.exports = router;

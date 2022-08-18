const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const session = require("express-session");
const hbs = require("express-handlebars");
const nocache = require("nocache");
const { errorHandler } = require("./middleware/errorhandler");
const usersRouter = require("./routes/users/users");
const adminRouter = require("./routes/admin/admin");
const connect = require("./connect/config");
const errorhandler = require("./middleware/errorhandler");

var app = express();

const start = async () => {
  try {
    const url = "mongodb://localhost:27017/happins";
    await connect(url);
    console.log("Data base connected");
  } catch (error) {
    console.log("Data base error", error);
  }
};
start();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

app.engine(
  "hbs",
  hbs.engine({
    extname: "hbs",
    defaultLayout: "layout",
    layoutsDir: __dirname + "/views",
    partialsDir: __dirname + "/views/partials",
  })
);

app.use(nocache());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({ secret: "itc", reserve: false, saveUninitialized: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/admin", express.static(path.join(__dirname, "public")));
app.use("/admin/usermanagement/edit", express.static(path.join(__dirname, "public")))
app.use("/admin/productmanagement/edit", express.static(path.join(__dirname, "public")))
app.use("/menu", express.static(path.join(__dirname, 'public')))
app.use('/cart/:id', express.static(path.join(__dirname, "public")))
app.use('/item-detail/:id', express.static(path.join(__dirname, 'public')))
app.use('/menu/:id', express.static(path.join(__dirname, "public")))


app.use("/", usersRouter);
app.use("/admin", adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res) {
  res.render("error/404-page");
});

app.use(errorHandler);

module.exports = app;

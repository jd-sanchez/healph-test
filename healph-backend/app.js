require('dotenv').config();
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const compression = require("compression");
const cors = require("cors");
const rfs = require("rotating-file-stream");

const userRouter = require("./routes/user_routes.js");
const intakeRouter = require("./routes/daily_intake_routes.js");
const mealRouter = require("./routes/meal_routes.js");
const mealnameRouter = require("./routes/mealname_routes.js");
const reportRouter = require("./routes/report_routes.js");
const indexRouter = require("./routes/index");
const rankingRouter = require("./routes/ranking_routes.js");
const adminRouter = require("./routes/admin_routes.js");
const dashboardRouter = require("./routes/dashboard_routes.js");

const app = express();

// Set up mongoose connection
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

const dev_db_url =
  "mongodb+srv://testadmin:MaDFhk14d6RNVcjo@cluster0.9fuqzsp.mongodb.net/healph";
const mongoDB = process.env.MONGODB_URI || dev_db_url;


var accessLogStream = rfs.createStream('access.log', {
  interval: '1d', // rotate daily
  path: path.join(__dirname, 'log')
})

main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(mongoDB);
}

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(
  cors({
    origin: "http://localhost:5000", // Replace with client's domain
    credentials: true, // Enable credentials (cookies, HTTP credentials)
  })
);

app.use(logger("combined", {stream: accessLogStream}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", userRouter);
app.use("/intakes", intakeRouter);
app.use("/meals", mealRouter);
app.use("/mealnames", mealnameRouter);
app.use("/reports", reportRouter);
app.use("/dashboard", dashboardRouter);
app.use("/rankings", rankingRouter);
app.use("/admins", adminRouter);
app.use("/redirect", (req, res) => {
  throw Error(
    "Insufficient Permissions. Please log in before attempting to access this data."
  );
});

app.use(compression()); // Compress all routes

app.use(express.static(path.join(__dirname, "public")));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;

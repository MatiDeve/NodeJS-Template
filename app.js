// CREATE app.js FILE IN shared FOLDER AND COPY THIS WITH YOUR INFO
// module.exports = {
//   "MONGODB_URL": "mongodb://localhost:27017/db",
//   "MONGODB_DB": "db",
//   "SECRET_SESSION": "password"
// }

const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const formidable = require("express-form-data");
const methodOverride = require("method-override");
const helmet = require('helmet');
const MongoDBStore = require('connect-mongodb-session')(session);
const mongoose = require("mongoose");
const shared = require("./shared/app");
mongoose.connect(shared.MONGODB_URL, { useNewUrlParser: true });

var admin_app = require("./admin-app.js");

var session_middleware = require("./middlewares/session");

const formidable_options = {
  uploadDir: "./public/images/",
  autoClean: false
};

var app = express();

app.use(bodyParser.json());
app.use(helmet());
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "pug");
app.use("/public", express.static("public"));
app.use(formidable.parse(formidable_options));
app.use(methodOverride("_method"));

var store = new MongoDBStore({
    uri: shared.MONGODB_URL,
    databaseName: shared.MONGODB_DB,
    collection: 'sessions'
});

store.on('error', function(error) {
	console.log("error ocurred.");
});

app.use(require('express-session')({
    secret: shared.SECRET_SESSION,
    cookie: {
	    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    },
    store: store,
    resave: true,
    saveUninitialized: true
}));

app.use("/*", session_middleware);

app.get("/", (req, res) => {
  var params = {};
  if(req.session.email_alert){
    params.alert = req.session.email_alert;
    req.session.email_alert = null;
  }

  if(req.session.email_success){
      params.success = req.session.email_success;
      req.session.email_success = null;
  }

	res.render("app-index", params);
})

app.use("/admin", admin_app);

app.get("/*", (req, res) =>{
    res.render("404");
} );

app.post("/*", (req, res) =>{
    res.render("404");
} );

app.listen(8080);

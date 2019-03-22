const express = require("express");
const router = express.Router();
const Admin = require("./models/admin");

const admin_admin_app = require("./admin-admin-app.js");
const admin_category_app = require("./admin-category-app.js");
const admin_subcategory_app = require("./admin-subcategory-app.js");
const admin_product_app = require("./admin-product-app.js");
const check_session_middleware = require("./middlewares/check-session");
const check_not_session_middleware = require("./middlewares/check-not-session");
const check_super_admin_middleware = require("./middlewares/check-super-admin");

router.get("/", check_session_middleware, (req, res) => {

  Admin.findById(req.session.admin).exec((error, admin) => {
    if(admin){
      let params = {
        admin: admin
      };

      if(req.session.alert){
        params.alert = req.session.alert;
        req.session.alert = null;
      }

      if(req.session.success){
        params.success = req.session.success;
        req.session.success = null;
      } 

      res.render("admin-index", params);
    }else{
      req.session.admin = null;
      res.redirect("./login");
    }
  })
});

router.route("/login")
  .get(check_not_session_middleware, (req, res) => {
    let params = {};

    if(req.session.data){
      params.email = req.session.data.email;
      params.password = req.session.data.password;
      req.session.data = null;
    }

    if(req.session.alert){
      params.alert = req.session.alert;
      req.session.alert = null;
    }

    if(req.session.success){
      params.success = req.session.success;
      req.session.success = null;
    } 

    res.render("admin-login", params);
  })
  .post(check_not_session_middleware, (req, res) => {
    Admin.login(req.body.email, req.body.password, (success, status, body) => {
      if(success){
        req.session.admin = body.admin;
        res.redirect("./");
      }else{
        req.session.data = {
          email: req.body.email,
          password: req.body.password
        }
        req.session.alert = body.message;
        res.redirect("./login");
      }
    })
  })

router.get("/logout", (req, res) => {
  req.session.admin = null;
  res.redirect("./login");
})

router.use("/admins", check_super_admin_middleware, admin_admin_app);
router.use("/categories", check_session_middleware, admin_category_app);
router.use("/subcategories", check_session_middleware, admin_subcategory_app);
router.use("/products", check_session_middleware, admin_product_app);


module.exports = router;
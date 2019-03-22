const express = require("express");
const router = express.Router();
const Subcategory = require("./models/subcategory");
const Category = require("./models/category");

router.route("/")
  .get((req, res) => {
    Subcategory.findAll((error, subcategories) => {
      let params = {};
  
      if(req.session.alert){
        params.alert = req.session.alert;
        req.session.alert = null;
      }
  
      if(req.session.success){
        params.success = req.session.success;
        req.session.success = null;
      }   
  
      if(error){
        console.log("error: "+error);
        res.send("Ha ocurrido un error. Contacte al programador.");
      }else if(subcategories){
        params.subcategories = subcategories
        res.render("admin-subcategory-index", params);
      }else{
        res.render("admin-subcategory-index", params);
      }
    })
  });

router.route("/new")
  .get((req, res) => {

    Category.findAll((error, categories) => {
      if(categories && categories.length){
        let params = {
          categories: categories
        };

        if(req.session.alert){
          params.alert = req.session.alert;
          req.session.alert = null;
        }

        res.render("admin-subcategory-new", params);
      }else{
        req.session.alert = "Primero debe crear las categorías.";
        res.redirect("./");
      }
    })
  })
  .post((req, res) => {
    Subcategory.add(req.session.admin, req.body, req.files.pic, (success, status, body) => {
      if(success){
        req.session.success = body.message;
        res.redirect("./");
      }else{
        req.session.alert = body.message;
        res.redirect("./new");
      }
    })
  })

router.route("/:id/edit")  
  .get((req, res) => {
    Subcategory.findById(req.params.id).exec((error, subcategory) => {
      Category.findAll((error, categories) => {
        if(categories && categories.length){
          if(subcategory){
            let params = {
              subcategory: subcategory,
              categories: categories
            };
    
            if(req.session.alert){
              params.alert = req.session.alert;
              req.session.alert = null;
            }
        
            res.render("admin-subcategory-edit", params);
          }else{
            req.session.alert = "Subactegoría no encontrada.";
            res.redirect("../");
          }
        }else{
          req.session.alert = "Primero debe crear las categorías.";
          res.redirect("./");
        }
      })
    })
  })
  .post((req, res) => {
    Subcategory.modify(req.session.admin, req.params.id, req.body, req.files.pic, (success, status, body) => {
      if(success){
        req.session.success = body.message;
        res.redirect("../");
      }else{
        req.session.alert = body.message;
        res.redirect("./edit");
      }
    })
  })

router.get("/:id/delete", (req, res) => {
  Subcategory.del(req.params.id, (success, status, body) => {
    if(success){
      req.session.success = body.message;
    }else{
      req.session.alert = body.message;
    }
    res.redirect("../");
  })
})

module.exports = router;
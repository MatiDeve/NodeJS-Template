const express = require("express");
const router = express.Router();
const Category = require("./models/category");
const Subcategory = require("./models/subcategory");

router.route("/")
  .get((req, res) => {
    Category.findAll((error, categories) => {
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
      }else if(categories){
        params.categories = categories
        res.render("admin-category-index", params);
      }else{
        res.render("admin-category-index", params);
      }
    })
  });

router.route("/new")
  .get((req, res) => {
    let params = {};

    if(req.session.alert){
      params.alert = req.session.alert;
      req.session.alert = null;
    }

    res.render("admin-category-new", params);
  })
  .post((req, res) => {
    Category.add(req.session.admin, req.body, req.files.pic, (success, status, body) => {
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
    Category.findById(req.params.id).exec((error, category) => {
      if(category){
        let params = {
          category: category
        };

        if(req.session.alert){
          params.alert = req.session.alert;
          req.session.alert = null;
        }
    
        res.render("admin-category-edit", params);
      }else{
        req.session.alert = "Subcategoría no encontrado.";
        res.redirect("../");
      }
    })
  })
  .post((req, res) => {
    Category.modify(req.session.admin, req.params.id, req.body, req.files.pic, (success, status, body) => {
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
  Category.findById(req.params.id).exec((error, category) => {
    if(category){
      Subcategory.find({category: req.params.id}).exec((error, subcategories) => {
        if(error){
          req.session.alert = "Ha ocurrido un error. Inténtelo nuevamente.";
          res.redirect("../");
        }else if(subcategories && subcategories.length){
          req.session.alert = "No se ha podido eliminar, hay subcategorías que dependen de esta.";
          res.redirect("../");
        }else{
          Category.del(req.params.id, (success, status, body) => {
            if(success){
              req.session.success = body.message;
            }else{
              req.session.alert = body.message;
            }
            res.redirect("../");
          })
        }
      })
    }else{
      req.session.alert = "Categoría no encontrada.";
      res.redirect("../");
    }
  })
})

module.exports = router;
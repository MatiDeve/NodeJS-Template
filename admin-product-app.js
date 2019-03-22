const express = require("express");
const router = express.Router();
const Subcategory = require("./models/subcategory");
const Product = require("./models/product");

router.route("/")
  .get((req, res) => {
    let params = {};
  
    if(req.session.alert){
      params.alert = req.session.alert;
      req.session.alert = null;
    }

    if(req.session.success){
      params.success = req.session.success;
      req.session.success = null;
    }   
    
    Product.findAll((error, products) => {
  
      if(error){
        res.send("Ha ocurrido un error. Contacte al programador.");
      }else if(products){
        params.products = products;
        res.render("admin-product-index", params);
      }else{
        res.render("admin-product-index", params);
      }
    })
  });

router.route("/new")
  .get((req, res) => {

    Subcategory.findAll((error, subcategories) => {
      if(subcategories && subcategories.length){
        let params = {
          subcategories: subcategories
        };

        if(req.session.alert){
          params.alert = req.session.alert;
          req.session.alert = null;
        }

        if(req.session.new_product_data){

          params.code = req.session.new_product_data.code;
          params.name = req.session.new_product_data.name;
          params.ml_link = req.session.new_product_data.ml_link;
          params.description = req.session.new_product_data.description;
          params.price = req.session.new_product_data.price;
          params.discount = req.session.new_product_data.discount;
          params.visible = req.session.new_product_data.visible;
          params.out_of_season = req.session.new_product_data.out_of_season;
          params.highlighted = req.session.new_product_data.highlighted;
          params.added_subcategory = req.session.new_product_data.subcategory;

          req.session.new_product_data = null;
        }

        res.render("admin-product-new", params);
      }else{
        req.session.alert = "Primero debe crear las subcategorías.";
        res.redirect("./");
      }
    })
  })
  .post((req, res) => {
    Product.add(req.session.admin, req.body, req.files.banner, req.files.pics, (success, status, body) => {
      if(success){
        req.session.success = body.message;
        res.redirect("./");
      }else{
        req.session.new_product_data = {
          code: req.body.code,
          name: req.body.name,
          ml_link: req.body.ml_link,
          description: req.body.description,
          price: req.body.price,
          discount: req.body.discount,
          visible: req.body.visible,
          out_of_season: req.body.out_of_season,
          highlighted: req.body.highlighted,
          subcategory: req.body.subcategory
        }
        req.session.alert = body.message;
        res.redirect("./new");
      }
    })
  })

router.route("/:id/edit")  
  .get((req, res) => {
    Product.findById(req.params.id).exec((error, product) => {
      Subcategory.findAll((error, subcategories) => {
        if(subcategories && subcategories.length){
          if(product){
            let params = {
              product: product,
              subcategories: subcategories
            };
    
            if(req.session.alert){
              params.alert = req.session.alert;
              req.session.alert = null;
            }

            if(req.session.edit_product_data){
              params.code = req.session.edit_product_data.code;
              params.name = req.session.edit_product_data.name;
              params.ml_link = req.session.edit_product_data.ml_link;
              params.description = req.session.edit_product_data.description;
              params.price = req.session.edit_product_data.price;
              params.discount = req.session.edit_product_data.discount;
              params.visible = req.session.edit_product_data.visible;
              params.out_of_season = req.session.edit_product_data.out_of_season;
              params.highlighted = req.session.edit_product_data.highlighted;
              params.added_subcategory = req.session.edit_product_data.subcategory;
    
              req.session.edit_product_data = null;
            }else{
              params.code = product.code;
              params.name = product.name;
              params.ml_link = product.ml_link;
              params.description = product.description;
              params.price = product.price;
              params.discount = product.discount;
              
              if(product.visible){
                params.visible = "true";
              }else{
                params.visible = "false";
              }
              
              if(product.out_of_season){
                params.out_of_season = "true";
              }else{
                params.out_of_season = "false";
              }

              if(product.highlighted){
                params.highlighted = "true";
              }else{
                params.highlighted = "false";
              }

              params.added_subcategory = String(product.subcategory._id);         
            }
        
            res.render("admin-product-edit", params);
          }else{
            req.session.alert = "Producto no encontrado.";
            res.redirect("../");
          }
        }else{
          req.session.alert = "Primero debe crear las subcategorías.";
          res.redirect("./");
        }
      })
    })
  })
  .post((req, res) => {
    Product.modify(req.session.admin, req.params.id, req.body, req.files.banner, req.files.pics, (success, status, body) => {
      if(success){
        req.session.success = body.message;
        res.redirect("../");
      }else{
        req.session.edit_product_data = {
          code: req.body.code,
          name: req.body.name,
          ml_link: req.body.ml_link,
          description: req.body.description,
          price: req.body.price,
          discount: req.body.discount,
          visible: req.body.visible,
          out_of_season: req.body.out_of_season,
          highlighted: req.body.highlighted,
          subcategory: req.body.subcategory
        }
        req.session.alert = body.message;
        res.redirect("./edit");
      }
    })
  })

router.get("/:id/delete", (req, res) => {
  Product.del(req.params.id, (success, status, body) => {
    if(success){
      req.session.success = body.message;
    }else{
      req.session.alert = body.message;
    }
    res.redirect("../");
  })
})

module.exports = router;
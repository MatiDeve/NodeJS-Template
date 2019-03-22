const express = require("express");
const router = express.Router();
const Admin = require("./models/admin");

const permissions = ["Administrador General", "Administrador de Productos"];

router.get("/", (req, res) => {
  Admin.findAll((error, admins) => {
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
    }else if(admins){
      params.admins = admins
      res.render("admin-admin-index", params);
    }else{
      res.render("admin-admin-index", params);
    }
  })
});

router.route("/new")  
  .get((req, res) => {
    let params = {
      permissions: permissions
    };

    if(req.session.new_admin_data){
      params.email = req.session.new_admin_data.email;
      params.name = req.session.new_admin_data.name;
      params.surname = req.session.new_admin_data.surname;
      params.oldPermissions = req.session.new_admin_data.permissions;
      req.session.new_admin_data = null;
    }

    if(req.session.alert){
      params.alert = req.session.alert;
      req.session.alert = null;
    }

    res.render("admin-admin-new", params);
  })
  .post((req, res) => {
    Admin.add(req.session.admin, req.body, (success, status, body) => {
      if(success){
        req.session.success = body.message;
        res.redirect("./");
      }else{
        req.session.new_admin_data = {
          email: req.body.email,
          name: req.body.name,
          surname: req.body.surname,
          permissions: req.body.permissions
        }
        req.session.alert = body.message;
        res.redirect("./new");
      }
    })
  })

router.route("/:id/edit")  
  .get((req, res) => {
    Admin.findById(req.params.id).exec((error, admin) => {
      if(admin){
        let params = {
          admin: admin,
          permissions: permissions
        };

        if(req.session.edit_admin_data){
          params.email = req.session.edit_admin_data.email;
          params.name = req.session.edit_admin_data.name;
          params.surname = req.session.edit_admin_data.surname;
          params.oldPermissions = req.session.edit_admin_data.permissions;
          req.session.edit_admin_data = null;
        }else{
          params.email = admin.email;
          params.name = admin.name;
          params.surname = admin.surname;
          params.oldPermissions = admin.permissions;          
        }
    
        if(req.session.alert){
          params.alert = req.session.alert;
          req.session.alert = null;
        }
    
        res.render("admin-admin-edit", params);
      }else{
        req.session.alert = "Administrador no encontrado.";
        res.redirect("../");
      }
    })
  })
  .post((req, res) => {
    Admin.modify(req.session.admin, req.params.id, req.body, (success, status, body) => {
      if(success){
        req.session.success = body.message;
        res.redirect("../");
      }else{
        req.session.alert = body.message;
        req.session.edit_admin_data = {
          email: req.body.email,
          name: req.body.name,
          surname: req.body.surname,
          permissions: req.body.permissions
        }
        res.redirect("./edit");
      }
    })
  })

router.get("/:id/delete", (req, res) => {
  Admin.del(req.params.id, (success, status, body) => {
    if(success){
      req.session.success = body.message;
    }else{
      req.session.alert = body.message;
    }
    res.redirect("../");
  })
})

module.exports = router;
module.exports = function(req, res, next){
	if(res.locals.admin){
		if(res.locals.admin.permissions == "Administrador General"){
      next();
    }else{
      res.redirect("/admin/")
    }
	}else{
		res.redirect("/admin/login");
	}
};
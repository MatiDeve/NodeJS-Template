const Admin = require("../models/admin");
module.exports = function(req, res, next){
	if(!req.session.admin){
		next();
	}else{
		Admin.findById(req.session.admin).exec(function(error, admin){
			if(error){
				req.session.admin = null;
				res.redirect("/admin/login");
			}else{
				res.locals = {admin: admin};
				next();
			}
		});
	}
};
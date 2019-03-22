module.exports = function(req, res, next){
	if(res.locals.admin){
		next();
	}else{
		res.redirect("/admin/login");
	}
};
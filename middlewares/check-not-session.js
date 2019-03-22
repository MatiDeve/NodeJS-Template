module.exports = function(req, res, next){
	if(res.locals.admin){
		res.redirect("/admin/");
	}else{
		next();
	}
};
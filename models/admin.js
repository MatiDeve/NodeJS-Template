var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
	console.log("Conected Admin!");
});

var email_match = [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/ , "Email invalido"];
var password_validation = {
	validator: function(p){
		return this.password_confirmation == p;
	},
	message: "Las contraseñas no coinciden."
}

var admin_schema = new Schema({
	email: {type:String, required: [true,"Email es requerido."], match: email_match},
	name: {type:String, required:[true, "Nombre es requerido."]},
  surname: {type:String, required:[true, "Apellido es requerido."]},
  password: {type:String, required:[true, "Contraseña es requerida."], validate: password_validation},
  permissions: {type: String, enum: {values: ["Administrador General", "Administrador de Productos"], message: "El tipo de permiso no existe."}},
  created_at: {type: Date},
  created_by: {type:Schema.Types.ObjectId, ref: "Admin"},
  updated_at: {type: Date},
  updated_by: {type:Schema.Types.ObjectId, ref: "Admin"},
});

admin_schema.pre("save", function(next){
	var now = new Date;
  this.updated_at = now;
  if(this.email)
    this.email = this.email.toLowerCase();
	if(this.isNew){
		this.created_at = now;
	}
	next();
});

admin_schema.virtual("password_confirmation").get(function(){
	return this.p_c;
}).set(function(password){
	this.p_c = password;
});

admin_schema.statics.findAll = function(cb){
  return this.find({}).sort({name: 1}).exec(cb);
}

admin_schema.statics.add = function(creator, body, cb){
  if(body && body.name && body.surname && body.permissions && body.password && body.password_confirmation){
    this.findOne({email: body.email}).exec((error, admin_email) => {
      if(error){
        return cb(false, 404, {success: false, message: "Ha ocurrido un error, inténtelo nuevamente."});
      }else if(admin_email){
        return cb(false, 404, {success: false, message: "El email ya está en uso."});
      }else{
        let admin = new Admin({
          email: body.email,
          name: body.name,
          surname: body.surname,
          permissions: body.permissions,
          password: body.password,
          password_confirmation: body.password_confirmation,
          created_by: creator,
          updated_by: creator
        });
    
        admin.save((error) => {
          if(error){
            var errorString = "";
            for(key in error.errors){
              errorString += error.errors[key]["message"]+'<br>';
            }
            return cb(false, 404, {success: false, message: errorString});
          }else{
            return cb(true, 201, {success: true, message: "Administrador añadido con éxito"});
          }
        })
      }
    })
  }else{
    return cb(false, 404, {success: false, message: "Datos incompletos."});
  }
}

admin_schema.statics.modify = function(creator, id, body, cb){
  if(id && body && body.name && body.surname && body.permissions){

    this.findById(id).exec((error, admin) => {
      if(admin){
        this.findOne({email: body.email}).exec((error, admin_email) => {
          if(error){
            return cb(false, 404, {success: false, message: "Ha ocurrido un error, inténtelo nuevamente."});
          }else if(admin_email && admin_email.email != admin.email){
            return cb(false, 404, {success: false, message: "El email ya está en uso."});
          }else{
            admin.email = body.email;
            admin.name = body.name;
            admin.surname = body.surname;
            admin.permissions = body.permissions;
            admin.updated_by = creator

            if(body.password){
              admin.password = body.password;
              admin.password_confirmation = body.password_confirmation;
            }else{
              admin.password_confirmation = admin.password;
            }

            admin.save((error) => {
              if(error){
                var errorString = "";
                for(key in error.errors){
                  errorString += error.errors[key]["message"]+'<br>';
                }
                return cb(false, 404, {success: false, message: errorString});
              }else{
                return cb(true, 201, {success: true, message: "Administrador actualizado con éxito"});
              }
            })
          }
        });
      }else{
        return cb(false, 404, {success: false, message: "Administrador no encontrado."});
      }
    })
  }else{
    return cb(false, 404, {success: false, message: "Datos incompletos."});
  }
}

admin_schema.statics.del = function(id, cb){
  this.findByIdAndDelete(id).exec((error, admin) => {
    if(admin){
      return cb(true, 200, {success: true, message: "Administrador eliminado con éxito"});
    }else{
      return cb(false, 404, {success: false, message: "Administrador no encontrado."});
    }
  })
}

admin_schema.statics.login = function(email, password, cb){
  this.findOne({email: email.toLowerCase()}).exec((error, admin) => { //chequear mayusculas
    if(error){
      return cb(false, 500, {"success": false, "message": "Ha ocurrido un error. Inténtelo nuevamente."});
    }else if(admin){
      if(password == admin.password){
        return cb(true, 200, {"success": true, "message": "Editor logueado con éxito.", admin: admin._id});
      }else{
        return cb(false, 404, {"success": false, "message": "Contraseña incorrecta."});
      }
    }else{
      return cb(false, 404, {"success": false, "message": "Email incorrecto."});
    }
  });
}

var Admin = mongoose.model("Admin", admin_schema);

module.exports = Admin;
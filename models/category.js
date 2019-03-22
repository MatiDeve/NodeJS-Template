var mongoose = require("mongoose");
const fs = require("fs");
var Schema = mongoose.Schema;

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
	console.log("Conected Category!");
});

var category_schema = new Schema({
  name: {type:String, required:[true, "Nombre es requerido."]},
  name_link: {type:String, required:false},
  extension: {type:String, required:[true, "Imagen es requerida."]},
	created_at: {type: Date},
  created_by: {type:Schema.Types.ObjectId, ref: "Admin"},
  updated_at: {type: Date},
  updated_by: {type:Schema.Types.ObjectId, ref: "Admin"},
});

category_schema.pre("save", function(next){
	var now = new Date;
  this.updated_at = now;
  this.name_link = this.name.replace(/ /g, '-').toLowerCase() ;
	if(this.isNew){
		this.created_at = now;
	}
	next();
});

category_schema.statics.findAll = function(cb){
  return this.find({}).sort({name: 1}).exec(cb);
}

category_schema.statics.add = function(creator, body, pic, cb){
  if(creator && body && body.name && pic){
    this.findOne({name: body.name}).exec((error, category_name) => {
      if(error){
        fs.unlink(pic.path, (error) => {
          return cb(false, 404, {success: false, message: "Ha ocurrido un error, inténtelo nuevamente."});
        })
      }else if(category_name){
        fs.unlink(pic.path, (error) => {
          return cb(false, 404, {success: false, message: "La categoría ya existe."});
        })
      }else{
        let category = new Category({
          name: body.name,
          created_by: creator,
          updated_by: creator
        });

        if(pic.originalFilename){
          category.extension = pic.name.split(".").pop();

          category.save((error) => {
            if(error){
              var errorString = "";
              for(key in error.errors){
                errorString += error.errors[key]["message"]+'<br>';
              }
              fs.unlink(pic.path, (error) => {
                return cb(false, 404, {success: false, message: errorString});
              })
            }else{
              fs.rename(pic.path, "public/images/categories/"+category._id+"."+category.extension, (error) => {
                return cb(true, 201, {success: true, message: "Categoria añadida con éxito"});
              });
            }
          })
        }else{
          fs.unlink(pic.path, (error) => {
            return cb(false, 404, {success: false, message: "No ha seleccionado una imagen."});
          })
        }
      }
    })
  }else{
    fs.unlink(pic.path, (error) => {
      return cb(false, 404, {success: false, message: "Datos incompletos."});
    })
  }
}

category_schema.statics.modify = function(creator, item, body, pic, cb){
  if(creator && item && body && body.name && pic){

    this.findById(item).exec((error, category) => {
      if(category){
        this.findOne({name: body.name}).exec((error, category_name) => {
          if(error){
            fs.unlink(pic.path, (error) => {
              return cb(false, 404, {success: false, message: "Ha ocurrido un error, inténtelo nuevamente."});
            })
          }else if(category_name && category_name.name != category.name){
            fs.unlink(pic.path, (error) => {
              return cb(false, 404, {success: false, message: "La categoría ya existe."});
            })
          }else{
              category.name = body.name;
              category.updated_by = creator;
    
            if(pic.originalFilename){
              category.extension = pic.name.split(".").pop();
            }

            category.save((error) => {
              if(error){
                var errorString = "";
                for(key in error.errors){
                  errorString += error.errors[key]["message"]+'<br>';
                }
                fs.unlink(pic.path, (error) => {
                  return cb(false, 404, {success: false, message: errorString});
                })
              }else{
                if(pic.originalFilename){
                  fs.rename(pic.path, "public/images/categories/"+category._id+"."+category.extension, (error) => {
                    return cb(true, 201, {success: true, message: "Categoria actualizada con éxito"});
                  });
                }else{
                  fs.unlink(pic.path, (error) => {
                    return cb(true, 201, {success: true, message: "Categoria actualizada con éxito"});
                  })
                }
              }
            })
          }
        })
      }else{
        fs.unlink(pic.path, (error) => {
          return cb(false, 404, {success: false, message: "Categoría no encontrada."});
        })
      }
    })
  }else{
    fs.unlink(pic.path, (error) => {
      return cb(false, 404, {success: false, message: "Datos incompletos."});
    })
  }
}

category_schema.statics.del = function(id, cb){
  this.findByIdAndDelete(id).exec((error, category) => {
    if(category){
      if(category.extension){
        fs.unlink("public/images/categories/"+category._id+"."+category.extension, (error) => {
          return cb(true, 200, {success: true, message: "Categoría eliminada con éxito"});
        })
      }
    }else{
      return cb(false, 404, {success: false, message: "Categoría no encontrada."});
    }
  })
}

var Category = mongoose.model("Category", category_schema);

module.exports = Category;
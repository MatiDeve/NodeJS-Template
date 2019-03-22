var mongoose = require("mongoose");
const fs = require("fs");
const Category = require("./category");
var Schema = mongoose.Schema;

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
	console.log("Conected Subcategory!");
});

var subcategory_schema = new Schema({
  name: {type:String, required:[true, "Nombre es requerido."]},
  name_link: {type:String, required:false},
  extension: {type:String, required:[true, "Imagen es requerida."]},
  category: {type:Schema.Types.ObjectId, ref: "Category", required: [true, "Categoría es requerida"]},
	created_at: {type: Date},
  created_by: {type:Schema.Types.ObjectId, ref: "Admin"},
  updated_at: {type: Date},
  updated_by: {type:Schema.Types.ObjectId, ref: "Admin"},
});

subcategory_schema.pre("save", function(next){
	var now = new Date;
  this.updated_at = now;
  this.name_link = this.name.replace(/ /g, '-').toLowerCase() ;
	if(this.isNew){
		this.created_at = now;
	}
	next();
});

subcategory_schema.statics.add = function(creator, body, pic, cb){
  if(creator && body && body.name && body.category && pic){
    this.findOne({name: body.name}).exec((error, subcategory_name) => {
      if(error){
        fs.unlink(pic.path, (error) => {
          return cb(false, 404, {success: false, message: "Ha ocurrido un error, inténtelo nuevamente."});
        })
      }else if(subcategory_name){
        fs.unlink(pic.path, (error) => {
          return cb(false, 404, {success: false, message: "La subcategoría ya existe."});
        })
      }else{
        Category.findById(body.category).exec((error, category) => {
          if(category){
            let subcategory = new Subcategory({
              name: body.name,
              category: body.category,
              created_by: creator,
              updated_by: creator
            });
    
            if(pic.originalFilename){
              subcategory.extension = pic.name.split(".").pop();
    
              subcategory.save((error) => {
                if(error){
                  var errorString = "";
                  for(key in error.errors){
                    errorString += error.errors[key]["message"]+'<br>';
                  }
                  fs.unlink(pic.path, (error) => {
                    return cb(false, 404, {success: false, message: errorString});
                  })
                }else{
                  fs.rename(pic.path, "public/images/subcategories/"+subcategory._id+"."+subcategory.extension, (error) => {
                    return cb(true, 201, {success: true, message: "Subcategoria añadida con éxito"});
                  });
                }
              })
            }else{
              fs.unlink(pic.path, (error) => {
                return cb(false, 404, {success: false, message: "No ha seleccionado una imagen."});
              })
            }
          }else{
            fs.unlink(pic.path, (error) => {
              return cb(false, 404, {success: false, message: "La categoría no existe."});
            })
          }
        })
      }
    })
  }else{
    fs.unlink(pic.path, (error) => {
      return cb(false, 404, {success: false, message: "Datos incompletos."});
    })
  }
}

subcategory_schema.statics.modify = function(creator, item, body, pic, cb){
  if(creator && item && body && body.name && body.category && pic){

    this.findById(item).exec((error, subcategory) => {
      if(subcategory){
        this.findOne({name: body.name}).exec((error, subcategory_name) => {
          if(error){
            fs.unlink(pic.path, (error) => {
              return cb(false, 404, {success: false, message: "Ha ocurrido un error, inténtelo nuevamente."});
            })
          }else if(subcategory_name && subcategory.name != subcategory_name.name){
            fs.unlink(pic.path, (error) => {
              return cb(false, 404, {success: false, message: "La subcategoría ya existeee."});
            })
          }else{
            Category.findById(body.category).exec((error, category) => {
              if(category){
                  subcategory.name = body.name;
                  subcategory.category = body.category;
                  subcategory.created_by = creator;
                  subcategory.updated_by = creator;
        
                if(pic.originalFilename)
                  subcategory.extension = pic.name.split(".").pop();
        
                subcategory.save((error) => {
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
                      fs.rename(pic.path, "public/images/subcategories/"+subcategory._id+"."+subcategory.extension, (error) => {
                        return cb(true, 201, {success: true, message: "Subcategoria actualizada con éxito"});
                      });
                    }else{
                      fs.unlink(pic.path, (error) => {
                        return cb(true, 201, {success: true, message: "Subcategoria actualizada con éxito"});
                      });
                    }
                  }
                })
              }else{
                fs.unlink(pic.path, (error) => {
                  return cb(false, 404, {success: false, message: "La categoría no existe."});
                })
              }
            })
          }
        })
      }else{
        fs.unlink(pic.path, (error) => {
          return cb(false, 404, {success: false, message: "Subcategoría no encontrada."});
        })
      }
    })
  }else{
    fs.unlink(pic.path, (error) => {
      return cb(false, 404, {success: false, message: "Datos incompletos."});
    })
  }
}

subcategory_schema.statics.del = function(id, cb){
  this.findByIdAndDelete(id).exec((error, subcategory) => {
    if(subcategory){
      if(subcategory.extension){
        fs.unlink("public/images/subcategories/"+subcategory._id+"."+subcategory.extension, (error) => {
          return cb(true, 200, {success: true, message: "Subcategoría eliminada con éxito"});
        })
      }
    }else{
      return cb(false, 404, {success: false, message: "Subcategoría no encontrada."});
    }
  })
}

subcategory_schema.statics.findAll = function(cb){
  return this.find({}).sort({name: 1}).populate("category").exec(cb);
}

var Subcategory = mongoose.model("Subcategory", subcategory_schema);

module.exports = Subcategory;
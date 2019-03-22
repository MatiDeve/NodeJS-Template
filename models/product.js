const mongoose = require("mongoose");
const async = require("async");
require("mongoose-double")(mongoose);
const Schema = mongoose.Schema;
const Subcategory = require("./subcategory");
const fs = require("fs");

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
	console.log("Conected Product!");
});

var product_schema = new Schema({
  code: {type:String, required:[true, "Código es requerido."]},
  name: {type:String, required:[true, "Nombre es requerido."]},
  name_link: {type:String},
  ml_link: {type:String},
  description: {type:String, required:[true, "Descripción es requerida."]},
  price: {type:Schema.Types.Double, required:[true, "Precio es requerido."]},
  real_price: {type:Schema.Types.Double, required:false},
  discount: {type:Schema.Types.Double, required:false},
  visible: {type:Boolean, required:[true, "Visibilidad es requerida."]},
  out_of_season: {type:Boolean, required:[true, "Fuera de temporada es requerido."]},
  highlighted: {type:Boolean, required:false},
  extensions: [{type:String, required:false}],
  banner_extension: {type:String, required:[true, "Banner es requerido."]},
  subcategory: {type: Schema.Types.ObjectId, ref: "Subcategory", required:[true, "Subcategoría es requerida."]},
  created_at: {type: Date},
  created_by: {type: Schema.Types.ObjectId, ref: "Admin"},
	updated_at: {type: Date},
  updated_by: {type: Schema.Types.ObjectId, ref: "Admin"}
});

product_schema.pre("save", function(next){
	var now = new Date;
  this.updated_at = now;
  this.name_link = this.name.replace(/ /g, '-').toLowerCase() ;
	if(this.isNew){
    this.created_at = now;
  }
  
  if(!this.discount)
    this.discount = 0;

  this.real_price = this.price - this.price * this.discount * 0.01;

	next();
});

product_schema.statics.findAll = function(cb){
  return this.find({}).sort({name: 1}).populate("subcategory").exec(cb);
}

product_schema.statics.findBySubcategory = function(subcat, cb){
  return this.find({subcategory: subcat}).sort({name: 1}).exec(cb);
}

product_schema.statics.add = async function(creator, body, banner, pics, cb){
  //TODO: COMPROBAR QUE PICS NO SEA UNO SOLO O NINGUNO (UN OBJECT, TIENE QUE SER ARRAY. PERO TYPEOF LO DETECTA COMO OBJECT);n
  if(pics && !Array.isArray(pics)){
    pics = [pics];
  }
  if(creator && body && body.code && body.name && body.ml_link && body.description && body.price && body.discount && body.visible && body.out_of_season && body.highlighted && body.subcategory && pics != "pics" && banner){
    
    this.findOne({code: body.code}).exec((error, product_code) => {
      if(error){
        async.eachSeries(pics, (item, callback) => {
          fs.unlink(item.path, (error) => {
            callback();
          })
        }, (error) => {
          fs.unlink(banner.path, (error) => {
            return cb(false, 404, {success: false, message: "Ha ocurrido un error. Inténtelo nuevamente."});
          })
        });
      }else if(product_code){
        async.eachSeries(pics, (item, callback) => {
          fs.unlink(item.path, (error) => {
            callback();
          })
        }, (error) => {
          fs.unlink(banner.path, (error) => {
            return cb(false, 404, {success: false, message: "El código ya existe."});
          })
        });
      }else{
        Subcategory.findById(body.subcategory).exec( async (error, subcategory) => {
          if(subcategory){
            let product = new Product({
              code: body.code,
              name: body.name,
              ml_link: body.ml_link,
              description: body.description.replace(/(?:\r\n|\r|\n)/g, '<br>'),
              price: body.price,
              discount: body.discount,
              visible: false,
              out_of_season: false,
              highlighted: false,
              subcategory: body.subcategory,
              extensions: [],
              created_by: creator,
              updated_by: creator
            });

            if(body.visible == "true"){
              product.visible = true;
            }

            if(body.highlighted == "true"){
              product.highlighted = true;
            }

            if(body.out_of_season == "true"){
              product.out_of_season = true;
            }
            
            if(banner && banner.originalFilename){
              product.banner_extension = banner.name.split(".").pop();

              for (let i = 0; i < pics.length; i++) {
                const pic = pics[i];
                if(!pic.originalFilename){
                  pics.splice(i, 1);
                  try {
                    await fs.unlink(pic.path);
                  }catch(error){
                  }
                }
              }


              if(pics && pics.length){

                for (let i = 0; i < pics.length; i++) {
                  const pic = pics[i];
                  product.extensions.push(pic.name.split(".").pop());
                }
      
                product.save((error) => {
                  if(error){
                    var errorString = "";
                    for(key in error.errors){
                      errorString += error.errors[key]["message"]+'<br>';
                    }
                    
                    async.eachSeries(pics, (item, callback) => {
                      fs.unlink(item.path, (error) => {
                        callback();
                      })
                    }, (error) => {
                      fs.unlink(banner.path, (error) => {
                        return cb(false, 404, {success: false, message: errorString});
                      })
                    });
                  }else{

                    async.eachOfSeries(pics, (item, index, callback) => {
                      fs.rename(item.path, "public/images/products/"+product._id+"_"+index+"."+product.extensions[index], (error) => {
                        callback();
                      })
                    }, (error) => {
                      fs.rename(banner.path, "public/images/products/"+product._id+"."+product.banner_extension, (error) => {
                        return cb(true, 201, {success: true, message: "Producto añadido con éxito."});
                      })
                    });
                  }
                })
              }else{
                async.eachSeries(pics, (item, callback) => {
                  fs.unlink(item.path, (error) => {
                    callback();
                  })
                }, (error) => {
                  fs.unlink(banner.path, (error) => {
                    return cb(false, 404, {success: false, message: "No ha seleccionado una imagen."});
                  })
                });
              }
            }else{
              async.eachSeries(pics, (item, callback) => {
                fs.unlink(item.path, (error) => {
                  callback();
                })
              }, (error) => {
                fs.unlink(banner.path, (error) => {
                  return cb(false, 404, {success: false, message: "No ha seleccionado un banner."});
                })
              });
            }
          }else{
            async.eachSeries(pics, (item, callback) => {
              fs.unlink(item.path, (error) => {
                callback();
              })
            }, (error) => {
              fs.unlink(banner.path, (error) => {
                return cb(false, 404, {success: false, message: "La subcategoría no existe."});
              })
            });
          }
        })
      }
    })
  }else{
    async.eachSeries(pics, (item, callback) => {
      fs.unlink(item.path, (error) => {
        callback();
      })
    }, (error) => {
      fs.unlink(banner.path, (error) => {
        return cb(false, 404, {success: false, message: "Datos incompletos."});
      })
    });
  }
}

product_schema.statics.modify = async function(creator, productId, body, banner, pics, cb){
  if(pics && !Array.isArray(pics)){
    pics = [pics];
  }
  if(creator && productId && body && body.code && body.name && body.ml_link && body.description && body.price && body.discount && body.visible && body.out_of_season && body.highlighted && body.subcategory && pics != "pics" && banner){
    
    this.findById(productId).exec((error, product) => {
      if(product){

        this.findOne({code: body.code}).exec((error, product_code) => {
          if(error){
            async.eachSeries(pics, (item, callback) => {
              fs.unlink(item.path, (error) => {
                callback();
              })
            }, (error) => {
              fs.unlink(banner.path, (error) => {
                return cb(false, 404, {success: false, message: "Ha ocurrido un error. Inténtelo nuevamente."});
              })
            });
          }else if(product_code && product_code.code != product.code){
            async.eachSeries(pics, (item, callback) => {
              fs.unlink(item.path, (error) => {
                callback();
              })
            }, (error) => {
              fs.unlink(banner.path, (error) => {
                return cb(false, 404, {success: false, message: "El código ya existe."});
              })
            });
          }else{
            Subcategory.findById(body.subcategory).exec( async (error, subcategory) => {
              if(subcategory){
                product.code = body.code;
                product.name = body.name;
                product.ml_link = body.ml_link;
                product.description = body.description.replace(/(?:\r\n|\r|\n)/g, '<br>'),
                product.price = body.price;
                product.discount = body.discount;
                product.visible = false;
                product.out_of_season = false;
                product.highlighted = false;
                product.subcategory = body.subcategory;
                product.updated_by = creator;
    
                if(body.visible == "true"){
                  product.visible = true;
                }
    
                if(body.highlighted == "true"){
                  product.highlighted = true;
                }
    
                if(body.out_of_season == "true"){
                  product.out_of_season = true;
                }

                let oldBanner;
                if(banner && banner.originalFilename){
                  oldBanner = product.banner_extension;
                  product.banner_extension = banner.name.split(".").pop();
                }

                for (let i = 0; i < pics.length; i++) {
                  const pic = pics[i];
                  if(!pic.originalFilename){
                    pics.splice(i, 1);
                    try {
                      await fs.unlink(pic.path);
                    }catch(error){
                    }
                  }
                }
  
                let oldExtensions;
                if(pics && pics.length){
                  for (let i = 0; i < pics.length; i++) {
                    const pic = pics[i];
                    oldExtensions = product.extensions;
                    product.extensions = [];
                    product.extensions.push(pic.name.split(".").pop());
                  }
                }
        
                product.save( async (error) => {
                  if(error){
                    var errorString = "";
                    for(key in error.errors){
                      errorString += error.errors[key]["message"]+'<br>';
                    }
                    
                    async.eachSeries(pics, (item, callback) => {
                      fs.unlink(item.path, (error) => {
                        callback();
                      })
                    }, (error) => {
                      fs.unlink(banner.path, (error) => {
                        return cb(false, 404, {success: false, message: errorString});
                      })
                    });
                  }else{

                    if(oldBanner){
                      console.log("tamo aca");
                      await fs.unlink("public/images/products/"+product._id+"."+oldBanner);
                      await fs.rename(banner.path, "public/images/products/"+product._id+"."+product.banner_extension, (error) => {
                        console.log("baner");
                      })
                    }

                    if(oldExtensions){
                      await async.eachOfSeries(oldExtensions, (item, index, callback) => {
                        fs.unlink("public/images/products/"+product._id+"_"+index+"."+item, (error) => {
                          callback();
                        })
                      }, (error) => {
                        console.log("terminamo");
                      });

                      async.eachOfSeries(pics, (item, index, callback) => {
                        fs.rename(item.path, "public/images/products/"+product._id+"_"+index+"."+product.extensions[index], (error) => {
                          callback();
                        })
                      }, (error) => {
                        console.log("terminamo2");
                      });
                      console.log("continuamo");
                    }

                    return cb(true, 201, {success: true, message: "Producto añadido con éxito."});

                  }
                })
              }else{
                async.eachSeries(pics, (item, callback) => {
                  fs.unlink(item.path, (error) => {
                    callback();
                  })
                }, (error) => {
                  fs.unlink(banner.path, (error) => {
                    return cb(false, 404, {success: false, message: "La subcategoría no existe."});
                  })
                });
              }
            })
          }
        })

      }else{
        async.eachSeries(pics, (item, callback) => {
          fs.unlink(item.path, (error) => {
            callback();
          })
        }, (error) => {
          fs.unlink(banner.path, (error) => {
            return cb(false, 404, {success: false, message: "Datos incompletos."});
          })
        });
      }
    });
  }else{
    async.eachSeries(pics, (item, callback) => {
      fs.unlink(item.path, (error) => {
        callback();
      })
    }, (error) => {
      fs.unlink(banner.path, (error) => {
        return cb(false, 404, {success: false, message: "Datos incompletos."});
      })
    });
  }
}

product_schema.statics.del = function(id, cb){
  this.findByIdAndDelete(id).exec((error, product) => {
    if(product){
      async.eachOfSeries(product.extensions, (item, index, callback) => {
        fs.unlink("public/images/products/"+product._id+"_"+index+"."+item, (error) => {
          callback();
        })
      }, (error) => {
        if(product.banner_extension){
          fs.unlink("public/images/products/"+product._id+"."+product.banner_extension, (error) => {
            return cb(true, 200, {success: true, message: "Producto eliminado con éxito"});
          })
        }else{
          return cb(true, 200, {success: true, message: "Producto eliminado con éxito"});
        }
      })
    }else{
      return cb(false, 404, {success: false, message: "Producto no encontrado."});
    }
  })
}

var Product = mongoose.model("Product", product_schema);

module.exports = Product;
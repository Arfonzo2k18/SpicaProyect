const Categoria = require('../models/categoria').Categorias;
const Usuario = require('../models/usuario').Usuarios;
const categoryController = {};
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

/**
 *  Crea una categoria.
 * 
 *  HEADERS: 
 *  Content-Type: application/x-www-form-urlencoded
 *  Authorization: Bearer <TOKEN DE SESION>
 * 
 *  BODY: <TYPE> FORM DATA
 *  @param nombre: String
 *  @param image: File (Extensiones admitidas: JPG, JPEG, PNG)
 * 
 */

categoryController.createCategory = async(req, res, next) => {

    if(!req.headers.authorization) {
        return res
            .status(403)
            .send({message: "Tu petición no tiene cabecera de autorización"});
    }

    var auth = req.headers.authorization.split(" ")[1];
    var payload = jwt.decode(auth, process.env.JWT_SECRET);
    if(payload) {
        await Usuario.findOne({where: {id: payload.id}}).then( async function(comprobante) {
            if(comprobante){
                if(comprobante.rol != 'admin' && comprobante.rol != 'redactor') {
                    res.status(403).json({'error': 'Acceso denegado.'});
                } else {
                    await Categoria.findOne({ where: { nombre: req.body.nombre } }).then(async function (category) {

                        if(category){
                            res.status(422).json('Ha ocurrido un error.');
                        } else{
                
                            const ext = req.file.filename.split(".")[1];
                
                            if(ext == 'jpg' || ext == 'png' || ext == 'jpeg') {
                                await Categoria.create({
                                    nombre: req.body.nombre,
                                    image: req.file.filename,
                                })
                                .then(
                                    console.log(req.file.filename),
                                    res.json(
                                        "Categoria creada correctamente."
                                    ),
                                    await Categoria.findOne({ where: { nombre: req.body.nombre} }).then(function (category) {
                                        if(!fs.existsSync(path.join("./", process.env.urlImagen + "/categorias"))) fs.mkdirSync(path.join("./", process.env.urlImagen + "/categorias"));
                                        if(!fs.existsSync(path.join("./", process.env.urlImagen + "/categorias/") + category.id)) fs.mkdirSync(path.join("./", process.env.urlImagen + "/categorias/") + category.id);
                                        fs.renameSync(path.join("./", process.env.urlImagen + "/" + req.file.filename), path.join("./", process.env.urlImagen + "/categorias/" + category.id + "/" + req.file.filename));
                                    }),
                                    )
                                .catch(err => res.status(400).json(err.msg));
                            } else {
                                res.status(422).json({'error': 'Solo se admiten imágenes con formato jpg o png.'});
                            }
                        }
                        
                    })
                }
            }
        }).catch(err => res.status(400).json(err.msg));
    } else {
        res.status(403).json({'error': 'Acceso denegado.'});
    }

};

/**
 *  Elimina una categoría.
 * 
 *  HEADERS: 
 *  Content-Type: application/x-www-form-urlencoded
 *  Authorization: Bearer <TOKEN DE SESION>
 * 
 *  PARAMS:
 *  Category_id
 */

categoryController.deleteCategory = async(req, res, next) => {

    if(!req.headers.authorization) {
        return res
            .status(403)
            .send({message: "Tu petición no tiene cabecera de autorización"});
    }

    var auth = req.headers.authorization.split(" ")[1];
    var payload = jwt.decode(auth, process.env.JWT_SECRET);

    if(payload) {
        await Usuario.findOne({where: {id: payload.id}}).then( async function(comprobante) {
            if(comprobante){
                if(comprobante.rol != 'admin' && comprobante.rol != 'redactor') {
                    res.status(403).json({'error': 'Acceso denegado.'});
                } else {
                    var imagenCategoria;
                    await Categoria.findOne({ where: { id: req.params.id } }).then(async function (category) {
                        if(category) {
                            imagenCategoria = category.image;
                        } else {
                            res.status(404).json({'success': 'No existe la categoria especificada.'});
                        }
                    });
                
                    console.log(imagenCategoria);
                    await Categoria.destroy({ where: {id: req.params.id}}).then(async function(rowDeleted) {
                        if(rowDeleted === 1){
                            try {
                                fs.unlinkSync(path.join("./", process.env.urlImagen + "/categorias/" + req.params.id + "/" + imagenCategoria));
                                fs.rmdirSync(path.join("./", process.env.urlImagen + "/categorias/" + req.params.id))
                              } catch (err) {
                                console.log(err);
                              }
                          console.log('Categoria eliminada correctamente.');
                          res.status(200).json({'success': 'Categoria eliminada correctamente.'});
                        } else {
                          console.log('No existe la categoria especificada.');
                          res.status(404).json({'success': 'No existe la categoria especificada.'});
                        }
                    }, function(err){
                        console.log(err);
                        res.status(400).json({'error': 'Ha ocurrido un error.'});
                    });
                }
            }
        }).catch(err => res.status(400).json(err.msg));
    } else {
        res.status(403).json({'error': 'Acceso denegado.'});
    }
    

}

/**
 *  Retorna todas las categorías.
 * 
 *  HEADERS: 
 *  Content-Type: application/x-www-form-urlencoded
 *  Authorization: Bearer <TOKEN DE SESION>
 * 
 */

categoryController.allCategorys = async(req, res, next) => {

    if(!req.headers.authorization) {
        return res
            .status(403)
            .send({message: "Tu petición no tiene cabecera de autorización"});
    }

    var auth = req.headers.authorization.split(" ")[1];
    var payload = jwt.decode(auth, process.env.JWT_SECRET);

    if(payload) {
        await Usuario.findOne({where: {id: payload.id}}).then( async function(comprobante) {
            if(comprobante){
                if(comprobante.rol != 'admin' && comprobante.rol != 'redactor') {
                    res.status(403).json({'error': 'Acceso denegado.'});
                } else {
                    var categorias = await Categoria.findAll();
                    if(categorias.length > 0) {
                        res.json(categorias);
                    } else {
                        res.status(400).json({'error': 'Ha ocurrido un error.'});
                    }
                }
            }
        }).catch(err => res.status(400).json(err.msg));
    } else {
        res.status(403).json({'error': 'Acceso denegado.'});
    }
}

/**
 *  Edita una categoria.
 * 
 *  HEADERS: 
 *  Content-Type: application/x-www-form-urlencoded
 *  Authorization: Bearer <TOKEN DE SESION>
 * 
 *  BODY: <TYPE> FORM DATA
 *  @param nombre: String
 *  @param image: File (Extensiones admitidas: JPG, JPEG, PNG)
 * 
 *  PARAMS:
 *  category_id
 * 
 */

categoryController.editCategory = async(req, res, next) => {
    if(!req.headers.authorization) {
        return res
            .status(403)
            .send({message: "Tu petición no tiene cabecera de autorización"});
    }

    var auth = req.headers.authorization.split(" ")[1];
    var payload = jwt.decode(auth, process.env.JWT_SECRET);
    if(payload) {
        await Usuario.findOne({where: {id: payload.id}}).then( async function(comprobante) {
            if(comprobante){
                if(comprobante.rol != 'admin' && comprobante.rol != 'redactor') {
                    res.status(403).json({'error': 'Acceso denegado.'});
                } else {
                    await Categoria.findOne({ where: { id: req.params.id } }).then(async function (category) {
                        if(!category){
                            res.status(422).json('Ha ocurrido un error.');
                        } else{
                            const ext = req.file.filename.split(".")[1];
                
                            if(ext == 'jpg' || ext == 'png' || ext == 'jpeg') {
                                await Categoria.update({
                                    nombre: req.body.nombre,
                                    image: req.file.filename,
                                })
                                .then(() => async function() {
                                    res.json(
                                        "Categoria actualizada correctamente."
                                    ),
                                    await Categoria.findOne({ where: { id: req.params.id} }).then(function (category) {
                                        if(!fs.existsSync(path.join("./", process.env.urlImagen + "/categorias"))) fs.mkdirSync(path.join("./", process.env.urlImagen + "/categorias"));
                                        if(!fs.existsSync(path.join("./", process.env.urlImagen + "/categorias/") + category.id)) fs.mkdirSync(path.join("./", process.env.urlImagen + "/categorias/") + category.id);
                                        fs.renameSync(path.join("./", process.env.urlImagen + "/" + req.file.filename), path.join("./", process.env.urlImagen + "/categorias/" + category.id + "/" + req.file.filename));
                                    })
                                }).catch(err => res.status(400).json(err.msg));
                            } else {
                                res.status(422).json({'error': 'Solo se admiten imágenes con formato jpg o png.'});
                            }
                        }
                        
                    })
                }
            }
        }).catch(err => res.status(400).json(err.msg));
    } else {
        res.status(403).json({'error': 'Acceso denegado.'});
    }
}

/**
 *  Retorna una categoría específica.
 * 
 *  HEADERS: 
 *  Content-Type: application/x-www-form-urlencoded
 *  Authorization: Bearer <TOKEN DE SESION>
 * 
 *  PARAMS:
 *  category_id
 */

categoryController.getCategory = async(req, res, next) => {
    if(!req.headers.authorization) {
        return res
            .status(403)
            .send({message: "Tu petición no tiene cabecera de autorización"});
    }

    var auth = req.headers.authorization.split(" ")[1];
    var payload = jwt.decode(auth, process.env.JWT_SECRET);
    if(payload) {
        await Usuario.findOne({where: {id: payload.id}}).then( async function(comprobante) {
            if(comprobante){
                if(comprobante.rol != 'admin' && comprobante.rol != 'redactor') {
                    res.status(403).json({'error': 'Acceso denegado.'});
                } else {
                    var categoria = await Categoria.findOne({ where: { id: req.params.id }});
                    if(categoria) {
                        res.json(categoria);
                    } else {
                        res.status(404).json({'error': 'Ha ocurrido un error.'});
                    }
                }
            }
        }).catch(err => res.status(400).json(err.msg));
    } else {
        res.status(403).json({'error': 'Acceso denegado.'});
    }


}

module.exports = categoryController;
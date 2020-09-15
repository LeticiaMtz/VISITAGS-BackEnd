const express = require('express');
var mongoose = require('mongoose');
const _ = require('underscore');
const Crde = require('../models/crde');
const { rolMenuUsuario } = require('../middlewares/permisosUsuarios');
const {} = require('../middlewares/autenticacion');
const app = express();
//|-----------------     Api GET de categoria crde       ----------------|
//| Creada por: Leticia Moreno                                           |
//| Api que obtiene listado de categorias de crde                         |
//| modificada por:                                                      |
//| Fecha de modificacion:                                               |
//| cambios:                                                             |
//| Ruta: http://localhost:3000/api/crde/obtener                         |
//|----------------------------------------------------------------------|
//Obtiene todos las categorias de crde
app.get('/obtener', [], (req, res) => {

    Crde.find() //select * from usuario where estado=true
        //solo aceptan valores numericos
        .exec((err, crde) => { //ejecuta la funcion
            if (err) {
                return res.status(400).json({
                    ok: false,
                    status: 400,
                    msg: 'error al generar la lista',
                    cnt: err
                });
            }
            console.log(req.crde);
            return res.status(200).json({
                ok: true,
                status: 200,
                msg: 'Lista generada exiosamente',
                count: crde.length,
                cnt: crde
            });
        });
});
//|-----------------     Api GET de categoria crde       ----------------|
//| Creada por: Leticia Moreno                                           |
//| Api que obtiene listado de categorias de crde segun id                |
//| modificada por:                                                      |
//| Fecha de modificacion:                                               |
//| cambios:                                                             |
//| Ruta: http://localhost:3000/api/crde/obtener/id                      |
//|----------------------------------------------------------------------|
//Obtener una categoria de crde por id 
app.get('/obtener/:id', [], (req, res) => {
    let id = req.params.id;
    Crde.find({ _id: id })
        .exec((err, crde) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    status: 400,
                    msg: 'Ocurrio un error al consultar las categorias de crde',
                    cnt: err
                });
            }
            return res.status(200).json({
                ok: true,
                status: 200,
                msg: 'Se han consultado correctamente la categori crde',
                cont: crde.length,
                cnt: crde
            });
        });
});

//|-----------------     Api POST de categoria crde      --------------------------------------------|
//| Creada por: Leticia Moreno                                                                       |
//| Api que registra una categoria de crde                                                           |
//| modificada por: Isabel Castillo                                                                  |
//| Fecha de modificacion: 03/09/20                                                                  |
//| cambios: Se agrego una validación para que la primera letra de la primera palabra sea mayúscula  |
//| Ruta: http://localhost:3000/api/crde/registrar                                                   |
//|--------------------------------------------------------------------------------------------------|

// Registrar una categoria de crde
app.post('/registrar', [], async(req, res) => {
    let body = req.body;

    let strCategoria = '';
    let crd = body.strCategoria.toLowerCase();
    for (let i = 0; i < crd.length; i++) {
        if (i == 0) {
            strCategoria += crd[i].charAt(0).toUpperCase();
        } else {
            strCategoria += crd[i];
        }
    }

    //para poder mandar los datos a la coleccion
    let crde = new Crde({
        strCategoria: strCategoria

    });

    Crde.findOne({ 'strCategoria': strCategoria }).then((encontrado) => {
        if (encontrado) {
            return res.status(400).json({
                ok: false,
                status: 400,
                msg: 'El nombre de la categoria ya ha sido registrada',
                cnt: encontrado

            });
        }
        crde.save((err, crde) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    status: 400,
                    msg: 'No se pudo guardar la nueva categoria',
                    cnt: err
                });
            }
            return res.status(200).json({
                ok: true,
                status: 200,
                msg: "Categoria de crde registrada correctamente",
                cont: crde.length,
                cnt: {
                    crde
                }
            });
        });
    });

});

//|-----------------     Api PUT de categoria crde       ----------------|
//| Creada por: Leticia Moreno                                           |
//| Api que actualiza una categoria de crde                              |
//| modificada por:                                                      |
//| Fecha de modificacion:                                               |
//| cambios:                                                             |
//| Ruta: http://localhost:3000/api/crde/actualizar/idCrde               |
//|----------------------------------------------------------------------|

app.put('/actualizar/:idCrde', [], (req, res) => {
    let id = req.params.idCrde;
    let numParam = Object.keys(req.body).length;

    let crdeBody;
    if (numParam == 7) {
        crdeBody = _.pick(req.body, ['strCategoria', 'blnStatus']);
    }
    if (numParam == 1) {
        crdeBody = _.pick(req.body, ['blnStatus']);
    }
    if (numParam !== 7 && numParam !== 1) {
        return res.status(400).json({
            ok: false,
            status: 400,
            msg: 'Error al actualizar CRDE',
            err: 'El número de parametros enviados no concuerdan con los que requiere la API'
        });
    }

    Crde.find({ _id: id }).then((resp) => {
        if (resp.length > 0) {
            Crde.findByIdAndUpdate(id, crdeBody).then((resp) => {
                return res.status(200).json({
                    ok: true,
                    status: 400,
                    msg: 'Actualizada con éxito',
                    cont: resp.length,
                    cnt: resp
                });
            }).catch((err) => {
                return res.status(400).json({
                    ok: false,
                    status: 400,
                    msg: 'Error al actualizar',
                    cnt: err
                });
            });
        }
    }).catch((err) => {
        return res.status(400).json({
            ok: false,
            status: 400,
            msg: 'Error al actualizar',
            cnt: err
        });
    });

});


// app.put('/actualizar/:idCrde', [], (req, res) => {
//     let id = req.params.idCrde;
//     console.log(req.params.idCrde)
//     const crdeBody = _.pick(req.body, ['strCategoria', 'blnStatus']);
//     Crde.find({ _id: id }).then((resp) => {
//         if (resp.length > 0) {
//             Crde.findByIdAndUpdate(id, crdeBody).then((resp) => {
//                 return res.status(200).json({
//                     ok: true,
//                     status: 400,
//                     msg: 'Actualizada con éxito',
//                     cont: resp.length,
//                     cnt: resp
//                 });
//             }).catch((err) => {
//                 return res.status(400).json({
//                     ok: false,
//                     status: 400,
//                     msg: 'Error al actualizar',
//                     cnt: err
//                 });
//             });
//         }
//     }).catch((err) => {
//         return res.status(400).json({
//             ok: false,
//             status: 400,
//             msg: 'Error al actualizar',
//             cnt: err
//         });
//     });
// });

//|-----------------     Api DELETE de categoria crde    ----------------|
//| Creada por: Leticia Moreno                                           |
//| Api que elimina una categoria de crde                                |
//| modificada por:                                                      |
//| Fecha de modificacion:                                               |
//| cambios:                                                             |
//| Ruta: http://localhost:3000/api/crde/eliminar/idCrde                 |
//|----------------------------------------------------------------------|
app.delete('/eliminar/:idCrde', (req, res) => {
    let id = req.params.idCrde;

    Crde.findByIdAndUpdate(id, { blnStatus: false }, { new: true, runValidators: true, context: 'query' }, (err, resp) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                status: 400,
                msg: 'Ha ocurrido un error al eliminar el crde',
                cnt: err
            });
        }
        return res.status(200).json({
            ok: true,
            status: 200,
            msg: 'Se ha eliminado correctamente el crde',
            cont: resp.length,
            cnt: resp
        });
    });
});

module.exports = app;
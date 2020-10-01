const express = require('express');
const bcrypt = require('bcrypt');
const _ = require('underscore');
const { verificaToken } = require('../middlewares/autenticacion');
const { rolMenuUsuario } = require('../middlewares/permisosUsuarios');
const Alert = require('../models/Alerts'); //subir nivel
const app = express();
const fileUpload = require('../libraries/subirArchivo(1)');
const User = require('../models/Users');
const { select, isArray } = require('underscore');
const cargaImagenes = require('../libraries/cargaImagenes');
const email = require('../libraries/mails');
const Seguimiento = require('../models/seguimiento');
const Crde = require('../models/crde');
const moment = require('moment');

const idProfesor = '5eeee0db16952756482d1868';
const idDirector = '5eeee0db16952756482d1869';
const idCoordinador = '5eeee0db16952756482d186a';
const idAdministrador = "5f1e2419ad1ebd0b08edab74";

//|-----------------          Api GET de alertas         ----------------|
//| Creada por: Leticia Moreno                                           |
//| Api que obtiene el listado de las alertas registradas                |
//| modificada por:                                                      |
//| Fecha de modificacion:                                               |
//| cambios:                                                             |
//| Ruta: http://localhost:3000/api/alerts/obtener                       |
//|----------------------------------------------------------------------|
app.get('/obtener', [], (req, res) => {
    Alert.find({ blnStatus: true }) //select * from usuario where estado=true
        //solo aceptan valores numericos
        .exec((err, alerts) => { //ejecuta la funcion
            if (err) {
                return res.status(400).json({
                    ok: false,
                    status: 400,
                    msg: 'Error al generar la lista',
                    err
                });
            }
            return res.status(200).json({
                ok: true,
                status: 200,
                msg: 'Lista de alertas generada exitosamente',
                cont: alerts.length,
                cnt: alerts
            });
        });
});

//|-----------------          Api GET de alertas         ----------------|
//| Creada por: Leticia Moreno                                           |
//| Api que obtiene el listado de las alertas registradas por id         |
//| modificada por:                                                      |
//| Fecha de modificacion:                                               |
//| cambios:                                                             |
//| Ruta: http://localhost:3000/api/alerts/obtener/idAlert               |
//|----------------------------------------------------------------------|
//Obtener por id
app.get('/obtener/:id', [], (req, res) => {
    let id = req.params.id;
    Alert.find({ _id: id })
        .exec((err, alerts) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    status: 400,
                    msg: 'Error al encontrar la alerta ',
                    cnt: err
                });
            }
            return res.status(200).json({
                ok: true,
                status: 200,
                msg: 'Alerta encontrada',
                cont: alerts.length,
                cnt: alerts
            });
        });
});

//|-----------------          Api POST de alertas        ----------------|
//| Creada por: Leticia Moreno                                           |
//| Api que registra una alerta                                          |
//| modificada por:                                                      |
//| Fecha de modificacion:                                               |
//| cambios:                                                             |
//| Ruta: http://localhost:3000/api/alerts/registrar                     |
//|----------------------------------------------------------------------|
app.post('/registrar', async(req, res) => {
 
    let alertas = [];
    let body = req.body;
 
    let strUrl = 'http://localhost:4200/#/dashboard';
    let aJsnEvidencias = [];
    let aJsnMotivo = [];
    if (req.files || req.body.strFileEvidencia) {
        let arrFiles = req.files ?
            req.files.strFileEvidencia :
            req.body.strFileEvidencia;
 
        if (isArray(arrFiles)) {
            for (const archivo of arrFiles) {
                let strNombreFile = await fileUpload.subirArchivo(archivo, 'evidencias');
                aJsnEvidencias.push({
                    strNombre: strNombreFile,
                    strFileEvidencia: `/envidencias/${strNombreFile}`,
                    blnActivo: true
                });
            }
        } else {
            let strNombreFile = await fileUpload.subirArchivo(arrFiles, 'evidencias');
            aJsnEvidencias.push({
                strNombre: strNombreFile,
                strFileEvidencia: `/envidencias/${strNombreFile}`,
                blnActivo: true
            });
        }
    }

    if(isArray(body.idUser)){
 
    for (let i = 0; i < body.idUser.length; i++) {
 
        let arrCrde = [];
        for (let j = 0; j < (body.arrCrde.length / body.idUser.length); j++) arrCrde.push(body.arrCrde[j]);
 
        console.log(body.arrInvitados);
        let arrInvitados = [];
        for (let k = 0; k < (body.arrInvitados.length /body.idUser.length); k++) arrInvitados.push(body.arrInvitados[k]);
 
        alertas.push({
            idUser: body.idUser[i],
            idEstatus: body.idEstatus[i],
            strMatricula: body.strMatricula[i],
            strNombreAlumno: body.strNombreAlumno[i],
            idAsignatura: body.idAsignatura[i],
            idCarrera: body.idCarrera[i],
            idEspecialidad: body.idEspecialidad[i],
            chrTurno: body.chrTurno[i],
            idModalidad: body.idModalidad[i],
            strDescripcion: body.strDescripcion[i],
            strGrupo: body.strGrupo[i],
            arrCrde,
            aJsnEvidencias,
            ...invitados
        });
    }

} else {
    if(body.arrInvitados.length <= 0) {
        delete body.arrInvitados;
    }
    alertas.push(body);
} 

 
    let alertP = [];
    for (const alerta of alertas) {
        alertP.push(new Promise((resolve, rejected) => {
            alert = new Alert(alerta);

            
            User.find({ arrEspecialidadPermiso: { $in: [ alert.idEspecialidad ]} }).then((personas) => {

                if(personas.length <= 0) {
                    rejected({
                            ok: false,
                            status: 404,
                            msg: 'No se encontraron personas.',
                            cnt: personas.length
                    });
                }
                
                for (const persona of personas) {
                    emailBody = {
                        nmbEmail: 10,
                        strNombreProf: persona.strName,
                        strEmail: persona.strEmail,
                        subject: '¡Se ha creado una nueva alerta!',
                        strNombreAlumno: alert.strNombreAlumno,
                        strDescripcion: alert.strDescripcion,
                        strLink: `${strUrl}/${alert._id}`,
                        html: '<h1>Tu solicitud de registro esta siendo revisada.</h1><br>' +
                            '<h3>En un maximo de 24hrs. tu solicitud tendrá que estar resuelta.</h3>'
                    };
                    email.sendEmail(emailBody, (err) => {
                        if (process.log) { console.log('[Enviando Correo]'.yellow); }

                        if (err) {
                            return console.log(err.message);
                        }
                    });
                }

                if(body.arrInvitados){
                    let arrInvitados = [];

                    for (let index = 0; index < (body.arrInvitados.length /body.idUser.length); index++) {
                        arrInvitados.push(body.arrInvitados[index]);
                    }
    
                    if (arrInvitados.length > 0) {
    
                        User.find().then((persons) => {
    
                            for (const invitado of arrInvitados) {
                                
                                let persona = persons.find(person => invitado === person._id);
    
                                if(persona) {
                                    emailBody = {
                                        nmbEmail: 11,
                                        strNombreProf: per,
                                        strEmail: persona.strEmail,
                                        subject: '¡Se le invito a colaborar en el seguimiento de una alerta!',
                                        // strNombreAlumno: alert.strNombreAlumno,
                                        // strDescripcion: alert.strDescripcion,
                                        strLink: strUrl,
                                        html: '<h1>Has sido invitado a participar en el seguimiento de incidencia de un alumno .</h1><br>' +
                                            '<h3>En un maximo de 24hrs. tu solicitud tendrá que estar resuelta.</h3>'
                                    };
    
                                    email.sendEmail(emailBody, (err) => {
                                        if (process.log) { console.log('[Enviando Correo]'.yellow); }
    
                                        if (err) {
                                            return console.log(err.message);
                                        }
                                    });
                                }
                            } 
    
                        }).catch(err => rejected({
                            ok: false,
                            status: 400,
                            msg: 'Se encontró un error al registrar',
                            cnt: err
                        }))
                    }
                }
                console.log('Proceso de correos correctos');
            }).catch((err) => rejected({
                ok: false,
                status: 400,
                msg: 'Se encontró un error al registrar',
                cnt: Object.keys(err).length === 0 ? err.message : err
            }));
        
 
            alert.save().then((resp) => {
 
                resolve({
                    ok: true,
                    status: 200,
                    msg: "Alerta registrada correctamente",
                    cont: 0,
                    cnt: resp
                });
 
            }).catch((err) => {
                rejected({
                    ok: false,
                    status: 400,
                    msg: 'Se encontró un error al registrar',
                    cnt: Object.keys(err).length === 0 ? err.message : err
                })
            });
        }));
    }
    Promise.allSettled(alertP).then((respuestas) => {
 
        let errores = [];
        let correctas = [];
        for (const respuesta of respuestas) {
            // console.log(respuesta);
            if (respuesta.status === 'fulfilled') {
                correctas.push(respuesta);
            } else {
                errores.push(respuesta);
            }
        }
 
        if (errores.length === respuestas.length) {
            return res.status(400).json({
                ok: false,
                status: 400,
                msg: "Error al registrar todas las alertas",
                cont: errores.length,
                cnt: errores
            });
        }
 
        if (errores.length >= 1) {
            return res.status(400).json({
                ok: false,
                status: 400,
                msg: "Hubo un error al registrar algunas alertas.",
                cont: errores.length,
                cnt: errores
            });
 
        }
 
        return res.status(200).json({
            ok: true,
            status: 200,
            msg: "Todas las alertas se registraron correctamente.",
            cont: respuestas.length,
            cnt: respuestas
        });
 
    }).catch((err) => {
        return res.status(400).json({
            ok: false,
            status: 400,
            msg: 'Ocurrio un error, las alerta no se pudo registrar',
            cnt: Object.keys(err).length === 0 ? err.message : err
        });
    })
 
    // console.log(alert);
    // alert.save((err, alert) => {
    //     if (err) {
    //         return res.status(400).json({
    //             ok: false,
    //             status: 400,
    //             msg: 'Ocurrio un error, la alerta no se pudo registrar',
    //             cnt: err
    //         });
    //     }
 
    //     User.find({ arrEspecialidadPermiso: { $in: [body.idEspecialidad] } }).then((personas) => {
    //       for (const persona of personas) {
    //             emailBody = {
    //                 nmbEmail: 10,
    //                 strNombreProf: persona.strName,
    //                 strEmail: persona.strEmail,
    //                 subject: '¡Se ha creado una nueva alerta!',
    //                 strNombreAlumno: alert.strNombreAlumno,
    //                 strDescripcion: alert.strDescripcion,
    //                 strLink: `${strUrl}/${alert._id}`,
    //                 html: '<h1>Tu solicitud de registro esta siendo revisada.</h1><br>' +
    //                     '<h3>En un maximo de 24hrs. tu solicitud tendrá que estar resuelta.</h3>'
    //             };
    //             email.sendEmail(emailBody, (err) => {
    //                 if (process.log) { console.log('[Enviando Correo]'.yellow); }
 
    //                 if (err) {
    //                     return console.log(err.message);
    //                 }
    //             });
    //         }
    //         if (body.arrInvitados.length > 0) {
 
    //             User.find().then((persons) => {
    //                 persons.forEach(person => {
    //                     for (let idUser of body.arrInvitados) {
    //                         if (person._id == idUser) {
    //                             emailBody = {
    //                                 nmbEmail: 11,
    //                                 strNombreProf: alert.idUser.strName,
    //                                 strEmail: person.strEmail,
    //                                 subject: '¡Se le invito a colaborar en el seguimiento de una alerta!',
    //                                 strNombreAlumno: alert.strNombreAlumno,
    //                                 // strDescripcion: alert.strDescripcion,
    //                                 strLink: `${strUrl}/${alert._id}/${person.idRole}`,
    //                                 html: '<h1>Has sido invitado a participar en el seguimiento de incidencia de un alumno .</h1><br>' +
    //                                     '<h3>En un maximo de 24hrs. tu solicitud tendrá que estar resuelta.</h3>'
    //                             };
    //                             email.sendEmail(emailBody, (err) => {
    //                                 if (process.log) { console.log('[Enviando Correo]'.yellow); }
 
    //                                 if (err) {
    //                                     return console.log(err.message);
    //                                 }
    //                             });
    //                         }
    //                     }
    //                 })
    //             }).catch(err => {
    //                 return res.status(400).json({
    //                     ok: false,
    //                     status: 400,
    //                     msg: 'Error a ',
    //                     cnt: err
    //                 });
    //             })
    //         }
 
    //         return res.status(200).json({
    //             ok: true,
    //             status: 200,
    //             msg: "Alerta registrada correctamente",
    //             cont: alert.length,
    //             cnt: alert
    //         });
 
    //     }).catch((err) => {
    //         return res.status(400).json({
    //             ok: false,
    //             status: 400,
    //             msg: 'No se encontró al profesor',
    //             cnt: err
    //         });
    //     });
    // });
 
});


//|-----------------          Api PUT de alertas         ----------------|
//| Creada por: Leticia Moreno                                           |
//| Api que actualiza una alerta                                         |
//| modificada por:                                                      |
//| Fecha de modificacion:                                               |
//| cambios:                                                             |
//| Ruta: http://localhost:3000/api/alerts/actualizar/idAlert            |
//|----------------------------------------------------------------------|
app.put('/actualizar/:idAlert', [verificaToken], (req, res) => {
    let id = req.params.idAlert;
    const alertBody = _.pick(req.body, ['idUser', 'idEstatus', 'strMatricula', 'strNombreAlumno', 'idAsigantura', 'idEspecialidad', 'strGrupo', 'chrTurno', 'idModalidad', 'strDescripcion', 'arrCrde', 'aJsnEvidencias', 'aJsnSeguimiento', 'blnStatus']);
    Alert.find({ _id: id }).then((resp) => {
        if (resp.length > 0) {
            Alert.findByIdAndUpdate(id, alertBody).then((resp) => {
                return res.status(200).json({
                    ok: true,
                    status: 200,
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

//|-----------------          Api DELETE de alertas      ----------------|
//| Creada por: Leticia Moreno                                           |
//| Api que elimina una alerta                                           |
//| modificada por:                                                      |
//| Fecha de modificacion:                                               |
//| cambios:                                                             |
//| Ruta: http://localhost:3000/api/alerts/eliminar/idAlert              |
//|----------------------------------------------------------------------|
app.delete('/eliminar/:idAlert', [verificaToken], (req, res) => {
    let id = req.params.id;

    //update from - set 
    Alert.findByIdAndUpdate(id, { blnStatus: false }, { new: true, runValidators: true, context: 'query' }, (err, resp) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                status: 400,
                msg: 'Error al eliminar alerta',
                cnt: err
            });
        }
        return res.status(200).json({
            ok: true,
            status: 200,
            msg: 'Alerta eliminada correctamente',
            cont: resp.length,
            cnt: resp
        });
    });
});

//|------------------- Api GET de alertas por usuario -------------------|
//| Creada por: Abraham Carranza                                         |
//| Api que obtiene alertas dependiendo del rol del usuario              |
//| modificada por: Abraham Carranza                                     |
//| Fecha de modificacion:  9 de Septiembre del 2020                     |
//| cambios: Se cambio la respuesta para que obtenga los motivos de los  |
//|          crde y no el crde                                           |
//| Ruta: http://localhost:3000/api/alerts/obtenerAlertas/idRol/idUser   |
//|----------------------------------------------------------------------|

app.get('/obtenerAlertas/:idRol/:idUser', async(req, res) => {
    let idRol = req.params.idRol;
    let idUser = req.params.idUser;
    let body = req.body;
    

    if (idRol == idProfesor ) {
        Alert.find({$or:[{ idUser: idUser},{arrInvitados: {$in: [idUser]} }]}).sort({ updatedAt: 'desc' }).limit(5).populate([{ path: 'idEstatus', select: 'strNombre' }, { path: 'idCarrera', select: 'strCarrera' }, { path: 'idEspecialidad', select: 'strEspecialidad' }, { path: 'idModalidad', select: 'strModalidad' }]).then(async(resp) => {
            let alertas = resp.map(alert => alert.toObject());
            const motivos = await Crde.aggregate().unwind('aJsnMotivo').replaceRoot('aJsnMotivo');

            for (const alerta of alertas) {
                for (const index of alerta.arrCrde.keys()) {
                    let crde = motivos.find(motivo => motivo._id.toString() === alerta.arrCrde[index].toString());
                    if (crde) alerta.arrCrde[index] = crde;
                }
            }

            return res.status(200).json({
                ok: true,
                status: 200,
                msg: 'Se han consultado correctamente las alertas',
                cont: alertas.length,
                cnt: alertas
            });
        }).catch((err) => {
            console.log(err);
            return res.status(400).json({
                ok: false,
                status: 400,
                msg: 'Ocurrio un error al consultar las alertas',
                cnt: err
            });
        });
    } else if (idRol == idAdministrador) {

        Alert.find({$or:[{ idUser: idUser},{arrInvitados: {$in: [idUser]} }]}).sort({ updatedAt: 'desc' }).limit(5).populate([{ path: 'idEstatus', select: 'strNombre' }, { path: 'idCarrera', select: 'strCarrera' }, { path: 'idEspecialidad', select: 'strEspecialidad' }, { path: 'idModalidad', select: 'strModalidad' }])
            .then(async(resp) => {

                let alertas = resp.map(alert => alert.toObject());
                const motivos = await Crde.aggregate().unwind('aJsnMotivo').replaceRoot('aJsnMotivo');

                for (const alerta of alertas) {
                    for (const index of alerta.arrCrde.keys()) {
                        let crde = motivos.find(motivo => motivo._id.toString() === alerta.arrCrde[index].toString());
                        if (crde) alerta.arrCrde[index] = crde;
                    }
                }

                return res.status(200).json({
                    ok: true,
                    status: 200,
                    msg: 'Se han consultado correctamente',
                    cont: alertas.length,
                    cnt: alertas
                });

            }).catch((err) => {
                console.log(err);
                return res.status(400).json({
                    ok: false,
                    status: 400,
                    msg: 'Ocurrio un error al consultar el rol',
                    cnt: err
                });
            });
    } else if (idRol == idCoordinador || idRol == idDirector) {

        let usuario = await User.findById(idUser);

        if (!usuario) {
            return res.status(400).json({
                ok: false,
                status: 400,
                msg: 'Ocurrio un error al consultar el rol',
                cnt: err
            });
        }

        let arrEspecialidad = usuario.arrEspecialidadPermiso;
        let arrAlertas = [];

        for (const idEspecialidad of arrEspecialidad) {
            await Alert.find({$or:[{ idUser: idUser},{idEspecialidad},{arrInvitados: {$in: [idUser]}}]}).sort({ updatedAt: 'desc' }).limit(5).populate([{ path: 'idEstatus', select: 'strNombre' }, { path: 'idCarrera', select: 'strCarrera' }, { path: 'idEspecialidad', select: 'strEspecialidad' }, { path: 'idModalidad', select: 'strModalidad' }]).then(async(alertas) => {
                for (const i of alertas) {
                    if (i.blnStatus != undefined) {
                        console.log(alertas, "Alertas");
                        await arrAlertas.push(i);

                        // {$or:[{ idUser: idUser},{arrInvitados: {$in: [idUser]} }]}

                    }
                }
            })
        };

        let alertas = arrAlertas.map(alert => alert.toObject());
        const motivos = await Crde.aggregate().unwind('aJsnMotivo').replaceRoot('aJsnMotivo');

        for (const alerta of alertas) {
            for (const index of alerta.arrCrde.keys()) {
                let crde = motivos.find(motivo => motivo._id.toString() === alerta.arrCrde[index].toString());
                if (crde) alerta.arrCrde[index] = crde;
            }
        }

        return res.status(200).json({
            ok: true,
            status: 200,
            msg: 'Se han consultado correctamente',
            cont: alertas.length,
            cnt: alertas
        });
    };

});



//|------------------- Api GET de alertas por usuario -------------------|
//| Creada por: Martin Palacios                                          |
//| Api que obtiene una alerta mediante un id                            |
//| modificada por:                                                      |
//| Fecha de modificacion:                                               |
//| cambios:                                                             |
//| Ruta: http://localhost:3000/api/obtenerAlerta/:idAlerta              |
//|----------------------------------------------------------------------|

app.get('/obtenerAlerta/:idAlerta', async(req, res) => {
    let idAlert = req.params.idAlerta;

    Alert.find({ _id: idAlert }).populate([{ path: 'idUser' }, { path: 'idEstatus', select: 'strNombre' }, { path: 'idCarrera', select: 'strCarrera' }, { path: 'idEspecialidad', select: 'strEspecialidad' }, { path: 'idModalidad', select: 'strModalidad' }, { path: 'idAsignatura', select: 'strAsignatura' }]).then(async(resp) => {

        let alertas = resp.map(alert => alert.toObject());
        const motivos = await Crde.aggregate().unwind('aJsnMotivo').replaceRoot('aJsnMotivo');

        for (const alerta of alertas) {
            for (const index of alerta.arrCrde.keys()) {
                let crde = motivos.find(motivo => motivo._id.toString() === alerta.arrCrde[index].toString());
                if (crde) alerta.arrCrde[index] = crde;
            }
        }

        return res.status(200).json({
            ok: true,
            status: 200,
            msg: 'Se han consultado correctamente la alerta',
            cont: alertas.length,
            cnt: alertas
        });
    }).catch((err) => {
        return res.status(400).json({
            ok: false,
            status: 400,
            msg: 'Ocurrio un error al consultar la alerta',
            cnt: err
        });
    });
});

//Actualizar el estatus de la alerta 
//|-----------------          Api PUT de alertas         ----------------|
//| Creada por: Leticia Moreno                                           |
//| Api que actualiza una alerta                                         |
//| modificada por:                                                      |
//| Fecha de modificacion:                                               |
//| cambios:                                                             |
//| Ruta: http://localhost:3000/api/alerts/actualizar/idAlert            |
//|----------------------------------------------------------------------|
app.put('/actualizarEstatus/:idAlert', (req, res) => {
    let id = req.params.idAlert;
    const alertBody = _.pick(req.body, ['idEstatus']);
    console.log(req.body, 'aaaaaa');
    Alert.find({ _id: id }).then((resp) => {
        if (resp.length > 0) {
            Alert.findByIdAndUpdate(id, alertBody).then((resp) => {
                return res.status(200).json({
                    ok: true,
                    status: 200,
                    msg: 'Estatus actualizado con éxito',
                    cont: resp.length,
                    cnt: resp
                });
            }).catch((err) => {
                return res.status(400).json({
                    ok: false,
                    status: 400,
                    msg: 'Error al actualizar el estatus',
                    cnt: err
                });
            });
        }
    }).catch((err) => {
        return res.status(400).json({
            ok: false,
            status: 400,
            msg: 'Error al actualizar el estatus',
            cnt: err
        });
    });
});


app.get('/obtenerAlertasMonitor/:idCarrera/:idEspecialidad/:idUser/:idAsignatura/:idEstatus/:dteFechaInicio/:dteFechaFin', (req, res) => {
    idCarrera = req.params.idCarrera;
    idEspecialidad = req.params.idEspecialidad;
    idUser = req.params.idUser;
    idAsignatura = req.params.idAsignatura;
    idEstatus = req.params.idEstatus;
    dteFechaInicio = req.params.dteFechaInicio;
    dteFechaFin = req.params.dteFechaFin;
    let query = {};
 
    if (idCarrera != 'undefined') {
        query.idCarrera = idCarrera;
    }
    if (idEspecialidad != 'undefined') {
        query.idEspecialidad = idEspecialidad;
    }
    if (idUser != 'undefined') {
        query.idUser = idUser;
    }
    
    if (idAsignatura != 'undefined') {
        query.idAsignatura = idAsignatura;
    }
    if (idEstatus != 'undefined') {
        query.idEstatus = idEstatus;
    }
 
    if (dteFechaInicio != 'undefined') {
        if(dteFechaFin  != 'undefined'){
        query.createdAt =  {"$gte": new Date(dteFechaInicio), "$lt": new Date(dteFechaFin).setDate(new Date(dteFechaFin).getDate()+1)};
        } else {
        query.createdAt =  {"$gte": new Date(dteFechaInicio)};
 
        }
    }
    if (dteFechaFin != 'undefined') {
        query.createdAt =  {"$lt": new Date(dteFechaFin)};
    }
 
    if (!dteFechaInicio) {
        return res.status(400).json({
            ok: false,
            resp: 400,
            msg: 'No se recibió una fecha válida.',
            cont: {
                dteFechaInicio,
                // dteFechaFin
            }
        });
    }
    Alert.find(query)
        .populate([{ path: 'idCarrera', select: 'strCarrera',
         populate: { path: 'aJsnEspecialidad', select: 'strEspecialidad' } },
        { path: 'idAsignatura', select: 'strAsignatura' },
        { path: 'idUser', select: 'strName strLastName strMotherLastName' },
        { path: 'idEstatus', select: 'strNombre' }
    ]).exec((err, alerts) => { //ejecuta la funcion
            if (err) {
                return res.status(400).json({
                    ok: false,
                    status: 400,
                    msg: 'Error al generar la lista',
                    err
                });
            }
            else if(alerts.length == 0){
                return res.status(400).json({
                    ok: false,
                    status: 400,
                    msg: 'No se encuentran registros en la base de datos',
                    err
                });
            }
            console.log(alerts)
 
            return res.status(200).json({
                ok: true,
                status: 200,
                msg: 'Lista de alertas generada exitosamente',
                cont: alerts.length,
                cnt: alerts
            });
        });
});


module.exports = app;
/* jshint esversion: 8 */
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Api = require('../models/Api');
const CategoriaApi = require('../models/CategoriaApi');


app.post('/registrar/:idCategoria', (req, res) => {
    if (process.log) {
        console.log(' params ', req.params);
        console.log(' body ', req.body);
    }
    const api = new Api(req.body);

    let err = api.validateSync();

    if (err) {
        return res.status(500).json({
            ok: false,
            resp: 500,
            msg: 'Error: Error al registrar la api',
            cont: {
                err
            }
        });
    }

    CategoriaApi.findOne({
            '_id': req.params.idCategoria,
            'aJsnRutas.strNameApi': api.strNameApi,
            'aJsnRutas.blnStatus': true
        })
        .populate('aJsnRutas')
        .then((resp) => {
            if (resp) {
                return res.status(400).json({
                    ok: false,
                    resp: 400,
                    msg: `Error: La Api " ${ api.strNameApi } " ya se encuentra registrada.`,
                    cont: {
                        resp
                    }
                });
            } else {
                CategoriaApi.findOneAndUpdate({
                        '_id': req.params.idCategoria
                    }, {
                        $push: {
                            aJsnRutas: api
                        }
                    })
                    .then((categoria) => {
                        return res.status(200).json({
                            ok: true,
                            resp: 200,
                            msg: 'Success: Informacion insertada correctamente.',
                            cont: {
                                api
                            }
                        });
                    })
                    .catch((err) => {
                        return res.status(500).json({
                            ok: false,
                            resp: 500,
                            msg: 'Error: Error al registrar la api',
                            cont: {
                                err: err.message
                            }
                        });
                    });
            }
        })
        .catch((err) => {
            return res.status(500).json({
                ok: false,
                resp: 500,
                msg: 'Error: Error interno',
                cont: {
                    err: err.message
                }
            });
        });
});


app.get('/obtener/:idCategoria', (req, res) => {
    if (process.log) {
        console.log(' params ', req.params);
    }
    CategoriaApi.aggregate([{
                $unwind: '$aJsnRutas'
            },
            {
                $match: {
                    '_id': mongoose.Types.ObjectId(req.params.idCategoria),
                    'blnStatus': true
                }
            },
            {
                $replaceRoot: {
                    newRoot: '$aJsnRutas'
                }
            }
        ]).sort({ created_at: 'desc' })
        .then((rutas) => {

            if (rutas.length > 0) {

                return res.status(200).json({
                    ok: true,
                    resp: 200,
                    msg: 'Success: Informacion obtenida correctamente.',
                    cont: {
                        rutas
                    }
                });

            } else {

                return res.status(404).json({
                    ok: true,
                    resp: 404,
                    msg: 'Error: La categoría no existe o no cuenta con rutas de apis',
                    cont: {
                        rutas
                    }
                });

            }

        })
        .catch((err) => {

            return res.status(500).json({
                ok: false,
                resp: 500,
                msg: "Error: Error al obtener las apis de la categoría.",
                cont: {
                    err: err.message
                }
            });

        });

});

app.put('/actualizar/:idCategoria/:idApi',  (req, res) => {
    if (process.log) {
        console.log(' params ', req.params);
        console.log(' body ', req.body);
    }
    let api = new Api({
        _id: req.params.idApi,
        strNameApi: req.body.strNameApi,
        strRuta: req.body.strRuta,
        blnStatus: req.body.blnStatus
    });

    let err = api.validateSync();

    if (err) {

        return res.status(500).json({
            ok: false,
            resp: 500,
            msg: 'Error: Error al actualizar la api',
            cont: {
                err
            }
        });

    }

    CategoriaApi.aggregate([{
            $unwind: '$aJsnRutas'
        },
        {
            $match: {
                'aJsnRutas.blnStatus': true,
                'aJsnRutas.strNameApi': req.body.strNameApi
            }
        },
        {
            $replaceRoot: {
                newRoot: '$aJsnRutas'
            }
        }
    ], (err, resp) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                resp: 500,
                msg: 'Error: Error del servidor',
                cont: {
                    err
                }
            });
        }

        if (resp.length > 0) {
            if (req.params.idApi != resp[0]._id) {
                return res.status(400).json({
                    ok: false,
                    resp: 400,
                    msg: 'Error: La api ya se encuentra registrada',
                    cont: {
                        resp
                    }
                });
            }
        }


        CategoriaApi.findOneAndUpdate({
                '_id': req.params.idCategoria,
                'aJsnRutas._id': req.params.idApi
            }, {
                $set: {
                    'aJsnRutas.$.strNameApi': api.strNameApi,
                    'aJsnRutas.$.strRuta': api.strRuta,
                    'aJsnRutas.$.blnStatus': api.blnStatus
                }
            })
            .then((ruta) => {

                return res.status(200).json({
                    ok: true,
                    resp: 200,
                    msg: 'Success: Informacion actualizada correctamente.',
                    cont: {
                        ruta
                    }
                });

            })
            .catch((err) => {

                return res.status(500).json({
                    ok: false,
                    resp: 500,
                    msg: 'Error: Error al modificar la api',
                    cont: {
                        err
                    }
                });

            });
    });

});

app.delete('/eliminar/:idCategoria/:idApi', (req, res) => {
    if (process.log) {
        console.log(' params ', req.params);
        console.log(' body ', req.body);
    }
    CategoriaApi.findOneAndUpdate({
            '_id': req.params.idCategoria,
            'aJsnRutas._id': req.params.idApi
        }, {
            $set: { 'aJsnRutas.$.blnStatus': false }
        })
        .populate('aJsnRutas')
        .then((resp) => {

            return res.status(200).json({
                ok: true,
                resp: 200,
                msg: 'Success: Informacion insertada correctamente.',
                cont: {
                    resp
                }
            });

        })
        .catch((err) => {

            return res.status(500).json({
                ok: false,
                resp: 500,
                msg: 'Error: Error al eliminar la api.',
                cont: {
                    err: err.message
                }
            });

        });
});


module.exports = app;
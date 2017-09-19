// Load modules

const FsExtra = require("fs-extra");
const Hapi = require('hapi');
const Hoek = require('hoek');
const Insync = require('insync');
const Joi = require('joi');
const Puid = require('puid');

const Services = require('../../lib/plugins/services');


// Declare internals

const internals = {
    schema: Joi.object().default().keys({
        // mysql: Joi.object().required().keys({
        //     connectionLimit: Joi.number().integer().positive(),
        //     database: Joi.string().required(),
        //     host: Joi.string().required(),
        //     password: Joi.string().required().allow(''),
        //     port: Joi.number().integer().positive().default(3306),
        //     user: Joi.string().required()
        // })
    })
};


module.exports = internals.prepare = function (options) {

    return (next) => {

        Insync.auto({
            initialize:      (next) => { return next(null, { options }); },
            validateInput:   ['initialize', internals.validate('initialize.options', internals.schema)],
            startServer:     ['validateInput', internals.startServer]
        }, (err, data) => {

            if (err) {
                return next(err);
            }

            const server = data.startServer.result.server;
            const cachePath = data.startServer.result.cachePath;
            const settings = data.validateInput.result;

            return next(null, { result: { server, cachePath, settings } });
        });
    };
};


internals.validate = function (ref, schema) {

    return (next, data) => {

        Joi.validate(Hoek.reach(data, ref), schema, (err, result) => {

            return next(err, { result });
        });
    };
};


internals.startServer = function (next, data) {

    const options = data.validateInput.result;
    const plugins = [
        { register: require('hapi-auth-cookie') },
        { register: require('bell') },
        { register: Services, options }
    ];

    // Temp storage directory.
    const cachePath = `${__dirname}/temp/${(new Puid()).generate()}`;
    FsExtra.ensureDirSync(cachePath);

    const server = new Hapi.Server({
        cache: [
            { name: 'disk', engine: require('catbox-disk'), cachePath, cleanEvery: 0 },
            { name: 'memory', engine: require('catbox-memory') }
        ],
    });

    server.connection();

    server.register(plugins, (err) => {

        if (err) {
            return callback(err);
        }

        server.start((err) => {

            return next(err, { result: { server, cachePath } });
        });
    });
};

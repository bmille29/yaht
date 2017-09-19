'use strict';

// Load modules

const Hoek = require('hoek');
const Joi = require('joi');


// Declare internals

const internals = {
    schema: {
        path: Joi.string().default('/heartbeat'),
        message: Joi.object().default({ status: 'ok' })
    }
};


exports.register = function (server, options, next) {

    Joi.validate(options, internals.schema, (err, result) => {

        if (err) {
            return next(err);
        }

        server.route({
            method: 'GET',
            path: result.path,
            config: {
                tags: ['api'],
                description: 'Application health check',
                handler: (request, reply) => {

                    return reply(result.message);
                }
            }
        });

        return next();
    });
};


exports.register.attributes = {
    name: 'heartbeat',
    version: '1.0.0'
};

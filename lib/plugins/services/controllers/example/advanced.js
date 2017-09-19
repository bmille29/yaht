'use strict';

// Load modules

const Insync = require('insync');
const Joi = require('joi');


// Declare internals

const internals = {};


module.exports = internals.advanced = {
    description: 'A more advanced route handler example',
    tags: ['api'],
    validate: {
        payload: {
            input: Joi.string().required()
        }
    },
    handler: function (request, reply) {

        const self = this;
        const payload = request.payload;

        // An overly complex route that demonstrates flow control mechanims
        Insync.auto({
            initialize: (next) => { return next(null, { payload }); },
            foo:        ['initialize', internals.process('foo')],
            bar:        ['initialize', internals.process('bar')],
            convert:    ['foo', 'bar', internals.convert]
        }, (err, data) => {

            if (err) {
                return reply(err);
            }

            return reply({ echo: data.convert.result });
        });
    }
};


internals.process = function (output) {

    return (next, data) => {

        const payload = data.initialize.payload;
        const result = { input: payload.input };

        return next(null, { result });
    };
};


internals.convert = function (next, data) {

    const foo = data.foo.result;
    const bar = data.bar.result;

    return next(null, { result: { foo, bar } })
};

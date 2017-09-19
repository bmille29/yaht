'use strict';

// Load modules


// Declare internals

const internals = {};


module.exports = internals.simple = {
    description: 'Simple Example for a route',
    tags: ['api'],
    handler: function (request, reply) {

        const self = this;
        return reply({ status: 'ok' });
    }
};

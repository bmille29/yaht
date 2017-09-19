'use strict';

// Load modules

const Hoek = require('hoek');
const Joi = require('joi');

const Controllers = require('./controllers');
const Cookies = require('./cookies');
const Providers = require('./providers');

const Mysql = require('../../clients/mysql');


// Decalre internals

const internals = {
    schema: {
        // mysql: Joi.object().required().keys({
        //     connectionLimit: Joi.number().integer().positive().default(process.env.UV_THREADPOOL_SIZE),
        //     database: Joi.string().required(),
        //     host: Joi.string().required(),
        //     password: Joi.string().required().allow(''),
        //     port: Joi.number().integer().positive().default(3306),
        //     user: Joi.string().required()
        // })
    }
};


exports.register = function (server, options, next) {

    // Input Validation
    const settings = Joi.validate(options, internals.schema);
    Hoek.assert(!settings.error, settings.error && settings.error.annotate());

    // Configure cache
    server.app.cache = server.cache({ cache: 'memory', segment: 'memory' });

    // Configure storage (in-memory cache is used as temp database)
    server.app.storage = server.cache({ cache: 'disk', segment: 'storage' });

    // Session authentication strategy
    server.auth.strategy('yaht', 'cookie', Cookies.yaht);

    // OAuth authentication strategies via bell (some will be custom until bell has providers)
    server.auth.strategy('jira', 'bell', Providers.jira);

    // Configure cookies
    server.state('tokens', Cookies.default);

    // Initialize client connectors
    // const mysql = new Mysql(settings.value.mysql);
    // server.app.mysql = mysql;

    // Routing table
    server.route([
        { method: 'GET', path: '/example/simple', config: Controllers.example.simple},
        { method: 'POST', path: '/example/advanced', config: Controllers.example.advanced },

        { method: 'GET', path: '/services/account/logout', config: Controllers.account.logout },
        { method: 'GET', path: '/services/account/status', config: Controllers.account.status },
        { method: 'POST', path: '/services/account/login', config: Controllers.account.login },
        { method: 'POST', path: '/services/account/signup', config: Controllers.account.signup },

        // OAuth login routes
        { method: 'POST', path: '/services/oauth/tokens', config: Controllers.account.tokens },
        // { method: ['GET', 'POST'], path: '/services/account/appfigures', config: Controllers.account.appfigures },
        // { method: ['GET', 'POST'], path: '/services/account/asana', config: Controllers.account.asana },
        // { method: ['GET', 'POST'], path: '/services/account/bugzilla', config: Controllers.account.bugzilla },
        // { method: ['GET', 'POST'], path: '/services/account/github', config: Controllers.account.github },
        // { method: ['GET', 'POST'], path: '/services/account/google', config: Controllers.account.google },
        { method: ['GET', 'POST'], path: '/services/oauth/jira', config: Controllers.account.jira },
        // { method: ['GET', 'POST'], path: '/services/account/mysql', config: Controllers.account.mysql },
        // { method: ['GET', 'POST'], path: '/services/account/omniture', config: Controllers.account.omniture },
        // { method: ['GET', 'POST'], path: '/services/account/oracle', config: Controllers.account.oracle },
        // { method: ['GET', 'POST'], path: '/services/account/zendesk', config: Controllers.account.zendesk },
    ]);

    return next();
};


exports.register.attributes = {
    name: 'services',
    version: '1.0.0'
};

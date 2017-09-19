'use strict';

// Load modules

const Boom = require('boom');
const Hoek = require('hoek');
const Insync = require('insync');
const Joi = require('joi');
const Uuid = require('uuid');


// Declare internals

const internals = { ttl: 3600000 };


exports.signup = {
    auth: { strategy: 'yaht', mode: 'optional' },
    description: 'signup',
    tags: ['api'],
    validate: {
        payload: Joi.object().default().keys({
            email: Joi.string().required().email(),
            password: Joi.string().required(),
            username: Joi.string().required()
        })
    },
    handler: function (request, reply) {

        if (request.auth.isAuthenticated) {
            return reply(Boom.badRequest('User already signed in'));
        }

        const cache = request.server.app.cache;
        const storage =request.server.app.storage;

        const sid = Uuid.v4();
        const account = request.payload;
        const email = request.payload.email
        const profile = { email, username: account.username };

        const _check = (next, data) => {

            if (data.lookup.result.value) {
                return next(Boom.badRequest('User account already exists'));
            }

            return next();
        };

        Insync.auto({
            init:   (next) => { return next(null, { sid, email, account, profile }); },
            lookup: ['init', internals.get(storage, 'init.email')],
            check:  ['lookup', _check],
            create: ['check', internals.set(storage, 'init.email', 'init.account')],
            cache:  ['create', internals.set(cache, 'init.sid', 'init.profile')],
        }, (err, data) => {

            if (err) {
                return reply(err);
            }

            // Set auth cookie
            request.cookieAuth.set({ sid, profile });
            return reply({ status: 'ok' });
        });
    }
};


exports.login = {
    auth: { strategy: 'yaht', mode: 'optional' },
    description: 'login',
    tags: ['api'],
    validate: {
        payload: Joi.object().default().keys({
            email: Joi.string().required().email(),
            password: Joi.string().required()
        })
    },
    handler: function (request, reply) {

        if (request.auth.isAuthenticated) {
            return reply(Boom.badRequest('User already signed in'));
        }

        const sid = Uuid.v4();
        const email = request.payload.email;
        const password = request.payload.password;

        const cache = request.server.app.cache;
        const storage =request.server.app.storage;

        const _check = (next, data) => {

            const account = data.lookup.result.value;
            const password = data.init.password;

            if (!account || (account.password !== password)) {
                return next(Boom.badRequest('Incorrect user or password'));
            }

            const result = { profile: { email: account.email, username: account.username } };
            return next(null, { result });
        };

        Insync.auto({
            init:   (next) => { return next(null, { sid, email, password }); },
            lookup: ['init', internals.get(storage, 'init.email')],
            check:  ['lookup', _check],
            cache:  ['check', internals.set(cache, 'init.sid', 'check.result.profile')],
        }, (err, data) => {

            if (err) {
                return reply(err);
            }

            // Set auth cookie
            const profile = data.check.result.profile;
            request.cookieAuth.set({ sid, profile });
            return reply({ status: 'ok' });
        });
    }
};


exports.logout = {
    auth: { strategy: 'yaht', mode: 'required' },
    description: 'logout',
    tags: ['api'],
    handler: function (request, reply) {

        const sid = request.auth.credentials.sid;
        const cache = request.server.app.cache;
        const storage =request.server.app.storage;

        const _check = (next, data) => {

            if (!data.lookup.result.value) {
                return next(Boom.badRequest('Must be logged in to log out'));
            }

            if (!data.lookup.result.cached.isStale) {
                return next(Boom.badRequest('Session expired'));
            }

            return next();
        };

        Insync.auto({
            init:   (next) => { return next(null, { sid }); },
            lookup: ['init', internals.get(cache, 'init.sid')],
            drop:   ['lookup', internals.drop(cache, 'init.sid')],
        }, (err, data) => {

            if (err) {
                return reply(err);
            }

            // Clear auth cookie
            request.cookieAuth.clear();
            return reply({ status: 'ok' });
        });
    }
};


exports.status = {
    auth: { strategy: 'yaht', mode: 'required' },
    description: 'status',
    tags: ['api'],
    handler: function (request, reply) {

        const sid = request.auth.credentials.sid;
        const cache = request.server.app.cache;

        Insync.auto({
            init:   (next) => { return next(null, { sid }); },
            lookup: ['init', internals.get(cache, 'init.sid')]
        }, (err, data) => {

            if (err) {
                return reply(err);
            }

            const lookup = data.lookup.result;
            const status = { profile: lookup.value, cached: lookup.cached, log: lookup.log };
            return reply({ sid, status });
        });
    }
};


exports.tokens = {
    auth: { strategy: 'yaht', mode: 'required' },
    description: 'Update user\'s tokens (must have tokens cookie set)',
    tags: ['api'],
    handler: function (request, reply) {

        if (!request.auth.isAuthenticated) {
            return reply(Boom.unauthorized(`Authentication failed: ${request.auth.error.message}`));
        }

        const sid = request.auth.credentials.sid;
        const email = request.auth.credentials.account.email;
        const tokens = request.state.tokens || {};

        request.server.app.storage.get(email, (err, value, cached, log) => {

            // TODO: handle case where cache expires
            if (err) {
                return reply(err);
            }

            const account = Hoek.applyToDefaults(value.account, { tokens });

            // Cache account by sid
            request.server.app.cache.set(sid, { account }, internals.ttl, (err) => {

                if (err) {
                    return reply(err);
                }

                // Record new account in storage
                request.server.app.storage.set(account.email, { account }, internals.ttl, (err) => {

                    if (err) {
                        return reply(err);
                    }

                    // Set auth cookie
                    request.cookieAuth.set({ sid, account: { email: account.email, username: account.username, tokens: account.tokens } });
                    return reply({ status: 'ok' });
                });
            });
        });
    }
};


exports.jira = {
    auth: 'jira',
    description: 'JIRA OAuth login',
    tags: ['api'],
    handler: function (request, reply) {

        if (!request.auth.isAuthenticated) {
            return reply(Boom.unauthorized(`Authentication failed: ${request.auth.error.message}`));
        }

        // User is now logged in, redirect them to their account area
        return reply({ status: 'ok' }).state('tokens', { jira: request.auth.credentials });
    }
};


// Utility

internals.get = function (store, refkey) {

    return (next, data) => {

        const key = Hoek.reach(data, refkey);
        store.get(key, (err, value, cached, log) => {

            // console.log(JSON.stringify({ action: 'get', key, value, cached, log, err }));
            if (err) {
                return next(err);
            }

            return next(null, { result: { value, cached, log } });
        });
    };
};


internals.set = function (store, refkey, refval) {

    return (next, data) => {

        const key = Hoek.reach(data, refkey);
        const value = Hoek.reach(data, refval);
        store.set(key, value, internals.ttl, (err) => {

            // console.log(JSON.stringify({ action: 'set', key, value, err }));
            if (err) {
                return next(err);
            }

            return next();
        });
    };
};


internals.drop = function (store, refkey) {

    return (next, data) => {

        const key = Hoek.reach(data, refkey);
        store.drop(key, (err) => {

            // console.log(JSON.stringify({ action: 'drop', key }));
            if (err) {
                return next(err);
            }

            return next();
        });
    };
};

'use strict';

// Load modules

const Hoek = require('hoek');
const Insync = require('insync');
const Joi = require('joi');
const Mysql = require('mysql');


// Declare internals

const internals = {
    schema: {
        mysql: Joi.object().required().keys({
            connectionLimit: Joi.number().integer().positive(),
            database: Joi.string().required(),
            host: Joi.string().required(),
            password: Joi.string().required().allow(''),
            port: Joi.number().integer().positive().default(3306),
            user: Joi.string().required()
        }),
        execute: Joi.object().keys({
            pre: Joi.array().single().default([]).items({
                stmt: Joi.string().required(),
                values: Joi.array().default([]),
                options: Joi.object().default().keys({
                    timeout: Joi.number().integer().positive().allow(0)
                })
            }),
            stmt: Joi.string().required(),
            values: Joi.array().default([]),
            options: Joi.object().default().keys({
                timeout: Joi.number().integer().positive().allow(0)
            })
        }),
        stream: Joi.object().keys({
            highWaterMark: Joi.number().integer().positive().default(1000),
            pre: Joi.array().single().default([]).items({
                stmt: Joi.string().required(),
                values: Joi.array().default([]),
                options: Joi.object().default().keys({
                    timeout: Joi.number().integer().positive().allow(0)
                })
            }),
            stmt: Joi.string().required(),
            values: Joi.array().default([]),
            options: Joi.object().default().keys({
                timeout: Joi.number().integer().positive().allow(0)
            })
        })
    }
};


module.exports = internals.Mysql = function (options) {

    const self = this;
    Hoek.assert(self.constructor === internals.Mysql, 'Must be constructed with new');

    // Input validation
    const result = Joi.validate(options, internals.schema.mysql);
    Hoek.assert(!result.error, result.error && result.error.annotate());

    self._settings = result.value;
    self._pool = Mysql.createPool(self._settings);
    self.escape = Mysql.escape;

    return self;
};


internals.Mysql.prototype.execute = function (input, callback) {

    const self = this;
    const attempts = { times: 3, interval: 200 };

    Insync.auto({
        initialize:       (next) => { return next(null, { input }); },
        validateInput:    ['initialize', internals.validate('initialize.input', internals.schema.execute)],
        getConnection:    ['initialize', Insync.retry(attempts, internals.getConnection.bind(self))],
        preStatements:    ['getConnection', internals.preStatements.bind(self)],
        beginTransaction: ['preStatements', internals.beginTransaction.bind(self)],
        query:            ['beginTransaction', internals.execute.bind(self)],
        commit:           ['query', internals.commit.bind(self)],
        convert:          ['commit', internals.convert.bind(self)]
    }, (err, data) => {

        // Automatically release connection back to pool
        const connection = Hoek.reach(data, 'getConnection.result');
        connection && connection.release();

        if (err) {
            return callback(err);
        }

        return callback(null, data.convert.result);
    });
};


internals.Mysql.prototype.stream = function (input, callback) {

    const self = this;
    const attempts = { times: 3, interval: 200 };

    Insync.auto({
        initialize:    (next) => { return next(null, { input }); },
        validateInput: ['initialize', internals.validate('initialize.input', internals.schema.stream)],
        getConnection: ['validateInput', Insync.retry(attempts, internals.getConnection.bind(self))],
        preStatements: ['getConnection', internals.preStatements.bind(self)],
        query:         ['preStatements', internals.stream.bind(self)],
        convert:       ['query', internals.convert.bind(self)]
    }, (err, data) => {

        const timerObj = new Hoek.Timer();
        const connection = Hoek.reach(data, 'getConnection.result');
        const stream = Hoek.reach(data, 'convert.result');

        if (err) {
            connection && connection.release();
            return callback(err);
        }

        // Automatically release connection back to pool
        stream.on('close', () => { return console.log('MySQL Stream close - elapsed time: ' + timerObj.elapsed()); });
        stream.on('end', () => { return (self._pool._freeConnections.indexOf(connection) === -1) && connection.release(); });
        stream.on('error', (err) => { return (self._pool._freeConnections.indexOf(connection) === -1) && connection.release(); });

        return callback(null, stream);
    });
};


// Flow control

internals.validate = function (ref, schema) {

    return (next, data) => {

        Joi.validate(Hoek.reach(data, ref), schema, (err, result) => {

            return next(err, { result });
        });
    };
};


internals.getConnection = function (next, data) {

    const self = this;
    self._pool.getConnection((err, connection) => {

        if (err) {
            return next(err);
        }

        return next(null, { result: connection });
    });
};


internals.preStatements = function (next, data) {

    const input = data.validateInput.result;
    const connection = data.getConnection.result;

    // Execute any "pre" statements (meant for session configuration)
    Insync.mapSeries(input.pre, (entry, callback) => {

        connection.query(entry.stmt, entry.values, (err, rows, fields) => {

            if (err) {
                return callback(err);
            }

            return callback(null, rows, fields);
        });
    }, (err, results) => {

        if (err) {
            return next(err);
        }

        return next(null, { result: results });
    });
};


internals.beginTransaction = function (next, data) {

    const connection = data.getConnection.result;
    connection.beginTransaction((err) => {

        return next(err);
    });
};


internals.execute = function (next, data) {

    const input = data.validateInput.result;
    const connection = data.getConnection.result;

    const options = Hoek.applyToDefaults({ sql: input.stmt, values: input.values }, input.options);
    connection.query(options, (err, rows, fields) => {

        if (err) {
            return next(err);
        }

        return next(null, { result: { rows, fields } });
    });
};


internals.commit = function (next, data) {

    const connection = data.getConnection.result;
    connection.commit((err) => {

        return next(err);
    });
};


internals.stream = function (next, data) {

    const input = data.validateInput.result;
    const connection = data.getConnection.result;

    const options = Hoek.applyToDefaults({ sql: input.stmt, values: input.values }, input.options);
    const stream = connection.query(options).stream({ highWaterMark: input.highWaterMark });

    return next(null, { result: stream });
};


internals.convert = function (next, data) {

    return next(null, { result: data.query.result });
};

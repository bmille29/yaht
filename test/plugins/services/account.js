'use strict'

// Load modules

const Code = require('code');
const Insync = require('insync');
const Joi = require('joi');
const Lab = require('lab');
const Wreck = require('wreck');

const Helper = require('../../helper');


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const expect = Code.expect;
const it = lab.it;


// Declare internals

const internals = {
    input: {
        logout: { method: 'GET', url: '/services/account/logout' },
        status: { method: 'GET', url: '/services/account/status' },
        signup: {
            method: 'POST',
            url: '/services/account/signup',
            payload: { email: 'foobar@example.io', password: 'fakepass', username: 'foobar' }
        },
        login: {
            method: 'POST',
            url: '/services/account/login',
            payload: { email: 'foobar@example.io', password: 'fakepass' }
        }
    }
};


describe('Yaht Accounts', () => {

    it('POST /services/account/signup', (done) => {

        Insync.auto({
            prepare: Helper.prepare(),
            signup:  ['prepare', Helper.inject(internals.input.signup)],
        }, (err, data) => {

            expect(err).to.not.exist();

            // Validate output
            const statusCode = data.signup.res.statusCode;
            const cookies = data.signup.res.headers['set-cookie'];
            const payload = data.signup.res.result;

            expect(statusCode).to.equal(200);
            expect(cookies).to.match(/yaht=Fe26/);
            expect(payload).to.equal({ status: 'ok' });

            done();
        });
    });

    it('GET /services/account/status', (done) => {

        Insync.auto({
            prepare: Helper.prepare(),
            signup:  ['prepare', Helper.inject(internals.input.signup)],
            status:  ['signup', Helper.inject(internals.input.status, { cookies: 'signup' })],
        }, (err, data) => {

            expect(err).to.not.exist();

            // Validate output
            const statusCode = data.status.res.statusCode;
            const payload = data.status.res.result;

            const result = Joi.validate(payload, Joi.object().required().keys({
                sid: Joi.string().required().uuid({ version: 'uuidv4' }),
                status: Joi.object().required().keys({
                    profile: Joi.object().required(),
                    cached: Joi.object().required(),
                    log: Joi.object().required()
                })
            }))

            expect(statusCode).to.equal(200);
            expect(result.err).to.not.exist();

            done();
        });
    });

    it('GET /services/account/logout', (done) => {

        Insync.auto({
            prepare: Helper.prepare(),
            signup:  ['prepare', Helper.inject(internals.input.signup)],
            logout:  ['signup', Helper.inject(internals.input.logout, { cookies: 'signup' })],
        }, (err, data) => {

            expect(err).to.not.exist();

            // Validate output
            const statusCode = data.logout.res.statusCode;
            const cookies = data.logout.res.headers['set-cookie'];
            const payload = data.logout.res.result;

            expect(statusCode).to.equal(200);
            expect(cookies).to.match(/yaht=;/);
            expect(payload).to.equal({ status: 'ok' });

            done();
        });
    });

    it('POST /services/account/login', (done) => {

        Insync.auto({
            prepare: Helper.prepare(),
            signup:  ['prepare', Helper.inject(internals.input.signup)],
            logout:  ['signup', Helper.inject(internals.input.logout, { cookies: 'signup' })],
            login:   ['logout', Helper.inject(internals.input.login, { cookies: ['signup', 'logout'] })],
        }, (err, data) => {

            expect(err).to.not.exist();

            // Validate output
            const statusCode = data.login.res.statusCode;
            const cookies = data.login.res.headers['set-cookie'];
            const payload = data.login.res.result;

            expect(statusCode).to.equal(200);
            expect(cookies).to.match(/yaht=Fe26/);
            expect(payload).to.equal({ status: 'ok' });

            done();
        });
    });
});

// describe('Provider Accounts', () => {
//
//     it('POST /services/account/jira', (done) => {
//
//         Insync.auto({
//             prepare: Helper.prepare(),
//             signup:  ['prepare', Helper.inject(internals.input.signup)],
//         }, (err, data) => {
//
//             expect(err).to.not.exist();
//
//             // Validate output
//             const statusCode = data.signup.res.statusCode;
//             const cookies = data.signup.res.headers['set-cookie'];
//             const payload = data.signup.res.result;
//
//             expect(statusCode).to.equal(200);
//             expect(cookies).to.match(/yaht=Fe26/);
//             expect(payload).to.equal({ status: 'ok' });
//
//             done();
//         });
//     });
// });

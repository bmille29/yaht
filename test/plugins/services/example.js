'use strict'

// Load modules

const Insync = require('insync');
const Code = require('code');
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
    config: {
        // mysql: {
        //     connectionLimit: 32,
        //     database: '' ,
        //     host: '',
        //     password: '',
        //     port: 3306,
        //     user: ''
        // }
    }
};


describe('Example Template Routes', () => {

    it('GET /example/simple', (done) => {

        const simple = { method: 'GET', url: '/example/simple' };

        Insync.auto({
            prepare: Helper.prepare(internals.config),
            inject:  ['prepare', Helper.inject(simple)],
        }, (err, data) => {

            expect(err).to.not.exist();

            // Validate output
            const statusCode = data.inject.res.statusCode;
            const payload = data.inject.res.result;

            expect(statusCode).to.equal(200);
            expect(payload).to.equal({ status: 'ok' });

            done();
        });
    });

    it('POST /example/advanced', (done) => {

        const advanced = { method: 'POST', url: '/example/advanced', payload: { input: 'testing' } };

        Insync.auto({
            prepare: Helper.prepare(internals.config),
            inject:  ['prepare', Helper.inject(advanced)],
        }, (err, data) => {

            expect(err).to.not.exist();

            // Validate output
            const statusCode = data.inject.res.statusCode;
            const payload = data.inject.res.result;

            expect(statusCode).to.equal(200);
            expect(payload).to.equal({ echo: { foo: { input: 'testing' }, bar: { input: 'testing' } } });

            done();
        });
    });
});

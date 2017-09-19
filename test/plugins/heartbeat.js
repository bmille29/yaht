'use strict';

// Load modules

const Code = require('code');
const Hapi = require('hapi');
const Joi = require('joi');
const Lab = require('lab');


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


// Declare internals

const internals = {
    plugins: { heartbeat: require('../../lib/plugins/heartbeat') }
};


describe('Heartbeat', () => {

    it('returns 200', (done) => {

        const server = new Hapi.Server();
        server.connection();

        const plugin = { register: internals.plugins.heartbeat };
        server.register(plugin, (err) => {

            expect(err).to.not.exist();
            server.start((err) => {

                expect(err).to.not.exist();
                server.inject('/heartbeat', (res) => {

                    expect(res.statusCode).to.equal(200);
                    expect(res.result).to.equal({ status: 'ok' });
                    done();
                });
            });
        });
    });

    it('throws with bad configuration', (done) => {

        const server = new Hapi.Server();
        server.connection();

        const plugin = {
            register: internals.plugins.heartbeat,
            options: { bad: 'configuration' }
        };

        server.register(plugin, (err) => {

            expect(err).to.exist();
            expect(err.message).to.equal('"bad" is not allowed');
            done();
        });
    });

    it('set a custom path', (done) => {

        const server = new Hapi.Server();
        server.connection();

        const plugin = {
            register: internals.plugins.heartbeat,
            options: { path: '/custom/path' }
        };


        server.register(plugin, (err) => {

            expect(err).to.not.exist();
            server.start((err) => {

                expect(err).to.not.exist();
                server.inject(plugin.options.path, (res) => {

                    expect(res.statusCode).to.equal(200);
                    expect(res.result).to.equal({ status: 'ok' });
                    done();
                });
            });
        });
    });

    it('set a custom message', (done) => {

        const server = new Hapi.Server();
        server.connection();

        const plugin = {
            register: internals.plugins.heartbeat,
            options: { message: { custom: 'message' } }
        };

        server.register(plugin, (err) => {

            expect(err).to.not.exist();
            server.start((err) => {

                expect(err).to.not.exist();
                server.inject('/heartbeat', (res) => {

                    expect(res.statusCode).to.equal(200);
                    expect(res.result).to.equal(plugin.options.message);
                    done();
                });
            });
        });
    });
});

'use strict';

// Load modules

const Code = require('code');
const Insync = require('insync');
const Lab = require('lab');
const Through2 = require('through2');

const Mysql = require('../../lib/clients/mysql');


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const expect = Code.expect;
const it = lab.it;


// Declare internals

const internals = {
    config: {
        database: '',
        host: '',
        password: '',
        port: '3306',
        user: ''
    }
};


describe('MySQL', { skip: true }, () => {

    it('execute basic query', (done) => {

        const mysql = new Mysql(internals.config);
        const input = { stmt: 'SELECT 1 + 1 AS solution' };

        mysql.execute(input, (err, result) => {

            expect(err).to.not.exist();
            expect(result.rows).to.equal([{ solution: 2 }]);
            done();
        });
    });

    it('execute with values', (done) => {

        const mysql = new Mysql(internals.config);
        const input = { stmt: 'SELECT 1 + 1 AS solution', values: [] };

        mysql.execute(input, (err, result) => {

            expect(err).to.not.exist();
            expect(result.rows).to.equal([{ solution: 2 }]);
            done();
        });
    });

    it('execute with timeout options', (done) => {

        const mysql = new Mysql(internals.config);
        const input = { stmt: 'SELECT 1 + 1 AS solution', options: { timeout: 1 } };

        mysql.execute(input, (err, result) => {

            expect(err).to.exist();
            expect(JSON.stringify(err)).to.equal('{"code":"PROTOCOL_SEQUENCE_TIMEOUT","fatal":true,"timeout":1}');
            done();
        });
    });

    it('execute with pre-statements', (done) => {

        const mysql = new Mysql(internals.config);
        const sql = {
            pre: [{ stmt: 'SET group_concat_max_len = 4194304' }],
            stmt: 'SELECT 1 + 1 AS solution'
        };

        mysql.execute(sql, (err, result) => {

            expect(err).to.not.exist();
            expect(result.rows).to.equal([{ solution: 2 }]);
            done();
        });
    });

    it('stream basic query', (done) => {

        const mysql = new Mysql(internals.config);
        const sql = { stmt: 'SELECT 1 + 1 AS solution' };

        mysql.stream(sql, (err, stream) => {

            expect(err).to.not.exist();

            const result = { rows: [] };
            const sink = Through2.obj((chunk, enc, callback) => {

                result.rows.push(chunk);
                return callback();
            });

            sink.on('error', () => { expect(err).to.not.exist(); });
            sink.on('finish', () => {

                expect(result.rows).to.equal([{ solution: 2 }]);
                done();
            });

            stream.pipe(sink);
        });
    });

    it('stream with values', (done) => {

        const mysql = new Mysql(internals.config);
        const sql = { stmt: 'SELECT 1 + ? AS solution', values: [1] };

        mysql.stream(sql, (err, stream) => {

            expect(err).to.not.exist();

            const result = { rows: [] };
            const sink = Through2.obj((chunk, enc, callback) => {

                result.rows.push(chunk);
                return callback();
            });

            sink.on('error', () => { expect(err).to.not.exist(); });
            sink.on('finish', () => {

                expect(result.rows).to.equal([{ solution: 2 }]);
                done();
            });

            stream.pipe(sink);
        });
    });

    it('stream with pre-statements', (done) => {

        const mysql = new Mysql(internals.config);
        const sql = {
            pre: [{ stmt: 'SET group_concat_max_len = 4194304' }],
            stmt: `SHOW VARIABLES LIKE 'group_concat_max_len'`
        };

        mysql.stream(sql, (err, stream) => {

            expect(err).to.not.exist();

            const result = { rows: [] };
            const sink = Through2.obj((chunk, enc, callback) => {

                result.rows.push(chunk);
                return callback();
            });

            sink.on('error', () => { expect(err).to.not.exist(); });
            sink.on('finish', () => {

                expect(result.rows).to.equal([{ Variable_name: 'group_concat_max_len', Value: '4194304' }]);
                done();
            });

            stream.pipe(sink);
        });
    });
});

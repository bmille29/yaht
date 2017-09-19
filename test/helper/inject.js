'use strict'

// Load modules

const Hoek = require('hoek');
const Joi = require('joi');


// Declare internals

const internals = {
    schema: {
        override: Joi.object().default().keys({
            cookies: Joi.array().single().unique().default([]).items(Joi.string())
        })
    }
};


module.exports = internals.inject = function (options, override) {

    return (next, data) => {

        const server = data.prepare.result.server;

        Joi.validate(override, internals.schema.override, (err, value) => {

            if (err) {
                return next(err);
            }

            // Cookies
            const headers = Hoek.reach(options, 'headers', { default: {} });
            options.headers = Hoek.applyToDefaults(headers, internals.cookies(data, value));

            server.inject(options, (res) => {

                return next(null, { res });
            });
        });
    };
};


internals.cookies = function (data, override) {

    const jar = {};

    // Set-Cookie applied in order of lookup options
    for (let i = 0; i < override.cookies.length; ++i) {
        const setCookies = data[override.cookies[i]].res.headers['set-cookie'];

        for (let i = 0; i < setCookies.length; ++i) {
            const setCookie = setCookies[i].split(';')[0];
            const [key, value] = setCookie.split('=');
            jar[key] = value;
        };
    }

    const cookies = [];
    for (let key in jar) {
        if (jar.hasOwnProperty(key)) {
            cookies.push(`${key}=${jar[key]}`);
        }
    }

    return { cookie: cookies.join(';') };
};

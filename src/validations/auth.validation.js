const Joi = require('joi');

module.exports = {
    // POST /v1/auth/register
    register: {
        body: {
            fullName: Joi.string().required().max(128),
            email: Joi.string().email().required(),
            password: Joi.string().required().min(6).max(128),
            country: Joi.string().required().max(128),
            city: Joi.string().required().max(128),
            address: Joi.string().required().max(256),
            //phone: Joi.string().max(256),
            role: Joi.string().required().max(256),
        },
    },

    // POST /v1/auth/login
    login: {
        body: {
            email: Joi.string().email().required(),
            password: Joi.string().required().max(128),
        },
    },

    // POST /v1/auth/refresh
    refresh: {
        body: {
            email: Joi.string().email().required(),
            refreshToken: Joi.string().required(),
        },
    },
};

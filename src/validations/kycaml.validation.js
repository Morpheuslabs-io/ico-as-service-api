const Joi = require('joi');

module.exports = {

  // POST /v1/kyc-aml
  createKYCAML: {
    body: {
      userId: Joi.string().regex(/^[a-fA-F0-9]{24}$/).required(),
    },
  },
};

const httpStatus = require('http-status');
const request = require('request-promise');
const dotenv = require('dotenv');
const Contract = require('../models/contract.model');

dotenv.config();

exports.listContracts = async (req, res, next) => {
    Contract.list().then(contracts => {
        return res.status(200).json(contracts);
    }).catch(err => {
        return res.status(500).json({error: true, message: err.message});
    });
};

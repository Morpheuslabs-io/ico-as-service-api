const httpStatus = require('http-status');
const request = require('request-promise');
const dotenv = require('dotenv');
const Contract = require('../../models/contract.model');

dotenv.config();

exports.createContract = async (req, res, next) => {
    const contract = new Contract(req.body);
    contract.userId = req.user._id;
    contract.save().then(savedContract => {
        return res.status(200).json(savedContract);
    }).catch(err => {
        return res.status(500).json({error: true, message: err.message});
    });
};

exports.listContracts = async (req, res, next) => {
    const net = req.params.net;
    const userId = req.user._id;
    Contract.list({userId: userId, network: net}).then(contracts => {
        return res.status(200).json(contracts);
    }).catch(err => {
        return res.status(500).json({error: true, message: err.message});
    });
};

exports.getContract = async (req, res, next) => {
    Contract.findOne({_id: req.params.id}).exec()
        .then(contract => {
            return res.status(200).json(contract);
        }).catch(err => {
        return res.status(500).json({error: true, message: err.message});
    });
};

exports.deleteContract = async (req, res, next) => {
    Contract.remove({_id: req.params.id}).exec().then(response => {
        return res.status(200).json(response);
    }).catch(err => {
        return res.status(500).json({error: true, message: err.message});
    });
};

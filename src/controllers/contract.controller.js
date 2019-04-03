const httpStatus = require('http-status');
const request = require('request-promise');
const dotenv = require('dotenv');
const Contract = require('../models/contract.model');

dotenv.config();

exports.listContracts = (req, res, next) => {
    const net = req.params.net;
    Contract.list({network: net}).then(contracts => {
        return res.status(200).json(contracts);
    }).catch(err => {
        return res.status(500).json({error: true, message: err.message});
    });
};

exports.updateWhitelist = (req, res, next) => {
    const contractId = req.body.contractId;
    const no = req.body.no;
    const w_address = req.body.w_address;
    const w_min = req.body.w_min;
    const w_max = req.body.w_max;

    return Contract.findOne({_id: contractId}).then(contract => {
        const whitelist = contract.tiers[no].whitelist;
        let matched = -1;
        for (let i=0; i<whitelist.length; i++) {
            if (whitelist[i].w_address == w_address) {
                matched = i;
                break;
            }
        }
        if (matched != -1) {
            contract.tiers[no].whitelist[matched] = {
                w_address, w_min, w_max
            };
        } else {
            whitelist.push({
                w_address, w_min, w_max
            });
            contract.tiers[no].whitelist = whitelist;
        }
        return contract.save().then(savedContract => {
            return res.status(200).json(savedContract);
        }).catch(err => {
            res.status(500).json({error: true, message: err.message});
        });
    });
};

exports.getTiers = (req, res, next) => {
    const contractId = req.query.contractId;
    return Contract.findOne({_id: contractId}).then(contract => {
        return res.status(200).json(contract.tiers);
    }).catch(err => {
        res.status(500).json({error: true, message: err.message});
    });
};

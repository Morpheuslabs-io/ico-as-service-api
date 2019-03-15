const httpStatus = require('http-status');
const request = require('request-promise');
const dotenv = require('dotenv');
const TokenVesting = require('../../models/tokenvesting.model');

dotenv.config();

exports.createTokenVesting = async (req, res, next) => {
    const tokenVesting = new TokenVesting(req.body);
    console.log('createTokenVesting - tokenVesting:', tokenVesting);
    console.log('createTokenVesting - req.body:', req.body);
    tokenVesting.userId = req.user._id;
    tokenVesting.save().then(savedTokenVesting => {
        return res.status(200).json(savedTokenVesting);
    }).catch(err => {
        return res.status(500).json({error: true, message: err.message});
    });
};

exports.listTokenVestings = async (req, res, next) => {
    const net = req.params.net;
    const userId = req.user._id;
    TokenVesting.list({userId: userId, network: net}).then(tokenVestings => {
        return res.status(200).json(tokenVestings);
    }).catch(err => {
        return res.status(500).json({error: true, message: err.message});
    });
};

exports.getTokenVesting = async (req, res, next) => {
    TokenVesting.findOne({_id: req.params.id}).exec()
        .then(tokenVesting => {
            return res.status(200).json(tokenVesting);
        }).catch(err => {
        return res.status(500).json({error: true, message: err.message});
    });
};

exports.deleteTokenVesting = async (req, res, next) => {
    TokenVesting.remove({_id: req.params.id}).exec().then(response => {
        return res.status(200).json(response);
    }).catch(err => {
        return res.status(500).json({error: true, message: err.message});
    });
};

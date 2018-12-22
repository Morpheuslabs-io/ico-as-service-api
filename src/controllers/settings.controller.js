const httpStatus = require('http-status');
const nodemailer = require('nodemailer');
const twoFactor = require('node-2fa');
const dotenv = require('dotenv');
const User = require('../models/user.model');
const Wallet = require('../models/wallet.model');
const ActionHistory = require('../models/actionHistory.model');
const moment = require('moment-timezone');
const {jwtExpirationInterval} = require('../config/vars');
const { sendVerifyEmail, sendForgotPasswordEmail } = require('../helpers/mailer');
const {log} = require('../helpers/logs');

dotenv.config({});

/**
 * Update Withdraw wallet Ethereum address
 */
exports.updateEthAddress = async (req, res, next) => {
    try {
        const wallet = await Wallet.findOne({userId: req.user._id});
        if (!wallet) {
            const newWallet = new Wallet({
                userId: req.user._id,
                label: 'token',
                balance: 0,
                address: req.body.address,
                disabled: false,
                logs: [],
                refLogs: [],
                refBalance: {
                    BTC: 0,
                    LTC: 0,
                    ETH: 0,
                    DASH: 0,
                    USD: 0,
                    EUR: 0,
                    LTCT: 0,
                }
            });

            const savedWallet = await newWallet.save();

            // log user's action
            if (req.body.browserInfo) {
                await log(req.user._id, req.body.browserInfo, 'Set Wallet Address');
            }

            return res.status(200).json({
                address: savedWallet.address
            });
        }

        wallet.address = req.body.address;
        const savedWallet = await wallet.save();

        // log user's action
        if (req.body.browserInfo) {
            await log(req.user._id, req.body.browserInfo, 'Set Wallet Address');
        }
        return res.status(200).json({
            address: savedWallet.address
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update password
 *
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
exports.updatePassword = async (req, res, next) => {
    try {
        const user = await User.get(req.user._id);
        if (!await user.passwordMatches(req.body.oldPassword)) {
            return res.status(400).json({code: 400, message: 'Current password is not matched'});
        }

        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        // log users action
        if (req.body.browserInfo) {
            await log(req.user._id, req.body.browserInfo, 'Changed Password');
        }

        return res.status(200).json({message: 'Your password has been changed'});
    } catch (error) {
        next(error);
    }
};

/**
 * Generate 2FA secret and otpUri for user's 2fa request
 *
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
exports.requestEnable2FA = async (req, res, next) => {
    try {
        const user = await User.get(req.user._id);
        if (user.tfaEnabled) {
            return res.status(400).json({code: 400, message: '2FA is already enabled for this account'});
        }

        const newSecret = twoFactor.generateSecret({
            name: 'Dashboard',
            account: user.email
        });

        user.tfaSecret = newSecret.secret;
        await user.save();

        return res.status(200).json({
            secret: newSecret.secret,
            otpUri: newSecret.uri
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Check user's otp temporary token
 *
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
exports.verify2FAToken = async (req, res, next) => {
    try {
        const user = await User.get(req.user._id);
        if (!user.tfaSecret) {
            return res.status(400).json({code: 400, message: '2FA is not enabled'});
        }

        const verifyResult = twoFactor.verifyToken(user.tfaSecret, req.body.token);

        if (verifyResult === null) {
            return res.status(400).json({code: 400, message: 'Invalid token'});
        } else if (verifyResult.delta > 0) {
            return res.status(400).json({code: 400, message: 'You entered the token too early'});
        } else if (verifyResult.delta < 0) {
            return res.status(400).json({code: 400, message: 'You entered the token too late'});
        } else if (verifyResult.delta === 0) {
            user.tfaEnabled = true;
            await user.save();

            // log user's action
            if (req.body.browserInfo) {
                await log(req.user._id, req.body.browserInfo, 'Enabled 2FA');
            }
            return res.status(200).json({message: 'TFA is successfully enabled'});
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Disable 2FA
 *
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
exports.disable2FA = async (req, res, next) => {
    try {
        const user = await User.get(req.user._id);
        if (!user.tfaSecret) {
            return res.status(400).json({code: 400, message: '2FA is not enabled'});
        }

        const verifyResult = twoFactor.verifyToken(user.tfaSecret, req.body.token);

        if (verifyResult === null) {
            return res.status(400).json({code: 400, message: 'Invalid token'});
        } else if (verifyResult.delta > 0) {
            return res.status(400).json({code: 400, message: 'You entered the token too early'});
        } else if (verifyResult.delta < 0) {
            return res.status(400).json({code: 400, message: 'You entered the token too late'});
        } else if (verifyResult.delta === 0) {
            user.tfaEnabled = false;
            user.tfaSecret = '';
            await user.save();

            // log user's action
            if (req.body.browserInfo) {
                await log(req.user._id, req.body.browserInfo, 'Disabled 2FA');
            }
            return res.status(200).json({message: 'TFA is successfully disabled'});
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Collect login history
 *
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
exports.actionHistory = async (req, res, next) => {
    try {
        const history = await ActionHistory.findOne({userId: req.user._id});
        res.json(history && history.logs ? history.logs : []);
    } catch (error) {
        next(error);
    }
};

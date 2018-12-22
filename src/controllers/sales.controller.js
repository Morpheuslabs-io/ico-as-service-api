const httpStatus = require('http-status');
const User = require('../models/user.model');
const Order = require('../models/order.model');
const Payment = require('../models/payment.model');
const Currency = require('../models/currency.model');
const Stats = require('../models/stats.model');
const Wallet = require('../models/wallet.model');
const { handler: errorHandler } = require('../middlewares/error');
const _ = require('lodash');

exports.list = async (req, res, next) => {
    try {
        const currencies = await Currency.list();
        res.json(currencies);
    } catch (error) {
        next(error);
    }
};

exports.saleStats = async (req, res, next) => {
    try {
        const stats = await Stats.findOne({prod: true});
        const orders = await Order.find({expired: false});
        const payments = await Payment.find({credited: true});

        res.json({
            fund: stats.fund,
            sold: stats.sold,
            contributors: stats.contributors,
            orders: orders.length,
            credits: payments.length
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Return all sales stats, currency prices, user data including balances, referrers, refBalances
 *
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
exports.saleData = async (req, res, next) => {
    try {
        // sale stats
        const stats = await Stats.findOne({prod: true});
        const orders = await Order.find({expired: false});
        const payments = await Payment.find();
        const contributors = await Payment.find().distinct('userId');

        // currencies prices
        const currencies = await Currency.list();

        // user data
        const userData = await req.user.transform();

        res.json({
            currencyData: currencies,
            salesData: {
                fund: stats.fund,
                sold: stats.sold,
                contributors: contributors.length + stats.contributors,
                orders: orders.length,
                credits: payments.length
            },
            userData: userData
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all referral users and ref bonus info
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
exports.refUsers = async (req, res, next) => {
    try {
        const result = [];
        const refUsers = await User.find({referrers: {$elemMatch: {userId: req.user._id}}});
        const wallet = await Wallet.findOne({userId: req.user._id});
        const refLogs = wallet ? wallet.refLogs : [];

        for (let i = 0; i < refUsers.length; i++) {
            const refUser = refUsers[i];
            const refObj = _.find(refUser.referrers, {'userId': req.user._id});
            let logItems = [];
            if (refLogs.length) {
                logItems = _.filter(refLogs, {'refUserId': refUser._id});
            }

            if (logItems.length > 0) {
                logItems.forEach((logItem) => {
                    result.push({
                        userId: refUser._id,
                        email: refUser.email,
                        firstName: refUser.firstName,
                        lastName: refUser.lastName,
                        level: refObj.level,
                        amount: logItem.addition,
                        currency: logItem.currency,
                        paid: logItem.paid,
                        status: logItem.status ? logItem.status : "not",
                        paidAt: logItem.paid && logItem.timestamp ? logItem.timestamp : '-',
                        refLogId: logItem._id
                    });
                });
            } else {
                result.push({
                    userId: refUser._id,
                    email: refUser.email,
                    firstName: refUser.firstName,
                    lastName: refUser.lastName,
                    level: refObj.level,
                    amount: 0,
                    currency: '-',
                    paid: false,
                    status: "not",
                    paidAt: '-',
                    refLogId: null
                });
            }
        }

        res.json(result);
    } catch (error) {
        next(error);
    }
};

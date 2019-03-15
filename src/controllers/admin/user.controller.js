const httpStatus = require('http-status');
const {omit} = require('lodash');
const User = require('../../models/user.model');
const Wallet = require('../../models/wallet.model');
const Payment = require('../../models/payment.model');
const Order = require('../../models/order.model');
const Contract = require('../../models/contract.model');
const {handler: errorHandler} = require('../../middlewares/error');

/**
 * Load user and append to req.
 * @public
 */
exports.load = async (req, res, next, id) => {
    try {
        const user = await User.get(id);
        req.locals = {user};
        return next();
    } catch (error) {
        return errorHandler(error, req, res);
    }
};

/**
 * Get user
 * @public
 */
exports.get = (req, res) => res.json(req.locals.user.transform());

/**
 * Get logged in user info
 * @public
 */
exports.loggedIn = async (req, res) => res.json(await req.user.transform());

/**
 * Create new user
 * @public
 */
exports.create = async (req, res, next) => {
    try {
        const user = new User(req.body);
        const savedUser = await user.save();
        res.status(httpStatus.CREATED);
        res.json(savedUser.transform());
    } catch (error) {
        next(User.checkDuplicateEmail(error));
    }
};

/**
 * Replace existing user
 * @public
 */
exports.replace = async (req, res, next) => {
    try {
        const {user} = req.locals;
        const newUser = new User(req.body);
        const ommitRole = user.role !== 'admin' ? 'role' : '';
        const newUserObject = omit(newUser.toObject(), '_id', ommitRole);

        await user.update(newUserObject, {override: true, upsert: true});
        const savedUser = await User.findById(user._id);

        res.json(savedUser.transform());
    } catch (error) {
        next(User.checkDuplicateEmail(error));
    }
};

/**
 * Update existing user
 * @public
 */
exports.update = (req, res, next) => {
    const ommitRole = req.locals.user.role !== 'admin' ? 'role' : '';
    const updatedUser = omit(req.body, ommitRole);
    const user = Object.assign(req.locals.user, updatedUser);

    user.save()
        .then(savedUser => res.json(savedUser.transform()))
        .catch(e => next(User.checkDuplicateEmail(e)));
};

exports.list = async (req, res, next) => {
    const net = req.params.net;
    const adminId = req.user._id;
    Contract.list({userId: adminId, network: net}).then(contracts => {
        const contractId = req.query.contractId ? req.query.contractId : contracts[0]._id;
        User.list({role: "Investor", contractId: contractId}).then(users => {
            return res.status(200).json(users);
        }).catch(err => {
            return res.status(500).json({error: true, message: err.message});
        });
    });
};

exports.getInfo = async (req, res, next) => {
    const userId = req.params.userId;
    let data = {};
    Wallet.find({userId: userId}).exec().then(wallets => {
        data.wallets = wallets;
        return Payment.find({userId: userId}).exec();
    }).catch(err => res.status(500).json({error: true, message: err.message})).then(payments => {
        data.payments = payments;
        return Order.find({userId: userId}).exec();
    }).catch(err => res.status(500).json({error: true, message: err.message})).then(orders => {
        data.orders = orders;
        return User.findOne({_id: userId}).exec();
    }).catch(err => res.status(500).json({error: true, message: err.message})).then(user => {
        data.user = user;
        return res.status(200).json(data);
    }).catch(err => res.status(500).json({error: true, message: err.message}));
};

exports.remove = (req, res, next) => {
    const {user} = req.locals;

    user.remove()
        .then(() => res.status(httpStatus.NO_CONTENT).end())
        .catch(e => next(e));
};


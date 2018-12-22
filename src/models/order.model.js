const mongoose = require('mongoose');
const httpStatus = require('http-status');
const Payment = require('./payment.model');
const Wallet = require('./wallet.model');
const APIError = require('../utils/APIError');
const {env} = require('../config/vars');
const _ = require('lodash');


/**
 * Order Schema
 * @private
 */
const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    address: {
        type: String,
        required: true,
        index: true,
        trim: true,
    },
    currency: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paid: {
        type: Boolean,
        default: false
    },
    expired: {
        type: Boolean,
        default: false
    },
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    }
}, {
    timestamps: true,
});


/**
 * Methods
 */
orderSchema.method({
    transform() {
        const transformed = {};
        const fields = ['id', 'address', 'currency', 'price', 'amount', 'paid', 'expired', 'userId', 'paymentId', 'createdAt'];

        fields.forEach((field) => {
            transformed[field] = this[field];
        });

        return transformed;
    }
});

/**
 * Statics
 */
orderSchema.statics = {

    /**
     * Get address
     *
     * @param {ObjectId} id - The objectId of address.
     * @returns {Promise<User, APIError>}
     */
    async get(id) {
        try {
            let order;

            if (mongoose.Types.ObjectId.isValid(id)) {
                order = await this.findById(id).exec();
            }
            if (order) {
                return order;
            }

            throw new APIError({
                message: 'Order does not exist',
                status: httpStatus.NOT_FOUND,
            });
        } catch (error) {
            throw error;
        }
    },

    async getByAddress(addr) {
        try {
            let order = null;

            if (mongoose.Types.String.isValid(addr)) {
                order = await this.find({address: addr}).exec();
            }

            if (order) {
                return order;
            }

            throw new APIError({
                message: 'Order does not exist',
                status: httpStatus.NOT_FOUND,
            });
        } catch (error) {
            throw error;
        }
    },

    async getByUser(userId) {
        try {
            let orders = [];
            const resultOrders = [];

            if (mongoose.Types.ObjectId.isValid(userId)) {
                orders = await this.find({userId: userId}).exec();
            }

            for (let i = 0; i < orders.length; i++) {
                const order = orders[i];
                const transformed = order.transform();
                if (transformed.paid) {
                    const payment = await Payment.get(order.paymentId);
                    transformed.paidAmount = payment.amount;
                    transformed.credited = payment.credited;
                    transformed.paidTx = payment.txnId;

                    if (payment.credited) {
                        const wallet = await Wallet.findOne({logs: {$elemMatch: {paymentId: order.paymentId}}});
                        if (wallet) {
                            const logs = _.find(wallet.logs, {paymentId: order.paymentId});
                            transformed.log = logs;
                        } else {
                            transformed.log = null;
                        }
                    }
                } else {
                    transformed.paidAmount = 0;
                    transformed.credited = false;
                    transformed.paidTx = null;
                    transformed.log = null;
                }

                resultOrders.push(transformed);
            }

            return resultOrders;
        } catch (error) {
            throw error;
        }
    },

    async getByCurrencyType(currency) {
        try {
            let orders = [];

            if (mongoose.Types.String.isValid(currency)) {
                orders = await this.find({currency: currency}).exec();
            }

            return orders;
        } catch (error) {
            throw error;
        }
    },


    /**
     * List orders in descending order of 'createdAt' timestamp.
     *
     * @returns {Promise<User[]>}
     */
    list() {
        return this.find()
            .exec();
    }
};

/**
 * @typedef User
 */
module.exports = mongoose.model('Order', orderSchema);

const mongoose = require('mongoose');
const httpStatus = require('http-status');
const Payment = require('./payment.model');
const Wallet = require('./wallet.model');
const APIError = require('../utils/APIError');
const _ = require('lodash');


/**
 * Order Schema
 * @private
 */
const contractSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    token: {
        name: {
            type: String,
            required: true,
            index: true,
            trim: true,
        },
        symbol: {
            type: String,
            required: true,
            index: true,
            trim: true,
        },
        totalSupply: {
            type: Number,
            required: true,
        },
        decimal: {
            type: Number,
            required: true,
            default: 0,
        },
    },
    ownerAddress: {
        type: String,
        required: true,
        trim: true,
    },
    mincap: {
        type: Number,
    },
    whitelisted: {
        type: Boolean,
    },
    network: {
        type: String,
        required: true,
    },
    tiers: [{
        sequence: {
            type: Number
        },
        tierName: {
            type: String,
        },
        allowModifying: {
            type: String,
        },
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
        lockDate: {
            type: Date,
        },
        unlockDate: {
            type: Date,
        },
        rate: {
            type: Number,
        },
        supply: {
            type: Number,
        },
        whitelist: [{
            w_address: {
                type: String
            },
            w_min: {
                type: Number,
            },
            w_max: {
                type: Number,
            }
        }]
    }],
    contractAddress: {
        token: {
            type: String,
            trim: true,
        },
        crowdsale: [{
            type: String,
            trim: true,
        }],
        pricingStrategy: [{
            type: String,
            trim: true,
        }],
        finalizeAgent: [{
            type: String,
            trim: true,
        }],
    },
    reservedTokens: [{
       address: {
           type: String
       },
       dimension: {
           type: String
       },
       tokenAmount: {
           type: Number
       }
    }],
    vestings: [{
        startVesting: {
            type: Date
        },
        endVesting: {
            type: Date
        },
        amount: {
            type: Number
        }
    }]
}, {
    timestamps: true,
});


/**
 * Methods
 */
contractSchema.method({
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
contractSchema.statics = {

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
    list(opt={}) {
        return this.find(opt)
            .sort('-createdAt')
            .exec();
    }
};

/**
 * @typedef User
 */
module.exports = mongoose.model('Contract', contractSchema);

const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('../utils/APIError');

// label = ['token', 'ref']

/**
 * Wallet Schema
 * @private
 */
const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    label: {
        type: String,
        required: true,
        default: 'token'
    },
    address: {
        type: String
    },
    balance: {
        type: Number,
        required: true,
        default: 0
    },
    refBalance: {
        BTC: {
            type: Number
        },
        LTC: {
            type: Number
        },
        ETH: {
            type: Number
        },
        DASH: {
            type: Number
        },
        USD: {
            type: Number
        },
        EUR: {
            type: Number
        },
        LTCT: {
            type: Number
        },
    },
    disabled: {
        type: Boolean,
        required: true,
        default: false
    },
    logs: [{
        timestamp: Date,
        paymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Payment'
        },
        addition: {
            type: Number,
            required: true,
            default: 0
        },
        txHash: {
            type: String
        }
    }],
    refLogs: [{
        refUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        paymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Payment'
        },
        addition: {
            type: Number,
            default: 0
        },
        currency: {
            type: String
        },
        paid: {
            type: Boolean
        },
        status: {
            type: String,
            default: "not"  // "not" | "pending" | "paid"
        },
        timestamp: {
            type: Date
        }
    }]
}, {
    timestamps: true,
});


/**
 * Methods
 */
walletSchema.method({
    transform() {
        const transformed = {};
        const fields = ['id', 'label', 'balance', 'disabled', 'logs', 'userId'];

        fields.forEach((field) => {
            transformed[field] = this[field];
        });

        return transformed;
    }
});

/**
 * Statics
 */
walletSchema.statics = {

    /**
     * Get Wallet
     *
     * @param id
     * @returns {Promise<*>}
     */
    async get(id) {
        try {
            let wallet;

            if (mongoose.Types.ObjectId.isValid(id)) {
                wallet = await this.findById(id).exec();
            }
            if (wallet) {
                return wallet;
            }

            throw new APIError({
                message: 'Wallet does not exist',
                status: httpStatus.NOT_FOUND,
            });
        } catch (error) {
            throw error;
        }
    },

    async getByUser(userId) {
        try {
            let wallet = [];

            if (mongoose.Types.ObjectId.isValid(userId)) {
                wallet = await this.findOne({userId: userId}).exec();
            }

            if (wallet) {
                return wallet;
            }

            throw new APIError({
                message: 'Wallet does not exist',
                status: httpStatus.NOT_FOUND,
            });
        } catch (error) {
            throw error;
        }
    },


    /**
     * List wallets in descending order of 'createdAt' timestamp.
     *
     * @returns {Promise<User[]>}
     */
    list() {
        return this.find()
            .exec();
    }
};

/**
 * @typedef Wallet
 */
module.exports = mongoose.model('Wallet', walletSchema);

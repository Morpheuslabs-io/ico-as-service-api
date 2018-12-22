const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('../utils/APIError');
const {env} = require('../config/vars');


/**
 * Payment Schema
 * @private
 */
const paymentSchema = new mongoose.Schema({
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
    amount: {
        type: Number,
        required: true
    },
    orderPrice: {
        type: Number,
        required: true
    },
    cpFee: {
        type: Number,
        required: true
    },
    confirms: {
        type: Number
    },
    merchantId: {
        type: String,
        required: true
    },
    ipnId: {
        type: String,
        required: true
    },
    txnId: {
        type: String,
        required: true
    },
    credited: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
});


/**
 * Methods
 */
paymentSchema.method({
    transform() {
        const transformed = {};
        const fields = ['id', 'address', 'currency', 'amount', 'cpFee', 'confirms', 'txnId'];

        fields.forEach((field) => {
            transformed[field] = this[field];
        });

        return transformed;
    }
});

/**
 * Statics
 */
paymentSchema.statics = {

    /**
     * Get payment
     *
     * @param {ObjectId} id - The objectId of address.
     * @returns {Promise<Payment, APIError>}
     */
    async get(id) {
        try {
            let payment;

            if (mongoose.Types.ObjectId.isValid(id)) {
                payment = await this.findById(id).exec();
            }
            if (payment) {
                return payment;
            }

            throw new APIError({
                message: 'Payment does not exist',
                status: httpStatus.NOT_FOUND,
            });
        } catch (error) {
            throw error;
        }
    },

    async getByUser(userId) {
        try {
            let payments = [];

            if (mongoose.Types.ObjectId.isValid(userId)) {
                payments = await this.find({userId: userId}).exec();
            }

            return payments;
        } catch (error) {
            throw error;
        }
    },

    async getByCurrencyType(currency) {
        try {
            let payments = [];

            if (mongoose.Types.String.isValid(currency)) {
                payments = await this.find({currency: currency}).exec();
            }

            return payments;
        } catch (error) {
            throw error;
        }
    },


    /**
     * List payments in descending order of 'createdAt' timestamp.
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
module.exports = mongoose.model('Payment', paymentSchema);

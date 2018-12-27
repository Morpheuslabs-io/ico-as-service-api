const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('../utils/APIError');

/**
 * KYCAML Schema
 * @private
 */
const KYCAMLSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    contractId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contract',
        required: true
    },
    pof: {          // proof of funds
        photos: [{
            type: String
        }],
        status: {
            type: String,
            default: "Pending",
        },
        doctype: String,
    },
    poi: {          // proof of identity
        photos: [{
            type: String
        }],
        status: {
            type: String,
            default: "Pending",
        },
        doctype: String,
    },
    onlineVerified: {
        type: String,
        default: "Pending",
    },
    adminVerified: {
        type: String,
        default: "Pending",
    },
    verifier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    }
}, {
    timestamps: true,
});


/**
 * Methods
 */
KYCAMLSchema.method({
    transform() {
        const transformed = {};
        const fields = ['id', 'pof', 'poi', 'onlineVerified', 'adminVerified', 'userId', 'verifier'];

        fields.forEach((field) => {
            transformed[field] = this[field];
        });

        return transformed;
    }
});

/**
 * Statics
 */
KYCAMLSchema.statics = {

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
                message: 'KYCAML data does not exist',
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
                message: 'KYCAML data does not exist',
                status: httpStatus.NOT_FOUND,
            });
        } catch (error) {
            throw error;
        }
    },

    list(opt={}) {
        return this.find(opt)
            .populate('userId')
            .select('id poi pof onlineVerified adminVerified userId verifier createdAt')
            .sort('-createdAt')
            .exec();
    }
};

/**
 * @typedef KYCAML
 */
module.exports = mongoose.model('KYCAML', KYCAMLSchema);

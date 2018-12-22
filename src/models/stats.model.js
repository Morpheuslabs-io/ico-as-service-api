const mongoose = require('mongoose');

/**
 * Stats Schema
 * @private
 */
const statsSchema = new mongoose.Schema({
    sold: {
        type: Number,
        default: 0
    },
    fund: {
        BTC: {
            type: Number,
            default: 0
        },
        LTC: {
            type: Number,
            default: 0
        },
        ETH: {
            type: Number,
            default: 0
        },
        DASH: {
            type: Number,
            default: 0
        },
        USD: {
            type: Number,
            default: 0
        },
        EUR: {
            type: Number,
            default: 0
        },
        LTCT: {
            type: Number,
            default: 0
        },
    },
    contributors: { // we will use this value for private allocation counts
        type: Number,
        default: 0
    },
    prod: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
});



/**
 * @typedef Stats
 */
module.exports = mongoose.model('Stats', statsSchema);

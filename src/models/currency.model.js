const mongoose = require('mongoose');

const currencySchema = new mongoose.Schema({
    slug: String,
    symbol: String,
    price_eur: String,
    price_usd: String,
    last_updated: String,
    exponent: Number
}, {timestamps: true});

currencySchema.statics = {
    list() {
        return this.find({})
            .exec();
    }
};

module.exports = mongoose.model('Currency', currencySchema);


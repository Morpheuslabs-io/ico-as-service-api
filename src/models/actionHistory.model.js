const mongoose = require('mongoose');

/**
 * Stats Schema
 * @private
 */
const actionHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    logs: [{
        name: String,
        os: String,
        version: String,
        ip: String,
        action: String,
        timestamp: Date
    }]
}, {
    timestamps: true,
    usePushEach: true
});



/**
 * @typedef Stats
 */
module.exports = mongoose.model('ActionHistory', actionHistorySchema);

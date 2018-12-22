const path = require('path');

// import .env variables
require('dotenv-safe').load({
    path: path.join(__dirname, '../../.env'),
    sample: path.join(__dirname, '../../.env.example'),
});

module.exports = {
    env: process.env.NODE_ENV,
    port: process.env.PORT,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpirationInterval: process.env.JWT_EXPIRATION_MINUTES,
    mongo: {
        uri: process.env.NODE_ENV === 'test'
            ? process.env.MONGO_URI_TESTS
            : process.env.MONGO_URI,
    },
    logs: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
    cpKey: process.env.CP_PUB_KEY,
    cpSecret: process.env.CP_PRIV_KEY,
    cpMerchantId: process.env.CP_MERCHANT_ID,
    cpMerchantSecret: process.env.CP_MERCHANT_SECRET
};

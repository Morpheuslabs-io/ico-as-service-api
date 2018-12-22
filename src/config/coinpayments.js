const Coinpayments = require('coinpayments');
const { cpKey, cpSecret } = require('./vars');

const client = new Coinpayments({
    key: cpKey,
    secret: cpSecret,
    autoIpn: true
});

client.on('autoipn', (data) => {
    console.log(data);
});

exports.coinpayment = client;


const Coinpayments = require('coinpayments');
const { cpMerchantId, cpMerchantSecret } = require('../config/vars');
const Payment = require('../models/payment.model');
const Order = require('../models/order.model');

const events = Coinpayments.events;

const middleware = [
    Coinpayments.ipn({
        merchantId: cpMerchantId,
        merchantSecret: cpMerchantSecret
    }),
    (req, res, next) => {
        console.log(req.body);
    }
];

events.on('ipn_fail', (data) => {
    // Handle failed Order
    console.log("IPN FAIL");
    console.log(data);
});
events.on('ipn_pending', (data) => {
    // Handle pending payment
    console.log("IPN PENDING");
    console.log(data);
});
events.on('ipn_complete', (data) => {
    // Handle completed payment
    console.log("IPN COMPLETE");
    if (data.ipn_type === 'deposit' && data.amount > 0) {
        const depositedAddr = data.address;
        Payment.find({ipnId: data.ipn_id}, (error, existingPayments) => {
            if (error) {
                console.log(`[IPN] Error getting payment by ipn id: ${data.ipn_id}`);
                return;
            }

            if (existingPayments.length > 0) {
                console.log(`[IPN] Payment already existing by ipn id: ${data.ipn_id}`);
                return;
            }

            Order.findOne({address: depositedAddr}, (err, order) => {
                if (err) {
                    console.log(`[IPN] Error getting order for address: ${depositedAddr}`);
                    return;
                } else if (!order) {
                    console.log(`[IPN] order not found for address: ${depositedAddr}`);
                    return;
                } else if (order.paid) {
                    console.log(`[IPN] This order was already paid for address: ${order.address}`);
                    return;
                } else if (order.expired) {
                    console.log(`[IPN] This order was already expired for address: ${order.address}`);
                    return;
                }

                if (order.currency !== data.currency) {
                    console.log(`[IPN] Currency is mismatching; deposited currency is ${data.currency} and db currency is ${order.currency}`);
                    return;
                }

                const payment = new Payment({
                    userId: order.userId,
                    address: data.address,
                    currency: data.currency,
                    amount: data.amount,
                    orderPrice: order.price,
                    cpFee: data.fee,
                    confirms: data.confirms,
                    merchantId: data.merchant,
                    ipnId: data.ipn_id,
                    txnId: data.txn_id
                });

                payment.save((saveErr, savedPayment) => {
                    if (saveErr) {
                        console.log(`[IPN] Error creating new payment for ipn id: ${data.ipn_id}`);
                        return;
                    }
                    console.log(`[IPN] Created new payment for ipn id: ${data.ipn_id}, payment id: ${savedPayment._id}`);

                    order.update({
                        paid: true,
                        paymentId: savedPayment._id
                    }, (updateErr, savedOrder) => {
                        console.log(`[IPN] Freed order for address: ${savedOrder.address}`);
                    });
                });
            });
        });
    }
});

exports.cpMiddleware = middleware;

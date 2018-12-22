const httpStatus = require('http-status');
const request = require('request-promise');
const dotenv = require('dotenv');
const Payment = require('../models/payment.model');
const Order = require('../models/order.model');
const Wallet = require('../models/wallet.model');
const { handler: errorHandler } = require('../middlewares/error');
const { coinpayment } = require('../config/coinpayments');
const { sendBankOrderEmail } = require('../helpers/mailer');
const Stripe = require('stripe');
const _ = require('lodash');

dotenv.config();

const stripeSecret = process.env.STRIPE_SECRET;
const stripe = Stripe(stripeSecret);

exports.createOrder = async (req, res, next) => {
    try {
        if (req.body.currency === 'USD' || req.body.currency === 'EUR') {
            const stripeResponse = await stripe.charges.create({
                amount: req.body.amount * 100,
                currency: req.body.currency,
                source: req.body.token,
                description: "Token purchase"
            });

            if (stripeResponse.paid) {
                ensureUserWallet(req.user._id, async (userWallet) => {
                    const payment = new Payment({
                        userId: req.user._id,
                        currency: req.body.currency,
                        amount: req.body.amount,
                        orderPrice: req.body.price,
                        credited: false,
                        address: 'n/a',
                        cpFee: 0,
                        confirms: 1,
                        merchantId: 'Stripe',
                        ipnId: stripeResponse.id,
                        txnId: stripeResponse.balance_transaction
                    });

                    const savedPayment = await payment.save();

                    const order = new Order({
                        userId: req.user._id,
                        currency: req.body.currency,
                        price: req.body.price,
                        amount: req.body.amount,
                        paid: true,
                        address: 'Stripe',
                        paymentId: savedPayment._id
                    });

                    await order.save();

                    return res.status(200).json({
                        message: 'Successfully paid ' + stripeResponse.amount/100 + ' ' + stripeResponse.currency
                    });
                }, (error) => {
                    throw error;
                });
            } else {
                return res.status(400).json({
                    message: 'Payment was not successful'
                });
            }
        } else {
            coinpayment.getCallbackAddress(req.body.currency, (err, response) => {
                if (err) {
                    return res.status(422).json({message: 'Coinpayments is unavailable'});
                }

                ensureUserWallet(req.user._id, (userWallet) => {
                    const order = new Order({
                        userId: req.user._id,
                        address: response.address,
                        currency: req.body.currency,
                        price: req.body.price,
                        amount: req.body.amount
                    });

                    order.save((error, savedOrder) => {
                        return res.status(200).json({
                            currency: req.body.currency,
                            address: response.address
                        });
                    });
                }, (error) => {
                    throw error;
                });
            });
        }
    } catch (error) {
        next(error);
    }
};


exports.createBankOrder = async (req, res, next) => {
    const bankName = 'AEQUO ANIMO AG';
    const bankNumber = 'CH7100779000243211103';
    const swiftCode = 'NIKACH22XXX';
    try {
        ensureUserWallet(req.user._id, async (userWallet) => {
            const order = new Order({
                userId: req.user._id,
                address: 'Bank Transfer',
                currency: req.body.currency,
                price: req.body.price,
                amount: req.body.amount
            });

            // send email to Oliver
            await sendBankOrderEmail(
                process.env.UI_DOMAIN,
                req.user.email,
                req.body.amount,
                req.body.currency,
                bankName,
                bankNumber,
                swiftCode
            );

            order.save((error, savedOrder) => {
                return res.status(200).json({
                    message: "success"
                });
            });
        }, (error) => {
            throw error;
        });
    } catch (error) {
        next(error);
    }
};


exports.getOrders = async (req, res, next) => {
    try {
        const orders = await Order.getByUser(req.user._id);
        res.json(orders);
    } catch (error) {
        next(error);
    }
};


/**
 * Create or Get User Wallet
 *
 * @param userId
 * @param done
 * @param error
 */
const ensureUserWallet = (userId, done, error) => {
    Wallet.findOne({userId: userId}, (walletErr, wallet) => {
        if (walletErr) {
            console.log(`[REST API] Error while fetching user wallet for userId: ${userId}\n`);
            error(walletErr);
        }

        if (!wallet) {
            const newWallet = new Wallet({
                userId: userId,
                label: 'token',
                balance: 0,
                disabled: false,
                logs: [],
                refLogs: [],
                refBalance: {
                    BTC: 0,
                    LTC: 0,
                    ETH: 0,
                    DASH: 0,
                    USD: 0,
                    EUR: 0,
                    LTCT: 0,
                }
            });

            newWallet.save((newErr, savedWallet) => {
                if (newErr) {
                    console.log(`[REST API] Error Creating new Wallet \n`, newErr);
                    error(newErr);
                }
                done(savedWallet);
            });
        } else {
            done(wallet);
        }
    });
};

const nodemailer = require('nodemailer');
const EmailTemplate = require('email-templates').EmailTemplate;
const dotenv = require('dotenv');
dotenv.config({});

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD
    }
});

const verifyEmail = transporter.templateSender(
    new EmailTemplate('src/templates/emailVerification'),
    {
        from: process.env.MAIL_FROM_ADDRESS
    }
);

const pwdResetEmail = transporter.templateSender(
    new EmailTemplate('src/templates/pwdResetEmail'),
    {
        from: process.env.MAIL_FROM_ADDRESS
    }
);

const requestPaymentEmail = transporter.templateSender(
    new EmailTemplate('src/templates/requestPayout'),
    {
        from: process.env.MAIL_FROM_ADDRESS
    }
);

const bankOrderEmail = transporter.templateSender(
    new EmailTemplate('src/templates/bankOrder'),
    {
        from: process.env.MAIL_FROM_ADDRESS
    }
);

exports.sendVerifyEmail = (host, email, token) => {
    verifyEmail({
        to: email,
        subject: 'Account Verification'
    }, {
        host: host,
        email: email,
        token: token
    });
};

exports.sendForgotPasswordEmail = (host, email, name, token) => {
    pwdResetEmail({
        to: email,
        subject: 'Your Password Reset Request'
    }, {
        host: host,
        name: name,
        token: token
    });
};

exports.sendRequestPayoutEmail = (host, email, username, amount, currency, bankName, bankNumber, cryptoAddress) => {
    requestPaymentEmail({
        to: 'morpheuslabs@gmail.com',
        subject: 'You\'ve got payment request'
    }, {
        host: host,
        username: username,
        email: email,
        amount: amount,
        currency: currency,
        bankName: bankName,
        bankNumber: bankNumber,
        cryptoAddress: cryptoAddress
    });
};

exports.sendBankOrderEmail = (host, email, amount, currency, bankName, bankNumber, swiftCode) => {
    bankOrderEmail({
        to: email,
        subject: 'You requested a bank order for Token'
    }, {
        host: host,
        amount: amount,
        currency: currency,
        bankName: bankName,
        bankNumber: bankNumber,
        swiftCode: swiftCode
    });
};

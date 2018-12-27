const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/admin/auth.controller');
const {
    login,
    register,
    refresh,
} = require('../../validations/auth.validation');

const router = express.Router();

router.route('/register')
    .post(validate(register), controller.register);

router.route('/login')
    .post(validate(login), controller.login)
    .patch(validate(login), controller.verify2FAToken);

router.route('/refresh-token')
    .post(validate(refresh), controller.refresh);

router.route('/email-confirmation')
    .post(controller.emailConfirmation);

router.route('/resend-verification-email')
    .post(controller.resendVerifyEmail);

router.route('/request-reset-password')
    .post(controller.requestForgotPassword);

router.route('/check-reset-token')
    .post(controller.checkResetToken);

router.route('/reset-password')
    .post(controller.resetPassword);

module.exports = router;

const express = require('express');
const validate = require('express-validation');
const controller = require('../controllers/settings.controller');
const { authorize } = require('../middlewares/auth');

const router = express.Router();

router
    .route('/wallet')
    .post(authorize(), controller.updateEthAddress);

router
    .route('/password')
    .post(authorize(), controller.updatePassword);

router
    .route('/tfa')
    .get(authorize(), controller.requestEnable2FA)
    .post(authorize(), controller.verify2FAToken)
    .patch(authorize(), controller.disable2FA);

router
    .route('/action-history')
    .get(authorize(), controller.actionHistory);

module.exports = router;

const express = require('express');
const validate = require('express-validation');
const controller = require('../controllers/purchase.controller');
const { authorize } = require('../middlewares/auth');

const router = express.Router();

router
    .route('/order')
    .get(authorize(), controller.getOrders)
    .post(authorize(), controller.createOrder);

router
    .route('/bank-order')
    .post(authorize(), controller.createBankOrder);

module.exports = router;

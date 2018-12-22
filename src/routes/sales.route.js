const express = require('express');
const validate = require('express-validation');
const controller = require('../controllers/sales.controller');
const { authorize } = require('../middlewares/auth');

const router = express.Router();

router
    .route('/prices')
    .get(controller.list);

router
    .route('/stats')
    .get(controller.saleStats);

router
    .route('/refers')
    .get(authorize(), controller.refUsers);

router
    .route('/all')
    .get(authorize(), controller.saleData);

module.exports = router;

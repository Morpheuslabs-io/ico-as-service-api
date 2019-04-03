const express = require('express');
const controller = require('../controllers/contract.controller');

const router = express.Router();
const { authorize } = require('../middlewares/auth');

router
    .route('/list/:net')
    .get(controller.listContracts);

router
    .route('/update-whitelist')
    .post(authorize(), controller.updateWhitelist);

router
    .route('/tiers')
    .get(authorize(), controller.getTiers);

module.exports = router;

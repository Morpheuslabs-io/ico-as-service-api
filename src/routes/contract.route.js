const express = require('express');
const controller = require('../controllers/contract.controller');

const router = express.Router();

router
    .route('/list')
    .get(controller.listContracts);

module.exports = router;

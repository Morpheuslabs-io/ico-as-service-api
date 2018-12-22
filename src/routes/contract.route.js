const express = require('express');
const controller = require('../controllers/contract.controller');
const { authorize } = require('../middlewares/auth');

const router = express.Router();

router
    .route('/')
    .post(authorize(), controller.createContract);

router
    .route('/list')
    .get(authorize(), controller.listContracts);

router
    .route('/:id')
    .get(authorize(), controller.getContract)
    .delete(authorize(), controller.deleteContract);

module.exports = router;

const express = require('express');
const controller = require('../../controllers/admin/tokenvesting.controller');
const { authorize } = require('../../middlewares/auth');

const router = express.Router();

router
    .route('/')
    .post(authorize(), controller.createTokenVesting);

router
    .route('/list/:net')
    .get(authorize(), controller.listTokenVestings);

router
    .route('/:id')
    .get(authorize(), controller.getTokenVesting)
    .delete(authorize(), controller.deleteTokenVesting);

module.exports = router;

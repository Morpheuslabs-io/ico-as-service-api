const express = require('express');
const controller = require('../../controllers/admin/kycaml.controller');
const { authorize } = require('../../middlewares/auth');
const validate = require('express-validation');
const {
    createKYCAML
} = require('../../validations/kycaml.validation');

const router = express.Router();

router
    .route('/')
    .post(authorize(), controller.createKYCAML);

router
    .route('/list')
    .get(authorize(), controller.listKYCAMLs);

router
    .route('/:id')
    .get(authorize(), controller.getKYCAML)
    .post(authorize(), controller.updateKYCAML)
    .delete(authorize(), controller.deleteKYCAML);
router
    .route('/online/:id')
    .post(authorize(), controller.requestOnlineVerify);

module.exports = router;

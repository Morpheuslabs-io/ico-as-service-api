const express = require('express');

// Admin Routes
const adminAuthRoutes = require('./admin/auth.route');
const adminKycamlRoutes = require('./admin/kycaml.route');
const adminContractRoutes = require('./admin/contract.route');
const adminTokenVestingRoutes = require('./admin/tokenvesting.route');
const adminUserRoutes = require('./admin/user.route');

// Investor Routes
const authRoutes = require('./auth.route');
const salesRoutes = require('./sales.route');
const purchaseRoutes = require('./purchase.route');
const settingsRoutes = require('./setting.route');
const contractRoutes = require('./contract.route');
const kycamlRoutes = require('./kycaml.route');

const router = express.Router();

router.get('/status', (req, res) => res.send('OK'));

// Admin Dashboard API
router.use('/admin/auth', adminAuthRoutes);
router.use('/admin/kyc-aml', adminKycamlRoutes);
router.use('/admin/contract', adminContractRoutes);
router.use('/admin/tokenvesting', adminTokenVestingRoutes);
router.use('/admin/users', adminUserRoutes);

// Investor Dashboard API
router.use('/auth', authRoutes);
router.use('/sales', salesRoutes);
router.use('/purchase', purchaseRoutes);
router.use('/settings', settingsRoutes);
router.use('/contract', contractRoutes);
router.use('/kyc-aml', kycamlRoutes);

module.exports = router;

const express = require('express');
const userRoutes = require('./user.route');
const authRoutes = require('./auth.route');
const salesRoutes = require('./sales.route');
const purchaseRoutes = require('./purchase.route');
const settingsRoutes = require('./setting.route');
const referralsRoutes = require('./referrals.route');
const contractRoutes = require('./contract.route');
const kycamlRoutes = require('./kycaml.route');

const router = express.Router();

router.get('/status', (req, res) => res.send('OK'));

router.use('/docs', express.static('docs'));

router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/contract', contractRoutes);
router.use('/kyc-aml', kycamlRoutes);
router.use('/sales', salesRoutes);
router.use('/purchase', purchaseRoutes);
router.use('/settings', settingsRoutes);
router.use('/referrals', referralsRoutes);

module.exports = router;

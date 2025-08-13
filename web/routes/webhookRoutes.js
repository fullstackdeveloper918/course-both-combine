const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Order webhooks
router.post('/orders/create', webhookController.handleOrderCreated);
router.post('/orders/cancelled', webhookController.handleOrderCancelled);

// Customer webhooks
router.post('/customers/create', webhookController.handleCustomerCreated);
router.post('/customers/update', webhookController.handleCustomerUpdated);

// Product webhooks
router.post('/products/create', webhookController.handleProductCreated);
router.post('/products/update', webhookController.handleProductUpdated);
router.post('/products/delete', webhookController.handleProductDeleted);

module.exports = router; 
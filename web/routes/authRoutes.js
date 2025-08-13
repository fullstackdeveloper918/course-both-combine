const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const shopifyAuth = require('../middleware/shopifyAuth');

// Initiate OAuth flow
router.get('/auth', shopifyAuth.verifyApiRequest, authController.initiateAuth);

// Handle OAuth callback
router.get('/auth/callback', authController.handleCallback);

// Logout
router.post('/auth/logout', authController.logout);

// Get current user
router.get('/auth/user', authController.getCurrentUser);

// Check authentication status
router.get('/auth/check', authController.checkAuth);

module.exports = router; 
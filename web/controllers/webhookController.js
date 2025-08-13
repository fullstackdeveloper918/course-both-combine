import crypto from 'crypto';
import config from '../config/config.js';
import shopifyService from '../services/shopifyService.js';

// Verify Shopify webhook signature
const verifyWebhook = (req) => {
  const hmac = req.headers['x-shopify-hmac-sha256'];
  const body = req.body;
  
  const hash = crypto
    .createHmac('sha256', config.shopify.webhookSecret)
    .update(Buffer.from(JSON.stringify(body)))
    .digest('base64');

  return hash === hmac;
};

// Handle order creation webhook
export const handleOrderCreated = async (req, res) => {
  try {
    if (!verifyWebhook(req)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    await shopifyService.handleOrderCreated(req.body);
    res.status(200).json({ message: 'Order processed successfully' });
  } catch (error) {
    console.error('Error processing order creation webhook:', error);
    res.status(500).json({ error: error.message });
  }
};

// Handle order cancellation webhook
export const handleOrderCancelled = async (req, res) => {
  try {
    if (!verifyWebhook(req)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    await shopifyService.handleOrderCancelled(req.body);
    res.status(200).json({ message: 'Order cancellation processed successfully' });
  } catch (error) {
    console.error('Error processing order cancellation webhook:', error);
    res.status(500).json({ error: error.message });
  }
};

// Handle customer creation webhook
export const handleCustomerCreated = async (req, res) => {
  try {
    if (!verifyWebhook(req)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    await shopifyService.handleCustomerCreated(req.body);
    res.status(200).json({ message: 'Customer creation processed successfully' });
  } catch (error) {
    console.error('Error processing customer creation webhook:', error);
    res.status(500).json({ error: error.message });
  }
};

// Handle customer update webhook
export const handleCustomerUpdated = async (req, res) => {
  try {
    if (!verifyWebhook(req)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    await shopifyService.handleCustomerUpdated(req.body);
    res.status(200).json({ message: 'Customer update processed successfully' });
  } catch (error) {
    console.error('Error processing customer update webhook:', error);
    res.status(500).json({ error: error.message });
  }
};

// Handle product creation webhook
export const handleProductCreated = async (req, res) => {
  try {
    if (!verifyWebhook(req)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    // Handle product creation if needed
    res.status(200).json({ message: 'Product creation processed successfully' });
  } catch (error) {
    console.error('Error processing product creation webhook:', error);
    res.status(500).json({ error: error.message });
  }
};

// Handle product update webhook
export const handleProductUpdated = async (req, res) => {
  try {
    if (!verifyWebhook(req)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    // Handle product update if needed
    res.status(200).json({ message: 'Product update processed successfully' });
  } catch (error) {
    console.error('Error processing product update webhook:', error);
    res.status(500).json({ error: error.message });
  }
};

// Handle product deletion webhook
export const handleProductDeleted = async (req, res) => {
  try {
    if (!verifyWebhook(req)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    // Handle product deletion if needed
    res.status(200).json({ message: 'Product deletion processed successfully' });
  } catch (error) {
    console.error('Error processing product deletion webhook:', error);
    res.status(500).json({ error: error.message });
  }
}; 
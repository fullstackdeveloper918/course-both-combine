// const crypto = require('crypto');
// const config = require('../config/config');
import crypto from 'crypto';
import config from '../config/config.js';
// Generate Shopify webhook signature
exports.generateWebhookSignature = (data) => {
  return crypto
    .createHmac('sha256', config.shopify.webhookSecret)
    .update(Buffer.from(JSON.stringify(data)))
    .digest('base64');
};

// Format price for Shopify
exports.formatPrice = (price) => {
  return parseFloat(price).toFixed(2);
};

// Generate Shopify product handle
exports.generateProductHandle = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Validate Shopify webhook signature
exports.validateWebhookSignature = (signature, data) => {
  const calculatedSignature = this.generateWebhookSignature(data);
  return signature === calculatedSignature;
};

// Format product data for Shopify
exports.formatProductData = (course) => {
  return {
    title: course.title,
    body_html: course.description,
    vendor: config.shopify.vendor,
    product_type: 'Digital Course',
    status: course.isPublished ? 'active' : 'draft',
    variants: [
      {
        price: this.formatPrice(course.price),
        inventory_management: 'shopify',
        inventory_quantity: -1,
        requires_shipping: false
      }
    ],
    images: course.thumbnail ? [
      {
        src: course.thumbnail
      }
    ] : [],
    handle: this.generateProductHandle(course.title)
  };
};

// Format order data
exports.formatOrderData = (order) => {
  return {
    id: order.id,
    order_number: order.order_number,
    customer: {
      id: order.customer.id,
      email: order.customer.email,
      first_name: order.customer.first_name,
      last_name: order.customer.last_name
    },
    line_items: order.line_items.map(item => ({
      id: item.id,
      product_id: item.product_id,
      title: item.title,
      price: item.price,
      quantity: item.quantity
    })),
    total_price: order.total_price,
    currency: order.currency,
    created_at: order.created_at,
    cancelled_at: order.cancelled_at,
    financial_status: order.financial_status
  };
};

// Format customer data
exports.formatCustomerData = (customer) => {
  return {
    id: customer.id,
    email: customer.email,
    first_name: customer.first_name,
    last_name: customer.last_name,
    created_at: customer.created_at,
    updated_at: customer.updated_at
  };
};

// Check if order is valid for course access
exports.isValidOrder = (order) => {
  return (
    order &&
    order.financial_status === 'paid' &&
    !order.cancelled_at &&
    order.line_items &&
    order.line_items.length > 0
  );
};

// Get course IDs from order
exports.getCourseIdsFromOrder = (order) => {
  return order.line_items
    .filter(item => item.product_type === 'Digital Course')
    .map(item => item.product_id.toString());
};

// Format error message for Shopify API
exports.formatShopifyError = (error) => {
  if (error.response && error.response.body) {
    const shopifyError = error.response.body;
    return {
      message: shopifyError.errors || 'Unknown Shopify error',
      status: error.statusCode,
      details: shopifyError
    };
  }
  return {
    message: error.message || 'Unknown error',
    status: error.statusCode || 500
  };
}; 
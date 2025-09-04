// const Shopify = require('shopify-api-node');
// const config = require('../config/config');
// const { Course, CourseAccess, User } = require('../models/associations');

import config from '../config/config.js';
import  shopify  from "shopify-api-node";
import { Course, CourseAccess, User } from '../models/associations.js';
// Initialize Shopify client
const shopify = new Shopify({
  shopName: config.shopify.shopName,
  accessToken: config.shopify.accessToken,
  apiVersion: config.shopify.apiVersion
});

// Create or update product
exports.createOrUpdateProduct = async (course) => {
  try {
    const productData = {
      title: course.title,
      body_html: course.description,
      vendor: config.shopify.vendor,
      product_type: 'Digital Course',
      status: course.isPublished ? 'active' : 'draft',
      variants: [
        {
          price: course.price.toString(),
          inventory_management: 'shopify',
          inventory_quantity: -1, // Unlimited
          requires_shipping: false
        }
      ],
      images: course.thumbnail ? [
        {
          src: course.thumbnail
        }
      ] : []
    };

    let product;

    if (course.shopifyProductId) {
      // Update existing product
      product = await shopify.product.update(course.shopifyProductId, productData);
    } else {
      // Create new product
      product = await shopify.product.create(productData);
    }

    // Update course with Shopify product ID
    await course.update({
      shopifyProductId: product.id.toString(),
      shopifyHandle: product.handle
    });

    return product;
  } catch (error) {
    throw new Error(`Error creating/updating Shopify product: ${error.message}`);
  }
};

// Delete product
exports.deleteProduct = async (course) => {
  try {
    if (course.shopifyProductId) {
      await shopify.product.delete(course.shopifyProductId);
    }
  } catch (error) {
    throw new Error(`Error deleting Shopify product: ${error.message}`);
  }
};

// Handle order creation webhook
exports.handleOrderCreated = async (order) => {
  try {
    // Find customer
    const customer = await User.findOne({
      where: { shopifyCustomerId: order.customer.id.toString() }
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Process line items
    for (const item of order.line_items) {
      // Find course by Shopify product ID
      const course = await Course.findOne({
        where: { shopifyProductId: item.product_id.toString() }
      });

      if (course) {
        // Create course access
        await CourseAccess.create({
          userId: customer.id,
          courseId: course.id,
          accessType: 'purchase',
          status: 'active',
          shopifyOrderId: order.id.toString(),
          purchaseDate: new Date(order.created_at),
          price: parseFloat(item.price),
          currency: order.currency,
          canDownload: true
        });
      }
    }
  } catch (error) {
    throw new Error(`Error handling order creation: ${error.message}`);
  }
};

// Handle order cancellation webhook
exports.handleOrderCancelled = async (order) => {
  try {
    // Find course access records for this order
    const courseAccess = await CourseAccess.findAll({
      where: { shopifyOrderId: order.id.toString() }
    });

    // Update status to cancelled
    for (const access of courseAccess) {
      await access.update({ status: 'cancelled' });
    }
  } catch (error) {
    throw new Error(`Error handling order cancellation: ${error.message}`);
  }
};

// Handle customer creation webhook
exports.handleCustomerCreated = async (customer) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      where: { shopifyCustomerId: customer.id.toString() }
    });

    if (!existingUser) {
      // Create new user
      await User.create({
        shopifyCustomerId: customer.id.toString(),
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        role: 'student',
        merchantId: config.shopify.merchantId
      });
    }
  } catch (error) {
    throw new Error(`Error handling customer creation: ${error.message}`);
  }
};

// Handle customer update webhook
exports.handleCustomerUpdated = async (customer) => {
  try {
    // Find user
    const user = await User.findOne({
      where: { shopifyCustomerId: customer.id.toString() }
    });

    if (user) {
      // Update user details
      await user.update({
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name
      });
    }
  } catch (error) {
    throw new Error(`Error handling customer update: ${error.message}`);
  }
};

// Get customer orders
exports.getCustomerOrders = async (customerId) => {
  try {
    const orders = await shopify.order.list({
      customer_id: customerId,
      status: 'any'
    });

    return orders;
  } catch (error) {
    throw new Error(`Error getting customer orders: ${error.message}`);
  }
};

// Get product details
exports.getProductDetails = async (productId) => {
  try {
    const product = await shopify.product.get(productId);
    return product;
  } catch (error) {
    throw new Error(`Error getting product details: ${error.message}`);
  }
};

// Get shop details
exports.getShopDetails = async () => {
  try {
    const shop = await shopify.shop.get();
    return shop;
  } catch (error) {
    throw new Error(`Error getting shop details: ${error.message}`);
  }
}; 
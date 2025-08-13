const crypto = require('crypto');
const config = require('../config/config');
const shopifyUtils = require('../utils/shopifyUtils');

// Generate Shopify OAuth URL
exports.generateAuthUrl = (shop, state) => {
  const scopes = [
    'read_products',
    'write_products',
    'read_orders',
    'write_orders',
    'read_customers',
    'write_customers',
    'read_content',
    'write_content'
  ].join(',');

  const redirectUri = `${config.app.baseUrl}/auth/callback`;
  const nonce = crypto.randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    client_id: config.shopify.apiKey,
    scope: scopes,
    redirect_uri: redirectUri,
    state,
    'grant_options[]': 'per-user'
  });

  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
};

// Verify Shopify OAuth callback
exports.verifyCallback = (query) => {
  const { shop, state, hmac } = query;

  if (!shop || !state || !hmac) {
    throw new Error('Missing required parameters');
  }

  // Verify state to prevent CSRF
  if (state !== query.state) {
    throw new Error('Invalid state parameter');
  }

  // Verify HMAC
  const queryString = Object.keys(query)
    .filter(key => key !== 'hmac')
    .sort()
    .map(key => `${key}=${query[key]}`)
    .join('&');

  const calculatedHmac = crypto
    .createHmac('sha256', config.shopify.apiSecret)
    .update(queryString)
    .digest('hex');

  if (calculatedHmac !== hmac) {
    throw new Error('Invalid HMAC');
  }

  return true;
};

// Exchange authorization code for access token
exports.getAccessToken = async (shop, code) => {
  try {
    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: config.shopify.apiKey,
        client_secret: config.shopify.apiSecret,
        code
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get access token');
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      scope: data.scope
    };
  } catch (error) {
    throw new Error(`Error getting access token: ${error.message}`);
  }
};

// Verify access token
exports.verifyAccessToken = async (shop, accessToken) => {
  try {
    const response = await fetch(`https://${shop}/admin/api/${config.shopify.apiVersion}/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken
      }
    });

    if (!response.ok) {
      throw new Error('Invalid access token');
    }

    const data = await response.json();
    return data.shop;
  } catch (error) {
    throw new Error(`Error verifying access token: ${error.message}`);
  }
};

// Register webhooks
exports.registerWebhooks = async (shop, accessToken) => {
  try {
    const webhooks = [
      {
        topic: 'orders/create',
        address: `${config.app.baseUrl}/webhooks/orders/create`,
        format: 'json'
      },
      {
        topic: 'orders/cancelled',
        address: `${config.app.baseUrl}/webhooks/orders/cancelled`,
        format: 'json'
      },
      {
        topic: 'customers/create',
        address: `${config.app.baseUrl}/webhooks/customers/create`,
        format: 'json'
      },
      {
        topic: 'customers/update',
        address: `${config.app.baseUrl}/webhooks/customers/update`,
        format: 'json'
      },
      {
        topic: 'products/create',
        address: `${config.app.baseUrl}/webhooks/products/create`,
        format: 'json'
      },
      {
        topic: 'products/update',
        address: `${config.app.baseUrl}/webhooks/products/update`,
        format: 'json'
      },
      {
        topic: 'products/delete',
        address: `${config.app.baseUrl}/webhooks/products/delete`,
        format: 'json'
      }
    ];

    const promises = webhooks.map(webhook =>
      fetch(`https://${shop}/admin/api/${config.shopify.apiVersion}/webhooks.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        },
        body: JSON.stringify({ webhook })
      })
    );

    await Promise.all(promises);
  } catch (error) {
    throw new Error(`Error registering webhooks: ${error.message}`);
  }
};

// Uninstall app
exports.uninstallApp = async (shop, accessToken) => {
  try {
    // Delete webhooks
    const response = await fetch(`https://${shop}/admin/api/${config.shopify.apiVersion}/webhooks.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get webhooks');
    }

    const { webhooks } = await response.json();
    const deletePromises = webhooks.map(webhook =>
      fetch(`https://${shop}/admin/api/${config.shopify.apiVersion}/webhooks/${webhook.id}.json`, {
        method: 'DELETE',
        headers: {
          'X-Shopify-Access-Token': accessToken
        }
      })
    );

    await Promise.all(deletePromises);
  } catch (error) {
    throw new Error(`Error uninstalling app: ${error.message}`);
  }
}; 
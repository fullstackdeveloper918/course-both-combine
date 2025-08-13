const crypto = require('crypto');
const config = require('../config/config');
const shopifyUtils = require('../utils/shopifyUtils');

// Verify Shopify webhook signature
exports.verifyWebhook = (req, res, next) => {
  try {
    const hmac = req.headers['x-shopify-hmac-sha256'];
    if (!hmac) {
      return res.status(401).json({ error: 'Missing Shopify webhook signature' });
    }

    const isValid = shopifyUtils.validateWebhookSignature(hmac, req.body);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid Shopify webhook signature' });
    }

    next();
  } catch (error) {
    console.error('Error verifying webhook:', error);
    res.status(500).json({ error: 'Error verifying webhook' });
  }
};

// Verify Shopify API request
exports.verifyApiRequest = (req, res, next) => {
  try {
    const shop = req.query.shop;
    const hmac = req.query.hmac;
    const timestamp = req.query.timestamp;

    if (!shop || !hmac || !timestamp) {
      return res.status(401).json({ error: 'Missing required parameters' });
    }

    // Check if timestamp is within 5 minutes
    const timestampAge = Math.floor(Date.now() / 1000) - parseInt(timestamp);
    if (timestampAge > 300) {
      return res.status(401).json({ error: 'Request expired' });
    }

    // Verify HMAC
    const queryString = Object.keys(req.query)
      .filter(key => key !== 'hmac')
      .sort()
      .map(key => `${key}=${req.query[key]}`)
      .join('&');

    const calculatedHmac = crypto
      .createHmac('sha256', config.shopify.apiSecret)
      .update(queryString)
      .digest('hex');

    if (calculatedHmac !== hmac) {
      return res.status(401).json({ error: 'Invalid HMAC' });
    }

    // Store shop in request for later use
    req.shop = shop;
    next();
  } catch (error) {
    console.error('Error verifying API request:', error);
    res.status(500).json({ error: 'Error verifying API request' });
  }
};

// Verify Shopify access token
exports.verifyAccessToken = (req, res, next) => {
  try {
    const accessToken = req.headers['x-shopify-access-token'];
    if (!accessToken) {
      return res.status(401).json({ error: 'Missing access token' });
    }

    // Store access token in request for later use
    req.shopifyAccessToken = accessToken;
    next();
  } catch (error) {
    console.error('Error verifying access token:', error);
    res.status(500).json({ error: 'Error verifying access token' });
  }
};

// Check if user has access to course
exports.checkCourseAccess = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const courseAccess = await CourseAccess.findOne({
      where: {
        userId,
        courseId,
        status: 'active'
      }
    });

    if (!courseAccess) {
      return res.status(403).json({ error: 'No access to this course' });
    }

    // Check if access has expired
    if (courseAccess.expiryDate && new Date() > courseAccess.expiryDate) {
      await courseAccess.update({ status: 'expired' });
      return res.status(403).json({ error: 'Course access has expired' });
    }

    next();
  } catch (error) {
    console.error('Error checking course access:', error);
    res.status(500).json({ error: 'Error checking course access' });
  }
};

// Check if user is course owner
exports.checkCourseOwnership = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const course = await Course.findOne({
      where: {
        id: courseId,
        merchantId: userId
      }
    });

    if (!course) {
      return res.status(403).json({ error: 'Not authorized to manage this course' });
    }

    next();
  } catch (error) {
    console.error('Error checking course ownership:', error);
    res.status(500).json({ error: 'Error checking course ownership' });
  }
}; 
import { sendCustomerEmail, sendDesignEmail } from '../utils/emailService.js';
import  Merchant  from '../models/Merchant.js';
import { logger } from '../utils/logger.js';

// Error handler for email-related errors
const handleEmailError = (error, res) => {
  logger.error('Email operation failed', {
    error: error.message,
    code: error.code,
    details: error.details
  });

  // Map error codes to HTTP status codes
  const statusMap = {
    'VALIDATION_ERROR': 400,
    'TEMPLATE_ERROR': 500,
    'TRANSPORT_ERROR': 500,
    'SEND_ERROR': 500
  };

  const status = statusMap[error.code] || 500;

  res.status(status).json({
    success: false,
    error: error.message,
    code: error.code,
    details: error.details
  });
};

export const sendInquiryEmail = async (req, res) => {
  try {
    const {
      customerEmail,
      customerName,
      jewelryType,
      style,
      material,
      additionalNotes,
      designImageUrl
    } = req.body;

    // Get merchant information from session
    console.log("generateImage called with body sendInquiryEmail:", req.body);
    const session = res.locals.shopify?.session || req.session;
    let shopDomain;
    console.log(process.env.NODE_ENV ,"enc chekc");
    if (process.env.NODE_ENV === 'development') {
      
      shopDomain = 'webhooktestingstore.myshopify.com';
            // shopDomain = 'testingappsstore-d.myshopify.com';

    } else if (session && session.shop) {
      shopDomain = session.shop;
    } else {
      return res.status(401).json({ error: 'Unauthorized: No valid Shopify session' });
    }

    // Get merchant details
    const merchant = await Merchant.findOne({ where: { shop: shopDomain } });
    if (!merchant) {
      logger.warn('Merchant not found for email attempt', {
        shop: shopDomain
      });
      return res.status(404).json({ error: 'Merchant not found' });
    }

    // Prepare email data
    const emailData = {
      merchantEmail: merchant.email||"testingd631@gmail.com",
      customerEmail,
      customerName: customerName || customerEmail.split('@')[0],
      jewelryType,
      style,
      material,
      additionalNotes,
      merchantName: merchant.name||"test",
      merchantShop: merchant.shop||"test",
      merchantPhone: merchant.phone||1234567890
    };

    logger.info('Attempting to send email', {
      to: customerEmail,
      from: merchant.email,
      jewelryType,
      hasDesign: !!designImageUrl
    });

    // Send email with or without design image
    let result;
    if (designImageUrl) {
      result = await sendDesignEmail({
        ...emailData,
        designImageUrl
      });
    } else {
      result = await sendCustomerEmail(emailData);
    }

    logger.info('Email sent successfully', {
      messageId: result.messageId,
      to: customerEmail,
      from: merchant.email
    });

    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    handleEmailError(error, res);
  }
};

export const getEmailHistory = async (req, res) => {
  try {
    const session = res.locals.shopify?.session || req.session;
    const shopDomain = session?.shop;

    if (!shopDomain) {
      logger.warn('Unauthorized email history attempt', {
        session: session ? 'exists' : 'missing',
        shop: shopDomain
      });
      return res.status(401).json({ error: 'Unauthorized: No valid Shopify session' });
    }

    // Get merchant details
    const merchant = await Merchant.findOne({ where: { shop: shopDomain } });
    if (!merchant) {
      logger.warn('Merchant not found for email history attempt', {
        shop: shopDomain
      });
      return res.status(404).json({ error: 'Merchant not found' });
    }

    // Here you would typically query your database for email history
    // For now, we'll return a placeholder response
    logger.info('Email history requested', {
      merchant: merchant.shop
    });

    res.json({
      success: true,
      data: {
        message: 'Email history functionality to be implemented'
      }
    });
  } catch (error) {
    logger.error('Failed to fetch email history', {
      error: error.message,
      shop: req.session?.shop
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email history',
      details: error.message
    });
  }
}; 
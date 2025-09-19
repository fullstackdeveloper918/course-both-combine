# Customer account UI Extension

## Prerequisites

Before you start building your extension, make sure that you’ve created a [development store](https://shopify.dev/docs/apps/tools/development-stores) with the [Checkout and Customer Accounts Extensibility](https://shopify.dev/docs/api/release-notes/developer-previews#previewing-new-features).

## Your new Extension

Your new extension contains the following files:

- `README.md`, the file you are reading right now.
- `shopify.extension.toml`, the configuration file for your extension. This file defines your extension’s name.
- `src/*.jsx`, the source code for your extension.
- `locales/en.default.json` and `locales/fr.json`, which contain translations used to [localized your extension](https://shopify.dev/docs/apps/checkout/best-practices/localizing-ui-extensions).

## Order Details Console Logging

This extension has been updated to console log order details when you click on a specific order. Here's what it does:

### Features:
1. **Automatic Order ID Logging**: Logs the current order ID when the component loads
2. **Detailed Order Information**: Fetches and logs comprehensive order details including:
   - Order ID and name
   - Total price and currency
   - Line items with quantities and variants
   - Customer information
   - Shipping address
3. **Interactive Button**: Click "Console Log Order Details" to fetch and display order information
4. **Visual Feedback**: Shows loading state and order summary in the UI

### How to Test:
1. Deploy the extension to your development store
2. Navigate to a customer account order status page
3. Open browser developer tools (F12) and go to Console tab
4. You'll see automatic order logging when the page loads
5. Click the "Console Log Order Details" button to see detailed information

### Console Output Example:
```
Current Order Info: {id: "gid://shopify/Order/123456789", ...}
Order ID: gid://shopify/Order/123456789
=== ORDER DETAILS ===
Order ID: gid://shopify/Order/123456789
Order Name: #1001
Total Price: {amount: "99.99", currencyCode: "USD"}
Line Items: [{node: {title: "Product Name", quantity: 2, ...}}]
```

## Useful Links

- [Customer account UI extension documentation](https://shopify.dev/docs/api/customer-account-ui-extensions)
  - [Configuration](https://shopify.dev/docs/api/customer-account-ui-extensions/unstable/configuration)
  - [API Reference](https://shopify.dev/docs/api/customer-account-ui-extensions/unstable/apis)
  - [UI Components](https://shopify.dev/docs/api/customer-account-ui-extensions/unstable/components)

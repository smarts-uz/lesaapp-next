# WooCommerce Refund API

This API endpoint allows you to process refunds for WooCommerce orders, including handling product bundles and stock adjustments.

## Endpoint

```
POST /api/refund
```

## Request Format

The request body should be a JSON object with the following structure:

```json
{
  "orderId": 123,                   // Required: The ID of the order to refund
  "items": [                        // Required: Array of items to refund
    {
      "itemId": 456,                // Required: Order item ID to refund
      "productId": 789,             // Required: Product ID
      "quantity": 1,                // Required: Quantity to refund
      "amount": 19.99,              // Required: Amount to refund for this item
      "isBundle": true,             // Optional: Whether this is a bundle product
      "bundledItems": [             // Required if isBundle is true
        {
          "itemId": 457,            // Order item ID of the bundled item
          "productId": 790,         // Product ID of the bundled item
          "quantity": 2             // Quantity of the bundled item
        }
      ]
    }
  ],
  "reason": "Customer requested",   // Optional: Reason for the refund
  "refundPayment": false            // Optional: Whether to refund payment (e.g. via payment gateway)
}
```

## Response Format

### Success Response

```json
{
  "success": true,
  "refundId": "143",                // The ID of the newly created refund
  "orderId": "123",                 // The original order ID
  "amount": 19.99                   // The total refund amount
}
```

### Error Response

```json
{
  "error": "Failed to process refund",
  "details": "Order with ID 123 not found"
}
```

## Features

This API handles:

1. Creating a refund record in WooCommerce
2. Processing refunds for regular products and bundles
3. Updating product stock levels
4. Adding appropriate order notes/comments
5. Setting order status to "Refunded"

## Example Usage

Here's an example of how to call this API from JavaScript:

```javascript
const response = await fetch('/api/refund', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    orderId: 123,
    items: [
      {
        itemId: 456,
        productId: 789,
        quantity: 1,
        amount: 19.99
      }
    ],
    reason: 'Customer requested refund'
  }),
});

const result = await response.json();
```

See the `example.js` file for a complete React component example.

## Important Notes

1. This API uses database transactions to ensure all operations are atomic - either all succeed or all fail.
2. Stock quantities are automatically adjusted for refunded items.
3. The original order status is updated to "refunded".
4. Bundle products require special handling, make sure to include all bundled items.
5. A full example request can be found in `example.json`.

## Implementation Details

The refund process involves multiple database operations:

1. Updating the original order status
2. Creating the refund order record
3. Adding refund metadata
4. Creating refund line items
5. Updating product stock levels
6. Adding order notes/comments

All SQL queries are executed within a transaction to ensure data consistency. 
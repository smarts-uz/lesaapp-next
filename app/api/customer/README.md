# Customer API

This API provides functionality to manage customers in the WooCommerce/WordPress database.

## Endpoints

### List Customers

`GET /api/customer`

Retrieves a paginated list of customers.

#### Query Parameters

- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of customers per page (default: 20)

#### Response

```json
{
  "customers": [
    {
      "id": "1",
      "username": "customer_username",
      "email": "customer@example.com",
      "displayName": "John Doe",
      "firstName": "John",
      "lastName": "Doe",
      "dateRegistered": "2023-06-15T10:30:00.000Z"
    }
    // Additional customers...
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

### Get Customer by ID

`GET /api/customer?id=123`

Retrieves a specific customer by ID.

#### Query Parameters

- `id` (required): Customer ID

#### Response (Success)

```json
{
  "id": "123",
  "username": "customer_username",
  "email": "customer@example.com",
  "displayName": "John Doe",
  "firstName": "John",
  "lastName": "Doe",
  "dateRegistered": "2023-06-15T10:30:00.000Z",
  "lastActive": "2023-07-10T14:25:00.000Z",
  "billing": {
    "firstName": "John",
    "lastName": "Doe",
    "company": "Example Company",
    "address1": "123 Main St",
    "address2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "postcode": "10001",
    "country": "US",
    "phone": "555-123-4567",
    "email": "customer@example.com"
  },
  "shipping": {
    "firstName": "John",
    "lastName": "Doe",
    "company": "Example Company",
    "address1": "123 Main St",
    "address2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "postcode": "10001",
    "country": "US"
  }
}
```

#### Response (Error - Customer Not Found)

```json
{
  "error": "Customer not found"
}
```

### Create Customer

`POST /api/customer`

Creates a new customer in the WooCommerce/WordPress database.

#### Request Body (JSON)

```json
{
  "username": "customer_username",
  "password": "secure_password",
  "email": "customer@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "555-123-4567",
  "nickname": "Johnny",
  "description": "A loyal customer",
  "billing": {
    "firstName": "John",
    "lastName": "Doe",
    "company": "Example Company",
    "address1": "123 Main St",
    "address2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "postcode": "10001",
    "country": "US",
    "phone": "555-123-4567"
  },
  "shipping": {
    "firstName": "John",
    "lastName": "Doe",
    "company": "Example Company",
    "address1": "123 Main St",
    "address2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "postcode": "10001",
    "country": "US"
  }
}
```

Required fields:

- `username`
- `password`
- `email`
- `firstName`
- `lastName`
- `phone`

#### Response (Success)

```json
{
  "success": true,
  "customer": {
    "id": "123",
    "username": "customer_username",
    "email": "customer@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "555-123-4567",
    "displayName": "John Doe"
  }
}
```

#### Response (Error - Missing Fields)

```json
{
  "error": "Required fields missing",
  "requiredFields": [
    "username",
    "password",
    "email",
    "firstName",
    "lastName",
    "phone"
  ]
}
```

#### Response (Error - User Exists)

```json
{
  "error": "User with this username or email already exists"
}
```

#### Response (Error - Server Error)

```json
{
  "success": false,
  "error": "Failed to create customer",
  "details": "Error message details"
}
```

## Implementation Details

The implementation follows WordPress and WooCommerce customer creation flow:

1. Creates a new user in `wp_users` table with basic information and phone number
2. Adds user metadata in `wp_usermeta` table:
   - Basic user information including phone number
   - User capabilities (customer role)
   - User preferences
   - Billing information (if provided)
   - Shipping information (if provided)
3. Adds the customer to the WooCommerce customer lookup table
4. Initializes an empty shopping cart
5. Updates the user count in WordPress options

The entire operation is performed in a database transaction to ensure data consistency.

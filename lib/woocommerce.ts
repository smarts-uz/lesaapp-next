// This is a mock implementation for demonstration purposes
// In a real application, this would use the WooCommerce REST API

import type { Product, Order, RefundData } from "@/types/pos";

export async function fetchProducts(): Promise<Product[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Mock product data for construction and scaffolding
  return [
    {
      id: 1,
      name: "Steel Scaffold Frame",
      price: 89.99,
      image: "/placeholder.svg?height=200&width=200",
      categories: ["Scaffolding", "Frames"],
      stock: 45,
      onSale: false,
      type: "simple",
      variations: [
        {
          id: 1,
          name: "Size",
          options: ["5' x 5'", "5' x 6'", "5' x 7'"],
        },
        {
          id: 2,
          name: "Material",
          options: ["Galvanized Steel", "Powder Coated Steel"],
        },
      ],
    },
    {
      id: 2,
      name: "Cross Brace",
      price: 35.5,
      image: "/placeholder.svg?height=200&width=200",
      categories: ["Scaffolding", "Braces"],
      stock: 78,
      onSale: false,
      type: "simple",
      variations: [
        {
          id: 1,
          name: "Length",
          options: ["5'", "6'", "7'", "8'"],
        },
      ],
    },
    {
      id: 3,
      name: "Scaffold Platform",
      price: 120.0,
      image: "/placeholder.svg?height=200&width=200",
      categories: ["Scaffolding", "Platforms"],
      stock: 32,
      onSale: true,
      type: "simple",
      variations: [
        {
          id: 1,
          name: "Width",
          options: ['19"', '24"', '30"'],
        },
        {
          id: 2,
          name: "Length",
          options: ["6'", "8'", "10'"],
        },
      ],
    },
    {
      id: 4,
      name: "Scaffold Caster Wheel",
      price: 28.75,
      image: "/placeholder.svg?height=200&width=200",
      categories: ["Scaffolding", "Accessories"],
      stock: 120,
      onSale: false,
      type: "simple",
      variations: [
        {
          id: 1,
          name: "Load Capacity",
          options: ["500 lbs", "750 lbs", "1000 lbs"],
        },
        {
          id: 2,
          name: "Locking",
          options: ["Standard Lock", "Total Lock"],
        },
      ],
    },
    {
      id: 5,
      name: "Scaffold Leveling Jack",
      price: 42.99,
      image: "/placeholder.svg?height=200&width=200",
      categories: ["Scaffolding", "Accessories"],
      stock: 65,
      onSale: false,
      type: "simple",
    },
    {
      id: 6,
      name: "Scaffold Guardrail",
      price: 55.25,
      image: "/placeholder.svg?height=200&width=200",
      categories: ["Scaffolding", "Safety"],
      stock: 48,
      onSale: false,
      type: "simple",
      variations: [
        {
          id: 1,
          name: "Length",
          options: ["6'", "8'", "10'"],
        },
      ],
    },
    {
      id: 7,
      name: "Scaffold Outrigger",
      price: 75.0,
      image: "/placeholder.svg?height=200&width=200",
      categories: ["Scaffolding", "Accessories"],
      stock: 30,
      onSale: false,
      type: "simple",
    },
    {
      id: 8,
      name: "Scaffold Coupling Pin",
      price: 12.5,
      image: "/placeholder.svg?height=200&width=200",
      categories: ["Scaffolding", "Connectors"],
      stock: 200,
      onSale: false,
      type: "simple",
    },
    {
      id: 9,
      name: "Scaffold Toe Board",
      price: 25.99,
      image: "/placeholder.svg?height=200&width=200",
      categories: ["Scaffolding", "Safety"],
      stock: 85,
      onSale: false,
      type: "simple",
      variations: [
        {
          id: 1,
          name: "Length",
          options: ["6'", "8'", "10'"],
        },
      ],
    },
    {
      id: 10,
      name: "Safety Harness",
      price: 89.95,
      image: "/placeholder.svg?height=200&width=200",
      categories: ["Safety", "PPE"],
      stock: 40,
      onSale: true,
      type: "simple",
      variations: [
        {
          id: 1,
          name: "Size",
          options: ["S/M", "L/XL", "XXL"],
        },
      ],
    },
    {
      id: 11,
      name: "Hard Hat",
      price: 24.99,
      image: "/placeholder.svg?height=200&width=200",
      categories: ["Safety", "PPE"],
      stock: 75,
      onSale: false,
      type: "simple",
      variations: [
        {
          id: 1,
          name: "Color",
          options: ["White", "Yellow", "Blue", "Red"],
        },
      ],
    },
    {
      id: 12,
      name: "Basic Scaffolding Kit",
      price: 599.99,
      image: "/placeholder.svg?height=200&width=200",
      categories: ["Scaffolding", "Kits", "Featured"],
      stock: 15,
      onSale: true,
      type: "bundle",
      bundledItems: [
        {
          id: 1,
          productId: 1,
          name: "Steel Scaffold Frame",
          price: 89.99,
          image: "/placeholder.svg?height=200&width=200",
          defaultQuantity: 4,
          minQuantity: 4,
          maxQuantity: 8,
          optional: false,
          variations: [
            {
              id: 1,
              name: "Size",
              options: ["5' x 5'", "5' x 6'", "5' x 7'"],
            },
            {
              id: 2,
              name: "Material",
              options: ["Galvanized Steel", "Powder Coated Steel"],
            },
          ],
        },
        {
          id: 2,
          productId: 2,
          name: "Cross Brace",
          price: 35.5,
          image: "/placeholder.svg?height=200&width=200",
          defaultQuantity: 4,
          minQuantity: 4,
          maxQuantity: 8,
          optional: false,
          variations: [
            {
              id: 1,
              name: "Length",
              options: ["5'", "6'", "7'", "8'"],
            },
          ],
        },
        {
          id: 3,
          productId: 3,
          name: "Scaffold Platform",
          price: 120.0,
          image: "/placeholder.svg?height=200&width=200",
          defaultQuantity: 2,
          minQuantity: 1,
          maxQuantity: 4,
          optional: false,
          variations: [
            {
              id: 1,
              name: "Width",
              options: ['19"', '24"', '30"'],
            },
            {
              id: 2,
              name: "Length",
              options: ["6'", "8'", "10'"],
            },
          ],
        },
      ],
    },
    {
      id: 13,
      name: "Mobile Scaffold Tower Kit",
      price: 1299.99,
      image: "/placeholder.svg?height=200&width=200",
      categories: ["Scaffolding", "Kits"],
      stock: 8,
      onSale: false,
      type: "bundle",
      bundledItems: [
        {
          id: 1,
          productId: 1,
          name: "Steel Scaffold Frame",
          price: 89.99,
          image: "/placeholder.svg?height=200&width=200",
          defaultQuantity: 8,
          minQuantity: 8,
          maxQuantity: 12,
          optional: false,
          variations: [
            {
              id: 1,
              name: "Size",
              options: ["5' x 5'", "5' x 6'", "5' x 7'"],
            },
            {
              id: 2,
              name: "Material",
              options: ["Galvanized Steel", "Powder Coated Steel"],
            },
          ],
        },
        {
          id: 2,
          productId: 2,
          name: "Cross Brace",
          price: 35.5,
          image: "/placeholder.svg?height=200&width=200",
          defaultQuantity: 8,
          minQuantity: 8,
          maxQuantity: 12,
          optional: false,
          variations: [
            {
              id: 1,
              name: "Length",
              options: ["5'", "6'", "7'", "8'"],
            },
          ],
        },
        {
          id: 3,
          productId: 3,
          name: "Scaffold Platform",
          price: 120.0,
          image: "/placeholder.svg?height=200&width=200",
          defaultQuantity: 4,
          minQuantity: 2,
          maxQuantity: 6,
          optional: false,
          variations: [
            {
              id: 1,
              name: "Width",
              options: ['19"', '24"', '30"'],
            },
            {
              id: 2,
              name: "Length",
              options: ["6'", "8'", "10'"],
            },
          ],
        },
        {
          id: 4,
          productId: 4,
          name: "Scaffold Caster Wheel",
          price: 28.75,
          image: "/placeholder.svg?height=200&width=200",
          defaultQuantity: 4,
          minQuantity: 4,
          maxQuantity: 4,
          optional: false,
          variations: [
            {
              id: 1,
              name: "Load Capacity",
              options: ["500 lbs", "750 lbs", "1000 lbs"],
            },
          ],
        },
        {
          id: 5,
          productId: 6,
          name: "Scaffold Guardrail",
          price: 55.25,
          image: "/placeholder.svg?height=200&width=200",
          defaultQuantity: 4,
          minQuantity: 4,
          maxQuantity: 8,
          optional: false,
          variations: [
            {
              id: 1,
              name: "Length",
              options: ["6'", "8'", "10'"],
            },
          ],
        },
      ],
    },
    {
      id: 14,
      name: "Scaffolding Safety Package",
      price: 199.99,
      image: "/placeholder.svg?height=200&width=200",
      categories: ["Safety", "Kits"],
      stock: 25,
      onSale: false,
      type: "bundle",
      bundledItems: [
        {
          id: 1,
          productId: 10,
          name: "Safety Harness",
          price: 89.95,
          image: "/placeholder.svg?height=200&width=200",
          defaultQuantity: 1,
          minQuantity: 1,
          maxQuantity: 4,
          optional: false,
          variations: [
            {
              id: 1,
              name: "Size",
              options: ["S/M", "L/XL", "XXL"],
            },
          ],
        },
        {
          id: 2,
          productId: 11,
          name: "Hard Hat",
          price: 24.99,
          image: "/placeholder.svg?height=200&width=200",
          defaultQuantity: 1,
          minQuantity: 1,
          maxQuantity: 4,
          optional: false,
          variations: [
            {
              id: 1,
              name: "Color",
              options: ["White", "Yellow", "Blue", "Red"],
            },
          ],
        },
        {
          id: 3,
          productId: 15,
          name: "Safety Glasses",
          price: 12.99,
          image: "/placeholder.svg?height=200&width=200",
          defaultQuantity: 1,
          minQuantity: 1,
          maxQuantity: 4,
          optional: false,
        },
        {
          id: 4,
          productId: 16,
          name: "Work Gloves",
          price: 18.5,
          image: "/placeholder.svg?height=200&width=200",
          defaultQuantity: 1,
          minQuantity: 1,
          maxQuantity: 4,
          optional: false,
          variations: [
            {
              id: 1,
              name: "Size",
              options: ["S", "M", "L", "XL"],
            },
          ],
        },
      ],
    },
    {
      id: 15,
      name: "Safety Glasses",
      price: 12.99,
      image: "/placeholder.svg?height=200&width=200",
      categories: ["Safety", "PPE"],
      stock: 150,
      onSale: false,
      type: "simple",
    },
    {
      id: 16,
      name: "Work Gloves",
      price: 18.5,
      image: "/placeholder.svg?height=200&width=200",
      categories: ["Safety", "PPE"],
      stock: 100,
      onSale: false,
      type: "simple",
      variations: [
        {
          id: 1,
          name: "Size",
          options: ["S", "M", "L", "XL"],
        },
      ],
    },
    {
      id: 17,
      name: "Safety Lanyard",
      price: 45.99,
      image: "/placeholder.svg?height=200&width=200",
      categories: ["Safety", "PPE"],
      stock: 60,
      onSale: false,
      type: "simple",
    },
    {
      id: 18,
      name: "Custom Scaffold Project",
      price: 2499.99,
      image: "/placeholder.svg?height=200&width=200",
      categories: ["Scaffolding", "Custom", "Featured"],
      stock: 5,
      onSale: true,
      type: "bundle",
      bundledItems: [
        {
          id: 1,
          productId: 1,
          name: "Steel Scaffold Frame",
          price: 89.99,
          image: "/placeholder.svg?height=200&width=200",
          defaultQuantity: 12,
          minQuantity: 8,
          maxQuantity: 20,
          optional: false,
          variations: [
            {
              id: 1,
              name: "Size",
              options: ["5' x 5'", "5' x 6'", "5' x 7'"],
            },
            {
              id: 2,
              name: "Material",
              options: ["Galvanized Steel", "Powder Coated Steel"],
            },
          ],
        },
        {
          id: 2,
          productId: 2,
          name: "Cross Brace",
          price: 35.5,
          image: "/placeholder.svg?height=200&width=200",
          defaultQuantity: 12,
          minQuantity: 8,
          maxQuantity: 20,
          optional: false,
          variations: [
            {
              id: 1,
              name: "Length",
              options: ["5'", "6'", "7'", "8'"],
            },
          ],
        },
        {
          id: 3,
          productId: 3,
          name: "Scaffold Platform",
          price: 120.0,
          image: "/placeholder.svg?height=200&width=200",
          defaultQuantity: 6,
          minQuantity: 4,
          maxQuantity: 10,
          optional: false,
          variations: [
            {
              id: 1,
              name: "Width",
              options: ['19"', '24"', '30"'],
            },
            {
              id: 2,
              name: "Length",
              options: ["6'", "8'", "10'"],
            },
          ],
        },
        {
          id: 6,
          productId: 6,
          name: "Scaffold Guardrail",
          price: 55.25,
          image: "/placeholder.svg?height=200&width=200",
          defaultQuantity: 6,
          minQuantity: 4,
          maxQuantity: 10,
          optional: false,
          variations: [
            {
              id: 1,
              name: "Length",
              options: ["6'", "8'", "10'"],
            },
          ],
        },
        {
          id: 8,
          productId: 8,
          name: "Scaffold Coupling Pin",
          price: 12.5,
          image: "/placeholder.svg?height=200&width=200",
          defaultQuantity: 24,
          minQuantity: 16,
          maxQuantity: 40,
          optional: false,
        },
      ],
    },
  ];
}

export async function createOrder(orderData: any) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // In a real implementation, this would create an order in WooCommerce
  return {
    id: Math.floor(Math.random() * 1000) + 1,
    ...orderData,
    date: new Date().toISOString(),
    status: "processing",
  };
}

export async function fetchOrder(orderId: string): Promise<Order | null> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // In a real implementation, this would fetch the order from WooCommerce
  // For now, return a mock order
  return {
    id: orderId,
    number: `#ORD-${orderId}`,
    date: new Date().toISOString(),
    status: "completed",
    customer: {
      name: "John Smith Construction",
      email: "john.smith@construction.com",
      phone: "+1 (555) 123-4567",
    },
    billing: {
      address: "123 Construction Ave",
      city: "New York",
      state: "NY",
      postcode: "10001",
      country: "US",
    },
    shipping: {
      address: "456 Building Site Rd",
      city: "New York",
      state: "NY",
      postcode: "10001",
      country: "US",
    },
    payment: {
      method: "Credit Card",
      transaction: "txn_1234567890",
    },
    items: [
      {
        id: 1,
        name: "Steel Scaffold Frame",
        sku: "SCF-001",
        price: 89.99,
        quantity: 4,
        total: 359.96,
        refundable: true,
        type: "simple",
      },
      {
        id: 2,
        name: "Cross Brace",
        sku: "CB-002",
        price: 35.5,
        quantity: 6,
        total: 213.0,
        refundable: true,
        type: "simple",
      },
      // ... other items
    ],
    subtotal: 1372.94,
    shipping_total: 75.0,
    tax_total: 137.29,
    discount_total: 0,
    total: 1585.23,
    refunds: [],
  };
}

export async function processRefund(orderId: string, refundData: RefundData) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Generate a unique refund ID
  const refundId = `RF-${Math.floor(Math.random() * 10000) + 1}`;

  // Create the refund object
  const refund = {
    id: refundId,
    order_id: orderId,
    date: refundData.date || new Date().toISOString(),
    amount: refundData.amount,
    reason: refundData.reason,
    items: refundData.items,
    payment_method: refundData.payment_method,
    transaction_id: `txn_refund_${Math.floor(Math.random() * 1000000) + 1}`,
    status: "completed",
    created_by: "admin",
    restock_items: refundData.restock,
  };

  // In a real implementation, this would:
  // 1. Process the refund through the payment gateway
  // 2. Update inventory if restocking
  // 3. Update the order status if it's a full refund
  // 4. Create a record of the refund in the database

  console.log("Processing refund:", refund);

  // Return the refund data
  return refund;
}

export async function createBooking(bookingData: any) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // In a real implementation, this would create a booking in WooCommerce
  return {
    id: `BK-${Math.floor(Math.random() * 1000) + 1}`,
    ...bookingData,
    status: "upcoming",
  };
}

export async function createDiscount(discountData: any) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // In a real implementation, this would create a discount in WooCommerce
  return {
    id: Math.floor(Math.random() * 1000) + 1,
    ...discountData,
  };
}

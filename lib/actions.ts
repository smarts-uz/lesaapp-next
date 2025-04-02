'use server';

import { createOrder as createOrderPrisma } from './prisma/orders';
import { z } from 'zod';

// Define a schema for order validation
const OrderItemSchema = z.object({
  product_id: z.number(),
  name: z.string(),
  sku: z.string().optional(),
  price: z.number(),
  quantity: z.number().min(1),
  total: z.number(),
  type: z.string().optional().default('simple'),
  bundleItems: z.array(z.any()).optional().default([]),
  tax_amount: z.number().optional(),
});

const OrderSchema = z.object({
  items: z.array(OrderItemSchema),
  subtotal: z.number(),
  tax_total: z.number(),
  total: z.number(),
  payment_method: z.string().optional().default('cash'),
  status: z.string().optional().default('processing'),
  customer: z.any().optional(),
  billing: z.any().optional(),
  shipping: z.any().optional(),
});

export async function createOrderAction(orderData: any) {
  try {
    // Validate order data
    const validatedData = OrderSchema.parse(orderData);
    
    // Process bundle items to ensure they have the correct structure
    const processedItems = validatedData.items.map(item => {
      if (item.type === 'bundle' && item.bundleItems && Array.isArray(item.bundleItems)) {
        // Ensure each bundle item has the required fields
        const processedBundleItems = item.bundleItems.map(bundleItem => ({
          id: bundleItem.id || 0,
          product_id: bundleItem.product_id || bundleItem.productId || 0,
          name: bundleItem.name || '',
          price: bundleItem.price || 0,
          quantity: bundleItem.quantity || 0,
          total: bundleItem.total || (bundleItem.price * bundleItem.quantity) || 0,
          variation_id: bundleItem.variation_id || 0,
          ...bundleItem
        }));
        
        return {
          ...item,
          bundleItems: processedBundleItems
        };
      }
      return item;
    });
    
    // Create order in database with processed items
    const order = await createOrderPrisma({
      ...validatedData,
      items: processedItems
    });
    
    return { success: true, order };
  } catch (error) {
    console.error('Error creating order:', error);
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: `Validation error: ${error.errors.map(e => e.message).join(', ')}` 
      };
    }
    
    return { success: false, error: (error as Error).message };
  }
} 
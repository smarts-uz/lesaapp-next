'use server';

import { createOrder as createOrderPrisma } from './prisma/orders';

export async function createOrderAction(orderData: any) {
  try {
    const order = await createOrderPrisma(orderData);
    return { success: true, order };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error: (error as Error).message };
  }
} 
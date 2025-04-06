import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { updateOrderStatus, processOrderItems, OrderItemProcessResult } from '@/services/order/test/complete';

// Define validation schema
const CompleteOrderSchema = z.object({
  orderId: z.number().or(z.string().regex(/^\d+$/).transform(Number)),
});

type CompleteOrderRequest = z.infer<typeof CompleteOrderSchema>;

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const parsedBody = CompleteOrderSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: parsedBody.error.format() },
        { status: 400 }
      );
    }

    const { orderId } = parsedBody.data;

    // Start a transaction
    return await prisma.$transaction(async (tx) => {
      // 1. Get the order
      const order = await tx.wp_wc_orders.findUnique({
        where: { id: BigInt(orderId) },
      });

      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      // 2. Get all order items
      const orderItems = await tx.wp_woocommerce_order_items.findMany({
        where: {
          order_id: BigInt(orderId),
          order_item_type: 'line_item',
        },
      });

      if (!orderItems.length) {
        return NextResponse.json(
          { error: 'No order items found' },
          { status: 400 }
        );
      }

      // 3. Process order items (attempt refunds and record lost products)
      const processResults = await processOrderItems(tx, BigInt(orderId));
      
      // 4. Update order status to completed
      await updateOrderStatus({ tx, orderId: BigInt(orderId) });

      // 5. Return success response with summary
      const lostProducts = processResults.filter((item: OrderItemProcessResult) => !item.refunded);
      
      return NextResponse.json({
        success: true,
        message: 'Order completed successfully',
        orderId: Number(orderId),
        totalItems: processResults.length,
        refundedItems: processResults.length - lostProducts.length,
        lostProductsCount: lostProducts.length,
        lostProducts: lostProducts.length > 0 ? lostProducts.map((item: OrderItemProcessResult) => ({
          orderItemId: Number(item.orderItemId),
          productId: Number(item.productId),
          error: item.error
        })) : undefined,
      });
    });
  } catch (error) {
    console.error('Failed to complete order:', error);
    return NextResponse.json(
      { error: 'Failed to complete order', details: (error as Error).message },
      { status: 500 }
    );
  }
}

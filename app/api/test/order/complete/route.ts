import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  updateOrderStatus,
  processOrderItems,
} from "@/services/order/test/complete";

// Define validation schema
const CompleteOrderSchema = z.object({
  orderId: z.number().or(z.string().regex(/^\d+$/).transform(Number)),
});

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const parsedBody = CompleteOrderSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsedBody.error.format() },
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
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      // Check if the order is already completed - use is_completed as the primary flag
      if (order.is_completed === true) {
        // If order is already completed, get existing lost products
        const lostProducts = await tx.wp_wc_order_lost_product.findMany({
          where: {
            order_id: BigInt(orderId),
          },
        });

        // For each lost product, get the original quantity
        const enhancedLostProducts = await Promise.all(
          lostProducts.map(async (item: any) => {
            // Get original quantity from order item meta
            const qtyMeta = await tx.wp_woocommerce_order_itemmeta.findFirst({
              where: {
                order_item_id: item.order_item_id,
                meta_key: '_qty',
              },
            });
            
            const originalQty = qtyMeta && qtyMeta.meta_value ? 
              parseInt(qtyMeta.meta_value.toString(), 10) : 
              // Fallback to product lookup
              await tx.wp_wc_order_product_lookup.findFirst({
                where: { order_item_id: item.order_item_id },
                select: { product_qty: true },
              }).then(lookup => lookup?.product_qty || 0);

            return {
              orderItemId: Number(item.order_item_id),
              productId: Number(item.product_id),
              originalQuantity: originalQty,
              remainingQuantity: item.product_qty,
              refundedQuantity: originalQty - item.product_qty,
            };
          })
        );

        return NextResponse.json({
          success: true,
          message: "Order was already completed",
          orderId: Number(orderId),
          status: order.status,
          is_completed: true,
          lostProductsCount: enhancedLostProducts.length,
          lostProducts: enhancedLostProducts.length > 0 ? enhancedLostProducts : undefined,
        });
      }

      // 2. Get all order items
      const orderItems = await tx.wp_woocommerce_order_items.findMany({
        where: {
          order_id: BigInt(orderId),
          order_item_type: "line_item",
        },
      });

      if (!orderItems.length) {
        return NextResponse.json(
          { error: "No order items found" },
          { status: 400 }
        );
      }

      // 3. Process order items (attempt refunds and record lost products)
      const processResults = await processOrderItems(tx, BigInt(orderId));

      // 4. Update order status to completed and set is_completed to true
      await updateOrderStatus({ tx, orderId: BigInt(orderId) });

      // 5. Get the updated order to confirm status change
      const updatedOrder = await tx.wp_wc_orders.findUnique({
        where: { id: BigInt(orderId) },
      });

      if (!updatedOrder) {
        return NextResponse.json(
          { error: "Failed to retrieve updated order" },
          { status: 500 }
        );
      }

      // 6. Get the lost products from the database for consistent results
      const lostProducts = await tx.wp_wc_order_lost_product.findMany({
        where: {
          order_id: BigInt(orderId),
        },
      });

      // For each lost product, get the original quantity
      const enhancedLostProducts = await Promise.all(
        lostProducts.map(async (item: any) => {
          // Get original quantity from order item meta
          const qtyMeta = await tx.wp_woocommerce_order_itemmeta.findFirst({
            where: {
              order_item_id: item.order_item_id,
              meta_key: '_qty',
            },
          });
          
          const originalQty = qtyMeta && qtyMeta.meta_value ? 
            parseInt(qtyMeta.meta_value.toString(), 10) : 
            // Fallback to product lookup
            await tx.wp_wc_order_product_lookup.findFirst({
              where: { order_item_id: item.order_item_id },
              select: { product_qty: true },
            }).then(lookup => lookup?.product_qty || 0);

          return {
            orderItemId: Number(item.order_item_id),
            productId: Number(item.product_id),
            originalQuantity: originalQty,
            remainingQuantity: item.product_qty,
            refundedQuantity: originalQty - item.product_qty,
          };
        })
      );

      // 7. Return success response with summary
      return NextResponse.json({
        success: true,
        message: "Order completed successfully",
        orderId: Number(orderId),
        status: updatedOrder.status,
        is_completed: updatedOrder.is_completed,
        totalItems: orderItems.length,
        refundedItemsCount: orderItems.length - lostProducts.length,
        lostProductsCount: enhancedLostProducts.length,
        lostProducts: enhancedLostProducts.length > 0 ? enhancedLostProducts : undefined,
      });
    });
  } catch (error) {
    console.error("Failed to complete order:", error);
    return NextResponse.json(
      { error: "Failed to complete order", details: (error as Error).message },
      { status: 500 }
    );
  }
}

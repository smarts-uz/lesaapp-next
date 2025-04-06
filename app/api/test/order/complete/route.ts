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

    const order = await prisma.wp_wc_orders.findUnique({
      where: {
        id: Number(orderId),
      },
    });
    console.log("order", order);

    if (!order?.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "completed") {
      return NextResponse.json(
        { error: "Order is not completed" },
        { status: 400 }
      );
    }

    const refundedOrders = await prisma.wp_wc_orders.findMany({
      where: {
        parent_order_id: Number(orderId),
      },
    });

    console.log("refundedOrders", refundedOrders);
    const refundedItems = [];
    if (refundedOrders?.length > 0) {
      for (const order of refundedOrders) {
        const orderItems = await prisma.wp_wc_order_product_lookup.findMany({
          where: {
            order_id: order.id,
          },
        });
        refundedItems.push(...orderItems);
      }
    }

    console.log("refundedItems", refundedItems);

    // [
    //   {
    //     order_item_id: 165n,
    //     order_id: 1743917525n,
    //     product_id: 66n,
    //     variation_id: 0n,
    //     customer_id: 0n,
    //     date_created: 2025-04-06T05:34:57.000Z,
    //     product_qty: -1,
    //     product_net_revenue: -4500,
    //     product_gross_revenue: -4500,
    //     coupon_amount: 0,
    //     tax_amount: 0,
    //     shipping_amount: 0,
    //     shipping_tax_amount: 0,
    //     rental_price: 0n,
    //     used_days: null,
    //     discount_days: null
    //   },
    //   {
    //     order_item_id: 166n,
    //     order_id: 1743917525n,
    //     product_id: 64n,
    //     variation_id: 0n,
    //     customer_id: 0n,
    //     date_created: 2025-04-06T05:34:57.000Z,
    //     product_qty: -2,
    //     product_net_revenue: 0,
    //     product_gross_revenue: 0,
    //     coupon_amount: 0,
    //     tax_amount: 0,
    //     shipping_amount: 0,
    //     shipping_tax_amount: 0,
    //     rental_price: 0n,
    //     used_days: null,
    //     discount_days: null
    //   },
    //   {
    //     order_item_id: 167n,
    //     order_id: 1743917525n,
    //     product_id: 65n,
    //     variation_id: 0n,
    //     customer_id: 0n,
    //     date_created: 2025-04-06T05:34:57.000Z,
    //     product_qty: -2,
    //     product_net_revenue: 0,
    //     product_gross_revenue: 0,
    //     coupon_amount: 0,
    //     tax_amount: 0,
    //     shipping_amount: 0,
    //     shipping_tax_amount: 0,
    //     rental_price: 0n,
    //     used_days: null,
    //     discount_days: null
    //   },
    //   {
    //     order_item_id: 168n,
    //     order_id: 1743917525n,
    //     product_id: 63n,
    //     variation_id: 0n,
    //     customer_id: 0n,
    //     date_created: 2025-04-06T05:34:57.000Z,
    //     product_qty: -2,
    //     product_net_revenue: 0,
    //     product_gross_revenue: 0,
    //     coupon_amount: 0,
    //     tax_amount: 0,
    //     shipping_amount: 0,
    //     shipping_tax_amount: 0,
    //     rental_price: 0n,
    //     used_days: null,
    //     discount_days: null
    //   },
    //   {
    //     order_item_id: 169n,
    //     order_id: 1743917525n,
    //     product_id: 65n,
    //     variation_id: 0n,
    //     customer_id: 0n,
    //     date_created: 2025-04-06T05:34:57.000Z,
    //     product_qty: -1,
    //     product_net_revenue: -2900,
    //     product_gross_revenue: -2900,
    //     coupon_amount: 0,
    //     tax_amount: 0,
    //     shipping_amount: 0,
    //     shipping_tax_amount: 0,
    //     rental_price: 0n,
    //     used_days: null,
    //     discount_days: null
    //   },
    //   {
    //     order_item_id: 176n,
    //     order_id: 1743917989n,
    //     product_id: 66n,
    //     variation_id: 0n,
    //     customer_id: 0n,
    //     date_created: 2025-04-06T06:11:28.000Z,
    //     product_qty: -1,
    //     product_net_revenue: -4500,
    //     product_gross_revenue: -4500,
    //     coupon_amount: 0,
    //     tax_amount: 0,
    //     shipping_amount: 0,
    //     shipping_tax_amount: 0,
    //     rental_price: 1638000n,
    //     used_days: 366,
    //     discount_days: null
    //   },
    //   {
    //     order_item_id: 177n,
    //     order_id: 1743917989n,
    //     product_id: 64n,
    //     variation_id: 0n,
    //     customer_id: 0n,
    //     date_created: 2025-04-06T06:11:28.000Z,
    //     product_qty: -2,
    //     product_net_revenue: 0,
    //     product_gross_revenue: 0,
    //     coupon_amount: 0,
    //     tax_amount: 0,
    //     shipping_amount: 0,
    //     shipping_tax_amount: 0,
    //     rental_price: 0n,
    //     used_days: 366,
    //     discount_days: null
    //   },
    //   {
    //     order_item_id: 178n,
    //     order_id: 1743917989n,
    //     product_id: 65n,
    //     variation_id: 0n,
    //     customer_id: 0n,
    //     date_created: 2025-04-06T06:11:28.000Z,
    //     product_qty: -2,
    //     product_net_revenue: 0,
    //     product_gross_revenue: 0,
    //     coupon_amount: 0,
    //     tax_amount: 0,
    //     shipping_amount: 0,
    //     shipping_tax_amount: 0,
    //     rental_price: 0n,
    //     used_days: 366,
    //     discount_days: null
    //   },
    //   {
    //     order_item_id: 179n,
    //     order_id: 1743917989n,
    //     product_id: 63n,
    //     variation_id: 0n,
    //     customer_id: 0n,
    //     date_created: 2025-04-06T06:11:28.000Z,
    //     product_qty: -2,
    //     product_net_revenue: 0,
    //     product_gross_revenue: 0,
    //     coupon_amount: 0,
    //     tax_amount: 0,
    //     shipping_amount: 0,
    //     shipping_tax_amount: 0,
    //     rental_price: 0n,
    //     used_days: 366,
    //     discount_days: null
    //   },
    //   {
    //     order_item_id: 180n,
    //     order_id: 1743917989n,
    //     product_id: 65n,
    //     variation_id: 0n,
    //     customer_id: 0n,
    //     date_created: 2025-04-06T06:11:28.000Z,
    //     product_qty: -1,
    //     product_net_revenue: -2900,
    //     product_gross_revenue: -2900,
    //     coupon_amount: 0,
    //     tax_amount: 0,
    //     shipping_amount: 0,
    //     shipping_tax_amount: 0,
    //     rental_price: 1055600n,
    //     used_days: 366,
    //     discount_days: null
    //   }
    // ]

    // =====================================================

    // items [
    //   {
    //     order_item_id: 159n,
    //     order_id: 1743917491n,
    //     product_id: 66n,
    //     variation_id: 0n,
    //     customer_id: 0n,
    //     date_created: 2025-04-06T05:31:31.000Z,
    //     product_qty: 10,
    //     product_net_revenue: 45000,
    //     product_gross_revenue: 45000,
    //     coupon_amount: 0,
    //     tax_amount: 0,
    //     shipping_amount: 0,
    //     shipping_tax_amount: 0,
    //     rental_price: null,
    //     used_days: null,
    //     discount_days: null
    //   },
    //   {
    //     order_item_id: 160n,
    //     order_id: 1743917491n,
    //     product_id: 64n,
    //     variation_id: 0n,
    //     customer_id: 0n,
    //     date_created: 2025-04-06T05:31:31.000Z,
    //     product_qty: 10,
    //     product_net_revenue: 0,
    //     product_gross_revenue: 0,
    //     coupon_amount: 0,
    //     tax_amount: 0,
    //     shipping_amount: 0,
    //     shipping_tax_amount: 0,
    //     rental_price: null,
    //     used_days: null,
    //     discount_days: null
    //   },
    //   {
    //     order_item_id: 161n,
    //     order_id: 1743917491n,
    //     product_id: 65n,
    //     variation_id: 0n,
    //     customer_id: 0n,
    //     date_created: 2025-04-06T05:31:31.000Z,
    //     product_qty: 10,
    //     product_net_revenue: 0,
    //     product_gross_revenue: 0,
    //     coupon_amount: 0,
    //     tax_amount: 0,
    //     shipping_amount: 0,
    //     shipping_tax_amount: 0,
    //     rental_price: null,
    //     used_days: null,
    //     discount_days: null
    //   },
    //   {
    //     order_item_id: 162n,
    //     order_id: 1743917491n,
    //     product_id: 63n,
    //     variation_id: 0n,
    //     customer_id: 0n,
    //     date_created: 2025-04-06T05:31:31.000Z,
    //     product_qty: 10,
    //     product_net_revenue: 0,
    //     product_gross_revenue: 0,
    //     coupon_amount: 0,
    //     tax_amount: 0,
    //     shipping_amount: 0,
    //     shipping_tax_amount: 0,
    //     rental_price: null,
    //     used_days: null,
    //     discount_days: null
    //   },
    //   {
    //     order_item_id: 163n,
    //     order_id: 1743917491n,
    //     product_id: 65n,
    //     variation_id: 0n,
    //     customer_id: 0n,
    //     date_created: 2025-04-06T05:31:31.000Z,
    //     product_qty: 10,
    //     product_net_revenue: 29000,
    //     product_gross_revenue: 29000,
    //     coupon_amount: 0,
    //     tax_amount: 0,
    //     shipping_amount: 0,
    //     shipping_tax_amount: 0,
    //     rental_price: null,
    //     used_days: null,
    //     discount_days: null
    //   }
    // ]

    const orderItems = await prisma.wp_wc_order_product_lookup.findMany({
      where: {
        order_id: Number(orderId),
      },
    });
    console.log("items", orderItems);

    return NextResponse.json({
      success: true,
      message: "Order completed successfully",
      orderId: Number(orderId),
    });
  } catch (error) {
    console.error("Failed to complete order:", error);
    return NextResponse.json(
      { error: "Failed to complete order", details: (error as Error).message },
      { status: 500 }
    );
  }
}

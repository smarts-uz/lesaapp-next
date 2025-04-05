import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOrderRecord } from "@/services/order/create/createOrderRecord";
import { createBillingAddress } from "@/services/order/create/createBillingAddress";
import { createOperationalData } from "@/services/order/create/createOperationalData";
import { createOrderItem } from "@/services/order/create/createOrderItem";
import { generateOrderItemMeta } from "@/services/order/create/createOrderItemMeta";
import { generateBundleProductMeta } from "@/services/order/create/createBundleProductMeta";
import { createBundleItem } from "@/services/order/create/createBundleItem";
import { updateProductStock } from "@/services/order/create/updateProductStock";

// Custom BigInt serializer
const bigIntSerializer = () => {
  const originalStringify = JSON.stringify;
  JSON.stringify = function (obj: any) {
    return originalStringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    );
  };
};

// Initialize BigInt serializer
bigIntSerializer();

interface Order {
  id: bigint;
  date_created_gmt: Date;
  status: string;
  total_amount: number;
  payment_method: string | null;
  payment_method_title: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address_1: string | null;
  city: string | null;
  country: string | null;
}

interface OrderItem {
  order_item_id: number;
  order_item_name: string;
  product_id: string;
  variation_id: string;
  quantity: string;
  subtotal: string;
  total: string;
}

interface ProductItem {
  product_id: number;
  quantity: number;
  price: number;
  name?: string;
  variationId?: number;
  isBundle?: boolean;
  bundleItems?: Array<{
    product_id: number;
    quantity: number;
  }>;
}

interface PrismaTransaction {
  wp_wc_orders: {
    create: Function;
  };
  wp_wc_order_addresses: {
    create: Function;
  };
  wp_wc_order_operational_data: {
    create: Function;
  };
  wp_woocommerce_order_items: {
    create: Function;
  };
  wp_woocommerce_order_itemmeta: {
    createMany: Function;
  };
  wp_wc_product_meta_lookup: {
    upsert: Function;
  };
}

export async function GET() {
  try {
    // Get orders with customer details
    const orders = await prisma.$queryRaw<Order[]>`
      SELECT 
        o.id, 
        o.date_created_gmt, 
        o.status, 
        o.total_amount,
        o.payment_method,
        o.payment_method_title,
        oa.first_name, 
        oa.last_name,
        oa.email,
        oa.phone,
        oa.address_1,
        oa.city,
        oa.country
      FROM wp_wc_orders o
      LEFT JOIN wp_wc_order_addresses oa ON o.id = oa.order_id AND oa.address_type = 'billing'
      ORDER BY o.date_created_gmt DESC
    `;

    const formattedOrders = await Promise.all(
      orders.map(async (order: Order) => {
        // Get order items for each order
        const orderItems = await prisma.$queryRaw<OrderItem[]>`
        SELECT 
          oi.order_item_id,
          oi.order_item_name,
          (SELECT meta_value FROM wp_woocommerce_order_itemmeta WHERE order_item_id = oi.order_item_id AND meta_key = '_product_id') as product_id,
          (SELECT meta_value FROM wp_woocommerce_order_itemmeta WHERE order_item_id = oi.order_item_id AND meta_key = '_variation_id') as variation_id,
          (SELECT meta_value FROM wp_woocommerce_order_itemmeta WHERE order_item_id = oi.order_item_id AND meta_key = '_qty') as quantity,
          (SELECT meta_value FROM wp_woocommerce_order_itemmeta WHERE order_item_id = oi.order_item_id AND meta_key = '_line_subtotal') as subtotal,
          (SELECT meta_value FROM wp_woocommerce_order_itemmeta WHERE order_item_id = oi.order_item_id AND meta_key = '_line_total') as total
        FROM wp_woocommerce_order_items oi
        WHERE oi.order_id = ${order.id}
        AND oi.order_item_type = 'line_item'
      `;

        const formattedItems = orderItems.map((item: OrderItem) => ({
          id: item.order_item_id,
          name: item.order_item_name,
          product_id: item.product_id,
          variation_id: item.variation_id,
          quantity: parseInt(item.quantity || "0"),
          subtotal: parseFloat(item.subtotal || "0"),
          total: parseFloat(item.total || "0"),
        }));

        return {
          id: order.id.toString(),
          number: `#ORD-${order.id.toString().padStart(3, "0")}`,
          date:
            order.date_created_gmt?.toISOString() || new Date().toISOString(),
          status: order.status || "pending",
          total: Number(order.total_amount) || 0,
          customer: {
            name:
              order.first_name || order.last_name
                ? `${order.first_name || ""} ${order.last_name || ""}`
                : "Unknown Customer",
            email: order.email || null,
            phone: order.phone || null,
            address: order.address_1 || null,
            city: order.city || null,
            country: order.country || null,
          },
          payment: {
            method: order.payment_method || null,
            methodTitle: order.payment_method_title || null,
          },
          items: formattedItems,
        };
      })
    );

    return new NextResponse(JSON.stringify(formattedOrders), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customer,
      products,
      status = "wc-processing",
      paymentMethod = "cod",
      paymentMethodTitle = "Cash on delivery",
    } = body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: "Products are required" },
        { status: 400 }
      );
    }

    // Calculate total amount from products
    const totalAmount = products.reduce(
      (total, product: ProductItem) => total + product.price * product.quantity,
      0
    );

    // Create order using Prisma transaction
    const result = await prisma.$transaction(async (tx: PrismaTransaction) => {
      // 1. Create the main order record
      const order = await createOrderRecord({
        tx,
        customerId: customer?.id,
        email: customer?.email,
        status,
        totalAmount,
        paymentMethod,
        paymentMethodTitle,
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: request.headers.get("user-agent") || "",
      });

      // 2. Create billing address if customer info is provided
      if (customer) {
        await createBillingAddress({
          tx,
          customer,
          orderId: order.id,
        });
      }

      // 3. Create operational data
      await createOperationalData({
        tx,
        orderId: order.id,
      });

      // 4. Create order items and handle bundles
      for (const product of products) {
        // Create order item
        const orderItem = await createOrderItem({
          tx,
          orderId: order.id,
          product,
        });

        // Generate base order item meta
        const baseItemMeta = generateOrderItemMeta({
          orderItemId: orderItem.order_item_id,
          product,
        });

        // If this is a bundle product, add bundle-specific meta
        if (product.isBundle && product.bundleItems) {
          const bundleCartKey = Math.random().toString(36).substring(2, 15);
          const bundledItemsKeys = product.bundleItems.map(() =>
            Math.random().toString(36).substring(2, 15)
          );

          // Add bundle meta
          const bundleMeta = generateBundleProductMeta({
            orderItemId: orderItem.order_item_id,
            bundleCartKey,
            bundledItemsKeys,
          });

          baseItemMeta.push(...bundleMeta);

          // Create bundled items
          for (const [index, bundleItem] of product.bundleItems.entries()) {
            await createBundleItem({
              tx,
              orderId: order.id,
              bundleItem,
              index,
              bundleCartKey,
            });
          }
        }

        // Create order item meta
        await tx.wp_woocommerce_order_itemmeta.createMany({
          data: baseItemMeta,
        });

        // Update product stock if not a bundle
        if (!product.isBundle) {
          await updateProductStock({
            tx,
            product,
          });
        }
      }

      return {
        id: order.id.toString(),
        number: `#ORD-${order.id.toString().padStart(3, "0")}`,
        date: order.date_created_gmt?.toISOString(),
        customer: customer
          ? `${customer.firstName || ""} ${customer.lastName || ""}`
          : "Guest",
        status: order.status,
        total: Number(order.total_amount) || 0,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to create order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createOrderRecord,
  createBillingAddress,
  createOperationalData,
  createOrderItem,
  generateOrderItemMeta,
  generateBundleProductMeta,
  updateProductStock,
  ProductItem,
  OrderCreateParams,
  createOrderProductLookup,
  updateBundledItemStock,
  createOrderStats,
  createBundledItemMeta,
  createOrderItemMetaEntries,
} from "@/services/order/create";
import { fetchOrders } from "@/services/order/fetch";

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
  wp_wc_order_product_lookup: {
    create: Function;
  };
  wp_wc_order_stats: {
    create: Function;
  };
}

// Use the OrderCreateParams interface from services/order/create
type OrderCreateBody = OrderCreateParams;

export async function GET() {
  try {
    const formattedOrders = await fetchOrders();

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
    const body: OrderCreateBody = await request.json();
    const {
      customer,
      products,
      status = "wc-processing",
      paymentMethod = "cod",
      paymentMethodTitle = "Cash on delivery",
      start_date, // Destructure start_date from body
    } = body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: "Products are required" },
        { status: 400 }
      );
    }

    if (!start_date) {
      return NextResponse.json(
        { error: "start_date is required" },
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
        startDate: start_date,
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

      // Calculate total items for order stats
      let totalItemsCount = 0;

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

        // Add entry to wp_wc_order_product_lookup for main product
        await createOrderProductLookup({
          tx,
          orderItemId: orderItem.order_item_id,
          orderId: order.id,
          product,
          customer,
        });

        totalItemsCount += product.quantity;

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
            const bundledOrderItem = await tx.wp_woocommerce_order_items.create(
              {
                data: {
                  order_item_name: `Product #${bundleItem.product_id}`,
                  order_item_type: "line_item",
                  order_id: order.id,
                },
              }
            );

            // Add bundled item meta
            await createBundledItemMeta({
              tx,
              orderItemId: bundledOrderItem.order_item_id,
              bundleItem,
              bundleCartKey,
              itemIndex: index,
            });

            // Add entry to wp_wc_order_product_lookup for bundled item
            await createOrderProductLookup({
              tx,
              orderItemId: bundledOrderItem.order_item_id,
              orderId: order.id,
              product: {
                product_id: bundleItem.product_id,
                quantity: bundleItem.quantity,
                price: 0, // Bundled items typically have 0 price
              },
              customer,
            });

            totalItemsCount += bundleItem.quantity;

            // Update stock for bundled item
            await updateBundledItemStock({
              tx,
              bundleItem,
            });
          }
        }

        // Create order item meta
        await createOrderItemMetaEntries({
          tx,
          orderItemId: orderItem.order_item_id,
          product,
          metaData: baseItemMeta,
        });

        // Update product stock if not a bundle
        if (!product.isBundle) {
          await updateProductStock({
            tx,
            product,
          });
        }
      }

      // 5. Create order stats entry
      try {
        await createOrderStats({
          tx,
          orderId: order.id,
          totalItemsCount,
          totalAmount,
          status,
          customerId: customer?.id,
        });
      } catch (error) {
        console.warn("Failed to create order stats:", error);
        // Continue processing as this is not critical
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

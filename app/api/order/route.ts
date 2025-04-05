import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createOrderRecord,
  createBillingAddress,
  createOperationalData,
  createOrderItem,
  generateOrderItemMeta,
  generateBundleProductMeta,
  createBundleItem,
  updateProductStock,
  ProductItem,
  OrderCreateParams,
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
      const order = await tx.wp_wc_orders.create({
        data: {
          id: BigInt(Math.floor(Date.now() / 1000)),
          status,
          currency: "UZS",
          type: "shop_order",
          tax_amount: 0,
          total_amount: totalAmount,
          customer_id: customer?.id ? BigInt(customer.id) : BigInt(0),
          billing_email: customer?.email || null,
          date_created_gmt: new Date(),
          date_updated_gmt: new Date(),
          start_date: new Date(start_date), // Use client provided start_date
          parent_order_id: BigInt(0),
          payment_method: paymentMethod,
          payment_method_title: paymentMethodTitle,
          transaction_id: "",
          ip_address: request.headers.get("x-forwarded-for") || "127.0.0.1",
          user_agent: request.headers.get("user-agent") || "",
          customer_note: "",
        },
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
      await tx.wp_wc_order_operational_data.create({
        data: {
          order_id: order.id,
          created_via: "api",
          woocommerce_version: "9.7.1",
          prices_include_tax: false,
          coupon_usages_are_counted: true,
          download_permission_granted: true,
          cart_hash: "",
          new_order_email_sent: true,
          order_key: `wc_order_${Math.random().toString(36).substring(2, 15)}`,
          order_stock_reduced: true,
          shipping_tax_amount: 0,
          shipping_total_amount: 0,
          discount_tax_amount: 0,
          discount_total_amount: 0,
          recorded_sales: true,
        },
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
        await tx.wp_wc_order_product_lookup.create({
          data: {
            order_item_id: orderItem.order_item_id,
            order_id: order.id,
            product_id: BigInt(product.product_id),
            variation_id: BigInt(product.variationId || 0),
            customer_id: customer?.id ? BigInt(customer.id) : BigInt(0),
            date_created: new Date(),
            product_qty: product.quantity,
            product_net_revenue: product.price * product.quantity,
            product_gross_revenue: product.price * product.quantity,
            coupon_amount: 0,
            tax_amount: 0,
            shipping_amount: 0,
            shipping_tax_amount: 0,
          },
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
            await tx.wp_woocommerce_order_itemmeta.createMany({
              data: [
                {
                  order_item_id: bundledOrderItem.order_item_id,
                  meta_key: "_product_id",
                  meta_value: bundleItem.product_id.toString(),
                },
                {
                  order_item_id: bundledOrderItem.order_item_id,
                  meta_key: "_variation_id",
                  meta_value: "0",
                },
                {
                  order_item_id: bundledOrderItem.order_item_id,
                  meta_key: "_qty",
                  meta_value: bundleItem.quantity.toString(),
                },
                {
                  order_item_id: bundledOrderItem.order_item_id,
                  meta_key: "_tax_class",
                  meta_value: "",
                },
                {
                  order_item_id: bundledOrderItem.order_item_id,
                  meta_key: "_line_subtotal",
                  meta_value: "0",
                },
                {
                  order_item_id: bundledOrderItem.order_item_id,
                  meta_key: "_line_subtotal_tax",
                  meta_value: "0",
                },
                {
                  order_item_id: bundledOrderItem.order_item_id,
                  meta_key: "_line_total",
                  meta_value: "0",
                },
                {
                  order_item_id: bundledOrderItem.order_item_id,
                  meta_key: "_line_tax",
                  meta_value: "0",
                },
                {
                  order_item_id: bundledOrderItem.order_item_id,
                  meta_key: "_line_tax_data",
                  meta_value: 'a:2:{s:5:"total";a:0:{}s:8:"subtotal";a:0:{}}',
                },
                {
                  order_item_id: bundledOrderItem.order_item_id,
                  meta_key: "_bundled_by",
                  meta_value: bundleCartKey,
                },
                {
                  order_item_id: bundledOrderItem.order_item_id,
                  meta_key: "_bundled_item_id",
                  meta_value: (index + 1).toString(),
                },
                {
                  order_item_id: bundledOrderItem.order_item_id,
                  meta_key: "_bundled_item_priced_individually",
                  meta_value: "no",
                },
                {
                  order_item_id: bundledOrderItem.order_item_id,
                  meta_key: "_bundled_item_needs_shipping",
                  meta_value: "yes",
                },
              ],
            });

            // Add entry to wp_wc_order_product_lookup for bundled item
            await tx.wp_wc_order_product_lookup.create({
              data: {
                order_item_id: bundledOrderItem.order_item_id,
                order_id: order.id,
                product_id: BigInt(bundleItem.product_id),
                variation_id: BigInt(0),
                customer_id: customer?.id ? BigInt(customer.id) : BigInt(0),
                date_created: new Date(),
                product_qty: bundleItem.quantity,
                product_net_revenue: 0, // Bundled items typically have 0 net revenue
                product_gross_revenue: 0, // Bundled items typically have 0 gross revenue
                coupon_amount: 0,
                tax_amount: 0,
                shipping_amount: 0,
                shipping_tax_amount: 0,
              },
            });

            totalItemsCount += bundleItem.quantity;

            // Update stock for bundled item
            await tx.wp_wc_product_meta_lookup.upsert({
              where: {
                product_id: BigInt(bundleItem.product_id),
              },
              create: {
                product_id: BigInt(bundleItem.product_id),
                stock_quantity: -bundleItem.quantity,
                total_sales: bundleItem.quantity,
                min_price: 0,
                max_price: 0,
                rating_count: 0,
                average_rating: 0,
              },
              update: {
                stock_quantity: {
                  decrement: bundleItem.quantity,
                },
                total_sales: {
                  increment: bundleItem.quantity,
                },
              },
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

      // 5. Create order stats entry
      try {
        await tx.wp_wc_order_stats.create({
          data: {
            order_id: order.id,
            parent_id: BigInt(0),
            date_created: new Date(),
            date_created_gmt: new Date(),
            num_items_sold: totalItemsCount,
            total_sales: totalAmount,
            tax_total: 0,
            shipping_total: 0,
            net_total: totalAmount,
            returning_customer: false,
            status: status,
            customer_id: customer?.id ? BigInt(customer.id) : BigInt(0),
          },
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

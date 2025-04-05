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
  wp_wc_order_product_lookup: {
    create: Function;
  };
  wp_wc_order_stats: {
    create: Function;
  };
}

// Add interface for POST request body
interface OrderCreateBody {
  customer?: {
    id?: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
  };
  products: ProductItem[];
  status?: string;
  paymentMethod?: string;
  paymentMethodTitle?: string;
  start_date: string; // Add start_date field
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
        { status: 400 },
      );
    }

    if (!start_date) {
      return NextResponse.json(
        { error: "start_date is required" },
        { status: 400 },
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
              },
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

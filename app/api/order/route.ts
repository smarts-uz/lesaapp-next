import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PrismaClient } from '@prisma/client'

interface Order {
  id: bigint;
  date_created_gmt: Date;
  status: string;
  total_amount: number;
  first_name: string | null;
  last_name: string | null;
}

interface OrderItem {
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

export async function GET() {
  try {
    const orders = await prisma.$queryRaw<Order[]>`
      SELECT o.id, o.date_created_gmt, o.status, o.total_amount, oa.first_name, oa.last_name
      FROM wp_wc_orders o
      LEFT JOIN wp_wc_order_addresses oa ON o.id = oa.order_id AND oa.address_type = 'billing'
      ORDER BY o.date_created_gmt DESC
    `;

    const formattedOrders = orders.map((order: Order) => ({
      id: order.id.toString(),
      number: `#ORD-${order.id.toString().padStart(3, "0")}`,
      date: order.date_created_gmt?.toISOString() || new Date().toISOString(),
      customer:
        order.first_name || order.last_name
          ? `${order.first_name || ""} ${order.last_name || ""}`
          : "Unknown Customer",
      status: order.status || "pending",
      total: Number(order.total_amount) || 0,
    }));

    return NextResponse.json(formattedOrders);
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
      paymentMethodTitle = "Cash on delivery" 
    } = body;
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "Products are required" }, { status: 400 });
    }

    // Calculate total amount from products
    const totalAmount = products.reduce((total, product: OrderItem) => 
      total + (product.price * product.quantity), 0);

    // Create order using Prisma transaction
    const result = await prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => {
      // 1. Create the main order record
      const order = await tx.wp_wc_orders.create({
        data: {
          id: BigInt(Math.floor(Date.now() / 1000)), // Generate a timestamp-based ID
          status,
          currency: "UZS",
          type: "shop_order",
          tax_amount: 0,
          total_amount: totalAmount,
          customer_id: customer?.id ? BigInt(customer.id) : BigInt(0),
          billing_email: customer?.email || null,
          date_created_gmt: new Date(),
          date_updated_gmt: new Date(),
          parent_order_id: BigInt(0),
          payment_method: paymentMethod,
          payment_method_title: paymentMethodTitle,
          transaction_id: "",
          ip_address: request.headers.get("x-forwarded-for") || "127.0.0.1",
          user_agent: request.headers.get("user-agent") || "",
          customer_note: ""
        }
      });

      // 2. Create billing address if customer info is provided
      if (customer) {
        await tx.wp_wc_order_addresses.create({
          data: {
            order_id: order.id,
            address_type: "billing",
            first_name: customer.firstName || null,
            last_name: customer.lastName || null,
            phone: customer.phone || null,
            email: customer.email || null,
            address_1: customer.address || null,
            city: customer.city || null,
            country: customer.country || null,
          }
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
          recorded_sales: true
        }
      });

      // 4. Create order items and handle bundles
      for (const product of products) {
        const orderItem = await tx.wp_woocommerce_order_items.create({
          data: {
            order_item_name: product.name || `Product #${product.product_id}`,
            order_item_type: "line_item",
            order_id: order.id
          }
        });

        // Create base order item meta
        const baseItemMeta = [
          {
            order_item_id: orderItem.order_item_id,
            meta_key: "_product_id",
            meta_value: product.product_id.toString()
          },
          {
            order_item_id: orderItem.order_item_id,
            meta_key: "_variation_id",
            meta_value: (product.variationId || 0).toString()
          },
          {
            order_item_id: orderItem.order_item_id,
            meta_key: "_qty",
            meta_value: product.quantity.toString()
          },
          {
            order_item_id: orderItem.order_item_id,
            meta_key: "_tax_class",
            meta_value: ""
          },
          {
            order_item_id: orderItem.order_item_id,
            meta_key: "_line_subtotal",
            meta_value: (product.price * product.quantity).toString()
          },
          {
            order_item_id: orderItem.order_item_id,
            meta_key: "_line_subtotal_tax",
            meta_value: "0"
          },
          {
            order_item_id: orderItem.order_item_id,
            meta_key: "_line_total",
            meta_value: (product.price * product.quantity).toString()
          },
          {
            order_item_id: orderItem.order_item_id,
            meta_key: "_line_tax",
            meta_value: "0"
          },
          {
            order_item_id: orderItem.order_item_id,
            meta_key: "_line_tax_data",
            meta_value: "a:2:{s:5:\"total\";a:0:{}s:8:\"subtotal\";a:0:{}}"
          }
        ];

        // If this is a bundle product, add bundle-specific meta
        if (product.isBundle && product.bundleItems) {
          const bundleCartKey = Math.random().toString(36).substring(2, 15);
          const bundledItemsKeys = product.bundleItems.map(() => 
            Math.random().toString(36).substring(2, 15));

          // Add bundle meta
          baseItemMeta.push(
            {
              order_item_id: orderItem.order_item_id,
              meta_key: "_bundled_items",
              meta_value: JSON.stringify(bundledItemsKeys)
            },
            {
              order_item_id: orderItem.order_item_id,
              meta_key: "_bundle_group_mode",
              meta_value: "parent"
            },
            {
              order_item_id: orderItem.order_item_id,
              meta_key: "_bundle_cart_key",
              meta_value: bundleCartKey
            }
          );

          // Create bundled items
          for (const [index, bundleItem] of product.bundleItems.entries()) {
            const bundledOrderItem = await tx.wp_woocommerce_order_items.create({
              data: {
                order_item_name: `Product #${bundleItem.product_id}`,
                order_item_type: "line_item",
                order_id: order.id
              }
            });

            // Add bundled item meta
            await tx.wp_woocommerce_order_itemmeta.createMany({
              data: [
                {
                  order_item_id: bundledOrderItem.order_item_id,
                  meta_key: "_product_id",
                  meta_value: bundleItem.product_id.toString()
                },
                {
                  order_item_id: bundledOrderItem.order_item_id,
                  meta_key: "_variation_id",
                  meta_value: "0"
                },
                {
                  order_item_id: bundledOrderItem.order_item_id,
                  meta_key: "_qty",
                  meta_value: bundleItem.quantity.toString()
                },
                {
                  order_item_id: bundledOrderItem.order_item_id,
                  meta_key: "_tax_class",
                  meta_value: ""
                },
                {
                  order_item_id: bundledOrderItem.order_item_id,
                  meta_key: "_line_subtotal",
                  meta_value: "0"
                },
                {
                  order_item_id: bundledOrderItem.order_item_id,
                  meta_key: "_line_subtotal_tax",
                  meta_value: "0"
                },
                {
                  order_item_id: bundledOrderItem.order_item_id,
                  meta_key: "_line_total",
                  meta_value: "0"
                },
                {
                  order_item_id: bundledOrderItem.order_item_id,
                  meta_key: "_line_tax",
                  meta_value: "0"
                },
                {
                  order_item_id: bundledOrderItem.order_item_id,
                  meta_key: "_line_tax_data",
                  meta_value: "a:2:{s:5:\"total\";a:0:{}s:8:\"subtotal\";a:0:{}}"
                },
                {
                  order_item_id: bundledOrderItem.order_item_id,
                  meta_key: "_bundled_by",
                  meta_value: bundleCartKey
                },
                {
                  order_item_id: bundledOrderItem.order_item_id,
                  meta_key: "_bundled_item_id",
                  meta_value: (index + 1).toString()
                },
                {
                  order_item_id: bundledOrderItem.order_item_id,
                  meta_key: "_bundled_item_priced_individually",
                  meta_value: "no"
                },
                {
                  order_item_id: bundledOrderItem.order_item_id,
                  meta_key: "_bundled_item_needs_shipping",
                  meta_value: "yes"
                }
              ]
            });

            // Update stock for bundled item
            await tx.wp_wc_product_meta_lookup.upsert({
              where: { 
                product_id: BigInt(bundleItem.product_id) 
              },
              create: {
                product_id: BigInt(bundleItem.product_id),
                stock_quantity: -bundleItem.quantity,
                total_sales: bundleItem.quantity,
                min_price: 0,
                max_price: 0,
                rating_count: 0,
                average_rating: 0
              },
              update: {
                stock_quantity: {
                  decrement: bundleItem.quantity
                },
                total_sales: {
                  increment: bundleItem.quantity
                }
              }
            });
          }
        }

        // Create order item meta
        await tx.wp_woocommerce_order_itemmeta.createMany({
          data: baseItemMeta
        });

        // Update product stock if not a bundle
        if (!product.isBundle) {
          await tx.wp_wc_product_meta_lookup.upsert({
            where: { 
              product_id: BigInt(product.product_id) 
            },
            create: {
              product_id: BigInt(product.product_id),
              stock_quantity: -product.quantity,
              total_sales: product.quantity,
              min_price: product.price,
              max_price: product.price,
              rating_count: 0,
              average_rating: 0
            },
            update: {
              stock_quantity: {
                decrement: product.quantity
              },
              total_sales: {
                increment: product.quantity
              }
            }
          });
        }
      }

      return {
        id: order.id.toString(),
        number: `#ORD-${order.id.toString().padStart(3, "0")}`,
        date: order.date_created_gmt?.toISOString(),
        customer: customer ? `${customer.firstName || ""} ${customer.lastName || ""}` : "Guest",
        status: order.status,
        total: Number(order.total_amount) || 0
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


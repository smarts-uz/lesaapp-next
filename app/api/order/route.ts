import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const orders = await prisma.$queryRaw<
      Array<{
        id: bigint;
        date_created_gmt: Date;
        status: string;
        total_amount: number;
        first_name: string | null;
        last_name: string | null;
      }>
    >`
      SELECT o.id, o.date_created_gmt, o.status, o.total_amount, oa.first_name, oa.last_name
      FROM wp_wc_orders o
      LEFT JOIN wp_wc_order_addresses oa ON o.id = oa.order_id AND oa.address_type = 'billing'
      ORDER BY o.date_created_gmt DESC
    `;

    const formattedOrders = orders.map((order) => ({
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
    const totalAmount = products.reduce((total, product) => total + (product.price * product.quantity), 0);

    // Create order using Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
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

      // 4. Create order items
      for (const product of products) {
        const orderItem = await tx.wp_woocommerce_order_items.create({
          data: {
            order_item_name: product.name,
            order_item_type: "line_item",
            order_id: order.id
          }
        });

        // 5. Create order item meta
        await tx.wp_woocommerce_order_itemmeta.createMany({
          data: [
            {
              order_item_id: orderItem.order_item_id,
              meta_key: "_product_id",
              meta_value: product.id.toString()
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
          ]
        });

        // 6. Update product stock if needed
        if (product.updateStock) {
          await tx.wp_wc_product_meta_lookup.update({
            where: { product_id: BigInt(product.id) },
            data: {
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

      // 7. Add basic order meta
      await tx.wp_wc_orders_meta.createMany({
        data: [
          {
            order_id: order.id,
            meta_key: "is_vat_exempt",
            meta_value: "no"
          },
          {
            order_id: order.id,
            meta_key: "_billing_address_index",
            meta_value: customer ? `${customer.firstName || ""} ${customer.lastName || ""} ${customer.phone || ""}` : ""
          }
        ]
      });

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


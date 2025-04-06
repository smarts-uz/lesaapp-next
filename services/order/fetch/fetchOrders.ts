import { prisma } from "@/lib/prisma";

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

export interface FormattedOrder {
  id: string;
  number: string;
  date: string;
  status: string;
  total: number;
  customer: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
  };
  payment: {
    method: string | null;
    methodTitle: string | null;
  };
  items: {
    id: number;
    name: string;
    product_id: string;
    variation_id: string;
    quantity: number;
    subtotal: number;
    total: number;
  }[];
}

export async function fetchOrders(): Promise<FormattedOrder[]> {
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

    return formattedOrders;
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    throw new Error("Failed to fetch orders");
  }
} 
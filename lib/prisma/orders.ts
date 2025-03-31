import { prisma } from "./index";
import { Prisma } from "@prisma/client";

export interface Order {
  id: string;
  number: string;
  date: string;
  customer: string;
  status: string;
  total: number;
  refunds?: Refund[];
}

export interface Refund {
  id: string;
  date: string;
  amount: number;
  reason: string;
  payment_method: string;
  transaction_id: string;
  status: string;
  created_by: string;
  restock_items: boolean;
  items: any[];
  order_id: string;
}

export async function getOrders() {
  const orders = await prisma.$queryRaw`
    SELECT o.*, oa.first_name, oa.last_name
    FROM wp_wc_orders o
    LEFT JOIN wp_wc_order_addresses oa ON o.id = oa.order_id AND oa.address_type = 'billing'
    ORDER BY o.date_created_gmt DESC
  `;

  return (orders as any[]).map((order) => ({
    id: order.id.toString(),
    number: `#ORD-${order.id.toString().padStart(3, "0")}`,
    date: order.date_created_gmt?.toISOString() || new Date().toISOString(),
    customer: order.first_name || order.last_name
      ? `${order.first_name || ""} ${order.last_name || ""}`
      : "Unknown Customer",
    status: order.status || "pending",
    total: Number(order.total_amount) || 0,
  }));
} 
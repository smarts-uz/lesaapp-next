import { prisma } from "./prisma";

export interface Order {
  id: string;
  number: string;
  date: Date;
  customer: string;
  status: string;
  total: number;
  refunds?: Refund[];
}

export interface Refund {
  id: string;
  date: Date;
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
  const orders = await prisma.wp_wc_orders.findMany({
    include: {
      orderStats: true,
      orderAddresses: {
        where: {
          address_type: "billing",
        },
      },
    },
    orderBy: {
      date_created_gmt: "desc",
    },
  });

  return orders.map((order) => ({
    id: order.id.toString(),
    number: `#ORD-${order.id.toString().padStart(3, "0")}`,
    date: order.date_created_gmt || new Date(),
    customer: order.orderAddresses[0] 
      ? `${order.orderAddresses[0].first_name} ${order.orderAddresses[0].last_name}`
      : "Unknown Customer",
    status: order.status || "pending",
    total: Number(order.total_amount) || 0,
  }));
} 
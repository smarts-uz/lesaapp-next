import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const orders = await prisma.$queryRaw<Array<{
      id: bigint;
      date_created_gmt: Date;
      status: string;
      total_amount: number;
      first_name: string | null;
      last_name: string | null;
    }>>`
      SELECT o.id, o.date_created_gmt, o.status, o.total_amount, oa.first_name, oa.last_name
      FROM wp_wc_orders o
      LEFT JOIN wp_wc_order_addresses oa ON o.id = oa.order_id AND oa.address_type = 'billing'
      ORDER BY o.date_created_gmt DESC
    `;

    const formattedOrders = orders.map((order) => ({
      id: order.id.toString(),
      number: `#ORD-${order.id.toString().padStart(3, "0")}`,
      date: order.date_created_gmt?.toISOString() || new Date().toISOString(),
      customer: order.first_name || order.last_name
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
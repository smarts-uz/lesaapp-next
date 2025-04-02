import { Button } from "@/components/ui/button";
import { OrdersTable } from "@/components/dashboard/orders-table";
import { Plus, FileDown } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function OrdersPage() {
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

  return (
    <div className="flex flex-col ">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <FileDown className="mr-2 h-3 w-3" />
            Export
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/orders/new">
              <Plus className="mr-2 h-3 w-3" />
              New Order
            </Link>
          </Button>
        </div>
      </div>
      <OrdersTable initialOrders={formattedOrders} />
    </div>
  );
}

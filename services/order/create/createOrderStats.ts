interface TransactionClient {
  wp_wc_order_stats: {
    create: Function;
  };
}

interface OrderStats {
  orderId: bigint;
  totalItemsCount: number;
  totalAmount: number;
  status: string;
  customerId?: number;
}

export async function createOrderStats({
  tx,
  orderId,
  totalItemsCount,
  totalAmount,
  status,
  customerId = 0,
}: {
  tx: TransactionClient;
  orderId: bigint;
  totalItemsCount: number;
  totalAmount: number;
  status: string;
  customerId?: number;
}) {
  return await tx.wp_wc_order_stats.create({
    data: {
      order_id: orderId,
      parent_id: BigInt(0),
      date_created: new Date(),
      date_created_gmt: new Date(),
      date_paid: status === 'completed' ? new Date() : null,
      date_completed: status === 'completed' ? new Date() : null,
      num_items_sold: totalItemsCount,
      total_sales: totalAmount,
      tax_total: 0,
      shipping_total: 0,
      net_total: totalAmount,
      returning_customer: false,
      status: status,
      customer_id: customerId ? BigInt(customerId) : BigInt(0),
    },
  });
} 
interface TransactionClient {
  wp_wc_orders: {
    update: Function;
  };
}

interface UpdateOrderStatusParams {
  tx: TransactionClient;
  orderId: number | string;
  status: string;
}

/**
 * Updates an order's status and timestamp
 */
export async function updateOrderStatus({
  tx,
  orderId,
  status,
}: UpdateOrderStatusParams) {
  return await tx.wp_wc_orders.update({
    where: {
      id: BigInt(orderId),
    },
    data: {
      status,
      date_updated_gmt: new Date(),
    },
  });
} 
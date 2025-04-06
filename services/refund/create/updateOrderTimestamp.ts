interface TransactionClient {
  wp_wc_orders: {
    update: Function;
  };
}

interface UpdateOrderTimestampParams {
  tx: TransactionClient;
  orderId: number | string;
}

/**
 * Updates an order's timestamp without changing status
 */
export async function updateOrderTimestamp({
  tx,
  orderId,
}: UpdateOrderTimestampParams) {
  return await tx.wp_wc_orders.update({
    where: {
      id: BigInt(orderId),
    },
    data: {
      date_updated_gmt: new Date(),
    },
  });
} 
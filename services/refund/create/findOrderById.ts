interface TransactionClient {
  wp_wc_orders: {
    findUnique: Function;
  };
}

type OrderSelect = {
  [key: string]: boolean;
};

/**
 * Finds an order by ID within a transaction
 */
export async function findOrderById<T = any>({
  tx,
  orderId,
  select,
  throwIfNotFound = true,
}: {
  tx: TransactionClient;
  orderId: number | string;
  select?: OrderSelect;
  throwIfNotFound?: boolean;
}): Promise<T | null> {
  const order = await tx.wp_wc_orders.findUnique({
    where: {
      id: BigInt(orderId),
    },
    select,
  });

  if (!order && throwIfNotFound) {
    throw new Error(`Order with ID ${orderId} not found`);
  }

  return order;
} 
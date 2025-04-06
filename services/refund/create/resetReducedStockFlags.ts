interface TransactionClient {
  wp_woocommerce_order_itemmeta: {
    updateMany: Function;
  };
}

interface ResetReducedStockFlagsParams {
  tx: TransactionClient;
  itemId: number;
}

/**
 * Resets the reduced stock flags for an order item
 */
export async function resetReducedStockFlags({
  tx,
  itemId,
}: ResetReducedStockFlagsParams) {
  return await tx.wp_woocommerce_order_itemmeta.updateMany({
    where: {
      order_item_id: BigInt(itemId),
      meta_key: "_reduced_stock",
    },
    data: {
      meta_value: "0",
    },
  });
} 
interface TransactionClient {
  wp_woocommerce_order_items: {
    create: Function;
  };
}

interface ProductItem {
  product_id: number;
  name?: string;
}

export async function createOrderItem({
  tx,
  orderId,
  product,
}: {
  tx: TransactionClient;
  orderId: bigint;
  product: ProductItem;
}) {
  return await tx.wp_woocommerce_order_items.create({
    data: {
      order_item_name: product.name || `Product #${product.product_id}`,
      order_item_type: "line_item",
      order_id: orderId,
    },
  });
} 
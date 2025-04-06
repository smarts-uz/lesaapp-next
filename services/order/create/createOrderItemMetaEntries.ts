import { generateOrderItemMeta } from './createOrderItemMeta';

interface TransactionClient {
  wp_woocommerce_order_itemmeta: {
    createMany: Function;
  };
}

interface ProductItem {
  product_id: number;
  quantity: number;
  price: number;
  name?: string;
  variationId?: number;
  isBundle?: boolean;
  bundleItems?: Array<{
    product_id: number;
    quantity: number;
  }>;
}

/**
 * Creates meta data entries for an order item
 */
export async function createOrderItemMetaEntries({
  tx,
  orderItemId,
  product,
  metaData,
}: {
  tx: TransactionClient;
  orderItemId: bigint;
  product: ProductItem;
  metaData?: any[];
}) {
  return await tx.wp_woocommerce_order_itemmeta.createMany({
    data: metaData || generateOrderItemMeta({
      orderItemId: Number(orderItemId),
      product,
    }),
  });
} 
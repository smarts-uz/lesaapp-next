import { generateBundledItemMeta } from "./createOrderItemMeta";

interface TransactionClient {
  wp_woocommerce_order_itemmeta: {
    createMany: Function;
  };
}

interface BundleItem {
  product_id: number;
  quantity: number;
}

/**
 * Creates meta data entries for a bundled item
 */
export async function createBundledItemMeta({
  tx,
  orderItemId,
  bundleItem,
  bundleCartKey,
  itemIndex,
}: {
  tx: TransactionClient;
  orderItemId: bigint;
  bundleItem: BundleItem;
  bundleCartKey: string;
  itemIndex: number;
}) {
  return await tx.wp_woocommerce_order_itemmeta.createMany({
    data: generateBundledItemMeta({
      orderItemId: Number(orderItemId),
      bundleItem,
      bundleCartKey,
      itemIndex,
    }),
  });
}

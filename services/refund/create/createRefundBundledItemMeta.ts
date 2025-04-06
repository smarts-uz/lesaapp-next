interface TransactionClient {
  wp_woocommerce_order_itemmeta: {
    createMany: Function;
  };
}

interface BundledItem {
  itemId: number;
  productId: number;
}

/**
 * Creates metadata for a bundled item in a refund
 */
export async function createRefundBundledItemMeta({
  tx,
  refundBundledItemId,
  bundledItem,
  negativeBundledQty,
  parentItemId,
}: {
  tx: TransactionClient;
  refundBundledItemId: bigint;
  bundledItem: BundledItem;
  negativeBundledQty: number;
  parentItemId: bigint;
}) {
  return await tx.wp_woocommerce_order_itemmeta.createMany({
    data: [
      {
        order_item_id: refundBundledItemId,
        meta_key: "_product_id",
        meta_value: bundledItem.productId.toString(),
      },
      {
        order_item_id: refundBundledItemId,
        meta_key: "_variation_id",
        meta_value: "0",
      },
      {
        order_item_id: refundBundledItemId,
        meta_key: "_qty",
        meta_value: negativeBundledQty.toString(),
      },
      {
        order_item_id: refundBundledItemId,
        meta_key: "_tax_class",
        meta_value: "",
      },
      {
        order_item_id: refundBundledItemId,
        meta_key: "_line_subtotal",
        meta_value: "0",
      },
      {
        order_item_id: refundBundledItemId,
        meta_key: "_line_subtotal_tax",
        meta_value: "0",
      },
      {
        order_item_id: refundBundledItemId,
        meta_key: "_line_total",
        meta_value: "0",
      },
      {
        order_item_id: refundBundledItemId,
        meta_key: "_line_tax",
        meta_value: "0",
      },
      {
        order_item_id: refundBundledItemId,
        meta_key: "_line_tax_data",
        meta_value: 'a:2:{s:5:"total";a:0:{}s:8:"subtotal";a:0:{}}',
      },
      {
        order_item_id: refundBundledItemId,
        meta_key: "_refunded_item_id",
        meta_value: bundledItem.itemId.toString(),
      },
      {
        order_item_id: refundBundledItemId,
        meta_key: "_bundled_by",
        meta_value: parentItemId.toString(),
      },
    ],
  });
} 
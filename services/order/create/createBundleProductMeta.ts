export function generateBundleProductMeta({
  orderItemId,
  bundleCartKey,
  bundledItemsKeys,
}: {
  orderItemId: number;
  bundleCartKey: string;
  bundledItemsKeys: string[];
}) {
  return [
    {
      order_item_id: orderItemId,
      meta_key: "_bundled_items",
      meta_value: JSON.stringify(bundledItemsKeys),
    },
    {
      order_item_id: orderItemId,
      meta_key: "_bundle_group_mode",
      meta_value: "parent",
    },
    {
      order_item_id: orderItemId,
      meta_key: "_bundle_cart_key",
      meta_value: bundleCartKey,
    },
  ];
} 
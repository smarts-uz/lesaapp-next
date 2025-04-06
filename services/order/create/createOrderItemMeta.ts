interface ProductItem {
  product_id: number;
  quantity: number;
  price: number;
  variationId?: number;
}

interface BundleItem {
  product_id: number;
  quantity: number;
}

export function generateOrderItemMeta({
  orderItemId,
  product,
}: {
  orderItemId: number;
  product: ProductItem;
}) {
  return [
    {
      order_item_id: orderItemId,
      meta_key: "_product_id",
      meta_value: product.product_id.toString(),
    },
    {
      order_item_id: orderItemId,
      meta_key: "_variation_id",
      meta_value: (product.variationId || 0).toString(),
    },
    {
      order_item_id: orderItemId,
      meta_key: "_qty",
      meta_value: product.quantity.toString(),
    },
    {
      order_item_id: orderItemId,
      meta_key: "_tax_class",
      meta_value: "",
    },
    {
      order_item_id: orderItemId,
      meta_key: "_line_subtotal",
      meta_value: (product.price * product.quantity).toString(),
    },
    {
      order_item_id: orderItemId,
      meta_key: "_line_subtotal_tax",
      meta_value: "0",
    },
    {
      order_item_id: orderItemId,
      meta_key: "_line_total",
      meta_value: (product.price * product.quantity).toString(),
    },
    {
      order_item_id: orderItemId,
      meta_key: "_line_tax",
      meta_value: "0",
    },
    {
      order_item_id: orderItemId,
      meta_key: "_line_tax_data",
      meta_value: 'a:2:{s:5:"total";a:0:{}s:8:"subtotal";a:0:{}}',
    },
  ];
}

export function generateBundledItemMeta({
  orderItemId,
  bundleItem,
  bundleCartKey,
  itemIndex,
}: {
  orderItemId: number;
  bundleItem: BundleItem;
  bundleCartKey: string;
  itemIndex: number;
}) {
  return [
    {
      order_item_id: orderItemId,
      meta_key: "_product_id",
      meta_value: bundleItem.product_id.toString(),
    },
    {
      order_item_id: orderItemId,
      meta_key: "_variation_id",
      meta_value: "0",
    },
    {
      order_item_id: orderItemId,
      meta_key: "_qty",
      meta_value: bundleItem.quantity.toString(),
    },
    {
      order_item_id: orderItemId,
      meta_key: "_tax_class",
      meta_value: "",
    },
    {
      order_item_id: orderItemId,
      meta_key: "_line_subtotal",
      meta_value: "0",
    },
    {
      order_item_id: orderItemId,
      meta_key: "_line_subtotal_tax",
      meta_value: "0",
    },
    {
      order_item_id: orderItemId,
      meta_key: "_line_total",
      meta_value: "0",
    },
    {
      order_item_id: orderItemId,
      meta_key: "_line_tax",
      meta_value: "0",
    },
    {
      order_item_id: orderItemId,
      meta_key: "_line_tax_data",
      meta_value: 'a:2:{s:5:"total";a:0:{}s:8:"subtotal";a:0:{}}',
    },
    {
      order_item_id: orderItemId,
      meta_key: "_bundled_by",
      meta_value: bundleCartKey,
    },
    {
      order_item_id: orderItemId,
      meta_key: "_bundled_item_id",
      meta_value: (itemIndex + 1).toString(),
    },
    {
      order_item_id: orderItemId,
      meta_key: "_bundled_item_priced_individually",
      meta_value: "no",
    },
    {
      order_item_id: orderItemId,
      meta_key: "_bundled_item_needs_shipping",
      meta_value: "yes",
    },
  ];
}

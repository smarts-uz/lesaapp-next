interface ProductItem {
  product_id: number;
  quantity: number;
  price: number;
  variationId?: number;
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
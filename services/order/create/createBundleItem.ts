interface TransactionClient {
  wp_woocommerce_order_items: {
    create: Function;
  };
  wp_woocommerce_order_itemmeta: {
    createMany: Function;
  };
  wp_wc_product_meta_lookup: {
    upsert: Function;
  };
}

interface BundleItem {
  product_id: number;
  quantity: number;
}

export async function createBundleItem({
  tx,
  orderId,
  bundleItem,
  index,
  bundleCartKey,
}: {
  tx: TransactionClient;
  orderId: bigint;
  bundleItem: BundleItem;
  index: number;
  bundleCartKey: string;
}) {
  // Create bundled order item
  const bundledOrderItem = await tx.wp_woocommerce_order_items.create({
    data: {
      order_item_name: `Product #${bundleItem.product_id}`,
      order_item_type: "line_item",
      order_id: orderId,
    },
  });

  // Add bundled item meta
  await tx.wp_woocommerce_order_itemmeta.createMany({
    data: [
      {
        order_item_id: bundledOrderItem.order_item_id,
        meta_key: "_product_id",
        meta_value: bundleItem.product_id.toString(),
      },
      {
        order_item_id: bundledOrderItem.order_item_id,
        meta_key: "_variation_id",
        meta_value: "0",
      },
      {
        order_item_id: bundledOrderItem.order_item_id,
        meta_key: "_qty",
        meta_value: bundleItem.quantity.toString(),
      },
      {
        order_item_id: bundledOrderItem.order_item_id,
        meta_key: "_tax_class",
        meta_value: "",
      },
      {
        order_item_id: bundledOrderItem.order_item_id,
        meta_key: "_line_subtotal",
        meta_value: "0",
      },
      {
        order_item_id: bundledOrderItem.order_item_id,
        meta_key: "_line_subtotal_tax",
        meta_value: "0",
      },
      {
        order_item_id: bundledOrderItem.order_item_id,
        meta_key: "_line_total",
        meta_value: "0",
      },
      {
        order_item_id: bundledOrderItem.order_item_id,
        meta_key: "_line_tax",
        meta_value: "0",
      },
      {
        order_item_id: bundledOrderItem.order_item_id,
        meta_key: "_line_tax_data",
        meta_value: 'a:2:{s:5:"total";a:0:{}s:8:"subtotal";a:0:{}}',
      },
      {
        order_item_id: bundledOrderItem.order_item_id,
        meta_key: "_bundled_by",
        meta_value: bundleCartKey,
      },
      {
        order_item_id: bundledOrderItem.order_item_id,
        meta_key: "_bundled_item_id",
        meta_value: (index + 1).toString(),
      },
      {
        order_item_id: bundledOrderItem.order_item_id,
        meta_key: "_bundled_item_priced_individually",
        meta_value: "no",
      },
      {
        order_item_id: bundledOrderItem.order_item_id,
        meta_key: "_bundled_item_needs_shipping",
        meta_value: "yes",
      },
    ],
  });

  // Update stock for bundled item
  await tx.wp_wc_product_meta_lookup.upsert({
    where: {
      product_id: BigInt(bundleItem.product_id),
    },
    create: {
      product_id: BigInt(bundleItem.product_id),
      stock_quantity: -bundleItem.quantity,
      total_sales: bundleItem.quantity,
      min_price: 0,
      max_price: 0,
      rating_count: 0,
      average_rating: 0,
    },
    update: {
      stock_quantity: {
        decrement: bundleItem.quantity,
      },
      total_sales: {
        increment: bundleItem.quantity,
      },
    },
  });

  return bundledOrderItem;
} 
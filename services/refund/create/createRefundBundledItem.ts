interface TransactionClient {
  wp_posts: {
    findUnique: Function;
  };
  wp_woocommerce_order_items: {
    create: Function;
  };
  wp_woocommerce_order_itemmeta: {
    createMany: Function;
    create: Function;
  };
  wp_wc_order_product_lookup: {
    create: Function;
  };
}

interface BundledItem {
  itemId: number;
  productId: number;
  quantity: number;
}

interface OriginalOrder {
  customer_id?: bigint;
  used_days?: number;
}

/**
 * Creates a refund bundled item with all related records
 */
export async function createRefundBundledItem({
  tx,
  refundOrderId,
  bundledItem,
  originalOrder,
  parentItemId,
}: {
  tx: TransactionClient;
  refundOrderId: bigint;
  bundledItem: BundledItem;
  originalOrder: OriginalOrder;
  parentItemId: bigint;
}) {
  // Get bundled product info
  const bundledProductResult = await tx.wp_posts.findUnique({
    where: { ID: BigInt(bundledItem.productId) },
    select: { post_title: true },
  });

  const bundledProductName = bundledProductResult
    ? bundledProductResult.post_title
    : `Product #${bundledItem.productId}`;

  // Create refund line item for bundled item
  const refundBundledItem = await tx.wp_woocommerce_order_items.create({
    data: {
      order_item_name: bundledProductName,
      order_item_type: "line_item",
      order_id: refundOrderId,
    },
  });

  // For bundled items in refunds, qty should be NEGATIVE
  const negativeBundledQty = -Math.abs(bundledItem.quantity);

  // Create metadata for bundled item
  await tx.wp_woocommerce_order_itemmeta.createMany({
    data: [
      {
        order_item_id: refundBundledItem.order_item_id,
        meta_key: "_product_id",
        meta_value: bundledItem.productId.toString(),
      },
      {
        order_item_id: refundBundledItem.order_item_id,
        meta_key: "_variation_id",
        meta_value: "0",
      },
      {
        order_item_id: refundBundledItem.order_item_id,
        meta_key: "_qty",
        meta_value: negativeBundledQty.toString(),
      },
      {
        order_item_id: refundBundledItem.order_item_id,
        meta_key: "_tax_class",
        meta_value: "",
      },
      {
        order_item_id: refundBundledItem.order_item_id,
        meta_key: "_line_subtotal",
        meta_value: "0",
      },
      {
        order_item_id: refundBundledItem.order_item_id,
        meta_key: "_line_subtotal_tax",
        meta_value: "0",
      },
      {
        order_item_id: refundBundledItem.order_item_id,
        meta_key: "_line_total",
        meta_value: "0",
      },
      {
        order_item_id: refundBundledItem.order_item_id,
        meta_key: "_line_tax",
        meta_value: "0",
      },
      {
        order_item_id: refundBundledItem.order_item_id,
        meta_key: "_line_tax_data",
        meta_value: 'a:2:{s:5:"total";a:0:{}s:8:"subtotal";a:0:{}}',
      },
      {
        order_item_id: refundBundledItem.order_item_id,
        meta_key: "_refunded_item_id",
        meta_value: bundledItem.itemId.toString(),
      },
      {
        order_item_id: refundBundledItem.order_item_id,
        meta_key: "_bundled_by",
        meta_value: parentItemId.toString(),
      },
    ],
  });

  // Add entry to wp_wc_order_product_lookup for bundled item
  await tx.wp_wc_order_product_lookup.create({
    data: {
      order_item_id: refundBundledItem.order_item_id,
      order_id: refundOrderId,
      product_id: BigInt(bundledItem.productId),
      variation_id: BigInt(0),
      customer_id: originalOrder.customer_id || BigInt(0),
      date_created: new Date(),
      product_qty: negativeBundledQty,
      product_net_revenue: Number(0),
      product_gross_revenue: Number(0),
      coupon_amount: Number(0),
      tax_amount: Number(0),
      shipping_amount: Number(0),
      shipping_tax_amount: Number(0),
      used_days: originalOrder.used_days,
      rental_price: BigInt(0),
    },
  });

  // Mark original bundled item as restocked
  await tx.wp_woocommerce_order_itemmeta.create({
    data: {
      order_item_id: BigInt(bundledItem.itemId),
      meta_key: "_restock_refunded_items",
      meta_value: bundledItem.quantity.toString(), // Positive for restocking
    },
  });

  return {
    refundBundledItem,
    bundledProductName,
    id: Number(refundBundledItem.order_item_id),
    description: `${bundledProductName} (x${bundledItem.quantity})`,
    productId: bundledItem.productId,
    quantity: bundledItem.quantity
  };
} 
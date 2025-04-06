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

interface RefundItem {
  itemId: number;
  productId: number;
  quantity: number;
  amount: number;
}

interface OriginalOrder {
  customer_id?: bigint;
  used_days?: number;
  currency?: string;
}

/**
 * Creates a refund order item
 */
export async function createRefundOrderItem({
  tx,
  refundOrderId,
  item,
  originalOrder,
  discountDays,
}: {
  tx: TransactionClient;
  refundOrderId: bigint;
  item: RefundItem;
  originalOrder: OriginalOrder;
  discountDays: number;
}) {
  // Get product info
  const productResult = await tx.wp_posts.findUnique({
    where: { ID: BigInt(item.productId) },
    select: { post_title: true },
  });

  const productName = productResult
    ? productResult.post_title
    : `Product #${item.productId}`;

  // Create refund line item
  const refundItem = await tx.wp_woocommerce_order_items.create({
    data: {
      order_item_name: productName,
      order_item_type: "line_item",
      order_id: refundOrderId,
    },
  });

  // For the refund item, qty and amount should be NEGATIVE
  const negativeQty = -Math.abs(item.quantity);
  const negativeAmount = -Math.abs(item.amount);

  // Create item meta for the refund item
  await tx.wp_woocommerce_order_itemmeta.createMany({
    data: [
      {
        order_item_id: refundItem.order_item_id,
        meta_key: "_product_id",
        meta_value: item.productId.toString(),
      },
      {
        order_item_id: refundItem.order_item_id,
        meta_key: "_variation_id",
        meta_value: "0",
      },
      {
        order_item_id: refundItem.order_item_id,
        meta_key: "_qty",
        meta_value: negativeQty.toString(),
      },
      {
        order_item_id: refundItem.order_item_id,
        meta_key: "_tax_class",
        meta_value: "",
      },
      {
        order_item_id: refundItem.order_item_id,
        meta_key: "_line_subtotal",
        meta_value: negativeAmount.toString(),
      },
      {
        order_item_id: refundItem.order_item_id,
        meta_key: "_line_subtotal_tax",
        meta_value: "0",
      },
      {
        order_item_id: refundItem.order_item_id,
        meta_key: "_line_total",
        meta_value: negativeAmount.toString(),
      },
      {
        order_item_id: refundItem.order_item_id,
        meta_key: "_line_tax",
        meta_value: "0",
      },
      {
        order_item_id: refundItem.order_item_id,
        meta_key: "_line_tax_data",
        meta_value: 'a:2:{s:5:"total";a:0:{}s:8:"subtotal";a:0:{}}',
      },
      {
        order_item_id: refundItem.order_item_id,
        meta_key: "_refunded_item_id",
        meta_value: item.itemId.toString(),
      },
    ],
  });

  // Add entry to wp_wc_order_product_lookup for the refund
  await tx.wp_wc_order_product_lookup.create({
    data: {
      order_item_id: refundItem.order_item_id,
      order_id: refundOrderId,
      product_id: BigInt(item.productId),
      variation_id: BigInt(0),
      customer_id: originalOrder.customer_id || BigInt(0),
      date_created: new Date(),
      product_qty: negativeQty,
      product_net_revenue: Number(negativeAmount),
      product_gross_revenue: Number(negativeAmount),
      coupon_amount: Number(0),
      tax_amount: Number(0),
      shipping_amount: Number(0),
      shipping_tax_amount: Number(0),
      used_days: originalOrder.used_days,
      rental_price: BigInt(
        Math.round(
          Math.abs(negativeAmount) *
            Math.max(0, (originalOrder.used_days || 0) - discountDays)
        )
      ),
    },
  });

  // Mark original item as restocked
  await tx.wp_woocommerce_order_itemmeta.create({
    data: {
      order_item_id: BigInt(item.itemId),
      meta_key: "_restock_refunded_items",
      meta_value: item.quantity.toString(), // Positive for restocking
    },
  });

  return {
    refundItem,
    productName,
    negativeQty,
    negativeAmount,
    itemDescription: `${productName} (${item.amount} ${originalOrder.currency})`,
  };
} 
interface TransactionClient {
  wp_wc_order_stats: {
    create: Function;
    updateMany: Function;
  };
}

interface RefundItem {
  quantity: number;
}

/**
 * Creates order stats for a refund
 */
export async function createRefundOrderStats({
  tx,
  refundOrderId,
  orderId,
  items,
  totalRefundAmount,
  customerId,
  refundType,
}: {
  tx: TransactionClient;
  refundOrderId: bigint;
  orderId: number | string;
  items: RefundItem[];
  totalRefundAmount: number;
  customerId: bigint;
  refundType?: "partial" | "full";
}) {
  try {
    // Create negative stats entry for the refund
    await tx.wp_wc_order_stats.create({
      data: {
        order_id: refundOrderId,
        parent_id: BigInt(orderId),
        date_created: new Date(),
        date_created_gmt: new Date(),
        num_items_sold: -items.reduce(
          (total, item) => total + item.quantity,
          0
        ),
        total_sales: -totalRefundAmount,
        tax_total: 0,
        shipping_total: 0,
        net_total: -totalRefundAmount,
        returning_customer: null,
        status: "wc-completed",
        customer_id: customerId || BigInt(0),
      },
    });

    // Update original order stats only for full refunds
    if (refundType === "full") {
      await tx.wp_wc_order_stats.updateMany({
        where: { order_id: BigInt(orderId) },
        data: { status: "wc-refunded" },
      });
    }

    return true;
  } catch (error) {
    console.warn("Order stats update failed, continuing with refund process");
    return false;
  }
} 
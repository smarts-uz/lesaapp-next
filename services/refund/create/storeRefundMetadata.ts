interface TransactionClient {
  wp_wc_orders_meta: {
    createMany: Function;
  };
}

/**
 * Stores refund metadata
 */
export async function storeRefundMetadata({
  tx,
  refundOrderId,
  totalRefundAmount,
  refundPayment,
  reason,
  refundType,
}: {
  tx: TransactionClient;
  refundOrderId: bigint;
  totalRefundAmount: number;
  refundPayment?: boolean;
  reason?: string;
  refundType?: string;
}) {
  return await tx.wp_wc_orders_meta.createMany({
    data: [
      {
        order_id: refundOrderId,
        meta_key: "_refund_amount",
        meta_value: totalRefundAmount.toString(),
      },
      {
        order_id: refundOrderId,
        meta_key: "_refunded_by",
        meta_value: "1", // Assuming admin user ID 1
      },
      {
        order_id: refundOrderId,
        meta_key: "_refunded_payment",
        meta_value: refundPayment ? "1" : "",
      },
      {
        order_id: refundOrderId,
        meta_key: "_refund_reason",
        meta_value: reason || "",
      },
      {
        order_id: refundOrderId,
        meta_key: "_refund_type",
        meta_value: refundType || "partial",
      },
    ],
  });
} 
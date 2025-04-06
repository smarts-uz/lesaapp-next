interface TransactionClient {
  wp_wc_orders: {
    create: Function;
  };
}

interface OriginalOrder {
  id: bigint;
  currency?: string;
  customer_id?: bigint;
  start_date?: Date;
  status?: string;
}

/**
 * Creates a refund order record
 */
export async function createRefundOrder({
  tx,
  refundOrderId,
  originalOrder,
  totalRefundAmount,
  endDateTime,
  usedDays,
  rentalPrice,
  reason,
}: {
  tx: TransactionClient;
  refundOrderId: bigint;
  originalOrder: OriginalOrder;
  totalRefundAmount: number;
  endDateTime: Date;
  usedDays: number;
  rentalPrice: number;
  reason?: string;
}) {
  return await tx.wp_wc_orders.create({
    data: {
      id: refundOrderId,
      status: "wc-completed",
      currency: originalOrder.currency || "UZS",
      type: "shop_order_refund",
      tax_amount: 0,
      total_amount: -totalRefundAmount,
      customer_id: originalOrder.customer_id,
      billing_email: null,
      date_created_gmt: new Date(),
      date_updated_gmt: new Date(),
      parent_order_id: originalOrder.id,
      payment_method: null,
      payment_method_title: null,
      transaction_id: null,
      ip_address: null,
      user_agent: null,
      customer_note: reason || null,
      start_date: originalOrder.start_date,
      end_date: endDateTime,
      used_days: usedDays,
      rental_price: BigInt(Math.round(rentalPrice)),
    },
  });
} 
interface TransactionClient {
  wp_wc_orders: {
    update: Function;
  };
}

/**
 * Updates an order with rental calculations
 */
export async function updateOrderWithRentalCalculations({
  tx,
  orderId,
  endDateTime,
  usedDays,
  rentalPrice,
  reason,
  refundType,
}: {
  tx: TransactionClient;
  orderId: number | string;
  endDateTime: Date;
  usedDays: number;
  rentalPrice: number;
  reason?: string;
  refundType?: "partial" | "full";
}) {
  return await tx.wp_wc_orders.update({
    where: {
      id: BigInt(orderId),
    },
    data: {
      end_date: endDateTime,
      used_days: usedDays,
      rental_price: BigInt(Math.round(rentalPrice)),
      date_updated_gmt: new Date(),
      customer_note: reason || null,
      ...(refundType === "full" ? { status: "wc-refunded" } : {}),
    },
  });
} 
interface TransactionClient {
  wp_wc_order_operational_data: {
    create: Function;
  };
}

export async function createOperationalData({
  tx,
  orderId,
}: {
  tx: TransactionClient;
  orderId: bigint;
}) {
  return await tx.wp_wc_order_operational_data.create({
    data: {
      order_id: orderId,
      created_via: "api",
      woocommerce_version: "9.7.1",
      prices_include_tax: false,
      coupon_usages_are_counted: true,
      download_permission_granted: true,
      cart_hash: "",
      new_order_email_sent: true,
      order_key: `wc_order_${Math.random().toString(36).substring(2, 15)}`,
      order_stock_reduced: true,
      shipping_tax_amount: 0,
      shipping_total_amount: 0,
      discount_tax_amount: 0,
      discount_total_amount: 0,
      recorded_sales: true,
    },
  });
} 
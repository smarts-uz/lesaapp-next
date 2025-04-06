interface TransactionClient {
  wp_wc_order_operational_data: {
    create: Function;
  };
}

interface CreateRefundOperationalDataParams {
  tx: TransactionClient;
  refundOrderId: bigint;
}

/**
 * Creates operational data for a refund order
 */
export async function createRefundOperationalData({
  tx,
  refundOrderId,
}: CreateRefundOperationalDataParams) {
  try {
    return await tx.wp_wc_order_operational_data.create({
      data: {
        order_id: refundOrderId,
        created_via: "api",
        woocommerce_version: "9.7.1",
        prices_include_tax: false,
        coupon_usages_are_counted: null,
        download_permission_granted: null,
        cart_hash: null,
        new_order_email_sent: null,
        order_key: null,
        order_stock_reduced: null,
        date_paid_gmt: null,
        date_completed_gmt: null,
        shipping_tax_amount: 0,
        shipping_total_amount: 0,
        discount_tax_amount: 0,
        discount_total_amount: 0,
        recorded_sales: false,
      },
    });
  } catch (error) {
    // Optional table, continue if it doesn't exist
    console.warn(
      "Order operational data could not be created, continuing with refund process"
    );
    return null;
  }
} 
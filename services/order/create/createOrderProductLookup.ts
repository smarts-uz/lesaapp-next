interface TransactionClient {
  wp_wc_order_product_lookup: {
    create: Function;
  };
}

interface ProductItem {
  product_id: number;
  variationId?: number;
  quantity: number;
  price: number;
}

interface Customer {
  id?: number;
}

/**
 * Creates an entry in the wp_wc_order_product_lookup table for an order item
 */
export async function createOrderProductLookup({
  tx,
  orderItemId,
  orderId,
  product,
  customer,
}: {
  tx: TransactionClient;
  orderItemId: bigint;
  orderId: bigint;
  product: ProductItem;
  customer?: Customer;
}) {
  return await tx.wp_wc_order_product_lookup.create({
    data: {
      order_item_id: orderItemId,
      order_id: orderId,
      product_id: BigInt(product.product_id),
      variation_id: BigInt(product.variationId || 0),
      customer_id: customer?.id ? BigInt(customer.id) : BigInt(0),
      date_created: new Date(),
      product_qty: product.quantity,
      product_net_revenue: product.price * product.quantity,
      product_gross_revenue: product.price * product.quantity,
      coupon_amount: 0,
      tax_amount: 0,
      shipping_amount: 0,
      shipping_tax_amount: 0,
    },
  });
} 
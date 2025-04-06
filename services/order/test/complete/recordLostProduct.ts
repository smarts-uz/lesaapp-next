import { RecordLostProductParams } from './index';

/**
 * Records a product as lost in wp_wc_order_lost_product table
 */
export async function recordLostProduct({ tx, item, error }: RecordLostProductParams): Promise<any> {
  return await tx.wp_wc_order_lost_product.create({
    data: {
      order_item_id: item.order_item_id,
      order_id: item.order_id,
      product_id: item.product_id,
      variation_id: item.variation_id,
      customer_id: item.customer_id,
      date_created: new Date(),
      product_qty: item.product_qty,
      product_net_revenue: item.product_net_revenue,
      product_gross_revenue: item.product_gross_revenue,
      coupon_amount: item.coupon_amount,
      tax_amount: item.tax_amount,
      shipping_amount: item.shipping_amount || 0,
      shipping_tax_amount: item.shipping_tax_amount || 0,
      rental_price: item.rental_price,
      used_days: item.used_days,
      regular_price: item.regular_price,
      sale_price: item.sale_price,
    },
  });
} 
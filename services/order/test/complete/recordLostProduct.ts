import { RecordLostProductParams } from './index';
import { checkIfRefunded } from './processOrderItems';

/**
 * Records a product as lost in wp_wc_order_lost_product table
 * Only records items that haven't been fully refunded
 * For partially refunded items, only the non-refunded quantity is recorded
 */
export async function recordLostProduct({ tx, item, error }: RecordLostProductParams): Promise<any> {
  // Double-check that this item has not been refunded before recording it as lost
  const { isRefunded, refundedQty } = await checkIfRefunded(tx, item.order_item_id);
  
  if (isRefunded) {
    console.log(`Item ${item.order_item_id} was already fully refunded, not recording as lost`);
    return null;
  }
  
  // Calculate remaining quantity (should be already calculated in processOrderItems, but checking as fallback)
  const productQty = item.product_qty;
  
  // If everything has been refunded, don't record as lost
  if (productQty <= 0) {
    console.log(`Item ${item.order_item_id} has no remaining quantity to record as lost`);
    return null;
  }
  
  // Check if this item is already recorded in the lost products table
  const existingRecord = await tx.wp_wc_order_lost_product.findUnique({
    where: {
      order_item_id: item.order_item_id,
    },
  });
  
  if (existingRecord) {
    console.log(`Item ${item.order_item_id} already recorded as lost, updating quantity if needed`);
    
    // Update the record if the quantity has changed
    if (existingRecord.product_qty !== productQty) {
      return await tx.wp_wc_order_lost_product.update({
        where: {
          order_item_id: item.order_item_id,
        },
        data: {
          product_qty: productQty,
          date_created: new Date(), // Update the date to reflect the latest check
        },
      });
    }
    
    return existingRecord;
  }
  
  // Record as lost since it's not fully refunded and not already recorded
  console.log(`Recording item ${item.order_item_id} as lost with quantity ${productQty}`);
  
  return await tx.wp_wc_order_lost_product.create({
    data: {
      order_item_id: item.order_item_id,
      order_id: item.order_id,
      product_id: item.product_id,
      variation_id: item.variation_id,
      customer_id: item.customer_id,
      date_created: new Date(),
      product_qty: productQty,
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
/**
 * Example React component that demonstrates how to use the refund API
 * This could be used in an order details page with a refund button
 */

'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function RefundOrderButton({ order, orderItems }) {
  const [isRefunding, setIsRefunding] = useState(false);

  const handleRefund = async () => {
    // Confirm with the user
    if (!confirm('Are you sure you want to refund this order?')) {
      return;
    }

    setIsRefunding(true);

    try {
      // Prepare items for refund
      const itemsToRefund = orderItems.map(item => ({
        itemId: parseInt(item.id),
        productId: parseInt(item.product_id),
        quantity: parseInt(item.quantity),
        amount: parseFloat(item.line_total),
        isBundle: item.isBundle || false,
        bundledItems: item.bundledItems 
          ? item.bundledItems.map(bundledItem => ({
              itemId: parseInt(bundledItem.id),
              productId: parseInt(bundledItem.product_id),
              quantity: parseInt(bundledItem.quantity)
            }))
          : undefined
      }));

      // Send refund request to the API
      const response = await fetch('/api/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: parseInt(order.id),
          items: itemsToRefund,
          reason: 'Customer requested refund',
          refundPayment: false // Set to true if you want to refund payment
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process refund');
      }

      // Show success message
      toast.success(`Order #${order.id} refunded successfully!`);
      
      // Refresh the page to show updated order status
      window.location.reload();
    } catch (error) {
      console.error('Refund failed:', error);
      toast.error(`Refund failed: ${error.message}`);
    } finally {
      setIsRefunding(false);
    }
  };

  return (
    <button
      onClick={handleRefund}
      disabled={isRefunding || order.status === 'wc-refunded'}
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
    >
      {isRefunding ? 'Processing...' : 'Refund Order'}
    </button>
  );
}

/**
 * Example of how to fetch order items including bundle information
 */
export async function getOrderItemsWithBundleInfo(orderId) {
  // This would typically be a server action or API call
  // Here's a simplified example
  
  // 1. Fetch base order items
  const items = await prisma.$queryRaw`
    SELECT 
      oi.order_item_id as id,
      meta_product.meta_value as product_id,
      meta_qty.meta_value as quantity,
      meta_total.meta_value as line_total,
      oi.order_item_name as name
    FROM wp_woocommerce_order_items oi
    LEFT JOIN wp_woocommerce_order_itemmeta meta_product 
      ON oi.order_item_id = meta_product.order_item_id AND meta_product.meta_key = '_product_id'
    LEFT JOIN wp_woocommerce_order_itemmeta meta_qty
      ON oi.order_item_id = meta_qty.order_item_id AND meta_qty.meta_key = '_qty'
    LEFT JOIN wp_woocommerce_order_itemmeta meta_total
      ON oi.order_item_id = meta_total.order_item_id AND meta_total.meta_key = '_line_total'
    WHERE oi.order_id = ${orderId} AND oi.order_item_type = 'line_item'
  `;

  // 2. Check for bundle items and enrich data
  const enrichedItems = await Promise.all(items.map(async (item) => {
    // Check if this is a bundle by looking for bundled_items meta
    const bundleItemsMeta = await prisma.$queryRaw`
      SELECT meta_value FROM wp_woocommerce_order_itemmeta
      WHERE order_item_id = ${item.id} AND meta_key = '_bundled_items'
    `;

    if (bundleItemsMeta && bundleItemsMeta.length > 0) {
      // This is a bundle product
      // Parse the bundled items (in a real implementation you'd need to parse PHP serialized string)
      // For this example, we'll make a simplified approach
      
      // Get all items that reference this bundle
      const bundledItems = await prisma.$queryRaw`
        SELECT 
          oi.order_item_id as id,
          meta_product.meta_value as product_id,
          meta_qty.meta_value as quantity,
          oi.order_item_name as name
        FROM wp_woocommerce_order_items oi
        JOIN wp_woocommerce_order_itemmeta meta_bundled_by
          ON oi.order_item_id = meta_bundled_by.order_item_id 
          AND meta_bundled_by.meta_key = '_bundled_by'
          AND meta_bundled_by.meta_value = ${item.id}
        LEFT JOIN wp_woocommerce_order_itemmeta meta_product 
          ON oi.order_item_id = meta_product.order_item_id 
          AND meta_product.meta_key = '_product_id'
        LEFT JOIN wp_woocommerce_order_itemmeta meta_qty
          ON oi.order_item_id = meta_qty.order_item_id 
          AND meta_qty.meta_key = '_qty'
        WHERE oi.order_id = ${orderId}
      `;
      
      return {
        ...item,
        isBundle: true,
        bundledItems
      };
    }
    
    // Check if this is a bundled item
    const bundledByMeta = await prisma.$queryRaw`
      SELECT meta_value FROM wp_woocommerce_order_itemmeta
      WHERE order_item_id = ${item.id} AND meta_key = '_bundled_by'
    `;
    
    if (bundledByMeta && bundledByMeta.length > 0) {
      // This is a bundled item, we'll skip it as it will be included
      // with its parent bundle
      return { ...item, isBundledItem: true, bundledBy: bundledByMeta[0].meta_value };
    }
    
    // Regular item
    return item;
  }));
  
  // Filter out bundled items as they're already included with their parent bundles
  return enrichedItems.filter(item => !item.isBundledItem);
} 
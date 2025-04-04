import type { Order } from "@/types/pos";
import { createOrderAction } from "../actions";
import { prisma } from "../prisma";
import { Prisma, wp_wc_orders } from "@prisma/client";

type OrderWithRelations = wp_wc_orders & {
  orderStats: { total_sales: number; total_shipping: number; total_tax: number; total_discount: number; };
  orderAddresses: Array<{ address_type: string; first_name: string; last_name: string; email?: string; phone?: string; address_1?: string; city?: string; state?: string; postcode?: string; country?: string; }>;
  orderItems: Array<any>;
  orderRefunds: Array<any>;
};

/**
 * Creates a new order in WooCommerce
 * @param orderData The order data to create
 * @returns A promise that resolves to the created order
 */
export async function createOrder(orderData: any) {
  try {
    // Process bundle items to ensure they have the correct structure
    const processedItems = orderData.items.map((item: any) => {
      if (item.type === 'bundle' && item.bundleItems && Array.isArray(item.bundleItems)) {
        // Ensure each bundle item has the required fields
        const processedBundleItems = item.bundleItems.map((bundleItem: any) => ({
          id: bundleItem.id || 0,
          product_id: bundleItem.product_id || bundleItem.productId || 0,
          name: bundleItem.name || '',
          price: bundleItem.price || 0,
          quantity: bundleItem.quantity || 0,
          total: bundleItem.total || (bundleItem.price * bundleItem.quantity) || 0,
          variation_id: bundleItem.variation_id || 0,
          ...bundleItem
        }));
        
        return {
          ...item,
          bundleItems: processedBundleItems
        };
      }
      return item;
    });
    
    // Use the server action to create the order
    const result = await createOrderAction({
      ...orderData,
      items: processedItems
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create order');
    }
    
    return result.order;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

/**
 * Fetches an order from WooCommerce by ID
 * @param orderId The ID of the order to fetch
 * @returns A promise that resolves to the order or null if not found
 */
export async function fetchOrder(orderId: string): Promise<Order | null> {
  try {
    // Fetch the order from the database
    const order = await prisma.$queryRaw<OrderWithRelations>`
      SELECT * FROM wp_wc_orders 
      LEFT JOIN orderStats ON wp_wc_orders.id = orderStats.order_id
      LEFT JOIN orderAddresses ON wp_wc_orders.id = orderAddresses.order_id
      LEFT JOIN orderItems ON wp_wc_orders.id = orderItems.order_id
      LEFT JOIN orderRefunds ON wp_wc_orders.id = orderRefunds.order_id
      WHERE wp_wc_orders.id = ${parseInt(orderId)}
      LIMIT 1
    `;

    if (!order) {
      return null;
    }

    // Get billing and shipping addresses
    const billingAddress = order.orderAddresses.find((addr: any) => addr.address_type === 'billing');
    const shippingAddress = order.orderAddresses.find((addr: any) => addr.address_type === 'shipping');

    // Process order items
    const items = processOrderItems(order.orderItems);

    // Process refunds
    const refunds = processRefunds(order.orderRefunds, Number(order.id), Number(order.total_amount));

    // Check for compatibility warnings
    const compatibilityWarnings = checkCompatibilityWarnings(items);

    // Construct the complete order object
    return {
      id: order.id.toString(),
      number: `#ORD-${order.id.toString().padStart(3, "0")}`,
      date: order.date_created_gmt?.toISOString() || new Date().toISOString(),
      status: order.status || 'pending',
      customer: {
        name: billingAddress 
          ? `${billingAddress.first_name} ${billingAddress.last_name}`
          : 'Unknown Customer',
        email: billingAddress?.email || '',
        phone: billingAddress?.phone || ''
      },
      billing: {
        address: billingAddress?.address_1 || '',
        city: billingAddress?.city || '',
        state: billingAddress?.state || '',
        postcode: billingAddress?.postcode || '',
        country: billingAddress?.country || ''
      },
      shipping: {
        address: shippingAddress?.address_1 || '',
        city: shippingAddress?.city || '',
        state: shippingAddress?.state || '',
        postcode: shippingAddress?.postcode || '',
        country: shippingAddress?.country || ''
      },
      payment: {
        method: order.payment_method || 'Unknown',
        transaction: order.transaction_id || ''
      },
      items,
      subtotal: parseFloat(order.orderStats?.total_sales?.toString() || '0'),
      shipping_total: parseFloat(order.orderStats?.total_shipping?.toString() || '0'),
      tax_total: parseFloat(order.orderStats?.total_tax?.toString() || '0'),
      discount_total: parseFloat(order.orderStats?.total_discount?.toString() || '0'),
      total: parseFloat(order.total_amount?.toString() || '0'),
      refunds,
      compatibility_warnings: compatibilityWarnings,
      currency: order.currency || 'USD',
      customer_id: order.customer_id ? parseInt(order.customer_id.toString()) : undefined,
      billing_email: billingAddress?.email,
      payment_method: order.payment_method,
      payment_method_title: order.payment_method_title,
      transaction_id: order.transaction_id,
      ip_address: order.ip_address,
      user_agent: order.user_agent,
      customer_note: order.customer_note
    } as Order;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

/**
 * Process order items from the database
 * @param orderItems The order items from the database
 * @returns Processed order items
 */
function processOrderItems(orderItems: any[]): any[] {
  return orderItems.map((item: any) => {
    // Get item meta data
    const itemMeta = item.orderItemMeta.reduce((acc: Record<string, string>, meta: any) => {
      acc[meta.meta_key] = meta.meta_value;
      return acc;
    }, {} as Record<string, string>);

    // Process bundle items if this is a bundle product
    const bundleItems = item.orderBundleItems?.map((bundleItem: any) => {
      const bundleItemMeta = bundleItem.orderItemMeta.reduce((acc: Record<string, string>, meta: any) => {
        acc[meta.meta_key] = meta.meta_value;
        return acc;
      }, {} as Record<string, string>);

      // Extract selected options from meta
      const selectedOptions: Record<string, string> = {};
      Object.keys(bundleItemMeta).forEach(key => {
        if (key.startsWith('_option_')) {
          const optionName = key.replace('_option_', '');
          selectedOptions[optionName] = bundleItemMeta[key];
        }
      });

      return {
        id: bundleItem.id,
        name: bundleItemMeta._product_name || bundleItemMeta.name || 'Unknown Bundle Item',
        sku: bundleItemMeta._sku || '',
        price: parseFloat(bundleItemMeta._line_total || '0') / parseFloat(bundleItemMeta._qty || '1'),
        quantity: parseInt(bundleItemMeta._qty || '1'),
        total: parseFloat(bundleItemMeta._line_total || '0'),
        selectedOptions,
        order_item_id: bundleItem.order_item_id,
        parent_order_item_id: bundleItem.parent_order_item_id,
        order_id: bundleItem.order_id,
        bundle_id: bundleItem.bundle_id,
        product_id: parseInt(bundleItemMeta._product_id || '0'),
        variation_id: parseInt(bundleItemMeta._variation_id || '0'),
        product_qty: parseInt(bundleItemMeta._qty || '1'),
        product_net_revenue: parseFloat(bundleItemMeta._line_total || '0'),
        product_gross_revenue: parseFloat(bundleItemMeta._line_total || '0'),
        coupon_amount: 0,
        tax_amount: parseFloat(bundleItemMeta._line_tax || '0')
      };
    });

    // Extract selected options from meta
    const selectedOptions: Record<string, string> = {};
    Object.keys(itemMeta).forEach(key => {
      if (key.startsWith('_option_')) {
        const optionName = key.replace('_option_', '');
        selectedOptions[optionName] = itemMeta[key];
      }
    });

    return {
      id: item.id,
      name: itemMeta._product_name || itemMeta.name || 'Unknown Product',
      sku: itemMeta._sku || '',
      price: parseFloat(itemMeta._line_total || '0') / parseFloat(itemMeta._qty || '1'),
      quantity: parseInt(itemMeta._qty || '1'),
      total: parseFloat(itemMeta._line_total || '0'),
      refundable: true, // Default to true, could be determined by order status
      type: bundleItems && bundleItems.length > 0 ? 'bundle' : 'simple',
      bundleItems,
      order_id: item.order_id,
      product_id: parseInt(itemMeta._product_id || '0'),
      variation_id: parseInt(itemMeta._variation_id || '0'),
      product_qty: parseInt(itemMeta._qty || '1'),
      product_net_revenue: parseFloat(itemMeta._line_total || '0'),
      product_gross_revenue: parseFloat(itemMeta._line_total || '0'),
      coupon_amount: 0,
      tax_amount: parseFloat(itemMeta._line_tax || '0'),
      shipping_amount: 0,
      shipping_tax_amount: 0
    };
  });
}

/**
 * Process refunds from the database
 * @param orderRefunds The refunds from the database
 * @param orderId The ID of the order
 * @param totalAmount The total amount of the order
 * @returns Processed refunds
 */
function processRefunds(orderRefunds: any[], orderId: number, totalAmount: number): any[] {
  return orderRefunds.map((refund: any) => {
    return {
      id: refund.id.toString(),
      order_id: orderId.toString(),
      date: refund.date_created_gmt?.toISOString() || new Date().toISOString(),
      amount: parseFloat(refund.amount || '0'),
      reason: refund.reason || '',
      items: refund.orderRefundItems.map((item: any) => ({
        id: item.order_item_id,
        name: item.name || `Item #${item.order_item_id}`,
        type: item.type || 'simple',
        refunded: true
      })),
      payment_method: refund.payment_method || 'original',
      transaction_id: refund.transaction_id || '',
      status: refund.status || 'completed',
      created_by: refund.created_by || 'System',
      restock_items: refund.restock_items || false,
      refund_type: Number(refund.amount) === Number(totalAmount) ? 'full' : 'partial'
    };
  });
}

/**
 * Check for compatibility warnings in order items
 * @param items The order items
 * @returns An array of compatibility warnings
 */
export function checkCompatibilityWarnings(items: any[]): string[] {
  const compatibilityWarnings: string[] = [];
  
  // Example compatibility check (in a real app, this would be more sophisticated)
  const hasScaffoldFrame = items.some(item => 
    item.name.toLowerCase().includes('scaffold frame')
  );
  
  const hasCrossBrace = items.some(item => 
    item.name.toLowerCase().includes('cross brace')
  );
  
  if (hasScaffoldFrame && !hasCrossBrace) {
    compatibilityWarnings.push(
      "This order contains scaffold frames but no cross braces. Cross braces are recommended for stability."
    );
  }

  return compatibilityWarnings;
} 
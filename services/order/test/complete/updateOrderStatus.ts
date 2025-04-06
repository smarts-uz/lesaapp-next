import { UpdateOrderStatusParams } from './index';

/**
 * Updates the order status to completed
 */
export async function updateOrderStatus({ tx, orderId }: UpdateOrderStatusParams): Promise<void> {
  // Update order status in wp_wc_orders
  await tx.wp_wc_orders.update({
    where: { id: orderId },
    data: {
      status: 'completed',
      is_completed: true,
    },
  });

  // Update order stats status
  await tx.wp_wc_order_stats.update({
    where: { order_id: orderId },
    data: {
      status: 'wc-completed',
    },
  });
} 
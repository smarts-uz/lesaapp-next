import type { Order, OrderItem, OrderBundleItem } from "@/types/pos";

/**
 * Extracts all items from an order, including bundle items
 * @param order The order to extract items from
 * @returns An array of all items in the order, including bundle items
 */
export function getOrderItems(order: Order): OrderItem[] {
  if (!order || !order.items) {
    return [];
  }

  // Return all items from the order
  return order.items;
}

/**
 * Extracts all bundle items from an order
 * @param order The order to extract bundle items from
 * @returns An array of all bundle items in the order
 */
export function getOrderBundleItems(order: Order): OrderBundleItem[] {
  if (!order || !order.items) {
    return [];
  }

  // Extract all bundle items from all order items
  const bundleItems: OrderBundleItem[] = [];

  order.items.forEach((item) => {
    if (
      item.type === "bundle" &&
      item.bundleItems &&
      item.bundleItems.length > 0
    ) {
      bundleItems.push(...item.bundleItems);
    }
  });

  return bundleItems;
}

/**
 * Gets all refundable items from an order
 * @param order The order to get refundable items from
 * @returns An array of refundable items in the order
 */
export function getRefundableItems(order: Order): OrderItem[] {
  if (!order || !order.items) {
    return [];
  }

  // Return only items that are refundable
  return order.items.filter((item) => item.refundable);
}

/**
 * Gets all refundable bundle items from an order
 * @param order The order to get refundable bundle items from
 * @returns An array of refundable bundle items in the order
 */
export function getRefundableBundleItems(order: Order): OrderBundleItem[] {
  if (!order || !order.items) {
    return [];
  }

  // Extract all bundle items from refundable order items
  const refundableBundleItems: OrderBundleItem[] = [];

  order.items.forEach((item) => {
    if (
      item.refundable &&
      item.type === "bundle" &&
      item.bundleItems &&
      item.bundleItems.length > 0
    ) {
      refundableBundleItems.push(...item.bundleItems);
    }
  });

  return refundableBundleItems;
}

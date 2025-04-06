interface TransactionClient {
  wp_woocommerce_order_itemmeta: {
    create: Function;
    createMany: Function;
  };
  wp_posts: {
    findUnique: Function;
  };
  wp_woocommerce_order_items: {
    create: Function;
  };
  wp_wc_order_product_lookup: {
    create: Function;
  };
}

interface BundledItem {
  itemId: number;
  productId: number;
  quantity: number;
}

interface RefundItem {
  isBundle?: boolean;
  bundledItems?: BundledItem[];
}

interface OriginalOrder {
  customer_id?: bigint;
  used_days?: number;
}

import { createRefundBundledItem } from './createRefundBundledItem';

/**
 * Processes all bundled items for a refund item
 */
export async function processRefundBundledItems({
  tx,
  refundOrderId,
  parentItemId,
  item,
  originalOrder,
}: {
  tx: TransactionClient;
  refundOrderId: bigint;
  parentItemId: bigint;
  item: RefundItem;
  originalOrder: OriginalOrder;
}) {
  // Skip if not a bundle or no bundled items
  if (!item.isBundle || !item.bundledItems || item.bundledItems.length === 0) {
    return {
      processedItems: [],
      stockAdjustments: [],
    };
  }

  const bundledItemIds: number[] = [];
  const bundledDescriptions: string[] = [];
  const stockAdjustments = [];
  const processedItems = [];

  // Process each bundled item
  for (const bundledItem of item.bundledItems) {
    const result = await createRefundBundledItem({
      tx,
      refundOrderId,
      bundledItem,
      originalOrder,
      parentItemId,
    });

    // Track results for reference
    bundledItemIds.push(result.id);
    bundledDescriptions.push(result.description);
    
    // Add to stock adjustments
    stockAdjustments.push({
      productId: bundledItem.productId,
      quantity: bundledItem.quantity, // Positive for stock adjustments
    });

    processedItems.push(result);
  }

  // Add bundled items reference to parent item (in serialized PHP array format)
  if (bundledItemIds.length > 0) {
    await tx.wp_woocommerce_order_itemmeta.create({
      data: {
        order_item_id: parentItemId,
        meta_key: "_bundled_items",
        meta_value: `a:${bundledItemIds.length}:{${bundledItemIds
          .map((id, index) => `i:${index};i:${id};`)
          .join("")}}`,
      },
    });
  }

  return {
    processedItems,
    bundledItemIds,
    bundledDescriptions,
    stockAdjustments,
  };
} 
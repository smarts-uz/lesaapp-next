import {
  OrderItemProcessResult,
  ProcessRefundParams,
  RefundCheckResult,
} from "./index";
import { recordLostProduct } from "./recordLostProduct";

// Interfaces for bundled items
interface BundleLookup {
  order_item_id: bigint;
  parent_order_item_id: bigint;
  order_id: bigint;
  bundle_id: bigint;
  product_id: bigint;
  variation_id: bigint;
  customer_id?: bigint;
  product_qty: number;
  product_net_revenue?: number;
  product_gross_revenue?: number;
}

interface ProductLookup {
  order_item_id: bigint;
  product_id: bigint;
  [key: string]: any;
}

/**
 * Process all order items for completion, attempt refunds and track lost products
 * Each item is processed individually and quantities are calculated per item
 */
export async function processOrderItems(
  tx: any,
  orderId: bigint
): Promise<OrderItemProcessResult[]> {
  // Get both regular order items and bundled items
  const orderItems = await tx.wp_woocommerce_order_items.findMany({
    where: {
      order_id: orderId,
      order_item_type: "line_item",
    },
  });

  // Get order product lookups for detailed information
  const orderProductLookups = await tx.wp_wc_order_product_lookup.findMany({
    where: {
      order_id: orderId,
    },
  });

  // Get bundle order item lookups if they exist
  const bundleLookups: BundleLookup[] = await tx.wp_wc_order_bundle_lookup
    .findMany({
      where: {
        order_id: orderId,
      },
    })
    .catch(() => []); // Gracefully handle if the table doesn't exist

  // Results array to track processing outcomes
  const results: OrderItemProcessResult[] = [];

  // Array to collect all items that need to be recorded as lost
  const lostItems: any[] = [];

  // Map order items to their product lookups for easier access
  const itemProductMap = new Map<string, ProductLookup>();
  orderProductLookups.forEach((lookup: ProductLookup) => {
    itemProductMap.set(lookup.order_item_id.toString(), lookup);
  });

  // Process all order items (including both regular items and items within bundles)
  for (const item of orderItems) {
    try {
      // Get the product lookup for this item
      const productLookup = itemProductMap.get(item.order_item_id.toString());

      // Skip if we don't have product lookup info
      if (!productLookup) {
        console.log(
          `No product lookup found for item ${item.order_item_id}, skipping`
        );
        continue;
      }

      // Check if this is a bundled item
      const isBundledItem = bundleLookups.some(
        (bundle: BundleLookup) =>
          bundle.parent_order_item_id.toString() ===
          item.order_item_id.toString()
      );

      // Get all children if this is a bundle
      const bundleChildren = isBundledItem
        ? bundleLookups.filter(
            (bundle: BundleLookup) =>
              bundle.parent_order_item_id.toString() ===
              item.order_item_id.toString()
          )
        : [];

      // Get the original item quantity from metadata
      const originalQuantity = await getOriginalQuantity(
        tx,
        item.order_item_id
      );

      // Get detailed refund information including already refunded quantity
      const { isRefunded, refundedQty } = await checkIfRefunded(
        tx,
        item.order_item_id
      );

      console.log(
        `Processing item ${item.order_item_id} (${item.order_item_name}): original qty=${originalQuantity}, already refunded=${refundedQty}, is bundle=${isBundledItem}`
      );

      // Calculate remaining quantity that needs to be accounted for
      const remainingQty = originalQuantity - refundedQty;

      // If refunded quantity doesn't match original quantity, add to lost products
      if (remainingQty > 0) {
        console.log(
          `Item ${item.order_item_id} has remaining quantity ${remainingQty}. Adding to lost products.`
        );
        const existingLostItemIndex = lostItems.findIndex(
          (lostItem) => lostItem.order_item_id === item.order_item_id
        );

        const lostItemData = {
          ...productLookup,
          order_item_name: item.order_item_name,
          product_qty: remainingQty, // The lost quantity is the difference between original and refunded
          original_qty: originalQuantity,
          refunded_qty: refundedQty,
          is_bundle: isBundledItem,
        };

        if (existingLostItemIndex >= 0) {
          lostItems[existingLostItemIndex] = lostItemData;
        } else {
          lostItems.push(lostItemData);
        }
      } else {
        console.log(
          `Item ${item.order_item_id} is fully refunded. Skipping lost products tracking.`
        );
      }

      // If item is fully refunded, add to results but don't attempt to refund again
      if (isRefunded && remainingQty === 0) {
        results.push({
          orderItemId: item.order_item_id,
          productId: productLookup.product_id,
          name: item.order_item_name,
          refunded: true,
          isBundle: isBundledItem,
        });
        continue;
      }

      // Attempt to refund the remaining quantity if not already fully refunded
      const currentAttemptResult = await processRefund({
        tx,
        orderItem: {
          ...item,
          product_id: productLookup.product_id,
          product_qty: originalQuantity,
        },
      });

      // If this attempt was successful, add to refunded quantity
      let newRefundedQty = refundedQty;
      if (currentAttemptResult.refunded) {
        newRefundedQty += currentAttemptResult.refundedQty;
      }

      // Recalculate remaining quantity after the refund attempt
      const newRemainingQty = originalQuantity - newRefundedQty;

      console.log(
        `Item ${item.order_item_id} (${item.order_item_name}): current refund=${
          currentAttemptResult.refunded ? currentAttemptResult.refundedQty : 0
        }, total refunded=${newRefundedQty}, remaining=${newRemainingQty}`
      );

      // Update the lost item status after the refund attempt
      if (newRemainingQty > 0) {
        const existingLostItemIndex = lostItems.findIndex(
          (lostItem) => lostItem.order_item_id === item.order_item_id
        );

        const updatedLostItemData = {
          ...productLookup,
          order_item_name: item.order_item_name,
          product_qty: newRemainingQty,
          original_qty: originalQuantity,
          refunded_qty: newRefundedQty,
          is_bundle: isBundledItem,
        };

        if (existingLostItemIndex >= 0) {
          lostItems[existingLostItemIndex] = updatedLostItemData;
        } else {
          lostItems.push(updatedLostItemData);
        }
      } else if (newRemainingQty === 0) {
        // If the item is now fully refunded, remove it from lost items
        const existingLostItemIndex = lostItems.findIndex(
          (lostItem) => lostItem.order_item_id === item.order_item_id
        );
        if (existingLostItemIndex >= 0) {
          lostItems.splice(existingLostItemIndex, 1);
        }
      }

      // If bundle items need to be processed individually
      if (isBundledItem && bundleChildren.length > 0) {
        // Process each bundle child separately
        for (const childItem of bundleChildren) {
          // Get the child's original quantity (adjusted for the bundle parent quantity)
          const childOriginalQty = childItem.product_qty;

          // Child's refunded quantity should be proportional to parent's refund ratio
          const refundRatio = newRefundedQty / originalQuantity;
          const childRefundedQty = Math.floor(childOriginalQty * refundRatio);

          // Calculate remaining quantity for this child
          const childRemainingQty = childOriginalQty - childRefundedQty;

          console.log(
            `Bundle child ${childItem.order_item_id} (product ${childItem.product_id}): original=${childOriginalQty}, refunded=${childRefundedQty}, remaining=${childRemainingQty}`
          );

          // If there's remaining quantity, add to lost items
          if (childRemainingQty > 0) {
            lostItems.push({
              order_item_id: childItem.order_item_id,
              order_id: item.order_id,
              product_id: childItem.product_id,
              variation_id: childItem.variation_id || BigInt(0),
              customer_id: childItem.customer_id,
              product_qty: childRemainingQty,
              product_net_revenue: childItem.product_net_revenue || 0,
              product_gross_revenue: childItem.product_gross_revenue || 0,
              original_qty: childOriginalQty,
              refunded_qty: childRefundedQty,
              parent_item_id: item.order_item_id,
              is_bundle_child: true,
            });
          }
        }
      }

      // Add result to tracking array
      results.push({
        orderItemId: item.order_item_id,
        productId: productLookup.product_id,
        name: item.order_item_name,
        refunded: newRefundedQty >= originalQuantity,
        isBundle: isBundledItem,
      });
    } catch (error) {
      console.error(`Failed to process item ${item.order_item_id}:`, error);

      // If there was an error, we still need to check how much was already refunded
      const originalQuantity = await getOriginalQuantity(
        tx,
        item.order_item_id
      );
      const { isRefunded, refundedQty } = await checkIfRefunded(
        tx,
        item.order_item_id
      );

      // Get the product lookup for this item
      const productLookup = itemProductMap.get(item.order_item_id.toString());

      // Calculate remaining quantity
      const remainingQty = originalQuantity - refundedQty;

      // If there's remaining quantity and we have product lookup info, add to lost items
      if (remainingQty > 0 && productLookup) {
        lostItems.push({
          ...productLookup,
          order_item_name: item.order_item_name,
          product_qty: remainingQty,
          original_qty: originalQuantity,
          refunded_qty: refundedQty,
          error: (error as Error).message,
        });
      }

      // Add failed result to tracking array
      results.push({
        orderItemId: item.order_item_id,
        productId: productLookup ? productLookup.product_id : null,
        name: item.order_item_name,
        refunded: isRefunded,
        error: (error as Error).message,
      });
    }
  }

  // Process all lost items in a single batch
  console.log(`Recording ${lostItems.length} lost items in a single batch`);
  for (const lostItem of lostItems) {
    await recordLostProduct({
      tx,
      item: lostItem,
      error: lostItem.error,
    });
  }

  return results;
}

/**
 * Gets the original quantity of an order item from metadata
 */
async function getOriginalQuantity(
  tx: any,
  orderItemId: bigint
): Promise<number> {
  // Get original product quantity from meta
  const qtyMeta = await tx.wp_woocommerce_order_itemmeta.findFirst({
    where: {
      order_item_id: orderItemId,
      meta_key: "_qty",
    },
  });

  // Return the quantity or default to the item's product_qty if metadata isn't found
  const originalQty =
    qtyMeta && qtyMeta.meta_value
      ? parseInt(qtyMeta.meta_value.toString(), 10) || 0
      : 0;

  if (originalQty === 0) {
    // If we couldn't get the quantity from meta, try to get it from the product lookup
    const productLookup = await tx.wp_wc_order_product_lookup.findFirst({
      where: {
        order_item_id: orderItemId,
      },
    });

    return productLookup ? productLookup.product_qty : 0;
  }

  return originalQty;
}

/**
 * Checks if an order item has already been refunded and returns refund status and quantity
 * @returns Object containing isRefunded status and refundedQty amount
 */
export async function checkIfRefunded(
  tx: any,
  orderItemId: bigint
): Promise<RefundCheckResult> {
  console.log(`Checking refund status for item ${orderItemId}`);
  
  // First get the original quantity
  const originalQty = await getOriginalQuantity(tx, orderItemId);
  
  // Keep track of total refunded quantity across all sources
  let totalRefundedQty = 0;
  
  // 1. Check for direct refund quantities in order item meta
  const refundedQtyMeta = await tx.wp_woocommerce_order_itemmeta.findFirst({
    where: {
      order_item_id: orderItemId,
      meta_key: "_refunded_qty",
    },
  });
  
  if (refundedQtyMeta && refundedQtyMeta.meta_value) {
    const metaRefundQty = parseInt(refundedQtyMeta.meta_value.toString(), 10) || 0;
    totalRefundedQty += metaRefundQty;
    console.log(`Found direct refund quantity in meta: ${metaRefundQty}`);
  }
  
  // 2. Check for refund items that reference this order item
  const refundItems = await tx.$queryRaw`
    SELECT oi.order_item_id, oim.meta_value as refunded_qty
    FROM wp_woocommerce_order_items oi
    JOIN wp_woocommerce_order_itemmeta oim ON oi.order_item_id = oim.order_item_id
    JOIN wp_woocommerce_order_itemmeta oim2 ON oi.order_item_id = oim2.order_item_id
    WHERE oi.order_item_type = 'line_item' 
    AND oim.meta_key = '_refunded_qty'
    AND oim2.meta_key = '_refunded_item_id'
    AND oim2.meta_value = ${orderItemId.toString()}
  `;
  
  if (Array.isArray(refundItems) && refundItems.length > 0) {
    for (const record of refundItems) {
      if (record.refunded_qty) {
        const refundQty = parseInt(record.refunded_qty.toString(), 10) || 0;
        totalRefundedQty += refundQty;
        console.log(`Found refund item referencing item ${orderItemId}: ${refundQty} units`);
      }
    }
  }
  
  // 3. Check for our custom refund tracking meta
  const processingMeta = await tx.wp_woocommerce_order_itemmeta.findFirst({
    where: {
      order_item_id: orderItemId,
      meta_key: "_refund_processed_qty",
    },
  });
  
  if (processingMeta && processingMeta.meta_value) {
    const processedQty = parseInt(processingMeta.meta_value.toString(), 10) || 0;
    totalRefundedQty += processedQty;
    console.log(`Found custom refund tracking meta: ${processedQty} units`);
  }
  
  // 4. Also check potential parent-child relationships for bundles
  // This is important when refunds are applied at the parent level but need to be calculated down to children
  const bundleChild = await tx.wp_wc_order_bundle_lookup.findFirst({
    where: {
      order_item_id: orderItemId,
    },
  }).catch(() => null);
  
  if (bundleChild) {
    // This is a bundle child, check if parent has been refunded
    const parentItemId = bundleChild.parent_order_item_id;
    const parentRefundCheck = await checkParentItemRefund(tx, parentItemId, orderItemId, bundleChild.product_qty);
    
    // Add any parent-derived refund quantities
    if (parentRefundCheck.refundedQty > 0) {
      totalRefundedQty += parentRefundCheck.refundedQty;
      console.log(`Found parent item ${parentItemId} refund affecting this bundle child: ${parentRefundCheck.refundedQty} units`);
    }
  }
  
  // An item is considered fully refunded if the total refunded quantity matches or exceeds the original
  const isFullyRefunded = totalRefundedQty >= originalQty;
  
  console.log(`Item ${orderItemId} refund status: original=${originalQty}, refunded=${totalRefundedQty}, fully refunded=${isFullyRefunded}`);
  
  return {
    isRefunded: isFullyRefunded,
    refundedQty: totalRefundedQty,
  };
}

/**
 * Helper function to check parent item refunds and calculate impact on child items
 */
async function checkParentItemRefund(
  tx: any, 
  parentItemId: bigint, 
  childItemId: bigint,
  childOriginalQty: number
): Promise<{ refundedQty: number }> {
  // Get parent item's original and refunded quantities
  const parentOriginalQty = await getOriginalQuantity(tx, parentItemId);
  
  // Skip the current function in the parent check to avoid infinite recursion
  let parentRefundedQty = 0;
  
  // Check for direct refund quantities in parent's meta
  const refundedQtyMeta = await tx.wp_woocommerce_order_itemmeta.findFirst({
    where: {
      order_item_id: parentItemId,
      meta_key: "_refunded_qty",
    },
  });
  
  if (refundedQtyMeta && refundedQtyMeta.meta_value) {
    parentRefundedQty += parseInt(refundedQtyMeta.meta_value.toString(), 10) || 0;
  }
  
  // Check our custom refund tracking meta for the parent
  const processingMeta = await tx.wp_woocommerce_order_itemmeta.findFirst({
    where: {
      order_item_id: parentItemId,
      meta_key: "_refund_processed_qty",
    },
  });
  
  if (processingMeta && processingMeta.meta_value) {
    parentRefundedQty += parseInt(processingMeta.meta_value.toString(), 10) || 0;
  }
  
  // Calculate refund ratio from parent
  if (parentOriginalQty <= 0) {
    return { refundedQty: 0 };
  }
  
  const parentRefundRatio = parentRefundedQty / parentOriginalQty;
  
  // Calculate child's refunded quantity based on parent's refund ratio
  const childRefundedQty = Math.floor(childOriginalQty * parentRefundRatio);
  
  return { refundedQty: childRefundedQty };
}

/**
 * Process refund for an order item, returning both success status and refunded quantity
 */
async function processRefund({
  tx,
  orderItem,
}: ProcessRefundParams): Promise<{ refunded: boolean; refundedQty: number }> {
  // Get original quantity
  const originalQty = await getOriginalQuantity(tx, orderItem.order_item_id);

  // Get already refunded quantity
  const { refundedQty } = await checkIfRefunded(tx, orderItem.order_item_id);

  // Calculate the quantity that still needs to be refunded
  const quantityToRefund = originalQty - refundedQty;

  // If nothing to refund, return immediately
  if (quantityToRefund <= 0) {
    console.log(
      `Item ${orderItem.order_item_id} has no quantity to refund (original: ${originalQty}, already refunded: ${refundedQty})`
    );
    return { refunded: true, refundedQty: 0 };
  }

  // Check if this item has already been marked as processed
  const alreadyProcessedMeta = await tx.wp_woocommerce_order_itemmeta.findFirst(
    {
      where: {
        order_item_id: orderItem.order_item_id,
        meta_key: "_refund_processed",
      },
    }
  );

  // If we've already attempted to refund this item, return the same result
  if (alreadyProcessedMeta) {
    const wasSuccessful = alreadyProcessedMeta.meta_value === "true";

    // Get the processed quantity
    const processedQtyMeta = await tx.wp_woocommerce_order_itemmeta.findFirst({
      where: {
        order_item_id: orderItem.order_item_id,
        meta_key: "_refund_processed_qty",
      },
    });

    const processedQty =
      processedQtyMeta && processedQtyMeta.meta_value
        ? parseInt(processedQtyMeta.meta_value.toString(), 10) || 0
        : 0;

    console.log(
      `Item ${orderItem.order_item_id} already processed with result: ${
        wasSuccessful ? "success" : "failure"
      }, quantity: ${processedQty}`
    );
    return { refunded: wasSuccessful, refundedQty: processedQty };
  }

  try {
    console.log(
      `Attempting to refund ${quantityToRefund} units for item ${orderItem.order_item_id}`
    );

    // In a real implementation, you would:
    // 1. Get payment details from order meta
    // 2. Call payment gateway API to process refund
    // 3. Record refund details in database

    // For demonstration, simulate a payment gateway call
    // In production, replace this with your actual payment gateway integration
    const simulateRefundResult = await simulatePaymentGatewayRefund(
      tx,
      orderItem,
      quantityToRefund
    );

    if (simulateRefundResult.success) {
      // Record the successful refund
      await tx.wp_woocommerce_order_itemmeta.create({
        data: {
          order_item_id: orderItem.order_item_id,
          meta_key: "_refund_processed",
          meta_value: "true",
        },
      });

      await tx.wp_woocommerce_order_itemmeta.create({
        data: {
          order_item_id: orderItem.order_item_id,
          meta_key: "_refund_processed_qty",
          meta_value: quantityToRefund.toString(),
        },
      });

      // Update inventory if needed
      await updateInventory(tx, orderItem.product_id, quantityToRefund);

      console.log(
        `Successfully refunded ${quantityToRefund} units for item ${orderItem.order_item_id}`
      );
      return { refunded: true, refundedQty: quantityToRefund };
    } else {
      throw new Error(simulateRefundResult.error || "Refund processing failed");
    }
  } catch (error) {
    console.error(
      `Failed to process refund for item ${orderItem.order_item_id}:`,
      error
    );

    // Record the failed attempt
    await tx.wp_woocommerce_order_itemmeta.create({
      data: {
        order_item_id: orderItem.order_item_id,
        meta_key: "_refund_processed",
        meta_value: "false",
      },
    });

    await tx.wp_woocommerce_order_itemmeta.create({
      data: {
        order_item_id: orderItem.order_item_id,
        meta_key: "_refund_processed_qty",
        meta_value: "0",
      },
    });

    return { refunded: false, refundedQty: 0 };
  }
}

/**
 * Simulates a payment gateway refund call
 * In a real implementation, this would be replaced with actual payment gateway API calls
 */
async function simulatePaymentGatewayRefund(
  tx: any,
  orderItem: any,
  quantityToRefund: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the payment method from order meta
    const paymentMethodMeta = await tx.wp_woocommerce_order_itemmeta.findFirst({
      where: {
        order_item_id: orderItem.order_item_id,
        meta_key: "_payment_method",
      },
    });

    const paymentMethod = paymentMethodMeta?.meta_value || "unknown";

    // Get the order total and calculate refund amount
    const priceMeta = await tx.wp_woocommerce_order_itemmeta.findFirst({
      where: {
        order_item_id: orderItem.order_item_id,
        meta_key: "_line_total",
      },
    });

    const totalPrice = priceMeta?.meta_value
      ? parseFloat(priceMeta.meta_value.toString())
      : 0;
    const originalQty = await getOriginalQuantity(tx, orderItem.order_item_id);
    const unitPrice = originalQty > 0 ? totalPrice / originalQty : 0;
    const refundAmount = unitPrice * quantityToRefund;

    console.log(
      `Simulating refund of $${refundAmount.toFixed(
        2
      )} for ${quantityToRefund} units via ${paymentMethod}`
    );
    
    // For better debugging, log the item details
    console.log(`Item details: ID=${orderItem.order_item_id}, Product ID=${orderItem.product_id}, Name=${orderItem.order_item_name}`);

    // Record the refund in the refunds table
    const refundId = await tx.wp_wc_order_refunds.create({
      data: {
        order_id: orderItem.order_id,
        amount: refundAmount,
        reason: "Automatic refund for lost items",
        refunded_by: BigInt(1), // System user ID
        date_created: new Date(),
        date_created_gmt: new Date(),
      },
      select: {
        id: true,
      },
    });

    // Link the refund to the order item
    if (refundId) {
      await tx.wp_woocommerce_order_items.create({
        data: {
          order_id: refundId.id,
          order_item_type: "line_item",
          order_item_name: `Refund for ${orderItem.order_item_name}`,
        },
      });
    }

    // In an actual implementation, specific items can be exempt from automatic refunds
    // For testing purposes, we'll determine success based on both product_id and order_item_id
    
    // Check if this item ID is in the list of excluded items
    const excludedItemIds = [123, 456, 789]; // Example list - replace with actual logic
    const itemIdExcluded = excludedItemIds.includes(Number(orderItem.order_item_id));
    
    // Check if this product ID is eligible for refunds (even products are refundable)
    const productRefundable = Number(orderItem.product_id) % 2 === 0;
    
    // Combine both checks - exclude specific items even if their product is refundable
    const isSuccessful = productRefundable && !itemIdExcluded;

    if (isSuccessful) {
      console.log(`Refund for item ${orderItem.order_item_id} approved`);
      return { success: true };
    } else {
      const reason = itemIdExcluded 
        ? `Item ${orderItem.order_item_id} is specifically excluded from automatic refunds`
        : `Product ${orderItem.product_id} is not eligible for automatic refunds`;
      
      console.log(`Refund for item ${orderItem.order_item_id} declined: ${reason}`);
      return {
        success: false,
        error: reason,
      };
    }
  } catch (error) {
    console.error("Error in refund simulation:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Updates inventory after a successful refund
 */
async function updateInventory(
  tx: any,
  productId: bigint,
  quantity: number
): Promise<void> {
  try {
    // Find the product
    const product = await tx.wp_wc_product_meta_lookup.findFirst({
      where: {
        product_id: productId,
      },
    });

    if (!product) {
      console.log(`Product ${productId} not found for inventory update`);
      return;
    }

    // Update product stock
    await tx.wp_wc_product_meta_lookup.update({
      where: {
        product_id: productId,
      },
      data: {
        stock_quantity: {
          increment: quantity,
        },
      },
    });

    // Update stock status if needed
    if (product.stock_quantity <= 0 && product.stock_quantity + quantity > 0) {
      await tx.wp_postmeta.updateMany({
        where: {
          post_id: productId,
          meta_key: "_stock_status",
        },
        data: {
          meta_value: "instock",
        },
      });
    }

    console.log(
      `Updated inventory for product ${productId}: added ${quantity} units back to stock`
    );
  } catch (error) {
    console.error(
      `Failed to update inventory for product ${productId}:`,
      error
    );
    // Don't throw the error - we don't want to fail the refund if inventory update fails
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  findOrderById,
  calculateRentalPrice,
  updateOrderWithRentalCalculations,
  createRefundOrder,
  storeRefundMetadata,
  createRefundOrderStats,
  createRefundOrderItem,
  updateProductStock,
  addRefundComment,
  processRefundBundledItems,
  updateOrderStatus,
  updateOrderTimestamp,
  resetReducedStockFlags,
  createRefundOperationalData,
} from "@/services/refund";
import { z } from "zod";

// Schema validation for request body
const BundledItemSchema = z.object({
  itemId: z.number().positive(),
  productId: z.number().positive(),
  quantity: z.number().positive(),
});

const RefundItemSchema = z.object({
  itemId: z.number().positive(),
  productId: z.number().positive(),
  quantity: z.number().positive(),
  amount: z.number().positive(),
  isBundle: z.boolean().optional(),
  bundledItems: z.array(BundledItemSchema).optional(),
});

const RefundRequestSchema = z.object({
  orderId: z.number().positive(),
  items: z.array(RefundItemSchema).min(1),
  reason: z.string().optional().default(""),
  refundPayment: z.boolean().optional().default(false),
  refundType: z.enum(["partial", "full"]).optional().default("partial"),
  discountDays: z.number().nonnegative(),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
});

// Type definitions derived from Zod schemas
type RefundRequest = z.infer<typeof RefundRequestSchema>;
type RefundItem = z.infer<typeof RefundItemSchema>;

interface StockAdjustment {
  productId: number;
  quantity: number;
}

/**
 * Process a refund transaction with all related operations
 */
async function processRefundTransaction(
  data: RefundRequest,
  totalRefundAmount: number
) {
  return prisma.$transaction(
    async (tx) => {
      const {
        orderId,
        items,
        reason,
        refundPayment,
        refundType,
        discountDays,
        endDate,
      } = data;

      // Get the original order to verify it exists
      const originalOrder = await findOrderById({
        tx,
        orderId,
        select: {
          id: true,
          currency: true,
          customer_id: true,
          status: true,
          start_date: true,
          end_date: true,
          discount_days: true,
          rental_price: true,
          used_days: true,
        },
      });

      if (!originalOrder) {
        throw new Error(`Order with ID ${orderId} not found`);
      }

      // Calculate rental price
      const endDateTime = new Date(endDate);
      const rentalCalculation = calculateRentalPrice({
        startDateTime: originalOrder.start_date as Date,
        endDateTime,
        discountDays,
        baseAmount: totalRefundAmount,
      });

      // Update the original order with rental calculations
      await updateOrderWithRentalCalculations({
        tx,
        orderId,
        endDateTime,
        usedDays: rentalCalculation.usedDays,
        rentalPrice: rentalCalculation.rentalPrice,
        reason,
        refundType,
      });

      // Get the next ID for the refund order
      const maxOrderResult = await tx.wp_wc_orders.findMany({
        orderBy: { id: "desc" },
        take: 1,
        select: { id: true },
      });
      const refundOrderId = BigInt(Number(maxOrderResult[0]?.id || 0) + 1);

      // Get current order status before updating
      const currentStatus = originalOrder.status || "wc-pending";

      // Update order status based on refund type
      if (refundType === "full") {
        await updateOrderStatus({
          tx,
          orderId,
          status: "wc-refunded",
        });
      } else {
        // For partial refunds, just update the timestamp
        await updateOrderTimestamp({
          tx,
          orderId,
        });
      }

      // Create refund order record
      await createRefundOrder({
        tx,
        refundOrderId,
        originalOrder,
        totalRefundAmount,
        endDateTime,
        usedDays: rentalCalculation.usedDays,
        rentalPrice: rentalCalculation.rentalPrice,
        reason,
      });

      // Store refund metadata
      await storeRefundMetadata({
        tx,
        refundOrderId,
        totalRefundAmount,
        refundPayment,
        reason,
        refundType,
      });

      // Update order stats
      await createRefundOrderStats({
        tx,
        refundOrderId,
        orderId,
        items,
        totalRefundAmount,
        customerId: originalOrder.customer_id as bigint,
        refundType,
      });

      // Process refund items
      const { stockAdjustments, refundNoteItems } = await processRefundItems(
        tx,
        refundOrderId,
        items,
        originalOrder,
        discountDays
      );

      // Update product stock levels
      for (const adjustment of stockAdjustments) {
        await updateProductStock({
          tx,
          adjustment,
          orderId,
        });
      }

      // Add refund notes
      await addRefundNotes({
        tx,
        orderId,
        totalRefundAmount,
        refundNoteItems,
        reason,
        refundType,
        currentStatus,
        currency: originalOrder.currency || "UZS",
      });

      // Reset stock flags
      await resetStockFlags(tx, items);

      // Update order operational data
      try {
        await createRefundOperationalData({
          tx,
          refundOrderId,
        });
      } catch (error) {
        console.warn(
          "Order operational data could not be created, continuing with refund process"
        );
      }

      return {
        success: true,
        refundId: refundOrderId.toString(),
        orderId: orderId.toString(),
        amount: totalRefundAmount,
        items: items.length,
        refundType,
        currency: originalOrder.currency || "UZS",
      };
    },
    {
      timeout: 30000,
      maxWait: 35000,
      isolationLevel: "ReadCommitted",
    }
  );
}

/**
 * Process all refund items and collect stock adjustments and note items
 */
async function processRefundItems(
  tx: any,
  refundOrderId: bigint,
  items: RefundItem[],
  originalOrder: any,
  discountDays: number
) {
  const stockAdjustments: StockAdjustment[] = [];
  const refundNoteItems: string[] = [];

  for (const item of items) {
    const { refundItem, itemDescription } = await createRefundOrderItem({
      tx,
      refundOrderId,
      item,
      originalOrder,
      discountDays,
    });

    // Add to refund note with the positive amount for readability
    refundNoteItems.push(itemDescription);

    // Add to stock adjustments if not a bundle
    if (!item.isBundle) {
      stockAdjustments.push({
        productId: item.productId,
        quantity: item.quantity,
      });
    }

    // Process bundled items if this is a bundle
    if (item.isBundle && item.bundledItems && item.bundledItems.length > 0) {
      const { stockAdjustments: bundleStockAdjustments } =
        await processRefundBundledItems({
          tx,
          refundOrderId,
          parentItemId: refundItem.order_item_id,
          item,
          originalOrder,
        });

      // Add bundle stock adjustments to the main list
      stockAdjustments.push(...bundleStockAdjustments);
    }
  }

  return { stockAdjustments, refundNoteItems };
}

/**
 * Add refund notes to the order
 */
async function addRefundNotes({
  tx,
  orderId,
  totalRefundAmount,
  refundNoteItems,
  reason,
  refundType,
  currentStatus,
  currency,
}: {
  tx: any;
  orderId: number;
  totalRefundAmount: number;
  refundNoteItems: string[];
  reason: string;
  refundType: string;
  currentStatus: string;
  currency: string;
}) {
  // Add main refund note
  let refundNoteContent = `Refunded ${totalRefundAmount} ${currency}`;
  if (refundNoteItems.length > 0) {
    refundNoteContent += `: ${refundNoteItems.join(", ")}`;
  }

  if (reason) {
    refundNoteContent += `. Reason: ${reason}`;
  }

  await addRefundComment({
    tx,
    orderId,
    content: refundNoteContent,
  });

  // Add status change note based on refund type
  if (refundType === "full") {
    await addRefundComment({
      tx,
      orderId,
      content: `Order status changed from ${currentStatus.replace(
        "wc-",
        ""
      )} to Refunded.`,
    });
  } else {
    await addRefundComment({
      tx,
      orderId,
      content: `Partial refund processed (${totalRefundAmount} ${currency}).`,
    });
  }
}

/**
 * Reset stock flags for all refunded items
 */
async function resetStockFlags(tx: any, items: RefundItem[]) {
  for (const item of items) {
    await resetReducedStockFlags({
      tx,
      itemId: item.itemId,
    });

    // Handle bundled items
    if (item.isBundle && item.bundledItems) {
      for (const bundledItem of item.bundledItems) {
        await resetReducedStockFlags({
          tx,
          itemId: bundledItem.itemId,
        });
      }
    }
  }
}

/**
 * POST /api/refund
 * Process a WooCommerce order refund with stock adjustment
 */
export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const parsedData = RefundRequestSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: parsedData.error.format(),
        },
        { status: 400 }
      );
    }

    const refundData = parsedData.data;

    // Calculate total refund amount - ensure it's a valid decimal
    const totalRefundAmount = parseFloat(
      refundData.items
        .reduce((total, item) => total + item.amount, 0)
        .toFixed(2)
    );

    // Process the refund transaction
    const result = await processRefundTransaction(
      refundData,
      totalRefundAmount
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to process refund:", error);
    return NextResponse.json(
      { error: "Failed to process refund", details: (error as Error).message },
      { status: 500 }
    );
  }
}

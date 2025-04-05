import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

interface RefundRequest {
  orderId: number;
  items: RefundItem[];
  reason?: string;
  refundPayment?: boolean;
  refundType?: "partial" | "full";
  discountDays: number;      // Skidkadagi kunlar
  endDate: string;           // Tugatilgan vaqt (ISO string format)
}

interface RefundItem {
  itemId: number;
  productId: number;
  quantity: number;
  amount: number;
  isBundle?: boolean;
  bundledItems?: Array<{
    itemId: number;
    productId: number;
    quantity: number;
  }>;
}

interface StockAdjustment {
  productId: number;
  quantity: number;
}

/**
 * POST /api/refund
 * Process a WooCommerce order refund with stock adjustment
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RefundRequest;
    const {
      orderId,
      items,
      reason = "",
      refundPayment = false,
      refundType = "partial",
      discountDays,
      endDate,
    } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Refund items are required" },
        { status: 400 }
      );
    }

    // Validate quantities and amounts
    for (const item of items) {
      if (item.quantity <= 0) {
        return NextResponse.json(
          { error: "Item quantities must be positive" },
          { status: 400 }
        );
      }
      if (item.amount <= 0) {
        return NextResponse.json(
          { error: "Item amounts must be positive" },
          { status: 400 }
        );
      }
    }

    // Calculate total refund amount - ensure it's a valid decimal
    const totalRefundAmount = parseFloat(
      items.reduce((total, item) => total + item.amount, 0).toFixed(2)
    );

    // Process refund in a transaction
    const result = await prisma.$transaction(
      async (tx) => {
        // Get the original order to verify it exists
        const originalOrder = await tx.wp_wc_orders.findUnique({
          where: {
            id: BigInt(orderId),
          },
          select: {
            id: true,
            currency: true,
            customer_id: true,
            status: true,
            start_date: true,
            end_date: true,
            discount_days: true,
            rental_price: true,
            used_days: true
          }
        });

        if (!originalOrder) {
          throw new Error(`Order with ID ${orderId} not found`);
        }

        // Calculate used days as the difference between end_date and start_date
        const endDateTime = new Date(endDate);
        const startDateTime = originalOrder.start_date;
        
        if (!startDateTime) {
          throw new Error("Order start_date is required for rental calculations");
        }

        const usedDays = Math.ceil(
          (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (usedDays < 0) {
          throw new Error("End date cannot be earlier than start date");
        }

        // Calculate rental price based on used days and discount days
        const effectiveDays = Math.max(0, usedDays - discountDays);
        const rentalPrice = effectiveDays * totalRefundAmount;

        // Update the original order with rental calculations
        await tx.wp_wc_orders.update({
          where: {
            id: BigInt(orderId),
          },
          data: {
            end_date: endDateTime,
            used_days: usedDays,
            rental_price: BigInt(Math.round(rentalPrice)),
            discount_days: discountDays,
            date_updated_gmt: new Date(),
            customer_note: reason || null,
            ...(refundType === "full" ? { status: "wc-refunded" } : {})
          }
        });

        // Get order address info for better refund notes
        const orderAddress = await tx.wp_wc_order_addresses.findFirst({
          where: {
            order_id: BigInt(orderId),
            address_type: "billing",
          },
        });

        // Get the next ID for the refund order
        const maxOrderResult = await tx.wp_wc_orders.findMany({
          orderBy: { id: "desc" },
          take: 1,
          select: { id: true },
        });
        const refundOrderId = BigInt(Number(maxOrderResult[0]?.id || 0) + 1);

        // Generate current timestamp for all date fields
        const now = new Date();

        // Get current order status before updating
        const currentStatus = originalOrder.status || "wc-pending";

        // Only update the original order status to refunded if it's a full refund
        if (refundType === "full") {
          await tx.wp_wc_orders.update({
            where: {
              id: BigInt(orderId),
            },
            data: {
              status: "wc-refunded",
              date_updated_gmt: now,
            },
          });
        } else {
          // For partial refunds, just update the date_updated_gmt
          await tx.wp_wc_orders.update({
            where: {
              id: BigInt(orderId),
            },
            data: {
              date_updated_gmt: now,
            },
          });
        }

        // Create refund order record
        await tx.wp_wc_orders.create({
          data: {
            id: refundOrderId,
            status: "wc-completed",
            currency: originalOrder.currency || "UZS",
            type: "shop_order_refund",
            tax_amount: new Decimal(0),
            total_amount: new Decimal(-totalRefundAmount),
            customer_id: originalOrder.customer_id,
            billing_email: null,
            date_created_gmt: now,
            date_updated_gmt: now,
            parent_order_id: originalOrder.id,
            payment_method: null,
            payment_method_title: null,
            transaction_id: null,
            ip_address: null,
            user_agent: null,
            customer_note: reason || null,
            start_date: originalOrder.start_date,
            end_date: endDateTime,
            used_days: usedDays,
            rental_price: BigInt(Math.round(rentalPrice)),
            discount_days: discountDays
          },
        });

        // Store refund metadata
        await tx.wp_wc_orders_meta.createMany({
          data: [
            {
              order_id: refundOrderId,
              meta_key: "_refund_amount",
              meta_value: totalRefundAmount.toString(),
            },
            {
              order_id: refundOrderId,
              meta_key: "_refunded_by",
              meta_value: "1", // Assuming admin user ID 1
            },
            {
              order_id: refundOrderId,
              meta_key: "_refunded_payment",
              meta_value: refundPayment ? "1" : "",
            },
            {
              order_id: refundOrderId,
              meta_key: "_refund_reason",
              meta_value: reason,
            },
            {
              order_id: refundOrderId,
              meta_key: "_refund_type",
              meta_value: refundType,
            },
          ],
        });

        // Update order stats if available
        try {
          // Create negative stats entry for the refund
          await tx.wp_wc_order_stats.create({
            data: {
              order_id: refundOrderId,
              parent_id: BigInt(orderId),
              date_created: now,
              date_created_gmt: now,
              num_items_sold: -items.reduce(
                (total, item) => total + item.quantity,
                0
              ),
              total_sales: -totalRefundAmount,
              tax_total: 0,
              shipping_total: 0,
              net_total: -totalRefundAmount,
              returning_customer: null,
              status: "wc-completed",
              customer_id: originalOrder.customer_id || BigInt(0),
            },
          });

          // Update original order stats only for full refunds
          if (refundType === "full") {
            await tx.wp_wc_order_stats.updateMany({
              where: { order_id: BigInt(orderId) },
              data: { status: "wc-refunded" },
            });
          }
        } catch (error) {
          // Order stats might not be available in some WooCommerce setups
          console.warn(
            "Order stats update failed, continuing with refund process"
          );
        }

        // Process refund items
        const stockAdjustments: StockAdjustment[] = [];
        const refundNoteItems: string[] = [];

        for (const item of items) {
          // Get product info
          const productResult = await tx.wp_posts.findUnique({
            where: { ID: BigInt(item.productId) },
            select: { post_title: true },
          });

          const productName = productResult
            ? productResult.post_title
            : `Product #${item.productId}`;

          // Create refund line item
          const refundItem = await tx.wp_woocommerce_order_items.create({
            data: {
              order_item_name: productName,
              order_item_type: "line_item",
              order_id: refundOrderId,
            },
          });

          // For the refund item, qty and amount should be NEGATIVE
          const negativeQty = -Math.abs(item.quantity);
          const negativeAmount = -Math.abs(item.amount);

          // Create item meta for the refund item
          await tx.wp_woocommerce_order_itemmeta.createMany({
            data: [
              {
                order_item_id: refundItem.order_item_id,
                meta_key: "_product_id",
                meta_value: item.productId.toString(),
              },
              {
                order_item_id: refundItem.order_item_id,
                meta_key: "_variation_id",
                meta_value: "0",
              },
              {
                order_item_id: refundItem.order_item_id,
                meta_key: "_qty",
                meta_value: negativeQty.toString(),
              },
              {
                order_item_id: refundItem.order_item_id,
                meta_key: "_tax_class",
                meta_value: "",
              },
              {
                order_item_id: refundItem.order_item_id,
                meta_key: "_line_subtotal",
                meta_value: negativeAmount.toString(),
              },
              {
                order_item_id: refundItem.order_item_id,
                meta_key: "_line_subtotal_tax",
                meta_value: "0",
              },
              {
                order_item_id: refundItem.order_item_id,
                meta_key: "_line_total",
                meta_value: negativeAmount.toString(),
              },
              {
                order_item_id: refundItem.order_item_id,
                meta_key: "_line_tax",
                meta_value: "0",
              },
              {
                order_item_id: refundItem.order_item_id,
                meta_key: "_line_tax_data",
                meta_value: 'a:2:{s:5:"total";a:0:{}s:8:"subtotal";a:0:{}}',
              },
              {
                order_item_id: refundItem.order_item_id,
                meta_key: "_refunded_item_id",
                meta_value: item.itemId.toString(),
              },
            ],
          });

          // Add to refund note with the positive amount for readability
          refundNoteItems.push(
            `${productName} (${item.amount} ${originalOrder.currency})`
          );

          // Add to stock adjustments if not a bundle or additionally if it's a simple product
          if (!item.isBundle) {
            stockAdjustments.push({
              productId: item.productId,
              quantity: item.quantity, // Positive for stock adjustments
            });
          }

          // Add entry to wp_wc_order_product_lookup for the refund
          await tx.wp_wc_order_product_lookup.create({
            data: {
              order_item_id: refundItem.order_item_id,
              order_id: refundOrderId,
              product_id: BigInt(item.productId),
              variation_id: BigInt(0),
              customer_id: originalOrder.customer_id || BigInt(0),
              date_created: now,
              product_qty: negativeQty,
              product_net_revenue: new Decimal(negativeAmount),
              product_gross_revenue: new Decimal(negativeAmount),
              coupon_amount: new Decimal(0),
              tax_amount: new Decimal(0),
              shipping_amount: new Decimal(0),
              shipping_tax_amount: new Decimal(0)
            }
          });

          // Mark original item as restocked
          await tx.wp_woocommerce_order_itemmeta.create({
            data: {
              order_item_id: BigInt(item.itemId),
              meta_key: "_restock_refunded_items",
              meta_value: item.quantity.toString(), // Positive for restocking
            },
          });

          // Process bundled items if this is a bundle
          if (
            item.isBundle &&
            item.bundledItems &&
            item.bundledItems.length > 0
          ) {
            const bundledItemIds: number[] = [];
            const bundledDescriptions: string[] = [];

            for (const bundledItem of item.bundledItems) {
              // Get bundled product info
              const bundledProductResult = await tx.wp_posts.findUnique({
                where: { ID: BigInt(bundledItem.productId) },
                select: { post_title: true },
              });

              const bundledProductName = bundledProductResult
                ? bundledProductResult.post_title
                : `Product #${bundledItem.productId}`;

              // Create refund line item for bundled item
              const refundBundledItem =
                await tx.wp_woocommerce_order_items.create({
                  data: {
                    order_item_name: bundledProductName,
                    order_item_type: "line_item",
                    order_id: refundOrderId,
                  },
                });

              // For bundled items in refunds, qty should be NEGATIVE
              const negativeBundledQty = -Math.abs(bundledItem.quantity);

              // Create metadata for bundled item
              await tx.wp_woocommerce_order_itemmeta.createMany({
                data: [
                  {
                    order_item_id: refundBundledItem.order_item_id,
                    meta_key: "_product_id",
                    meta_value: bundledItem.productId.toString(),
                  },
                  {
                    order_item_id: refundBundledItem.order_item_id,
                    meta_key: "_variation_id",
                    meta_value: "0",
                  },
                  {
                    order_item_id: refundBundledItem.order_item_id,
                    meta_key: "_qty",
                    meta_value: negativeBundledQty.toString(),
                  },
                  {
                    order_item_id: refundBundledItem.order_item_id,
                    meta_key: "_tax_class",
                    meta_value: "",
                  },
                  {
                    order_item_id: refundBundledItem.order_item_id,
                    meta_key: "_line_subtotal",
                    meta_value: "0",
                  },
                  {
                    order_item_id: refundBundledItem.order_item_id,
                    meta_key: "_line_subtotal_tax",
                    meta_value: "0",
                  },
                  {
                    order_item_id: refundBundledItem.order_item_id,
                    meta_key: "_line_total",
                    meta_value: "0",
                  },
                  {
                    order_item_id: refundBundledItem.order_item_id,
                    meta_key: "_line_tax",
                    meta_value: "0",
                  },
                  {
                    order_item_id: refundBundledItem.order_item_id,
                    meta_key: "_line_tax_data",
                    meta_value: 'a:2:{s:5:"total";a:0:{}s:8:"subtotal";a:0:{}}',
                  },
                  {
                    order_item_id: refundBundledItem.order_item_id,
                    meta_key: "_refunded_item_id",
                    meta_value: bundledItem.itemId.toString(),
                  },
                  {
                    order_item_id: refundBundledItem.order_item_id,
                    meta_key: "_bundled_by",
                    meta_value: refundItem.order_item_id.toString(),
                  },
                ],
              });

              // Add entry to wp_wc_order_product_lookup for bundled item
              await tx.wp_wc_order_product_lookup.create({
                data: {
                  order_item_id: refundBundledItem.order_item_id,
                  order_id: refundOrderId,
                  product_id: BigInt(bundledItem.productId),
                  variation_id: BigInt(0),
                  customer_id: originalOrder.customer_id || BigInt(0),
                  date_created: now,
                  product_qty: negativeBundledQty,
                  product_net_revenue: new Decimal(0),
                  product_gross_revenue: new Decimal(0),
                  coupon_amount: new Decimal(0),
                  tax_amount: new Decimal(0),
                  shipping_amount: new Decimal(0),
                  shipping_tax_amount: new Decimal(0)
                }
              });

              // Add to bundled items list
              bundledItemIds.push(Number(refundBundledItem.order_item_id));
              bundledDescriptions.push(
                `${bundledProductName} (x${bundledItem.quantity})`
              );

              // Add to stock adjustments
              stockAdjustments.push({
                productId: bundledItem.productId,
                quantity: bundledItem.quantity, // Positive for stock adjustments
              });

              // Mark original bundled item as restocked
              await tx.wp_woocommerce_order_itemmeta.create({
                data: {
                  order_item_id: BigInt(bundledItem.itemId),
                  meta_key: "_restock_refunded_items",
                  meta_value: bundledItem.quantity.toString(), // Positive for restocking
                },
              });
            }

            // Add bundled items reference to parent item (in serialized PHP array format)
            if (bundledItemIds.length > 0) {
              await tx.wp_woocommerce_order_itemmeta.create({
                data: {
                  order_item_id: refundItem.order_item_id,
                  meta_key: "_bundled_items",
                  meta_value: `a:${bundledItemIds.length}:{${bundledItemIds
                    .map((id, index) => `i:${index};i:${id};`)
                    .join("")}}`,
                },
              });
            }
          }
        }

        // Update product stock levels
        for (const adjustment of stockAdjustments) {
          const { productId, quantity } = adjustment;

          try {
            // Get current stock
            const stockMeta = await tx.wp_postmeta.findFirst({
              where: {
                post_id: BigInt(productId),
                meta_key: "_stock",
              },
            });

            if (stockMeta) {
              const oldStock = parseInt(stockMeta.meta_value || "0") || 0;
              const newStock = oldStock + quantity;

              // Update stock in wp_postmeta
              await tx.wp_postmeta.updateMany({
                where: {
                  post_id: BigInt(productId),
                  meta_key: "_stock",
                },
                data: {
                  meta_value: newStock.toString(),
                },
              });

              // Update product meta lookup
              await tx.wp_wc_product_meta_lookup.updateMany({
                where: {
                  product_id: BigInt(productId),
                },
                data: {
                  stock_quantity: newStock,
                  stock_status: newStock > 0 ? "instock" : "outofstock",
                },
              });

              // Update bundled item metadata if this product is part of bundles
              const bundledItems =
                await tx.wp_woocommerce_bundled_items.findMany({
                  where: {
                    product_id: BigInt(productId),
                  },
                  select: {
                    bundled_item_id: true,
                  },
                });

              if (bundledItems.length > 0) {
                await tx.wp_woocommerce_bundled_itemmeta.updateMany({
                  where: {
                    bundled_item_id: {
                      in: bundledItems.map((item) => item.bundled_item_id),
                    },
                    meta_key: "max_stock",
                  },
                  data: {
                    meta_value: newStock.toString(),
                  },
                });
              }

              // Add comment for stock adjustment
              await tx.wp_comments.create({
                data: {
                  comment_post_ID: BigInt(orderId),
                  comment_author: "WooCommerce",
                  comment_author_email: "woocommerce@lesa.smarts.uz",
                  comment_author_url: "",
                  comment_author_IP: "",
                  comment_date: now,
                  comment_date_gmt: now,
                  comment_content: `Item #${productId} stock increased from ${oldStock} to ${newStock}.`,
                  comment_karma: 0,
                  comment_approved: "1",
                  comment_agent: "WooCommerce",
                  comment_type: "order_note",
                  comment_parent: BigInt(0),
                  user_id: BigInt(0),
                },
              });
            } else {
              console.warn(
                `No stock found for product ${productId}, skipping stock adjustment`
              );
            }
          } catch (stockError) {
            console.error(
              `Error updating stock for product ${productId}:`,
              stockError
            );
            // Continue with other stock adjustments
          }
        }

        // Add refund note
        let refundNoteContent = `Refunded ${totalRefundAmount} ${originalOrder.currency}`;
        if (refundNoteItems.length > 0) {
          refundNoteContent += `: ${refundNoteItems.join(", ")}`;
        }

        if (reason) {
          refundNoteContent += `. Reason: ${reason}`;
        }

        await tx.wp_comments.create({
          data: {
            comment_post_ID: BigInt(orderId),
            comment_author: "WooCommerce",
            comment_author_email: "woocommerce@lesa.smarts.uz",
            comment_author_url: "",
            comment_author_IP: "",
            comment_date: now,
            comment_date_gmt: now,
            comment_content: refundNoteContent,
            comment_karma: 0,
            comment_approved: "1",
            comment_agent: "WooCommerce",
            comment_type: "order_note",
            comment_parent: BigInt(0),
            user_id: BigInt(0),
          },
        });

        // Add status change note only for full refunds
        if (refundType === "full") {
          await tx.wp_comments.create({
            data: {
              comment_post_ID: BigInt(orderId),
              comment_author: "WooCommerce",
              comment_author_email: "woocommerce@lesa.smarts.uz",
              comment_author_url: "",
              comment_author_IP: "",
              comment_date: now,
              comment_date_gmt: now,
              comment_content: `Order status changed from ${currentStatus.replace(
                "wc-",
                ""
              )} to Refunded.`,
              comment_karma: 0,
              comment_approved: "1",
              comment_agent: "WooCommerce",
              comment_type: "order_note",
              comment_parent: BigInt(0),
              user_id: BigInt(0),
            },
          });
        } else {
          await tx.wp_comments.create({
            data: {
              comment_post_ID: BigInt(orderId),
              comment_author: "WooCommerce",
              comment_author_email: "woocommerce@lesa.smarts.uz",
              comment_author_url: "",
              comment_author_IP: "",
              comment_date: now,
              comment_date_gmt: now,
              comment_content: `Partial refund processed (${totalRefundAmount} ${originalOrder.currency}).`,
              comment_karma: 0,
              comment_approved: "1",
              comment_agent: "WooCommerce",
              comment_type: "order_note",
              comment_parent: BigInt(0),
              user_id: BigInt(0),
            },
          });
        }

        // Reset reduced stock flags for original order items
        for (const item of items) {
          await tx.wp_woocommerce_order_itemmeta.updateMany({
            where: {
              order_item_id: BigInt(item.itemId),
              meta_key: "_reduced_stock",
            },
            data: {
              meta_value: "0",
            },
          });

          // Handle bundled items too
          if (item.isBundle && item.bundledItems) {
            for (const bundledItem of item.bundledItems) {
              await tx.wp_woocommerce_order_itemmeta.updateMany({
                where: {
                  order_item_id: BigInt(bundledItem.itemId),
                  meta_key: "_reduced_stock",
                },
                data: {
                  meta_value: "0",
                },
              });
            }
          }
        }

        // Update order operational data if it exists
        try {
          await tx.wp_wc_order_operational_data.create({
            data: {
              order_id: refundOrderId,
              created_via: "api",
              woocommerce_version: "9.7.1",
              prices_include_tax: false,
              coupon_usages_are_counted: null,
              download_permission_granted: null,
              cart_hash: null,
              new_order_email_sent: null,
              order_key: null,
              order_stock_reduced: null,
              date_paid_gmt: null,
              date_completed_gmt: null,
              shipping_tax_amount: new Decimal(0),
              shipping_total_amount: new Decimal(0),
              discount_tax_amount: new Decimal(0),
              discount_total_amount: new Decimal(0),
              recorded_sales: false,
            },
          });
        } catch (error) {
          // Optional table, continue if it doesn't exist
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

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to process refund:", error);
    return NextResponse.json(
      { error: "Failed to process refund", details: (error as Error).message },
      { status: 500 }
    );
  }
}

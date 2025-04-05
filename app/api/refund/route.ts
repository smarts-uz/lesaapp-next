import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { PrismaClient, Prisma } from '.prisma/client';

interface RefundRequest {
  orderId: number;
  items: RefundItem[];
  reason?: string;
  refundPayment?: boolean;
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
    const body = await request.json() as RefundRequest;
    const { orderId, items, reason = '', refundPayment = false } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Refund items are required" }, { status: 400 });
    }

    // Calculate total refund amount
    const totalRefundAmount = items.reduce((total, item) => total + item.amount, 0);

    // Process refund in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get the original order to verify it exists
      const originalOrder = await tx.wp_wc_orders.findUnique({
        where: {
          id: BigInt(orderId)
        }
      });

      if (!originalOrder) {
        throw new Error(`Order with ID ${orderId} not found`);
      }

      // Get order address info for better refund notes
      const orderAddress = await tx.wp_wc_order_addresses.findFirst({
        where: {
          order_id: BigInt(orderId),
          address_type: 'billing'
        }
      });

      // Get the next ID for the refund order
      const maxOrderId = await tx.$queryRaw<{ max_id: bigint }[]>`
        SELECT MAX(id) as max_id FROM wp_wc_orders
      `;
      const refundOrderId = BigInt(Number(maxOrderId[0]?.max_id || 0) + 1);

      // Generate current timestamp for all date fields
      const now = new Date();

      // Get current order status before updating
      const currentStatus = originalOrder.status || 'wc-pending';

      // 1. Update original order status to refunded
      await tx.wp_wc_orders.update({
        where: {
          id: BigInt(orderId)
        },
        data: {
          status: "wc-refunded",
          date_updated_gmt: now
        }
      });

      // 2. Create refund order record
      await tx.wp_wc_orders.create({
        data: {
          id: refundOrderId,
          status: "wc-completed",
          currency: originalOrder.currency || 'UZS',
          type: "shop_order_refund",
          tax_amount: 0,
          total_amount: -totalRefundAmount,
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
          customer_note: null
        }
      });

      // 3. Store refund metadata
      await tx.wp_wc_orders_meta.createMany({
        data: [
          {
            order_id: refundOrderId,
            meta_key: "_refund_amount",
            meta_value: totalRefundAmount.toString()
          },
          {
            order_id: refundOrderId,
            meta_key: "_refunded_by",
            meta_value: "1" // Assuming admin user ID 1
          },
          {
            order_id: refundOrderId,
            meta_key: "_refunded_payment",
            meta_value: refundPayment ? "1" : ""
          },
          {
            order_id: refundOrderId,
            meta_key: "_refund_reason",
            meta_value: reason
          }
        ]
      });

      // 4. Update order stats if available
      try {
        // Create negative stats entry for the refund
        await tx.$executeRaw`
          INSERT INTO wp_wc_order_stats (
            order_id, parent_id, date_created, date_created_gmt, 
            num_items_sold, total_sales, tax_total, shipping_total, 
            net_total, returning_customer, status, customer_id
          ) 
          VALUES (
            ${refundOrderId}, ${BigInt(orderId)}, ${now}, ${now}, 
            ${-items.reduce((total, item) => total + item.quantity, 0)}, 
            ${-totalRefundAmount}, 0, 0, ${-totalRefundAmount}, NULL, 
            'wc-completed', ${originalOrder.customer_id || 0}
          )
        `;

        // Update original order stats
        await tx.$executeRaw`
          UPDATE wp_wc_order_stats 
          SET status = 'wc-refunded' 
          WHERE order_id = ${BigInt(orderId)}
        `;
      } catch (error) {
        // Order stats might not be available in some WooCommerce setups
        console.warn('Order stats update failed, continuing with refund process');
      }

      // 5. Process refund items
      const stockAdjustments: StockAdjustment[] = [];
      const refundNoteItems: string[] = [];

      for (const item of items) {
        // Get product info
        const product = await tx.$queryRaw<{ post_title: string }[]>`
          SELECT post_title FROM wp_posts WHERE ID = ${item.productId}
        `;
        const productName = product && product[0] ? product[0].post_title : `Product #${item.productId}`;
        
        // Create refund line item
        const refundItem = await tx.wp_woocommerce_order_items.create({
          data: {
            order_item_name: productName,
            order_item_type: "line_item",
            order_id: refundOrderId
          }
        });

        // Create item meta for the refund item
        await tx.wp_woocommerce_order_itemmeta.createMany({
          data: [
            {
              order_item_id: refundItem.order_item_id,
              meta_key: "_product_id",
              meta_value: item.productId.toString()
            },
            {
              order_item_id: refundItem.order_item_id,
              meta_key: "_variation_id",
              meta_value: "0"
            },
            {
              order_item_id: refundItem.order_item_id,
              meta_key: "_qty",
              meta_value: item.quantity.toString()
            },
            {
              order_item_id: refundItem.order_item_id,
              meta_key: "_tax_class",
              meta_value: ""
            },
            {
              order_item_id: refundItem.order_item_id,
              meta_key: "_line_subtotal",
              meta_value: (-item.amount).toString()
            },
            {
              order_item_id: refundItem.order_item_id,
              meta_key: "_line_subtotal_tax",
              meta_value: "0"
            },
            {
              order_item_id: refundItem.order_item_id,
              meta_key: "_line_total",
              meta_value: (-item.amount).toString()
            },
            {
              order_item_id: refundItem.order_item_id,
              meta_key: "_line_tax",
              meta_value: "0"
            },
            {
              order_item_id: refundItem.order_item_id,
              meta_key: "_line_tax_data",
              meta_value: "a:2:{s:5:\"total\";a:0:{}s:8:\"subtotal\";a:0:{}}"
            },
            {
              order_item_id: refundItem.order_item_id,
              meta_key: "_refunded_item_id",
              meta_value: item.itemId.toString()
            }
          ]
        });

        // Add to refund note
        refundNoteItems.push(`${productName} (${-item.amount} ${originalOrder.currency})`);

        // Add to stock adjustments if not a bundle or additionally if it's a simple product
        if (!item.isBundle) {
          stockAdjustments.push({
            productId: item.productId,
            quantity: item.quantity
          });
        }

        // Mark original item as restocked
        await tx.wp_woocommerce_order_itemmeta.create({
          data: {
            order_item_id: item.itemId,
            meta_key: "_restock_refunded_items",
            meta_value: item.quantity.toString()
          }
        });

        // Process bundled items if this is a bundle
        if (item.isBundle && item.bundledItems && item.bundledItems.length > 0) {
          const bundledItemIds: number[] = [];
          const bundledDescriptions: string[] = [];

          for (const bundledItem of item.bundledItems) {
            // Get bundled product info
            const bundledProduct = await tx.$queryRaw<{ post_title: string }[]>`
              SELECT post_title FROM wp_posts WHERE ID = ${bundledItem.productId}
            `;
            const bundledProductName = bundledProduct && bundledProduct[0] 
              ? bundledProduct[0].post_title 
              : `Product #${bundledItem.productId}`;
            
            // Create refund line item for bundled item
            const refundBundledItem = await tx.wp_woocommerce_order_items.create({
              data: {
                order_item_name: bundledProductName,
                order_item_type: "line_item",
                order_id: refundOrderId
              }
            });

            // Create metadata for bundled item
            await tx.wp_woocommerce_order_itemmeta.createMany({
              data: [
                {
                  order_item_id: refundBundledItem.order_item_id,
                  meta_key: "_product_id",
                  meta_value: bundledItem.productId.toString()
                },
                {
                  order_item_id: refundBundledItem.order_item_id,
                  meta_key: "_variation_id",
                  meta_value: "0"
                },
                {
                  order_item_id: refundBundledItem.order_item_id,
                  meta_key: "_qty",
                  meta_value: bundledItem.quantity.toString()
                },
                {
                  order_item_id: refundBundledItem.order_item_id,
                  meta_key: "_tax_class",
                  meta_value: ""
                },
                {
                  order_item_id: refundBundledItem.order_item_id,
                  meta_key: "_line_subtotal",
                  meta_value: "0"
                },
                {
                  order_item_id: refundBundledItem.order_item_id,
                  meta_key: "_line_subtotal_tax",
                  meta_value: "0"
                },
                {
                  order_item_id: refundBundledItem.order_item_id,
                  meta_key: "_line_total",
                  meta_value: "0"
                },
                {
                  order_item_id: refundBundledItem.order_item_id,
                  meta_key: "_line_tax",
                  meta_value: "0"
                },
                {
                  order_item_id: refundBundledItem.order_item_id,
                  meta_key: "_line_tax_data",
                  meta_value: "a:2:{s:5:\"total\";a:0:{}s:8:\"subtotal\";a:0:{}}"
                },
                {
                  order_item_id: refundBundledItem.order_item_id,
                  meta_key: "_refunded_item_id",
                  meta_value: bundledItem.itemId.toString()
                },
                {
                  order_item_id: refundBundledItem.order_item_id,
                  meta_key: "_bundled_by",
                  meta_value: refundItem.order_item_id.toString()
                }
              ]
            });

            // Add to bundled items list
            bundledItemIds.push(Number(refundBundledItem.order_item_id));
            bundledDescriptions.push(`${bundledProductName} (x${bundledItem.quantity})`);
            
            // Add to stock adjustments
            stockAdjustments.push({
              productId: bundledItem.productId,
              quantity: bundledItem.quantity
            });

            // Mark original bundled item as restocked
            await tx.wp_woocommerce_order_itemmeta.create({
              data: {
                order_item_id: bundledItem.itemId,
                meta_key: "_restock_refunded_items",
                meta_value: bundledItem.quantity.toString()
              }
            });
          }

          // Add bundled items reference to parent item (in serialized PHP array format)
          if (bundledItemIds.length > 0) {
            await tx.wp_woocommerce_order_itemmeta.create({
              data: {
                order_item_id: refundItem.order_item_id,
                meta_key: "_bundled_items",
                meta_value: `a:${bundledItemIds.length}:{${bundledItemIds.map((id, index) => `i:${index};i:${id};`).join('')}}`
              }
            });
          }
        }
      }

      // 6. Update product stock levels
      for (const adjustment of stockAdjustments) {
        const { productId, quantity } = adjustment;

        // Get current stock
        const currentStock = await tx.$queryRaw<{ meta_value: string }[]>`
          SELECT meta_value FROM wp_postmeta 
          WHERE post_id = ${productId} AND meta_key = '_stock'
        `;

        if (currentStock && currentStock[0]) {
          const oldStock = parseInt(currentStock[0].meta_value);
          const newStock = oldStock + quantity;

          // Update stock in wp_postmeta
          await tx.$executeRaw`
            UPDATE wp_postmeta 
            SET meta_value = ${newStock.toString()}
            WHERE post_id = ${productId} AND meta_key = '_stock'
          `;

          // Update product meta lookup
          await tx.$executeRaw`
            UPDATE wp_wc_product_meta_lookup 
            SET stock_quantity = ${newStock}, 
                stock_status = 'instock'
            WHERE product_id = ${productId}
          `;

          // Update bundled item metadata if this product is part of bundles
          await tx.$executeRaw`
            UPDATE wp_woocommerce_bundled_itemmeta
            SET meta_value = ${newStock.toString()}
            WHERE meta_key = 'max_stock'
            AND bundled_item_id IN (
              SELECT bundled_item_id FROM wp_woocommerce_bundled_items
              WHERE product_id = ${productId}
            )
          `;

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
              comment_parent: 0,
              user_id: 0
            }
          });
        }
      }

      // 7. Add refund note
      let refundNoteContent = `Refunded ${totalRefundAmount} ${originalOrder.currency}`;
      if (refundNoteItems.length > 0) {
        refundNoteContent += `: ${refundNoteItems.join(', ')}`;
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
          comment_parent: 0,
          user_id: 0
        }
      });

      // 8. Add status change note
      await tx.wp_comments.create({
        data: {
          comment_post_ID: BigInt(orderId),
          comment_author: "WooCommerce",
          comment_author_email: "woocommerce@lesa.smarts.uz",
          comment_author_url: "",
          comment_author_IP: "",
          comment_date: now,
          comment_date_gmt: now,
          comment_content: `Order status changed from ${currentStatus.replace('wc-', '')} to Refunded.`,
          comment_karma: 0,
          comment_approved: "1",
          comment_agent: "WooCommerce",
          comment_type: "order_note",
          comment_parent: 0,
          user_id: 0
        }
      });

      // 9. Reset reduced stock flags for original order items
      for (const item of items) {
        await tx.$executeRaw`
          UPDATE wp_woocommerce_order_itemmeta
          SET meta_value = '0'
          WHERE meta_key = '_reduced_stock'
          AND order_item_id = ${item.itemId}
        `;

        // Handle bundled items too
        if (item.isBundle && item.bundledItems) {
          for (const bundledItem of item.bundledItems) {
            await tx.$executeRaw`
              UPDATE wp_woocommerce_order_itemmeta
              SET meta_value = '0'
              WHERE meta_key = '_reduced_stock'
              AND order_item_id = ${bundledItem.itemId}
            `;
          }
        }
      }

      // 10. Update order operational data if it exists
      try {
        await tx.wp_wc_order_operational_data.create({
          data: {
            order_id: refundOrderId,
            created_via: 'api',
            woocommerce_version: '9.7.1',
            prices_include_tax: false,
            coupon_usages_are_counted: null,
            download_permission_granted: null,
            cart_hash: null,
            new_order_email_sent: null,
            order_key: null,
            order_stock_reduced: null,
            date_paid_gmt: null,
            date_completed_gmt: null,
            shipping_tax_amount: 0,
            shipping_total_amount: 0,
            discount_tax_amount: 0,
            discount_total_amount: 0,
            recorded_sales: false
          }
        });
      } catch (error) {
        // Optional table, continue if it doesn't exist
        console.warn('Order operational data could not be created, continuing with refund process');
      }

      return {
        success: true,
        refundId: refundOrderId.toString(),
        orderId: orderId.toString(),
        amount: totalRefundAmount,
        items: items.length,
        currency: originalOrder.currency || 'UZS'
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to process refund:", error);
    return NextResponse.json(
      { error: "Failed to process refund", details: (error as Error).message },
      { status: 500 }
    );
  }
}

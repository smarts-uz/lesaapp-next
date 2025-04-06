interface TransactionClient {
  wp_postmeta: {
    findFirst: Function;
    updateMany: Function;
  };
  wp_wc_product_meta_lookup: {
    updateMany: Function;
  };
  wp_woocommerce_bundled_items: {
    findMany: Function;
  };
  wp_woocommerce_bundled_itemmeta: {
    updateMany: Function;
  };
  wp_comments: {
    create: Function;
  };
}

interface StockAdjustment {
  productId: number;
  quantity: number;
}

interface BundledItem {
  bundled_item_id: number | bigint;
}

/**
 * Updates product stock levels during refund
 */
export async function updateProductStock({
  tx,
  adjustment,
  orderId,
}: {
  tx: TransactionClient;
  adjustment: StockAdjustment;
  orderId: number | string;
}) {
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
      const bundledItems = await tx.wp_woocommerce_bundled_items.findMany({
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
              in: bundledItems.map((item: BundledItem) => item.bundled_item_id),
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
          comment_date: new Date(),
          comment_date_gmt: new Date(),
          comment_content: `Item #${productId} stock increased from ${oldStock} to ${newStock}.`,
          comment_karma: 0,
          comment_approved: "1",
          comment_agent: "WooCommerce",
          comment_type: "order_note",
          comment_parent: BigInt(0),
          user_id: BigInt(0),
        },
      });

      return {
        success: true,
        oldStock,
        newStock,
        productId,
      };
    } else {
      console.warn(
        `No stock found for product ${productId}, skipping stock adjustment`
      );
      return {
        success: false,
        reason: "no_stock_found",
        productId,
      };
    }
  } catch (stockError) {
    console.error(
      `Error updating stock for product ${productId}:`,
      stockError
    );
    return {
      success: false,
      reason: "error",
      error: stockError,
      productId,
    };
  }
} 
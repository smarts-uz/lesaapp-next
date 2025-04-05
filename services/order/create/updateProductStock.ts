interface TransactionClient {
  wp_wc_product_meta_lookup: {
    upsert: Function;
  };
}

interface ProductItem {
  product_id: number;
  quantity: number;
  price: number;
}

interface BundleItem {
  product_id: number;
  quantity: number;
}

export async function updateProductStock({
  tx,
  product,
}: {
  tx: TransactionClient;
  product: ProductItem;
}) {
  return await tx.wp_wc_product_meta_lookup.upsert({
    where: {
      product_id: BigInt(product.product_id),
    },
    create: {
      product_id: BigInt(product.product_id),
      stock_quantity: -product.quantity,
      total_sales: product.quantity,
      min_price: product.price,
      max_price: product.price,
      rating_count: 0,
      average_rating: 0,
    },
    update: {
      stock_quantity: {
        decrement: product.quantity,
      },
      total_sales: {
        increment: product.quantity,
      },
    },
  });
}

export async function updateBundledItemStock({
  tx,
  bundleItem,
}: {
  tx: TransactionClient;
  bundleItem: BundleItem;
}) {
  return await tx.wp_wc_product_meta_lookup.upsert({
    where: {
      product_id: BigInt(bundleItem.product_id),
    },
    create: {
      product_id: BigInt(bundleItem.product_id),
      stock_quantity: -bundleItem.quantity,
      total_sales: bundleItem.quantity,
      min_price: 0,
      max_price: 0,
      rating_count: 0,
      average_rating: 0,
    },
    update: {
      stock_quantity: {
        decrement: bundleItem.quantity,
      },
      total_sales: {
        increment: bundleItem.quantity,
      },
    },
  });
} 
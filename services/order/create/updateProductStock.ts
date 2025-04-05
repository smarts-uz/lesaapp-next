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
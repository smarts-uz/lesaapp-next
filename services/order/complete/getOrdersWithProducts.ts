import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface OrderProduct {
  product_id: string;
  variation_id: string;
  product_qty: number;
  product_net_revenue: number;
  product_gross_revenue: number;
  date_created: Date;
}

export interface OrderProductsWithTotal {
  products: OrderProduct[];
  totalQuantity: number;
}

export interface RefundSummary {
  originalOrder: {
    products: OrderProduct[];
    totalQuantity: number;
  };
  refundedProducts: {
    products: OrderProduct[];
    totalQuantity: number;
  };
  remainingProducts: {
    products: OrderProduct[];
    totalQuantity: number;
  };
}

interface RawOrderProduct {
  product_id: bigint;
  variation_id: bigint;
  product_qty: number;
  product_net_revenue: number;
  product_gross_revenue: number;
  date_created: Date;
}

/**
 * Convert BigInt values to strings in an object or array
 */
function convertBigIntToString<T>(data: any): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'bigint') {
    return data.toString() as T;
  }

  if (Array.isArray(data)) {
    return data.map(item => convertBigIntToString(item)) as T;
  }

  if (typeof data === 'object') {
    const result: { [key: string]: any } = {};
    for (const key in data) {
      result[key] = convertBigIntToString(data[key]);
    }
    return result as T;
  }

  return data as T;
}

/**
 * Convert raw product data to OrderProduct format
 */
function convertRawProducts(products: RawOrderProduct[]): OrderProduct[] {
  return products.map(product => ({
    ...product,
    product_id: product.product_id.toString(),
    variation_id: product.variation_id.toString()
  }));
}

/**
 * Get products for a specific order
 * @param orderId - The order ID to get products for
 * @returns Array of products for the order
 */
export async function getOrderProducts(orderId: number): Promise<OrderProduct[]> {
  try {
    const products = await prisma.wp_wc_order_product_lookup.findMany({
      where: {
        order_id: orderId
      },
      select: {
        product_id: true,
        variation_id: true,
        product_qty: true,
        product_net_revenue: true,
        product_gross_revenue: true,
        date_created: true
      }
    });

    return convertRawProducts(products as RawOrderProduct[]);
  } catch (error) {
    console.error('Error fetching products for order:', error);
    throw error;
  }
}

/**
 * Get all products from orders with specific parent_order_id and calculate total quantity
 * @param parentOrderId - The parent order ID to search for
 * @returns Object containing array of products and their total quantity
 */
export async function getProductsByParentOrderId(parentOrderId: number): Promise<OrderProductsWithTotal> {
  try {
    // First get all orders with this parent_order_id
    const childOrders = await prisma.wp_wc_orders.findMany({
      where: {
        parent_order_id: parentOrderId
      },
      select: {
        id: true
      }
    });

    // Get products for all child orders
    const orderIds = childOrders.map(order => order.id);
    const allProducts = await prisma.wp_wc_order_product_lookup.findMany({
      where: {
        order_id: {
          in: orderIds
        }
      },
      select: {
        product_id: true,
        variation_id: true,
        product_qty: true,
        product_net_revenue: true,
        product_gross_revenue: true,
        date_created: true
      }
    });

    // Calculate total quantity
    const totalQuantity = allProducts.reduce((sum, product) => sum + product.product_qty, 0);

    return {
      products: allProducts,
      totalQuantity
    };
  } catch (error) {
    console.error('Error fetching products for parent order:', error);
    throw error;
  }
}

/**
 * Get refund summary for an order, showing original, refunded and remaining products
 * @param parentOrderId - The parent order ID to analyze refunds for
 * @returns Summary of original, refunded and remaining products
 */
export async function getRefundSummary(parentOrderId: number): Promise<RefundSummary> {
  try {
    // Get original order and its refund orders
    const orders = await prisma.wp_wc_orders.findMany({
      where: {
        OR: [
          { id: parentOrderId },
          { parent_order_id: parentOrderId }
        ]
      },
      select: {
        id: true,
        type: true,
        status: true,
        parent_order_id: true
      }
    });

    // Convert orders to string IDs for comparison
    const parentOrderIdStr = parentOrderId.toString();
    
    // Separate original order and refund orders
    const originalOrder = orders.find(order => order.id.toString() === parentOrderIdStr);
    const refundOrders = orders.filter(order => 
      order.parent_order_id?.toString() === parentOrderIdStr
    );

    if (!originalOrder) {
      throw new Error('Original order not found');
    }

    // Get products from original order
    const originalProducts = await prisma.wp_wc_order_product_lookup.findMany({
      where: {
        order_id: originalOrder.id
      },
      select: {
        product_id: true,
        variation_id: true,
        product_qty: true,
        product_net_revenue: true,
        product_gross_revenue: true,
        date_created: true
      }
    });

    // Get products from refund orders
    const refundOrderIds = refundOrders.map(order => order.id);
    const refundedProducts = await prisma.wp_wc_order_product_lookup.findMany({
      where: {
        order_id: {
          in: refundOrderIds
        }
      },
      select: {
        product_id: true,
        variation_id: true,
        product_qty: true,
        product_net_revenue: true,
        product_gross_revenue: true,
        date_created: true
      }
    });

    // Convert raw products to OrderProduct format
    const convertedOriginalProducts = convertRawProducts(originalProducts as RawOrderProduct[]);
    const convertedRefundProducts = convertRawProducts(refundedProducts as RawOrderProduct[]);

    // Calculate remaining products (original - refunded)
    const remainingProducts = convertedOriginalProducts.map((originalProduct: OrderProduct) => {
      const refundedQty = convertedRefundProducts
        .filter((refund: OrderProduct) => refund.product_id === originalProduct.product_id)
        .reduce((sum: number, refund: OrderProduct) => sum + refund.product_qty, 0);

      return {
        ...originalProduct,
        product_qty: originalProduct.product_qty - refundedQty
      };
    }).filter((product: OrderProduct) => product.product_qty > 0);

    return {
      originalOrder: {
        products: convertedOriginalProducts,
        totalQuantity: convertedOriginalProducts.reduce((sum: number, product: OrderProduct) => 
          sum + product.product_qty, 0)
      },
      refundedProducts: {
        products: convertedRefundProducts,
        totalQuantity: convertedRefundProducts.reduce((sum: number, product: OrderProduct) => 
          sum + product.product_qty, 0)
      },
      remainingProducts: {
        products: remainingProducts,
        totalQuantity: remainingProducts.reduce((sum: number, product: OrderProduct) => 
          sum + product.product_qty, 0)
      }
    };
  } catch (error) {
    console.error('Error fetching refund summary:', error);
    throw error;
  }
}
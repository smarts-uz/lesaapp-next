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

    // Convert bigint values to strings
    const convertedProducts = convertRawProducts(allProducts as RawOrderProduct[]);

    // Calculate total quantity
    const totalQuantity = convertedProducts.reduce((sum, product) => sum + product.product_qty, 0);

    return {
      products: convertedProducts,
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
        date_created: true,
        order_id: true
      }
    });

    // Convert raw products to OrderProduct format
    const convertedOriginalProducts = convertRawProducts(originalProducts as RawOrderProduct[]);
    const convertedRefundProducts = convertRawProducts(refundedProducts as RawOrderProduct[]);

    // Process refunded products (convert negative values to positive)
    const processedRefundProducts = convertedRefundProducts.map(product => ({
      ...product,
      product_qty: Math.abs(product.product_qty),
      product_net_revenue: Math.abs(product.product_net_revenue),
      product_gross_revenue: Math.abs(product.product_gross_revenue)
    }));

    // Sort refunds by date
    const sortedRefunds = [...processedRefundProducts].sort((a, b) => 
      a.date_created.getTime() - b.date_created.getTime()
    );

    // Create a map to track remaining quantities for each original product
    const remainingQtyMap = new Map<string, number>();
    
    // Initialize remaining quantities for each original product
    convertedOriginalProducts.forEach((product, index) => {
      const key = `${product.product_id}-${product.variation_id}-${index}`;
      remainingQtyMap.set(key, product.product_qty);
    });

    // Process refunds in chronological order
    const usedRefunds: OrderProduct[] = [];
    sortedRefunds.forEach(refund => {
      // Find the first matching original product that still has quantity to refund
      for (let i = 0; i < convertedOriginalProducts.length; i++) {
        const original = convertedOriginalProducts[i];
        if (original.product_id === refund.product_id && 
            original.variation_id === refund.variation_id) {
          const key = `${original.product_id}-${original.variation_id}-${i}`;
          const remainingQty = remainingQtyMap.get(key) || 0;
          
          if (remainingQty >= refund.product_qty) {
            // Apply refund to this original product
            remainingQtyMap.set(key, remainingQty - refund.product_qty);
            usedRefunds.push(refund);
            break;
          }
        }
      }
    });

    // Calculate remaining products based on the remaining quantities
    const remainingProducts = convertedOriginalProducts.map((original, index) => {
      const key = `${original.product_id}-${original.variation_id}-${index}`;
      const remainingQty = remainingQtyMap.get(key) || 0;

      if (remainingQty <= 0) {
        return null;
      }

      return {
        ...original,
        product_qty: remainingQty,
        product_net_revenue: (original.product_net_revenue / original.product_qty) * remainingQty,
        product_gross_revenue: (original.product_gross_revenue / original.product_qty) * remainingQty
      };
    }).filter((product): product is OrderProduct => product !== null);

    return {
      originalOrder: {
        products: convertedOriginalProducts,
        totalQuantity: convertedOriginalProducts.reduce((sum, product) => 
          sum + product.product_qty, 0)
      },
      refundedProducts: {
        products: usedRefunds,
        totalQuantity: usedRefunds.reduce((sum, product) => 
          sum + product.product_qty, 0)
      },
      remainingProducts: {
        products: remainingProducts,
        totalQuantity: remainingProducts.reduce((sum, product) => 
          sum + product.product_qty, 0)
      }
    };
  } catch (error) {
    console.error('Error fetching refund summary:', error);
    throw error;
  }
}